from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, date, timedelta, time
import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import uuid

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///habits_advanced.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # User preferences
    theme = db.Column(db.String(20), default='light')  # light, dark
    timezone = db.Column(db.String(50), default='UTC')
    
    # Gamification
    level = db.Column(db.Integer, default=1)
    xp = db.Column(db.Integer, default=0)
    total_coins = db.Column(db.Integer, default=0)
    
    # Relationships
    habits = db.relationship('Habit', backref='user', lazy=True, cascade='all, delete-orphan')
    user_badges = db.relationship('UserBadge', backref='user', lazy=True, cascade='all, delete-orphan')
    user_goals = db.relationship('UserGoal', backref='user', lazy=True, cascade='all, delete-orphan')

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default='#3B82F6')
    icon = db.Column(db.String(50), default='default')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # NULL for default categories

class Habit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Categorization
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    custom_category = db.Column(db.String(50))  # For custom categories
    
    # Scheduling
    frequency = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly, custom
    repeat_days = db.Column(db.String(20))  # JSON string: [1,2,3,4,5] for Mon-Fri
    start_date = db.Column(db.Date, default=date.today)
    end_date = db.Column(db.Date)  # Optional end date
    
    # Habit types
    habit_type = db.Column(db.String(20), default='yes_no')  # yes_no, measurable, time_based
    target_value = db.Column(db.Float, default=1.0)  # Target for measurable habits
    unit = db.Column(db.String(20))  # glasses, pages, minutes, etc.
    
    # Visual customization
    color = db.Column(db.String(7), default='#3B82F6')
    icon = db.Column(db.String(50), default='star')
    order = db.Column(db.Integer, default=0)  # For custom ordering
    is_pinned = db.Column(db.Boolean, default=False)
    
    # Streak rules
    allow_skips = db.Column(db.Boolean, default=False)
    max_misses_per_week = db.Column(db.Integer, default=0)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    habit_logs = db.relationship('HabitLog', backref='habit', lazy=True, cascade='all, delete-orphan')
    reminders = db.relationship('Reminder', backref='habit', lazy=True, cascade='all, delete-orphan')

class HabitLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habit.id'), nullable=False)
    
    # Completion status
    status = db.Column(db.String(20), default='completed')  # completed, skipped, missed
    
    # For measurable habits
    value = db.Column(db.Float)  # Actual value achieved
    
    # Metadata
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    mood = db.Column(db.Integer)  # 1-5 mood rating
    duration_minutes = db.Column(db.Integer)  # Time spent in minutes

class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habit.id'), nullable=False)
    
    # Timing
    time = db.Column(db.Time, nullable=False)
    days = db.Column(db.String(20))  # JSON array of days
    
    # Smart reminders
    is_smart = db.Column(db.Boolean, default=False)  # Only remind if not done
    cutoff_time = db.Column(db.Time)  # Don't remind after this time
    
    is_active = db.Column(db.Boolean, default=True)

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    condition_type = db.Column(db.String(50))  # streak, completion, special
    condition_value = db.Column(db.Integer)
    xp_reward = db.Column(db.Integer, default=10)
    coin_reward = db.Column(db.Integer, default=5)

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserGoal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    target_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # AI-generated habit plan
    habit_plan = db.Column(db.Text)  # JSON string of suggested habits

class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    code = db.Column(db.String(10), unique=True, nullable=False)  # Join code
    is_private = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    members = db.relationship('GroupMember', backref='group', lazy=True, cascade='all, delete-orphan')
    challenges = db.relationship('Challenge', backref='group', lazy=True, cascade='all, delete-orphan')

class GroupMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)

class Challenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    habit_template = db.Column(db.Text)  # JSON template for the challenge habit
    
    # Relationships
    participants = db.relationship('ChallengeParticipant', backref='challenge', lazy=True, cascade='all, delete-orphan')

class ChallengeParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenge.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Tracking
    days_completed = db.Column(db.Integer, default=0)
    current_streak = db.Column(db.Integer, default=0)

