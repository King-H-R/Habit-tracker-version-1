"use client"

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { OnboardingScreen } from '@/components/OnboardingScreen'
import { CalendarHeatmap, generateSampleHeatmapData } from '@/components/CalendarHeatmap'
import { AnalyticsDashboard, generateSampleAnalyticsData } from '@/components/AnalyticsDashboard'
import { HabitTimer } from '@/components/HabitTimer'
import { SettingsScreen } from '@/components/SettingsScreen'
import {
  Target,
  Flame,
  Plus,
  Clock,
  TrendingUp,
  Calendar,
  Timer,
  Settings,
  Moon,
  Sun,
  Brain,
  Heart,
  BookOpen,
  CheckCircle,
  Dumbbell,
  Droplets,
  Trophy,
  Award,
  BarChart3
} from 'lucide-react'

interface Habit {
  id: string
  name: string
  category: string
  type: string
  targetValue: number | null
  unit?: string | null
  progress: number
  streak: number
  icon: any // Dynamic icon based on category
  color: string
  completed: boolean
  timeSpent?: number
  longestStreak: number
  completionRate: number
}

interface UserStats {
  currentStreak: number
  longestStreak: number
  completionRate: number
  bestDay: string
  totalHabits: number
  completedToday: number
}

export default function HabitTrackerApp() {
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showTimer, setShowTimer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const { data: session } = useSession()
  const [habits, setHabits] = useState<Habit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states for interactions
  const [showQuantityDialog, setShowQuantityDialog] = useState(false)
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null)
  const [quantityInput, setQuantityInput] = useState('')

  const fetchHabits = async () => {
    if (!session?.user) return
    try {
      setIsLoading(true)
      const res = await axios.get('/api/habits')

      const mappedHabits = res.data.map((h: any) => ({
        id: h.id,
        name: h.name,
        category: h.category,
        type: h.type,
        targetValue: h.targetValue || 0,
        unit: h.unit,
        streak: h.currentStreak || 0,
        icon: getCategoryIcon(h.category),
        color: h.color || getCategoryColor(h.category),
        completed: h.todayCompleted,
        progress: h.logs?.[0]?.value || 0,
        timeSpent: h.logs?.[0]?.value || 0, // Reuse value for time
        longestStreak: h.longestStreak || 0,
        completionRate: h.completionRate || 0
      }))

      setHabits(mappedHabits)
    } catch (error) {
      console.error("Failed to fetch habits", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      setShowOnboarding(false) // Hide onboarding if logged in
      fetchHabits()
      setUserName(session.user.name || 'User')
    }
  }, [session])

  const [userStats, setUserStats] = useState<UserStats>({
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    bestDay: 'Monday',
    totalHabits: 0,
    completedToday: 0
  })

  const [userName, setUserName] = useState('Vimal')

  // Create Habit State
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState('Study')
  const [newHabitType, setNewHabitType] = useState<'yesno' | 'measurable'>('yesno')
  const [newHabitTarget, setNewHabitTarget] = useState('')
  const [newHabitUnit, setNewHabitUnit] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCreateHabit = async () => {
    if (!newHabitName) return

    try {
      await axios.post('/api/habits', {
        name: newHabitName,
        category: newHabitCategory,
        type: newHabitType,
        frequency: 'daily',
        targetValue: newHabitTarget,
        unit: newHabitUnit,
        color: getCategoryColor(newHabitCategory),
        allowSkip: false,
        allowedMisses: 0
      })
      setShowCreateDialog(false)
      setNewHabitName('')
      setNewHabitTarget('')
      fetchHabits()
    } catch (error) {
      console.error("Failed to create habit", error)
    }
  }
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }, [])

  const completedToday = habits.filter(h => h.completed).length
  const totalHabits = habits.length
  const overallProgress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ElementType } = {
      'Study': BookOpen,
      'Health': Heart,
      'Mindfulness': Brain,
      'Fitness': Dumbbell,
      'Finance': TrendingUp,
      'Social': Heart, // Placeholder
      'Other': Target
    }
    return icons[category] || Target
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Study': '#3b82f6', // blue
      'Health': '#ef4444', // red
      'Mindfulness': '#8b5cf6', // purple
      'Fitness': '#f97316', // orange
    }
    return colors[category] || '#10b981' // emerald default
  }

  const toggleHabitComplete = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    // Logic to open dialogs based on type
    if (habit.type === 'measurable') {
      if (['minutes', 'hours', 'time'].includes(habit.unit?.toLowerCase() || '')) {
        // Show Timer Dialog directly
        openTimer(habit)
        return
      } else {
        // Show Quantity Dialog
        setActiveHabitId(habitId)
        setQuantityInput('')
        setShowQuantityDialog(true)
        return
      }
    }

    // Default yes/no toggle behavior
    try {
      const newStatus = !habit.completed
      setHabits(habits.map(h => h.id === habitId ? { ...h, completed: newStatus } : h))

      await axios.post(`/api/habits/${habitId}/checkin`, {
        status: newStatus ? 'done' : 'missed',
        date: new Date().toISOString()
      })

      fetchHabits() // Refresh to get exact stats
    } catch (error) {
      console.error("Failed to checkin", error)
    }
  }

  const handleQuantitySubmit = async () => {
    if (!activeHabitId || !quantityInput) return

    try {
      const value = parseInt(quantityInput)
      await axios.post(`/api/habits/${activeHabitId}/checkin`, {
        status: 'done',
        value: value,
        date: new Date().toISOString()
      })
      setShowQuantityDialog(false)
      fetchHabits()
    } catch (error) {
      console.error("Failed to log quantity", error)
    }
  }

  const openTimer = (habit: Habit) => {
    setSelectedHabit(habit)
    setShowTimer(true)
  }

  const analyticsData = generateSampleAnalyticsData()
  const calendarData = generateSampleHeatmapData(2024, 11) // Current month

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={async (name, goals) => {
          if (name) {
            // Sign in using the name as the email (simplified flow)
            await signIn('credentials', {
              email: name,
              redirect: false,
            })
            setUserName(name)
            // Session update happens automatically via NextAuth context
            // No reload needed, effect will catch the session change
          }
        }}
      />
    )
  }

  if (showTimer && selectedHabit) {
    return (
      <HabitTimer
        habitName={selectedHabit.name}
        targetMinutes={(selectedHabit.targetValue || 1) * (selectedHabit.unit?.toLowerCase().includes('hour') ? 60 : 1)}
        onComplete={(timeSpent) => {
          // Update habit with time spent
          // Call API
          axios.post(`/api/habits/${selectedHabit.id}/checkin`, {
            status: 'done',
            value: timeSpent, // in minutes?
            date: new Date().toISOString()
          }).then(() => {
            fetchHabits()
            setShowTimer(false)
          })
        }}
        onClose={() => setShowTimer(false)}
      />
    )
  }

  if (showSettings) {
    return (
      <SettingsScreen onClose={() => setShowSettings(false)} />
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
      }}>
      {/* Header */}
      <header className="p-6 pb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <span>{greeting}, {userName} 👋</span>
              <Badge variant="secondary" className="text-xs">
                Level 12 🔥
              </Badge>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Build better habits, one day at a time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 rounded-full"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="p-3 rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:max-w-4xl">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Streak</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        🔥 {userStats.currentStreak} days
                      </p>
                    </div>
                    <Flame className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Best Streak</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        🏆 {userStats.longestStreak} days
                      </p>
                    </div>
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completion Rate</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {userStats.completionRate}%
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                      {userStats.completionRate}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Today's Progress</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {completedToday}/{totalHabits}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                  <Progress value={overallProgress} className="mt-3" />
                </CardContent>
              </Card>
            </section>

            {/* Today's Habits */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Habits</h2>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="rounded-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Habit
                </Button>

                {/* Create Habit Dialog */}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create New Habit</DialogTitle>
                      <DialogDescription>
                        Add a new habit to track your progress
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Habit Name</label>
                        <input
                          type="text"
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          placeholder="e.g., Read 10 pages"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <select
                          value={newHabitCategory}
                          onChange={(e) => setNewHabitCategory(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Study">Study</option>
                          <option value="Health">Health</option>
                          <option value="Mindfulness">Mindfulness</option>
                          <option value="Fitness">Fitness</option>
                          <option value="Finance">Finance</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="type"
                              checked={newHabitType === 'yesno'}
                              onChange={() => setNewHabitType('yesno')}
                              className="mr-2"
                            /> Yes/No
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="type"
                              checked={newHabitType === 'measurable'}
                              onChange={() => setNewHabitType('measurable')}
                              className="mr-2"
                            /> Measurable
                          </label>
                        </div>
                      </div>

                      {newHabitType === 'measurable' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Target</label>
                            <input
                              type="number"
                              value={newHabitTarget}
                              onChange={(e) => setNewHabitTarget(e.target.value)}
                              placeholder="8"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Unit</label>
                            <input
                              type="text"
                              value={newHabitUnit}
                              onChange={(e) => setNewHabitUnit(e.target.value)}
                              placeholder="minutes, pages"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      <Button onClick={handleCreateHabit} className="w-full rounded-lg py-3 bg-gradient-to-r from-blue-500 to-purple-600">
                        Create Habit
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {habits.map((habit) => {
                  const Icon = habit.icon
                  const progressPercentage = (habit.progress / (habit.targetValue || 1)) * 100

                  return (
                    <Card
                      key={habit.id}
                      className={`backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${habit.completed ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                        }`}
                    >
                      <CardContent className="p-6">
                        {/* Habit Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                              style={{ backgroundColor: habit.color }}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {habit.category}
                              </Badge>
                            </div>
                          </div>
                          {habit.completed && (
                            <div className="text-green-500 text-sm font-medium">✓ Done</div>
                          )}
                        </div>

                        {/* Progress Ring */}
                        <div className="flex justify-center mb-4">
                          <div className="relative w-20 h-20">
                            <svg className="transform -rotate-90 w-20 h-20">
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-gray-200 dark:text-gray-700"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressPercentage / 100)}`}
                                className="transition-all duration-500"
                                style={{
                                  stroke: habit.color,
                                  strokeLinecap: 'round'
                                }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {Math.round(progressPercentage)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Details */}
                        <div className="text-center mb-4">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {habit.progress}/{habit.targetValue} {habit.unit}
                          </p>
                          {habit.streak > 0 && (
                            <Badge className="bg-orange-500 text-white">
                              🔥 {habit.streak} day streak
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => toggleHabitComplete(habit.id)}
                            className={`flex-1 rounded-lg py-3 font-medium transition-all ${habit.completed
                              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                              }`}
                          >
                            {habit.completed ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Done
                              </>
                            ) : (
                              <>
                                {habit.type === 'measurable' && ['minutes', 'hours', 'time'].includes(habit.unit?.toLowerCase() || '') ? (
                                  <>
                                    <Timer className="h-4 w-4 mr-2" />
                                    Start Timer / Log Time
                                  </>
                                ) : habit.type === 'measurable' ? (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Log Progress
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Complete
                                  </>
                                )}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>

            {/* Motivational Quote */}
            <section className="text-center py-8">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg max-w-2xl mx-auto">
                <CardContent className="p-8">
                  <blockquote className="text-lg text-gray-700 dark:text-gray-300 italic mb-4">
                    "One step at a time ✨ Progress is not about being perfect, it's about showing up every day."
                  </blockquote>
                  <cite className="text-sm text-gray-500 dark:text-gray-400">
                    — Your Journey to Better Habits
                  </cite>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <CalendarHeatmap year={2024} month={11} data={calendarData} />
          </TabsContent>

          {/* Quantity Input Dialog */}
          <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Progress</DialogTitle>
                <DialogDescription>Enter the amount you completed</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <input
                    type="number"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="e.g. 5"
                    autoFocus
                  />
                </div>
                <Button onClick={handleQuantitySubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Save Progress
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard data={analyticsData} />
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">🎯</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Goals
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Set meaningful goals and track your progress
                </p>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600">
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '🏅', name: '3-Day Starter', description: 'Complete habits for 3 consecutive days', earned: true },
                { icon: '🔥', name: '7-Day Streak', description: 'Maintain a 7-day streak', earned: true },
                { icon: '💪', name: '30-Day Warrior', description: '30 days of consistent habits', earned: false },
                { icon: '🌟', name: 'Early Bird', description: 'Complete habits before 7 AM for 5 days', earned: false },
                { icon: '👑', name: 'Perfect Week', description: '100% completion for a week', earned: true },
                { icon: '🏆', name: 'Habit Master', description: 'Reach a 60-day streak', earned: false }
              ].map((achievement, index) => (
                <Card key={index} className={`text-center p-6 transition-all hover:scale-105 ${achievement.earned
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900 dark:to-orange-800 border-yellow-200 dark:border-yellow-700'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}>
                  <CardContent>
                    <div className="text-4xl mb-3">{achievement.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.description}</p>
                    {achievement.earned && (
                      <Badge className="mt-2 bg-green-500 text-white">
                        <Award className="h-3 w-3 mr-1" />
                        Earned
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance Insights</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📈 Most Productive Day</p>
                      <p className="text-blue-600 dark:text-blue-400">Monday - 92% completion rate</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">🔥 Best Streak Period</p>
                      <p className="text-green-600 dark:text-green-400">Jan 15 - Feb 28 (44 days)</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">💡 Suggestion</p>
                      <p className="text-purple-600 dark:text-purple-400">Try morning meditation for better focus</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-8 w-8 text-purple-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Smart Recommendations</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">🎯 Goal Focus</p>
                      <p className="text-purple-600 dark:text-purple-400">Study habits show 89% success rate</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">⏰ Optimal Timing</p>
                      <p className="text-orange-600 dark:text-orange-400">Complete habits between 7-9 PM</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">🌱 Recovery Pattern</p>
                      <p className="text-green-600 dark:text-green-400">Rest weekends boost weekday performance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}