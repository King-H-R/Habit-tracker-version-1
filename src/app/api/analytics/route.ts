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

    const userId = session.user.id;

    const totalHabits = await db.habit.count({
      where: { isActive: true, userId }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedToday = await db.habitLog.count({
      where: {
        userId,
        date: { gte: today },
        status: 'done'
      }
    })

    // Get completion rate for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const totalLogsInPeriod = await db.habitLog.count({
      where: {
        date: { gte: thirtyDaysAgo }
      }
    })

    const completedLogsInPeriod = await db.habitLog.count({
      where: {
        date: { gte: thirtyDaysAgo },
        status: 'done'
      }
    })

    const completionRate = totalLogsInPeriod > 0
      ? Math.round((completedLogsInPeriod / totalLogsInPeriod) * 100)
      : 0

    // Get habits by category
    const habitsByCategory = await db.habit.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true
    })

    // Get current streaks for all habits
    const habits = await db.habit.findMany({
      where: { isActive: true },
      include: {
        logs: {
          orderBy: { date: 'desc' },
          take: 30
        }
      }
    })

    const currentStreaks = habits.map(habit => {
      let streak = 0
      for (const log of habit.logs) {
        if (log.status === 'done') {
          streak++
        } else if (log.status === 'missed') {
          break
        }
      }
      return { habitId: habit.id, streak }
    })

    const bestStreak = Math.max(...currentStreaks.map(s => s.streak), 0)

    return NextResponse.json({
      totalHabits,
      completedToday,
      completionRate,
      bestStreak,
      habitsByCategory,
      currentStreaks
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}