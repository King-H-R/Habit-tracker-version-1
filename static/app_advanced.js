// Global variables
let currentUser = null;
let authToken = null;
let habits = [];
let categories = [];
let currentSection = 'dashboard';
let currentHabitId = null;
let analyticsChart = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeEventListeners();
});

// Check if user is authenticated
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showLoginModal();
    } else {
        loadUserProfile();
        loadDashboard();
    }
}

// Show login modal
function showLoginModal() {
    const loginHtml = `
        <div class="modal fade" id="loginModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Welcome to HabitMaster Pro</h5>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs" id="authTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login" type="button">Login</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="register-tab" data-bs-toggle="tab" data-bs-target="#register" type="button">Register</button>
                            </li>
                        </ul>
                        <div class="tab-content mt-3" id="authTabContent">
                            <div class="tab-pane fade show active" id="login">
                                <form id="loginForm">
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" id="loginEmail" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Password</label>
                                        <input type="password" class="form-control" id="loginPassword" required>
                                    </div>
                                    <button type="submit" class="btn btn-gradient w-100">Login</button>
                                </form>
                            </div>
                            <div class="tab-pane fade" id="register">
                                <form id="registerForm">
                                    <div class="mb-3">
                                        <label class="form-label">Username</label>
                                        <input type="text" class="form-control" id="registerUsername" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" id="registerEmail" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Password</label>
                                        <input type="password" class="form-control" id="registerPassword" required>
                                    </div>
                                    <button type="submit" class="btn btn-gradient w-100">Register</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loginHtml);
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
    
    // Handle login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    // Handle register form
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
}

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            loadUserProfile();
            loadDashboard();
            showSuccess('Login successful!');
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

// Register function
async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            loadUserProfile();
            loadDashboard();
            showSuccess('Registration successful!');
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            // Update UI with user data
            document.getElementById('userLevel').textContent = currentUser.level;
            document.getElementById('userCoins').textContent = currentUser.total_coins;
            document.getElementById('xpProgress').style.width = data.progress.xp_progress + '%';
            
            // Load badges
            loadBadges(data.badges);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch('/api/analytics/dashboard', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update stats
            document.getElementById('totalHabits').textContent = data.overview.total_habits;
            document.getElementById('todayCompleted').textContent = data.overview.today_completed;
            document.getElementById('completionRate').textContent = Math.round(data.overview.completion_rate_today) + '%';
            
            // Calculate current streak
            let maxStreak = 0;
            data.habit_stats.forEach(habit => {
                if (habit.current_streak > maxStreak) {
                    maxStreak = habit.current_streak;
                }
            });
            document.getElementById('currentStreak').textContent = maxStreak;
            
            // Load today's habits
            loadTodayHabits();
            
            // Load insights
            loadInsights();
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load today's habits
async function loadTodayHabits() {
    try {
        const response = await fetch('/api/habits', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            habits = await response.json();
            renderTodayHabits(habits);
        }
    } catch (error) {
        console.error('Error loading habits:', error);
    }
}

// Render today's habits
function renderTodayHabits(habitsToRender) {
    const container = document.getElementById('todayHabits');
    
    if (habitsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-seedling"></i>
                <h4>No habits yet</h4>
                <p>Start building better habits by adding your first one!</p>
                <button class="btn btn-gradient mt-3" onclick="showAddHabitModal()">
                    <i class="fas fa-plus me-2"></i>Add Your First Habit
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = habitsToRender.map(habit => {
        const progressHtml = habit.today_progress ? `
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${habit.today_progress.current}/${habit.today_progress.target} ${habit.unit || ''}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${habit.today_progress.percentage}%"></div>
                </div>
            </div>
        ` : '';
        
        return `
            <div class="habit-card ${habit.today_status === 'completed' ? 'completed' : ''} ${habit.is_pinned ? 'pinned' : ''} fade-in">
                <div class="habit-header">
                    <div>
                        <div class="habit-title">${habit.name}</div>
                        <div class="habit-meta">
                            <span class="habit-badge">${habit.category}</span>
                            <span class="habit-badge">${habit.frequency}</span>
                            ${habit.current_streak > 0 ? `<span class="streak-badge"><i class="fas fa-fire"></i> ${habit.current_streak} days</span>` : ''}
                        </div>
                    </div>
                </div>
                
                ${progressHtml}
                
                <div class="habit-actions">
                    <button class="action-btn complete" onclick="showCompleteModal(${habit.id})" ${habit.today_status ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> ${habit.today_status === 'completed' ? 'Done' : 'Complete'}
                    </button>
                    <button class="action-btn skip" onclick="skipHabit(${habit.id})" ${habit.today_status ? 'disabled' : ''}>
                        <i class="fas fa-forward"></i> Skip
                    </button>
                    <button class="action-btn miss" onclick="missHabit(${habit.id})" ${habit.today_status ? 'disabled' : ''}>
                        <i class="fas fa-times"></i> Miss
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Show section
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(section + '-section').style.display = 'block';
    
    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.sidebar-item').classList.add('active');
    
    currentSection = section;
    
    // Load section-specific data
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'habits':
            loadHabits();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'badges':
            loadBadges();
            break;
        case 'insights':
            loadInsights();
            break;
    }
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

// Load habits section
async function loadHabits() {
    try {
        const response = await fetch('/api/habits', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            habits = await response.json();
            renderHabitsList(habits);
        }
    } catch (error) {
        console.error('Error loading habits:', error);
    }
}

// Render habits list
function renderHabitsList(habitsToRender) {
    const container = document.getElementById('habitsList');
    
    if (habitsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-seedling"></i>
                <h4>No habits yet</h4>
                <p>Start building better habits by adding your first one!</p>
                <button class="btn btn-gradient mt-3" onclick="showAddHabitModal()">
                    <i class="fas fa-plus me-2"></i>Add Your First Habit
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = habitsToRender.map(habit => `
        <div class="habit-card ${habit.is_pinned ? 'pinned' : ''} fade-in">
            <div class="habit-header">
                <div>
                    <div class="habit-title">${habit.name}</div>
                    <div class="habit-meta">
                        <span class="habit-badge">${habit.category}</span>
                        <span class="habit-badge">${habit.frequency}</span>
                        <span class="habit-badge">${habit.habit_type}</span>
                        ${habit.current_streak > 0 ? `<span class="streak-badge"><i class="fas fa-fire"></i> ${habit.current_streak} days</span>` : ''}
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editHabit(${habit.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteHabit(${habit.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="habit-actions">
                <button class="action-btn complete" onclick="showCompleteModal(${habit.id})" ${habit.today_status ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> ${habit.today_status === 'completed' ? 'Done' : 'Complete'}
                </button>
                <button class="action-btn skip" onclick="skipHabit(${habit.id})" ${habit.today_status ? 'disabled' : ''}>
                    <i class="fas fa-forward"></i> Skip
                </button>
                <button class="action-btn miss" onclick="missHabit(${habit.id})" ${habit.today_status ? 'disabled' : ''}>
                    <i class="fas fa-times"></i> Miss
                </button>
            </div>
        </div>
    `).join('');
}

// Show add habit modal
function showAddHabitModal() {
    currentHabitId = null;
    document.getElementById('habitModalTitle').textContent = 'Add New Habit';
    document.getElementById('habitForm').reset();
    
    const modal = new bootstrap.Modal(document.getElementById('habitModal'));
    modal.show();
}

// Show complete modal
function showCompleteModal(habitId) {
    currentHabitId = habitId;
    document.getElementById('completeForm').reset();
    
    const modal = new bootstrap.Modal(document.getElementById('completeModal'));
    modal.show();
}

// Save habit
async function saveHabit() {
    const formData = {
        name: document.getElementById('habitName').value,
        description: document.getElementById('habitDescription').value,
        category_id: 1, // Default category for now
        frequency: document.getElementById('habitFrequency').value,
        habit_type: document.getElementById('habitType').value,
        color: document.getElementById('habitColor').value
    };
    
    try {
        const response = await fetch('/api/habits', {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('habitModal')).hide();
            showSuccess('Habit created successfully!');
            loadHabits();
            loadDashboard();
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to create habit');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

// Confirm complete habit
async function confirmComplete() {
    const status = document.querySelector('input[name="status"]:checked').value;
    const notes = document.getElementById('habitNotes').value;
    
    try {
        const response = await fetch(`/api/habits/${currentHabitId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, notes })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('completeModal')).hide();
            showSuccess('Habit logged successfully!');
            loadHabits();
            loadDashboard();
            loadUserProfile(); // Update XP and level
        } else {
            const data = await response.json();
            showError(data.error || 'Failed to log habit');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
}

// Skip habit
async function skipHabit(habitId) {
    try {
        const response = await fetch(`/api/habits/${habitId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'skipped' })
        });
        
        if (response.ok) {
            showSuccess('Habit skipped');
            loadHabits();
            loadDashboard();
        }
    } catch (error) {
        showError('Failed to skip habit');
    }
}

// Miss habit
async function missHabit(habitId) {
    try {
        const response = await fetch(`/api/habits/${habitId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'missed' })
        });
        
        if (response.ok) {
            showSuccess('Habit marked as missed');
            loadHabits();
            loadDashboard();
        }
    } catch (error) {
        showError('Failed to mark habit as missed');
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch('/api/analytics/dashboard', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderAnalyticsChart(data);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Render analytics chart
function renderAnalyticsChart(data) {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    
    if (analyticsChart) {
        analyticsChart.destroy();
    }
    
    analyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Completion Rate',
                data: [65, 78, 90, 81, 56, 85, 92], // Sample data
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Load badges
async function loadBadges(badgesData = null) {
    if (!badgesData) {
        // This would be expanded to fetch from API
        badgesData = [];
    }
    
    const container = document.getElementById('badgesGrid');
    
    if (badgesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-medal"></i>
                <h4>No badges yet</h4>
                <p>Complete habits and build streaks to earn badges!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = badgesData.map(badge => `
        <div class="badge-item fade-in">
            <div class="badge-icon">${badge.icon || '🏆'}</div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
        </div>
    `).join('');
}

// Load insights
async function loadInsights() {
    try {
        const response = await fetch('/api/ai/insights', {
            headers: { 'Authorization': authToken }
        });
        
        if (response.ok) {
            const insights = await response.json();
            renderInsights(insights);
        }
    } catch (error) {
        console.error('Error loading insights:', error);
    }
}

// Render insights
function renderInsights(insights) {
    const container = document.getElementById('insightsList') || document.getElementById('insightsPreview');
    
    if (insights.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <h4>No insights yet</h4>
                <p>Keep tracking your habits to get personalized insights!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-card ${insight.type} fade-in">
            <h6 class="fw-bold">${insight.title}</h6>
            <p class="mb-0">${insight.content}</p>
            <small class="text-muted">${new Date(insight.created_at).toLocaleDateString()}</small>
        </div>
    `).join('');
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.getElementById('themeIcon');
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Toggle sidebar (mobile)
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Logout
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    location.reload();
}

// Show success message
function showSuccess(message) {
    showToast(message, 'success');
}

// Show error message
function showError(message) {
    showToast(message, 'error');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.innerHTML = toastHtml;
    
    document.body.appendChild(toastContainer);
    
    const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
    toast.show();
    
    setTimeout(() => {
        toastContainer.remove();
    }, 5000);
}

// Initialize event listeners
function initializeEventListeners() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('themeIcon').className = savedTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(event.target) && 
            !toggle.contains(event.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
    });
}