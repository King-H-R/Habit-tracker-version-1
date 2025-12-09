"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw, Check } from 'lucide-react'

interface TimerProps {
  habitName: string
  targetMinutes: number
  onComplete: (timeSpent: number) => void
  onClose: () => void
}

export function HabitTimer({ habitName, targetMinutes, onComplete, onClose }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  useEffect(() => {
    // Check if target reached
    if (seconds >= targetMinutes * 60 && !isCompleted) {
      setIsCompleted(true)
      setIsRunning(false)
      onComplete(seconds)
    }
  }, [seconds, targetMinutes, isCompleted])

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = Math.min((seconds / (targetMinutes * 60)) * 100, 100)

  const toggleTimer = () => {
    if (isCompleted) {
      // Reset timer
      setSeconds(0)
      setIsCompleted(false)
    } else {
      setIsRunning(!isRunning)
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setSeconds(0)
    setIsCompleted(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              ×
            </Button>
          </div>

          {/* Habit Name */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {habitName}
          </h2>

          {/* Timer Display */}
          <div className="mb-8">
            <div className={`text-6xl font-mono font-bold mb-4 transition-all ${
              isCompleted ? 'text-green-500' : 'text-gray-900 dark:text-white'
            }`}>
              {formatTime(seconds)}
            </div>
            
            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Target Time */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Target: {targetMinutes} minutes
            </p>
          </div>

          {/* Completion Message */}
          {isCompleted && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">
                Great job! 🎉
              </h3>
              <p className="text-green-600 dark:text-green-400">
                You've completed your {targetMinutes}-minute goal!
              </p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={resetTimer}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <Button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-8 py-3 ${
                isCompleted 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : isRunning 
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isCompleted ? (
                <>
                  <Check className="h-4 w-4" />
                  Done
                </>
              ) : isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start
                </>
              )}
            </Button>
          </div>

          {/* Motivational Quote */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              "Just start — progress will follow."
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              — Your Journey to Better Habits
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}