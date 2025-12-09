from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, date, timedelta
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///habits.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Habit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.String(20), nullable=False)  # daily, weekly, monthly
    target_count = db.Column(db.Integer, default=1)
    color = db.Column(db.String(7), default='#3B82F6')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    habit_logs = db.relationship('HabitLog', backref='habit', lazy=True, cascade='all, delete-orphan')

class HabitLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habit.id'), nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    count = db.Column(db.Integer, default=1)

# API Routes
@app.route('/api/habits', methods=['GET'])
def get_habits():
    habits = Habit.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': habit.id,
        'name': habit.name,
        'description': habit.description,
        'category': habit.category,
        'frequency': habit.frequency,
        'target_count': habit.target_count,
        'color': habit.color,
        'created_at': habit.created_at.isoformat(),
        'today_completed': get_today_completion(habit.id),
        'streak': get_streak(habit.id)
    } for habit in habits])

@app.route('/api/habits', methods=['POST'])
def create_habit():
    data = request.get_json()
    
    habit = Habit(
        name=data['name'],
        description=data.get('description', ''),
        category=data['category'],
        frequency=data['frequency'],
        target_count=data.get('target_count', 1),
        color=data.get('color', '#3B82F6')
    )
    
    db.session.add(habit)
    db.session.commit()
    
    return jsonify({
        'id': habit.id,
        'name': habit.name,
        'description': habit.description,
        'category': habit.category,
        'frequency': habit.frequency,
        'target_count': habit.target_count,
        'color': habit.color,
        'created_at': habit.created_at.isoformat(),
        'today_completed': False,
        'streak': 0
    }), 201

@app.route('/api/habits/<int:habit_id>', methods=['PUT'])
def update_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    data = request.get_json()
    
    habit.name = data.get('name', habit.name)
    habit.description = data.get('description', habit.description)
    habit.category = data.get('category', habit.category)
    habit.frequency = data.get('frequency', habit.frequency)
    habit.target_count = data.get('target_count', habit.target_count)
    habit.color = data.get('color', habit.color)
    
    db.session.commit()
    
    return jsonify({
        'id': habit.id,
        'name': habit.name,
        'description': habit.description,
        'category': habit.category,
        'frequency': habit.frequency,
        'target_count': habit.target_count,
        'color': habit.color,
        'created_at': habit.created_at.isoformat(),
        'today_completed': get_today_completion(habit.id),
        'streak': get_streak(habit.id)
    })

@app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    habit.is_active = False
    db.session.commit()
    return jsonify({'message': 'Habit deleted successfully'})

@app.route('/api/habits/<int:habit_id>/complete', methods=['POST'])
def complete_habit(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    data = request.get_json()
    
    # Check if already completed today
    today = date.today()
    existing_log = HabitLog.query.filter(
        HabitLog.habit_id == habit_id,
        db.func.date(HabitLog.completed_at) == today
    ).first()
    
    if existing_log:
        existing_log.count = data.get('count', 1)
        existing_log.notes = data.get('notes', '')
        existing_log.completed_at = datetime.utcnow()
    else:
        log = HabitLog(
            habit_id=habit_id,
            count=data.get('count', 1),
            notes=data.get('notes', '')
        )
        db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Habit completed successfully',
        'today_completed': True,
        'streak': get_streak(habit_id)
    })

@app.route('/api/habits/<int:habit_id>/logs', methods=['GET'])
def get_habit_logs(habit_id):
    habit = Habit.query.get_or_404(habit_id)
    logs = HabitLog.query.filter_by(habit_id=habit_id).order_by(HabitLog.completed_at.desc()).limit(30).all()
    
    return jsonify([{
        'id': log.id,
        'completed_at': log.completed_at.isoformat(),
        'notes': log.notes,
        'count': log.count
    } for log in logs])

@app.route('/api/stats', methods=['GET'])
def get_stats():
    active_habits = Habit.query.filter_by(is_active=True).all()
    total_habits = len(active_habits)
    
    today_completed = 0
    for habit in active_habits:
        if get_today_completion(habit.id):
            today_completed += 1
    
    # Get completion rate for last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    week_logs = HabitLog.query.filter(HabitLog.completed_at >= week_ago).all()
    
    return jsonify({
        'total_habits': total_habits,
        'today_completed': today_completed,
        'completion_rate': (today_completed / total_habits * 100) if total_habits > 0 else 0,
        'week_activities': len(week_logs)
    })

def get_today_completion(habit_id):
    today = date.today()
    log = HabitLog.query.filter(
        HabitLog.habit_id == habit_id,
        db.func.date(HabitLog.completed_at) == today
    ).first()
    return log is not None

def get_streak(habit_id):
    logs = HabitLog.query.filter_by(habit_id=habit_id).order_by(HabitLog.completed_at.desc()).all()
    
    if not logs:
        return 0
    
    streak = 0
    current_date = date.today()
    
    for log in logs:
        log_date = log.completed_at.date()
        
        if log_date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        elif log_date == current_date - timedelta(days=1):
            streak += 1
            current_date = log_date
        else:
            break
    
    return streak

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)