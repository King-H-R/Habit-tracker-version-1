"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface DayData {
  date: number
  completed: number
  total: number
  intensity: number // 0-4 for heatmap colors
}

interface CalendarHeatmapProps {
  year: number
  month: number
  data: DayData[]
}

export function CalendarHeatmap({ year, month, data }: CalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month]
  }

  const getHeatmapColor = (intensity: number) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-green-100 dark:bg-green-900',
      'bg-green-300 dark:bg-green-700',
      'bg-green-500 dark:bg-green-500',
      'bg-green-700 dark:bg-green-300'
    ]
    return colors[intensity] || colors[0]
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const days: (DayData | null)[] = []

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const dayData = data.find(d => d.date === i)
    days.push({
      date: i,
      completed: dayData?.completed ?? 0,
      total: dayData?.total ?? 0,
      intensity: dayData?.intensity ?? 0
    })
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth(-1)}
            disabled={month === 0 && year === 2023}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {getMonthName(month)} {year}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth(1)}
            disabled={month === 11 && year === 2025}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={`${day}-${index}`} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const isToday =
              currentDate.getDate() === day.date &&
              currentDate.getMonth() === month &&
              currentDate.getFullYear() === year

            const completionRate = day.total > 0 ? (day.completed / day.total) : 0
            const heatmapColor = getHeatmapColor(day.intensity)

            return (
              <div
                key={day.date}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all hover:scale-110 ${heatmapColor} ${isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                title={`${day.date}: ${day.completed}/${day.total} habits completed`}
              >
                <span className={`text-sm font-medium ${day.intensity > 2 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                  {day.date}
                </span>
                {day.total > 0 && (
                  <div className="text-xs mt-1">
                    {completionRate === 1 ? '✓' : `${Math.round(completionRate * 100)}%`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Sample data generator for demonstration
export function generateSampleHeatmapData(year: number, month: number): DayData[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const data: DayData[] = []

  for (let i = 1; i <= daysInMonth; i++) {
    // Generate random but realistic data
    const random = Math.random()
    let intensity = 0
    let completed = 0
    let total = 0

    if (random > 0.2) { // 80% chance of having any habits
      total = Math.floor(Math.random() * 4) + 1 // 1-4 habits
      if (random > 0.4) { // 60% chance of completing some
        completed = Math.floor(total * (Math.random() * 0.8 + 0.2)) // 20-100% completion
        intensity = Math.ceil((completed / total) * 4)
      }
    }

    data.push({
      date: i,
      completed,
      total,
      intensity
    })
  }

  return data
}