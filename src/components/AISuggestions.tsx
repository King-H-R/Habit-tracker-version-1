"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Brain, Plus, Sparkles, Clock, Target } from 'lucide-react'

interface AISuggestion {
  name: string
  category: string
  type: 'yesno' | 'measurable'
  targetValue?: number
  unit?: string
  description: string
  bestTime: string
  frequency: string
  reasoning: string
}

export function AISuggestions() {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    goal: '',
    lifestyle: '',
    currentHabits: ''
  })

  const lifestyles = [
    { value: 'student', label: 'Student' },
    { value: 'professional', label: 'Working Professional' },
    { value: 'entrepreneur', label: 'Entrepreneur' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'parent', label: 'Parent' },
    { value: 'athlete', label: 'Athlete' }
  ]

  const generateSuggestions = async () => {
    if (!formData.goal.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      health: '❤️',
      study: '📚',
      finance: '💰',
      personal: '🧠',
      social: '👥',
      creative: '🎨',
      other: '⚙️'
    }
    return icons[category] || '📌'
  }

  const getTimeIcon = (time: string) => {
    const icons: { [key: string]: string } = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌙',
      anytime: '⏰'
    }
    return icons[time] || '⏰'
  }

  const addSuggestionAsHabit = async (suggestion: AISuggestion) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestion.name,
          description: suggestion.description,
          category: suggestion.category,
          type: suggestion.type,
          frequency: suggestion.frequency,
          targetValue: suggestion.targetValue,
          unit: suggestion.unit,
          color: '#3b82f6',
          repeatDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          allowSkip: true,
          allowedMisses: 1
        })
      })
      
      if (response.ok) {
        // Trigger a page reload or state update to show the new habit
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding habit:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Habit Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Habit Suggestions
          </DialogTitle>
          <DialogDescription>
            Get personalized habit recommendations based on your goals and lifestyle
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Input Form */}
          <div className="grid gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label htmlFor="goal">Your Goal</Label>
              <Textarea
                id="goal"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                placeholder="e.g., I want to prepare for GATE CS with AIR under 100"
                className="min-h-[80px]"
              />
            </div>
            
            <div>
              <Label htmlFor="lifestyle">Lifestyle</Label>
              <Select value={formData.lifestyle} onValueChange={(value) => setFormData({ ...formData, lifestyle: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your lifestyle" />
                </SelectTrigger>
                <SelectContent>
                  {lifestyles.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="currentHabits">Current Habits (Optional)</Label>
              <Textarea
                id="currentHabits"
                value={formData.currentHabits}
                onChange={(e) => setFormData({ ...formData, currentHabits: e.target.value })}
                placeholder="List your current habits, e.g., Morning meditation, Daily reading, Exercise"
              />
            </div>
            
            <Button 
              onClick={generateSuggestions} 
              disabled={!formData.goal.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Suggestions
                </>
              )}
            </Button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Recommended Habits</h3>
              
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getCategoryIcon(suggestion.category)}</span>
                          <h4 className="font-semibold text-lg">{suggestion.name}</h4>
                          <Badge variant="secondary">{suggestion.category}</Badge>
                          {suggestion.type === 'measurable' && (
                            <Badge variant="outline">
                              {suggestion.targetValue} {suggestion.unit}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {suggestion.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{getTimeIcon(suggestion.bestTime)} {suggestion.bestTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{suggestion.frequency}</span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Why this helps:</strong> {suggestion.reasoning}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => addSuggestionAsHabit(suggestion)}
                        className="ml-4"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Habit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}