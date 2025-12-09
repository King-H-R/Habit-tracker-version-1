"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Target, Flame, Brain, Heart, ArrowRight } from 'lucide-react'

interface OnboardingScreenProps {
  onComplete: (name: string, goals: string[]) => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentScreen, setCurrentScreen] = useState(0)
  const [userName, setUserName] = useState('')

  const screens = [
    {
      title: "Build Better Habits",
      subtitle: "Transform your life, one small step at a time",
      illustration: "🎯",
      content: "Track your daily habits, build consistency, and achieve your goals with our intelligent habit tracker."
    },
    {
      title: "Stay Consistent",
      subtitle: "Watch your streaks grow and celebrate your progress",
      illustration: "🔥",
      content: "Maintain streaks, earn achievements, and get motivated by seeing your improvement over time."
    },
    {
      title: "Gain Insights",
      subtitle: "Understand your patterns and optimize your routine",
      illustration: "📊",
      content: "Get detailed analytics, discover your best performing days, and optimize your habit schedule."
    }
  ]

  const nextScreen = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1)
    } else {
      setCurrentScreen(3) // Move to goals screen
    }
  }

  const prevScreen = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1)
    }
  }

  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  const toggleGoal = (label: string) => {
    setSelectedGoals(prev =>
      prev.includes(label)
        ? prev.filter(g => g !== label)
        : [...prev, label]
    )
  }

  const goals = [
    { icon: Target, label: "Study", color: "bg-blue-500" },
    { icon: Brain, label: "Mindfulness", color: "bg-purple-500" },
    { icon: Heart, label: "Health", color: "bg-red-500" },
    { icon: Flame, label: "Fitness", color: "bg-orange-500" }
  ]

  if (currentScreen === 3) {
    // Goals selection screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What's your main focus?
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Choose your primary goals to personalize your experience
            </p>

            <div className="space-y-3 mb-8">
              {goals.map((goal) => {
                const Icon = goal.icon
                const isSelected = selectedGoals.includes(goal.label)
                return (
                  <button
                    key={goal.label}
                    onClick={() => toggleGoal(goal.label)}
                    className={`w-full p-4 rounded-lg border-2 transition-all hover:scale-105 flex items-center gap-3 ${isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/40 dark:border-purple-500'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${goal.color} flex items-center justify-center text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white flex-1 text-left">{goal.label}</span>
                    {isSelected && <CheckCircle className="h-5 w-5 text-purple-500" />}
                  </button>
                )
              })}
            </div>

            <div className="space-y-3 mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-left">
                What should we call you?
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-lg transition-all"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={prevScreen}
                className="flex-1 py-6"
              >
                Back
              </Button>
              <Button
                onClick={() => onComplete(userName, selectedGoals)}
                disabled={!userName.trim()}
                className="flex-1 py-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg shadow-lg"
              >
                Start Journey
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${index === currentScreen ? 'bg-blue-500 w-8' : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>

          {/* Illustration */}
          <div className="text-center mb-6">
            <div className="text-8xl mb-4 animate-bounce">
              {screens[currentScreen].illustration}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {screens[currentScreen].title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {screens[currentScreen].subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {screens[currentScreen].content}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/50">
              <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Easy Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">One tap to mark habits complete</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/50">
              <Flame className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Smart Streaks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Flexible streak protection</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/50">
              <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Personalized recommendations</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentScreen > 0 && (
              <Button
                variant="outline"
                onClick={prevScreen}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            <Button
              onClick={nextScreen}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}