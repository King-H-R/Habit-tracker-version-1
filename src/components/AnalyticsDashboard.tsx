"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Award,
  Flame,
  Clock
} from 'lucide-react'

interface HabitAnalytics {
  name: string
  currentStreak: number
  longestStreak: number
  completionRate: number
  monthlyCompletion: number
  weeklyProgress: number[]
  bestDay: string
  totalTime: number
  category: string
}

interface AnalyticsProps {
  data: HabitAnalytics[]
}

export function AnalyticsDashboard({ data }: AnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  const getOverallStats = () => {
    const totalCompletion = data.reduce((sum, habit) => sum + habit.completionRate, 0) / data.length
    const totalStreak = Math.max(...data.map(h => h.currentStreak))
    const totalTime = data.reduce((sum, habit) => sum + (habit.totalTime || 0), 0)

    return {
      avgCompletion: Math.round(totalCompletion),
      maxStreak: totalStreak,
      totalHours: Math.round(totalTime / 60)
    }
  }

  const getBestDay = () => {
    const dayCounts: { [key: string]: number } = {}
    data.forEach(habit => {
      if (dayCounts[habit.bestDay]) {
        dayCounts[habit.bestDay]++
      } else {
        dayCounts[habit.bestDay] = 1
      }
    })

    return Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday'
  }

  const getCategoryStats = () => {
    const categoryStats: { [key: string]: { count: number; avgCompletion: number } } = {}

    data.forEach(habit => {
      if (categoryStats[habit.category]) {
        categoryStats[habit.category].count++
        categoryStats[habit.category].avgCompletion += habit.completionRate
      } else {
        categoryStats[habit.category] = { count: 1, avgCompletion: habit.completionRate }
      }
    })

    // Calculate averages
    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].avgCompletion /= categoryStats[category].count
    })

    return categoryStats
  }

  const overall = getOverallStats()
  const bestDay = getBestDay()
  const categoryStats = getCategoryStats()

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Avg Completion</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {overall.avgCompletion}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {overall.avgCompletion}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-300">Best Streak</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {overall.maxStreak} days
                </p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-300">Total Time</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {overall.totalHours}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Best Day</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {bestDay}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Performance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Habit Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((habit, index) => (
              <div key={habit.name} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-800">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
                    <Badge variant="secondary">{habit.category}</Badge>
                    {habit.currentStreak > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        🔥 {habit.currentStreak} days
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Current Streak</p>
                      <p className="font-medium">{habit.currentStreak} days</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Longest Streak</p>
                      <p className="font-medium">{habit.longestStreak} days</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Completion Rate</p>
                      <p className="font-medium">{habit.completionRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Monthly</p>
                      <p className="font-medium">{habit.monthlyCompletion}%</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{habit.completionRate}%</span>
                    </div>
                    <Progress value={habit.completionRate} className="h-2" />
                  </div>
                </div>

                <div className="ml-4">
                  <div className={`text-2xl font-bold ${habit.completionRate >= 80 ? 'text-green-500' :
                      habit.completionRate >= 60 ? 'text-yellow-500' :
                        habit.completionRate >= 40 ? 'text-orange-500' :
                          'text-red-500'
                    }`}>
                    {habit.completionRate >= 80 ? '🏆' :
                      habit.completionRate >= 60 ? '📈' :
                        habit.completionRate >= 40 ? '📊' : '📉'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{category}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Habits</span>
                    <span className="font-medium">{stats.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Avg Completion</span>
                    <span className="font-medium">{Math.round(stats.avgCompletion)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sample data generator
export function generateSampleAnalyticsData(): HabitAnalytics[] {
  return [
    {
      name: 'Study 2 Hours',
      currentStreak: 15,
      longestStreak: 45,
      completionRate: 92,
      monthlyCompletion: 88,
      weeklyProgress: [100, 80, 100, 60, 100, 80, 100],
      bestDay: 'Monday',
      totalTime: 2400, // minutes
      category: 'Study'
    },
    {
      name: 'Drink 8 Glasses of Water',
      currentStreak: 8,
      longestStreak: 23,
      completionRate: 78,
      monthlyCompletion: 75,
      weeklyProgress: [100, 60, 80, 100, 40, 80, 60],
      bestDay: 'Wednesday',
      totalTime: 0,
      category: 'Health'
    },
    {
      name: 'Morning Workout',
      currentStreak: 12,
      longestStreak: 30,
      completionRate: 85,
      monthlyCompletion: 90,
      weeklyProgress: [100, 100, 80, 60, 100, 80, 100],
      bestDay: 'Tuesday',
      totalTime: 1800,
      category: 'Fitness'
    },
    {
      name: 'Meditate',
      currentStreak: 20,
      longestStreak: 60,
      completionRate: 95,
      monthlyCompletion: 98,
      weeklyProgress: [100, 100, 100, 80, 100, 100, 100],
      bestDay: 'Sunday',
      totalTime: 600,
      category: 'Mindfulness'
    }
  ]
}