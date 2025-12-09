"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Heart, Brain, Star, Calendar, Plus } from 'lucide-react'

interface Reflection {
  id: string
  date: string
  questions: { [key: string]: string }
  mood: string
  notes: string
}

const defaultQuestions = [
  "What went well today?",
  "What could be improved?",
  "What am I grateful for?",
  "How did my habits contribute to my goals?"
]

const moods = [
  { value: 'amazing', label: 'Amazing', color: 'bg-green-500', emoji: '😄' },
  { value: 'good', label: 'Good', color: 'bg-blue-500', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-500', emoji: '😐' },
  { value: 'bad', label: 'Bad', color: 'bg-orange-500', emoji: '😔' },
  { value: 'terrible', label: 'Terrible', color: 'bg-red-500', emoji: '😢' }
]

export function Reflections() {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [todayReflection, setTodayReflection] = useState<Reflection | null>(null)
  
  const [formData, setFormData] = useState({
    mood: '',
    notes: '',
    answers: {} as { [key: string]: string }
  })

  useEffect(() => {
    loadReflections()
    checkTodayReflection()
  }, [])

  const loadReflections = async () => {
    try {
      // Mock data for now
      const mockReflections: Reflection[] = [
        {
          id: '1',
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          questions: {
            "What went well today?": "Completed my morning meditation and finished a chapter of my book.",
            "What could be improved?": "Need to better manage my time in the afternoon.",
            "What am I grateful for?": "My health and the support of my family.",
            "How did my habits contribute to my goals?": "Reading helped me progress towards my learning goal."
          },
          mood: 'good',
          notes: 'Overall a productive day with good balance.'
        },
        {
          id: '2',
          date: new Date(Date.now() - 172800000).toISOString(), // Day before
          questions: {
            "What went well today?": "Had a great workout session.",
            "What could be improved?": "Skipped my evening reading habit.",
            "What am I grateful for?": "The beautiful weather and good coffee.",
            "How did my habits contribute to my goals?": "Exercise kept me energized throughout the day."
          },
          mood: 'amazing',
          notes: 'Feeling energized and motivated!'
        }
      ]
      setReflections(mockReflections)
    } catch (error) {
      console.error('Error loading reflections:', error)
    }
  }

  const checkTodayReflection = () => {
    const today = new Date().toDateString()
    const existing = reflections.find(r => 
      new Date(r.date).toDateString() === today
    )
    setTodayReflection(existing || null)
  }

  const saveReflection = async () => {
    try {
      const newReflection: Reflection = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        questions: formData.answers,
        mood: formData.mood,
        notes: formData.notes
      }

      setReflections([newReflection, ...reflections])
      setTodayReflection(newReflection)
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving reflection:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      mood: '',
      notes: '',
      answers: {}
    })
  }

  const getMoodInfo = (mood: string) => {
    return moods.find(m => m.value === mood) || moods[2]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Reflections</h2>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!!todayReflection}>
              {todayReflection ? 'Already Reflected Today' : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reflection
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Daily Reflection</DialogTitle>
              <DialogDescription>
                Take a moment to reflect on your day and progress
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Mood Selection */}
              <div>
                <Label>How are you feeling today?</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {moods.map(mood => (
                    <button
                      key={mood.value}
                      onClick={() => setFormData({ ...formData, mood: mood.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.mood === mood.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{mood.emoji}</div>
                      <div className="text-xs font-medium">{mood.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection Questions */}
              <div className="space-y-4">
                {defaultQuestions.map((question, index) => (
                  <div key={index}>
                    <Label htmlFor={`question-${index}`}>{question}</Label>
                    <Textarea
                      id={`question-${index}`}
                      value={formData.answers[question] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        answers: {
                          ...formData.answers,
                          [question]: e.target.value
                        }
                      })}
                      placeholder="Share your thoughts..."
                      className="min-h-[80px]"
                    />
                  </div>
                ))}
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any other thoughts or insights from today..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={saveReflection}
                disabled={!formData.mood}
              >
                Save Reflection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Status */}
      {todayReflection ? (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-green-600" />
              <span className="font-medium">Today's reflection completed</span>
              <Badge className="bg-green-500">
                {getMoodInfo(todayReflection.mood).emoji} {getMoodInfo(todayReflection.mood).label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="font-medium">No reflection yet today</span>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                Add Reflection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Reflections */}
      <div className="space-y-4">
        {reflections.map(reflection => {
          const moodInfo = getMoodInfo(reflection.mood)
          return (
            <Card key={reflection.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {formatDate(reflection.date)}
                  </CardTitle>
                  <Badge className={moodInfo.color}>
                    {moodInfo.emoji} {moodInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(reflection.questions).map(([question, answer]) => (
                    <div key={question}>
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {question}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {answer}
                      </p>
                    </div>
                  ))}
                  
                  {reflection.notes && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Additional Notes
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {reflection.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {reflections.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reflections yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Start reflecting on your days to build self-awareness and track your progress
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Reflection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}