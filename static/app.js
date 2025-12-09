// Global variables
let habits = [];
let currentEditingHabit = null;
let currentCompletingHabit = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    loadHabits();
    loadStats();
    
    // Update date every minute
    setInterval(updateCurrentDate, 60000);
    
    // Refresh data every 30 seconds
    setInterval(refreshData, 30000);
});

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// Load all habits
async function loadHabits() {
    try {
        const response = await fetch('/api/habits');
        habits = await response.json();
        renderHabits();
        updateProgress();
    } catch (error) {
        console.error('Error loading habits:', error);
        showError('Failed to load habits');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        document.getElementById('totalHabits').textContent = stats.total_habits;
        document.getElementById('todayCompleted').textContent = stats.today_completed;
        document.getElementById('completionRate').textContent = Math.round(stats.completion_rate) + '%';
        document.getElementById('weekActivities').textContent = stats.week_activities;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Render habits list
function renderHabits() {
    const habitsList = document.getElementById('habitsList');
    
    if (habits.length === 0) {
        habitsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-seedling"></i>
                <h4>No habits yet</h4>
                <p>Start building better habits by adding your first one!</p>
                <button class="btn btn-primary mt-3" onclick="showAddHabitModal()">
                    <i class="fas fa-plus me-2"></i>Add Your First Habit
                </button>
            </div>
        `;
        return;
    }
    
    habitsList.innerHTML = habits.map(habit => `
        <div class="habit-card ${habit.today_completed ? 'habit-completed' : ''}" 
             style="border-left-color: ${habit.color};">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <div class="d-flex align-items-center mb-2">
                        <h5 class="mb-0 me-3">${habit.name}</h5>
                        ${habit.today_completed ? '<span class="badge bg-success me-2"><i class="fas fa-check"></i> Done</span>' : ''}
                        <span class="category-badge">${getCategoryLabel(habit.category)}</span>
                    </div>
                    ${habit.description ? `<p class="text-muted mb-2">${habit.description}</p>` : ''}
                    <div class="d-flex align-items-center gap-3">
                        <small class="text-muted">
                            <i class="fas fa-repeat me-1"></i>${habit.frequency}
                        </small>
                        <small class="text-muted">
                            <i class="fas fa-bullseye me-1"></i>Target: ${habit.target_count}
                        </small>
                        ${habit.streak > 0 ? `<span class="streak-badge"><i class="fas fa-fire me-1"></i>${habit.streak} day streak</span>` : ''}
                    </div>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-complete me-2" 
                            onclick="showCompleteModal(${habit.id})"
                            ${habit.today_completed ? 'disabled' : ''}>
                        ${habit.today_completed ? '<i class="fas fa-check"></i> Completed' : '<i class="fas fa-play"></i> Mark Complete'}
                    </button>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editHabit(${habit.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteHabit(${habit.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Update progress circle
function updateProgress() {
    const total = habits.length;
    const completed = habits.filter(h => h.today_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('progressPercentage').textContent = percentage + '%';
    
    // Update progress circle
    const circle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

// Get category label
function getCategoryLabel(category) {
    const labels = {
        'health': 'Health & Fitness',
        'learning': 'Learning & Growth',
        'productivity': 'Productivity',
        'mindfulness': 'Mindfulness',
        'social': 'Social',
        'creative': 'Creative',
        'other': 'Other'
    };
    return labels[category] || category;
}

// Show add habit modal
function showAddHabitModal() {
    currentEditingHabit = null;
    document.getElementById('habitModalTitle').textContent = 'Add New Habit';
    document.getElementById('habitForm').reset();
    document.getElementById('habitColor').value = '#3B82F6';
    
    const modal = new bootstrap.Modal(document.getElementById('habitModal'));
    modal.show();
}

// Edit habit
function editHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    currentEditingHabit = habitId;
    document.getElementById('habitModalTitle').textContent = 'Edit Habit';
    document.getElementById('habitName').value = habit.name;
    document.getElementById('habitDescription').value = habit.description || '';
    document.getElementById('habitCategory').value = habit.category;
    document.getElementById('habitFrequency').value = habit.frequency;
    document.getElementById('habitTarget').value = habit.target_count;
    document.getElementById('habitColor').value = habit.color;
    
    const modal = new bootstrap.Modal(document.getElementById('habitModal'));
    modal.show();
}

// Save habit (create or update)
async function saveHabit() {
    const formData = {
        name: document.getElementById('habitName').value,
        description: document.getElementById('habitDescription').value,
        category: document.getElementById('habitCategory').value,
        frequency: document.getElementById('habitFrequency').value,
        target_count: parseInt(document.getElementById('habitTarget').value),
        color: document.getElementById('habitColor').value
    };
    
    try {
        let response;
        if (currentEditingHabit) {
            response = await fetch(`/api/habits/${currentEditingHabit}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('habitModal')).hide();
            loadHabits();
            loadStats();
            showSuccess(currentEditingHabit ? 'Habit updated successfully!' : 'Habit added successfully!');
        } else {
            showError('Failed to save habit');
        }
    } catch (error) {
        console.error('Error saving habit:', error);
        showError('Failed to save habit');
    }
}

// Delete habit
async function deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    try {
        const response = await fetch(`/api/habits/${habitId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadHabits();
            loadStats();
            showSuccess('Habit deleted successfully!');
        } else {
            showError('Failed to delete habit');
        }
    } catch (error) {
        console.error('Error deleting habit:', error);
        showError('Failed to delete habit');
    }
}

// Show complete modal
function showCompleteModal(habitId) {
    currentCompletingHabit = habitId;
    document.getElementById('completeForm').reset();
    document.getElementById('completeCount').value = 1;
    
    const modal = new bootstrap.Modal(document.getElementById('completeModal'));
    modal.show();
}

// Confirm complete habit
async function confirmComplete() {
    if (!currentCompletingHabit) return;
    
    const formData = {
        count: parseInt(document.getElementById('completeCount').value),
        notes: document.getElementById('completeNotes').value
    };
    
    try {
        const response = await fetch(`/api/habits/${currentCompletingHabit}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('completeModal')).hide();
            loadHabits();
            loadStats();
            showSuccess('Great job! Habit marked as complete!');
        } else {
            showError('Failed to complete habit');
        }
    } catch (error) {
        console.error('Error completing habit:', error);
        showError('Failed to complete habit');
    }
}

// Refresh all data
function refreshData() {
    loadHabits();
    loadStats();
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