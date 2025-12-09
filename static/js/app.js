class HabitTracker {
    constructor() {
        this.habits = [];
        this.stats = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadHabits();
        this.loadStats();
    }

    bindEvents() {
        // Add habit form
        document.getElementById('addHabitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHabit();
        });

        // Edit habit form
        document.getElementById('editHabitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateHabit();
        });

        // Delete habit button
        document.getElementById('deleteHabitBtn').addEventListener('click', () => {
            this.deleteHabit();
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async loadHabits() {
        try {
            const response = await fetch('/api/habits');
            this.habits = await response.json();
            this.renderHabits();
        } catch (error) {
            this.showToast('Error loading habits', true);
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            this.stats = await response.json();
            this.renderStats();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderHabits() {
        const container = document.getElementById('habitsContainer');
        const noHabitsMessage = document.getElementById('noHabitsMessage');

        if (this.habits.length === 0) {
            container.innerHTML = '';
            noHabitsMessage.style.display = 'block';
            return;
        }

        noHabitsMessage.style.display = 'none';
        container.innerHTML = this.habits.map(habit => this.createHabitCard(habit)).join('');

        // Bind completion events
        this.habits.forEach(habit => {
            const completeBtn = document.getElementById(`complete-${habit.id}`);
            if (completeBtn) {
                completeBtn.addEventListener('click', () => this.completeHabit(habit.id));
            }

            const editBtn = document.getElementById(`edit-${habit.id}`);
            if (editBtn) {
                editBtn.addEventListener('click', () => this.openEditModal(habit));
            }
        });
    }

    createHabitCard(habit) {
        const todayCompletions = habit.completions ? habit.completions.filter(c => {
            const completionDate = new Date(c.completed_at).toDateString();
            const today = new Date().toDateString();
            return completionDate === today;
        }).length : 0;

        const isCompletedToday = todayCompletions >= habit.target_frequency;
        
        return `
            <div class="habit-card">
                <div class="habit-header">
                    <div>
                        <div class="habit-title">${this.escapeHtml(habit.name)}</div>
                        <span class="habit-category">${this.escapeHtml(habit.category || 'General')}</span>
                    </div>
                    ${this.getStreakBadge(habit.id)}
                </div>
                
                ${habit.description ? `<div class="habit-description">${this.escapeHtml(habit.description)}</div>` : ''}
                
                <div class="habit-meta">
                    <span><i class="fas fa-clock"></i> ${habit.frequency_type === 'daily' ? 'Daily' : 'Weekly'}</span>
                    <span><i class="fas fa-target"></i> ${habit.target_frequency}x</span>
                    <span><i class="fas fa-check"></i> ${todayCompletions}/${habit.target_frequency} today</span>
                </div>
                
                <div class="habit-actions">
                    <button class="btn btn-complete" id="complete-${habit.id}" ${isCompletedToday ? 'disabled' : ''}>
                        <i class="fas fa-check"></i> ${isCompletedToday ? 'Completed ✓' : 'Complete'}
                    </button>
                    <button class="btn btn-edit" id="edit-${habit.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getStreakBadge(habitId) {
        const stat = this.stats.find(s => s.habit_id === habitId);
        if (stat && stat.current_streak > 0) {
            return `<span class="streak-badge"><i class="fas fa-fire"></i> ${stat.current_streak} day streak</span>`;
        }
        return '';
    }

    renderStats() {
        const container = document.getElementById('statsContainer');
        
        if (this.stats.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No stats available yet</p>';
            return;
        }

        container.innerHTML = this.stats.map(stat => `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-title">${this.escapeHtml(stat.habit_name)}</div>
                    <div class="streak-badge"><i class="fas fa-fire"></i> ${stat.current_streak}</div>
                </div>
                <div class="stat-value">${stat.total_completions}</div>
                <div class="stat-label">Completions (30 days)</div>
                <div class="stat-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(stat.completion_rate, 100)}%"></div>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">
                        ${stat.completion_rate}% completion rate
                    </div>
                </div>
            </div>
        `).join('');
    }

    async addHabit() {
        const formData = {
            name: document.getElementById('habitName').value.trim(),
            description: document.getElementById('habitDescription').value.trim(),
            category: document.getElementById('habitCategory').value.trim() || 'General',
            target_frequency: parseInt(document.getElementById('targetFrequency').value) || 1,
            frequency_type: document.getElementById('frequencyType').value
        };

        if (!formData.name) {
            this.showToast('Please enter a habit name', true);
            return;
        }

        try {
            const response = await fetch('/api/habits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showToast('Habit added successfully!');
                document.getElementById('addHabitForm').reset();
                await this.loadHabits();
                await this.loadStats();
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Error adding habit', true);
            }
        } catch (error) {
            this.showToast('Error adding habit', true);
        }
    }

    async completeHabit(habitId) {
        try {
            const response = await fetch(`/api/habits/${habitId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                this.showToast('Great job! Habit completed! 🎉');
                await this.loadHabits();
                await this.loadStats();
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Error completing habit', true);
            }
        } catch (error) {
            this.showToast('Error completing habit', true);
        }
    }

    openEditModal(habit) {
        document.getElementById('editHabitId').value = habit.id;
        document.getElementById('editHabitName').value = habit.name;
        document.getElementById('editHabitDescription').value = habit.description || '';
        document.getElementById('editHabitCategory').value = habit.category || '';
        document.getElementById('editTargetFrequency').value = habit.target_frequency;
        document.getElementById('editFrequencyType').value = habit.frequency_type;
        
        document.getElementById('editModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    async updateHabit() {
        const habitId = document.getElementById('editHabitId').value;
        const formData = {
            name: document.getElementById('editHabitName').value.trim(),
            description: document.getElementById('editHabitDescription').value.trim(),
            category: document.getElementById('editHabitCategory').value.trim() || 'General',
            target_frequency: parseInt(document.getElementById('editTargetFrequency').value) || 1,
            frequency_type: document.getElementById('editFrequencyType').value
        };

        if (!formData.name) {
            this.showToast('Please enter a habit name', true);
            return;
        }

        try {
            const response = await fetch(`/api/habits/${habitId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showToast('Habit updated successfully!');
                this.closeModal();
                await this.loadHabits();
                await this.loadStats();
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Error updating habit', true);
            }
        } catch (error) {
            this.showToast('Error updating habit', true);
        }
    }

    async deleteHabit() {
        const habitId = document.getElementById('editHabitId').value;
        const habitName = document.getElementById('editHabitName').value.trim();
        
        if (!confirm(`Are you sure you want to delete "${habitName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/habits/${habitId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showToast('Habit deleted successfully');
                this.closeModal();
                await this.loadHabits();
                await this.loadStats();
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Error deleting habit', true);
            }
        } catch (error) {
            this.showToast('Error deleting habit', true);
        }
    }

    showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : ''}`;
        toast.innerHTML = `
            <i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HabitTracker();
});