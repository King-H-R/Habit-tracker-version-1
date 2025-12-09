import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Seed achievements if they don't exist
    const existingAchievements = await db.achievement.count()

    if (existingAchievements === 0) {
      await seedAchievements()
    }

    const achievements = await db.achievement.findMany({
      orderBy: { points: 'desc' }
    })

    return NextResponse.json(achievements)
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
  }
}

async function seedAchievements() {
  const achievements = [
    {
      name: 'First Step',
      description: 'Complete your first habit',
      icon: '🎯',
      badgeColor: '#10b981',
      points: 10,
      condition: JSON.stringify({ type: 'first_completion' })
    },
    {
      name: '7-Day Streak',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      badgeColor: '#f59e0b',
      points: 50,
      condition: JSON.stringify({ type: 'streak', days: 7 })
    },
    {
      name: '30-Day Warrior',
      description: 'Maintain a 30-day streak',
      icon: '⚡',
      badgeColor: '#ef4444',
      points: 200,
      condition: JSON.stringify({ type: 'streak', days: 30 })
    },
    {
      name: 'Early Bird',
      description: 'Complete habits before 7 AM for 5 days straight',
      icon: '🌅',
      badgeColor: '#3b82f6',
      points: 75,
      condition: JSON.stringify({ type: 'early_bird', days: 5 })
    },
    {
      name: 'Consistency King',
      description: 'Maintain 80%+ completion rate for 30 days',
      icon: '👑',
      badgeColor: '#8b5cf6',
      points: 150,
      condition: JSON.stringify({ type: 'consistency', rate: 80, days: 30 })
    },
    {
      name: 'Habit Master',
      description: 'Complete 100 total habits',
      icon: '🏆',
      badgeColor: '#fbbf24',
      points: 300,
      condition: JSON.stringify({ type: 'total_completions', count: 100 })
    },
    {
      name: 'Perfect Week',
      description: 'Complete all habits for 7 days straight',
      icon: '💎',
      badgeColor: '#06b6d4',
      points: 100,
      condition: JSON.stringify({ type: 'perfect_week', days: 7 })
    },
    {
      name: 'Habit Collector',
      description: 'Create 10 different habits',
      icon: '📚',
      badgeColor: '#ec4899',
      points: 80,
      condition: JSON.stringify({ type: 'habit_count', count: 10 })
    }
  ]

  await db.achievement.createMany({
    data: achievements
  })
}