class AIInsight(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    insight_type = db.Column(db.String(50))  # pattern, suggestion, motivation
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    confidence_score = db.Column(db.Float)  # 0-1
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

# Helper functions
def get_user_from_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return User.query.get(payload['user_id'])
    except:
        return None

def calculate_level(xp):
    # Level calculation: 100 XP for level 1, 200 for level 2, 300 for level 3, etc.
    level = 1
    xp_needed = 100
    while xp >= xp_needed:
        xp -= xp_needed
        level += 1
        xp_needed = level * 100
    return level

def award_xp(user_id, xp_amount, reason="Habit completion"):
    user = User.query.get(user_id)
    if user:
        user.xp += xp_amount
        new_level = calculate_level(user.xp)
        if new_level > user.level:
            user.level = new_level
            # Award coins for level up
            user.total_coins += 50
        db.session.commit()

def check_badges(user_id):
    user = User.query.get(user_id)
    badges = Badge.query.all()
    
    for badge in badges:
        # Check if user already has this badge
        if UserBadge.query.filter_by(user_id=user_id, badge_id=badge.id).first():
            continue
            
        earned = False
        
        if badge.condition_type == 'streak':
            # Check for streak badges
            max_streak = db.session.query(db.func.max(HabitLog.id)).filter(
                HabitLog.habit_id.in_([h.id for h in user.habits])
            ).scalar()
            
            if max_streak and max_streak >= badge.condition_value:
                earned = True
                
        elif badge.condition_type == 'completion':
            # Check for completion badges
            total_completions = HabitLog.query.filter(
                HabitLog.habit_id.in_([h.id for h in user.habits]),
                HabitLog.status == 'completed'
            ).count()
            
            if total_completions >= badge.condition_value:
                earned = True
        
        if earned:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.session.add(user_badge)
            user.total_coins += badge.coin_reward
            award_xp(user_id, badge.xp_reward, f"Badge earned: {badge.name}")

def get_habit_streak(habit_id):
    logs = HabitLog.query.filter_by(habit_id=habit_id, status='completed').order_by(HabitLog.completed_at.desc()).all()
    
    if not logs:
        return 0, 0  # current, longest
    
    current_streak = 0
    longest_streak = 0
    temp_streak = 0
    
    current_date = date.today()
    
    for log in logs:
        log_date = log.completed_at.date()
        
        if log_date == current_date:
            current_streak += 1
            temp_streak += 1
            current_date -= timedelta(days=1)
        elif log_date == current_date - timedelta(days=1):
            temp_streak += 1
            current_date = log_date
        else:
            break
    
    longest_streak = temp_streak
    
    return current_streak, longest_streak

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Create default categories for user
    default_categories = [
        ('Health & Fitness', '#10B981', 'heart'),
        ('Study & Learning', '#3B82F6', 'book'),
        ('Finance', '#F59E0B', 'dollar'),
        ('Personal Growth', '#8B5CF6', 'brain'),
        ('Social', '#EC4899', 'users'),
        ('Creative', '#06B6D4', 'palette')
    ]
    
    for name, color, icon in default_categories:
        category = Category(name=name, color=color, icon=icon, user_id=user.id)
        db.session.add(category)
    
    db.session.commit()
    
    token = jwt.encode({'user_id': user.id}, app.config['SECRET_KEY'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'level': user.level,
            'xp': user.xp,
            'total_coins': user.total_coins
        }
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = jwt.encode({'user_id': user.id}, app.config['SECRET_KEY'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'level': user.level,
            'xp': user.xp,
            'total_coins': user.total_coins
        }
    })

# Habit Routes
@app.route('/api/habits', methods=['GET'])
def get_habits():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    habits = Habit.query.filter_by(user_id=user.id, is_active=True).order_by(Habit.order, Habit.is_pinned.desc()).all()
    
    result = []
    for habit in habits:
        current_streak, longest_streak = get_habit_streak(habit.id)
        
        # Check today's status
        today = date.today()
        today_log = HabitLog.query.filter(
            HabitLog.habit_id == habit.id,
            db.func.date(HabitLog.completed_at) == today
        ).first()
        
        # Get progress for measurable habits
        progress = None
        if habit.habit_type in ['measurable', 'time_based'] and today_log:
            progress = {
                'current': today_log.value or 0,
                'target': habit.target_value,
                'percentage': min(100, ((today_log.value or 0) / habit.target_value) * 100) if habit.target_value > 0 else 0
            }
        
        result.append({
            'id': habit.id,
            'name': habit.name,
            'description': habit.description,
            'category': Category.query.get(habit.category_id).name if habit.category_id else habit.custom_category,
            'frequency': habit.frequency,
            'repeat_days': json.loads(habit.repeat_days) if habit.repeat_days else None,
            'habit_type': habit.habit_type,
            'target_value': habit.target_value,
            'unit': habit.unit,
            'color': habit.color,
            'icon': habit.icon,
            'is_pinned': habit.is_pinned,
            'today_status': today_log.status if today_log else None,
            'today_progress': progress,
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'created_at': habit.created_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/api/habits', methods=['POST'])
def create_habit():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.get_json()
    
    habit = Habit(
        user_id=user.id,
        name=data['name'],
        description=data.get('description', ''),
        category_id=data.get('category_id'),
        custom_category=data.get('custom_category'),
        frequency=data.get('frequency', 'daily'),
        repeat_days=json.dumps(data.get('repeat_days', [])),
        start_date=datetime.strptime(data.get('start_date'), '%Y-%m-%d').date() if data.get('start_date') else date.today(),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
        habit_type=data.get('habit_type', 'yes_no'),
        target_value=data.get('target_value', 1.0),
        unit=data.get('unit'),
        color=data.get('color', '#3B82F6'),
        icon=data.get('icon', 'star'),
        is_pinned=data.get('is_pinned', False),
        allow_skips=data.get('allow_skips', False),
        max_misses_per_week=data.get('max_misses_per_week', 0)
    )
    
    db.session.add(habit)
    db.session.commit()
    
    # Award XP for creating habit
    award_xp(user.id, 5, "New habit created")
    
    return jsonify({'message': 'Habit created successfully', 'habit_id': habit.id}), 201

@app.route('/api/habits/<int:habit_id>/complete', methods=['POST'])
def complete_habit(habit_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    habit = Habit.query.get_or_404(habit_id)
    if habit.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    status = data.get('status', 'completed')
    
    # Check if already logged today
    today = date.today()
    existing_log = HabitLog.query.filter(
        HabitLog.habit_id == habit_id,
        db.func.date(HabitLog.completed_at) == today
    ).first()
    
    if existing_log:
        # Update existing log
        existing_log.status = status
        existing_log.value = data.get('value')
        existing_log.notes = data.get('notes')
        existing_log.mood = data.get('mood')
        existing_log.duration_minutes = data.get('duration_minutes')
        existing_log.completed_at = datetime.utcnow()
    else:
        # Create new log
        log = HabitLog(
            habit_id=habit_id,
            status=status,
            value=data.get('value'),
            notes=data.get('notes'),
            mood=data.get('mood'),
            duration_minutes=data.get('duration_minutes')
        )
        db.session.add(log)
    
    db.session.commit()
    
    # Award XP and check badges
    if status == 'completed':
        award_xp(user.id, 10, f"Habit completed: {habit.name}")
        check_badges(user.id)
    
    current_streak, longest_streak = get_habit_streak(habit_id)
    
    return jsonify({
        'message': 'Habit logged successfully',
        'status': status,
        'current_streak': current_streak,
        'longest_streak': longest_streak
    })

# Analytics Routes
@app.route('/api/analytics/dashboard', methods=['GET'])
def get_analytics_dashboard():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Time periods
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    habit_ids = [h.id for h in user.habits]
    
    # Basic stats
    total_habits = len(habit_ids)
    
    # Today's completion
    today_logs = HabitLog.query.filter(
        HabitLog.habit_id.in_(habit_ids),
        db.func.date(HabitLog.completed_at) == today
    ).all()
    
    today_completed = len([log for log in today_logs if log.status == 'completed'])
    
    # Weekly stats
    week_logs = HabitLog.query.filter(
        HabitLog.habit_id.in_(habit_ids),
        HabitLog.completed_at >= week_ago
    ).all()
    
    week_completed = len([log for log in week_logs if log.status == 'completed'])
    
    # Monthly stats
    month_logs = HabitLog.query.filter(
        HabitLog.habit_id.in_(habit_ids),
        HabitLog.completed_at >= month_ago
    ).all()
    
    month_completed = len([log for log in month_logs if log.status == 'completed'])
    
    # Best day of week
    day_completion = {}
    for log in week_logs:
        if log.status == 'completed':
            day_name = log.completed_at.strftime('%A')
            day_completion[day_name] = day_completion.get(day_name, 0) + 1
    
    best_day = max(day_completion.items(), key=lambda x: x[1])[0] if day_completion else None
    
    # Habit-wise stats
    habit_stats = []
    for habit in user.habits:
        current_streak, longest_streak = get_habit_streak(habit.id)
        
        habit_month_logs = [log for log in month_logs if log.habit_id == habit.id]
        habit_month_completed = len([log for log in habit_month_logs if log.status == 'completed'])
        
        # Total value for measurable habits
        total_value = sum([log.value or 0 for log in habit_month_logs if log.value])
        
        habit_stats.append({
            'id': habit.id,
            'name': habit.name,
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'monthly_completion': habit_month_completed,
            'total_value': total_value,
            'unit': habit.unit
        })
    
    return jsonify({
        'overview': {
            'total_habits': total_habits,
            'today_completed': today_completed,
            'week_completed': week_completed,
            'month_completed': month_completed,
            'completion_rate_today': (today_completed / total_habits * 100) if total_habits > 0 else 0,
            'completion_rate_week': (week_completed / (total_habits * 7) * 100) if total_habits > 0 else 0,
            'best_day': best_day
        },
        'habit_stats': habit_stats,
        'user': {
            'level': user.level,
            'xp': user.xp,
            'total_coins': user.total_coins
        }
    })

@app.route('/api/analytics/calendar', methods=['GET'])
def get_calendar_data():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    habit_ids = [h.id for h in user.habits]
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = HabitLog.query.filter(HabitLog.habit_id.in_(habit_ids))
    
    if start_date:
        query = query.filter(HabitLog.completed_at >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(HabitLog.completed_at <= datetime.strptime(end_date, '%Y-%m-%d'))
    
    logs = query.all()
    
    calendar_data = {}
    for log in logs:
        date_str = log.completed_at.strftime('%Y-%m-%d')
        if date_str not in calendar_data:
            calendar_data[date_str] = {
                'completed': 0,
                'skipped': 0,
                'missed': 0,
                'habits': []
            }
        
        calendar_data[date_str][log.status] += 1
        calendar_data[date_str]['habits'].append({
            'habit_id': log.habit_id,
            'habit_name': log.habit.name,
            'status': log.status,
            'value': log.value,
            'notes': log.notes
        })
    
    return jsonify(calendar_data)

# Gamification Routes
@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Get user badges
    user_badges = db.session.query(UserBadge, Badge).join(Badge).filter(UserBadge.user_id == user.id).all()
    
    badges = []
    for user_badge, badge in user_badges:
        badges.append({
            'id': badge.id,
            'name': badge.name,
            'description': badge.description,
            'icon': badge.icon,
            'earned_at': user_badge.earned_at.isoformat()
        })
    
    # Calculate progress to next level
    current_level_xp = sum([i * 100 for i in range(1, user.level)])
    next_level_xp = current_level_xp + (user.level * 100)
    xp_progress = ((user.xp - current_level_xp) / (user.level * 100)) * 100 if user.level > 0 else 0
    
    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'level': user.level,
            'xp': user.xp,
            'total_coins': user.total_coins,
            'theme': user.theme,
            'timezone': user.timezone
        },
        'badges': badges,
        'progress': {
            'current_level_xp': current_level_xp,
            'next_level_xp': next_level_xp,
            'xp_progress': xp_progress
        }
    })

# Categories Routes
@app.route('/api/categories', methods=['GET'])
def get_categories():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Get both default and user categories
    categories = Category.query.filter(
        (Category.user_id == user.id) | (Category.user_id.is_(None))
    ).all()
    
    return jsonify([{
        'id': cat.id,
        'name': cat.name,
        'color': cat.color,
        'icon': cat.icon,
        'is_custom': cat.user_id == user.id
    } for cat in categories])

# AI Insights Route
@app.route('/api/ai/insights', methods=['GET'])
def get_ai_insights():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Get existing unread insights
    insights = AIInsight.query.filter_by(user_id=user.id, is_read=False).order_by(AIInsight.created_at.desc()).limit(5).all()
    
    # Generate new insights if needed (simplified for now)
    if len(insights) < 3:
        new_insight = AIInsight(
            user_id=user.id,
            insight_type='motivation',
            title='Keep up the great work!',
            content=f'You\'re at level {user.level} with {user.xp} XP. You\'re making excellent progress!',
            confidence_score=0.9
        )
        db.session.add(new_insight)
        db.session.commit()
        insights.append(new_insight)
    
    return jsonify([{
        'id': insight.id,
        'type': insight.insight_type,
        'title': insight.title,
        'content': insight.content,
        'confidence_score': insight.confidence_score,
        'created_at': insight.created_at.isoformat()
    } for insight in insights])

# Serve frontend
@app.route('/')
def index():
    return render_template('index_advanced.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create default badges if they don't exist
        if Badge.query.count() == 0:
            default_badges = [
                ('First Step', 'Complete your first habit', 'star', 'completion', 1, 10, 5),
                ('Week Warrior', '7-day streak', 'fire', 'streak', 7, 50, 25),
                ('Habit Master', '30-day streak', 'crown', 'streak', 30, 200, 100),
                ('Consistency King', '100 habit completions', 'king', 'completion', 100, 150, 75),
                ('Early Bird', 'Complete habits before 7 AM for 5 days', 'sun', 'special', 5, 75, 40)
            ]
            
            for name, desc, icon, cond_type, cond_val, xp_reward, coin_reward in default_badges:
                badge = Badge(
                    name=name,
                    description=desc,
                    icon=icon,
                    condition_type=cond_type,
                    condition_value=cond_val,
                    xp_reward=xp_reward,
                    coin_reward=coin_reward
                )
                db.session.add(badge)
            
            db.session.commit()
    
    app.run(debug=True, port=5000)