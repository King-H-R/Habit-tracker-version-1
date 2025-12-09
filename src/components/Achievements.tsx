"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Star, Lock, CheckCircle, Flame, Crown, Target, Zap, Diamond, BookOpen } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  badgeColor: string
  points: number
  condition: string
  unlocked?: boolean
  unlockedAt?: string
}

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState({
    level: 1,
    experiencePoints: 0,
    totalCoins: 0,
    currentStreak: 0,
    longestStreak: 0
  })

  useEffect(() => {
    loadAchievements()
    loadUserStats()
  }, [])

  const loadAchievements = async () => {
    try {
      const response = await fetch('/api/achievements')
      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
      // Fallback to mock achievements
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          name: 'First Step',
          description: 'Complete your first habit',
          icon: '🎯',
          badgeColor: '#10b981',
          points: 10,
          condition: '{"type": "first_completion"}',
          unlocked: true,
          unlockedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '7-Day Streak',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          badgeColor: '#f59e0b',
          points: 50,
          condition: '{"type": "streak", "days": 7}',
          unlocked: false
        },
        {
          id: '3',
          name: '30-Day Warrior',
          description: 'Maintain a 30-day streak',
          icon: '⚡',
          badgeColor: '#ef4444',
          points: 200,
          condition: '{"type": "streak", "days": 30}',
          unlocked: false
        },
        {
          id: '4',
          name: 'Early Bird',
          description: 'Complete habits before 7 AM for 5 days straight',
          icon: '🌅',
          badgeColor: '#3b82f6',
          points: 75,
          condition: '{"type": "early_bird", "days": 5}',
          unlocked: false
        },
        {
          id: '5',
          name: 'Consistency King',
          description: 'Maintain 80%+ completion rate for 30 days',
          icon: '👑',
          badgeColor: '#8b5cf6',
          points: 150,
          condition: '{"type": "consistency", "rate": 80, "days": 30}',
          unlocked: false
        },
        {
          id: '6',
          name: 'Habit Master',
          description: 'Complete 100 total habits',
          icon: '🏆',
          badgeColor: '#fbbf24',
          points: 300,
          condition: '{"type": "total_completions", "count": 100}',
          unlocked: false
        },
        {
          id: '7',
          name: 'Perfect Week',
          description: 'Complete all habits for 7 days straight',
          icon: '💎',
          badgeColor: '#06b6d4',
          points: 100,
          condition: '{"type": "perfect_week", "days": 7}',
          unlocked: false
        },
        {
          id: '8',
          name: 'Habit Collector',
          description: 'Create 10 different habits',
          icon: '📚',
          badgeColor: '#ec4899',
          points: 80,
          condition: '{"type": "habit_count", "count": 10}',
          unlocked: false
        }
      ]
      setAchievements(mockAchievements)
    }
  }

  const loadUserStats = async () => {
    try {
      // Mock user stats for now
      setUserStats({
        level: 3,
        experiencePoints: 250,
        totalCoins: 150,
        currentStreak: 5,
        longestStreak: 12
      })
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const getLevelProgress = () => {
    const xpForNextLevel = userStats.level * 100
    const currentLevelXP = (userStats.level - 1) * 100
    const progress = ((userStats.experiencePoints - currentLevelXP) / (xpForNextLevel - currentLevelXP)) * 100
    return Math.min(progress, 100)
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)

  const getAchievementIcon = (achievement: Achievement) => {
    if (achievement.unlocked) {
      return (
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${achievement.badgeColor}20` }}
        >
          {achievement.icon}
        </div>
      )
    } else {
      return (
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Lock className="h-8 w-8 text-gray-400" />
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                Level {userStats.level}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {userStats.experiencePoints} XP
              </div>
              <Progress value={getLevelProgress()} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {userStats.totalCoins}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Coins
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {userStats.currentStreak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Current Streak
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {unlockedCount}/{totalCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Achievements
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <Card 
              key={achievement.id} 
              className={`transition-all ${
                achievement.unlocked 
                  ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10' 
                  : 'opacity-75'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getAchievementIcon(achievement)}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.name}</h4>
                      {achievement.unlocked && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {achievement.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {achievement.points} points
                      </Badge>
                      
                      {achievement.unlocked && achievement.unlockedAt && (
                        <div className="text-xs text-gray-500">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Star className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Points Earned
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Achievement Progress
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Crown className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{userStats.level}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Current Level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}