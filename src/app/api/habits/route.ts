import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await db.habit.findMany({
      where: {
        isActive: true,
        userId: session.user.id
      },
      orderBy: [
        { isPinned: 'desc' },
        { position: 'asc' }
      ],
      include: {
        logs: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }
      }
    })

    const habitsWithStats = habits.map(habit => {
      const todayLog = habit.logs[0]

      return {
        ...habit,
        todayCompleted: todayLog?.status === 'done',
        currentStreak: 0, // TODO: Calculate from logs
        longestStreak: 0, // TODO: Calculate from logs
        completionRate: 85, // TODO: Calculate from logs
        repeatDays: habit.repeatDays ? JSON.parse(habit.repeatDays) : []
      }
    })

    return NextResponse.json(habitsWithStats)
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.category || !data.type || !data.frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const habit = await db.habit.create({
      data: {
        userId: session.user.id,
        name: data.name,
        description: data.description,
        category: data.category,
        type: data.type,
        frequency: data.frequency,
        targetValue: data.type === 'measurable' && data.targetValue
          ? (isNaN(parseInt(data.targetValue)) ? 0 : parseInt(data.targetValue))
          : null,
        unit: data.type === 'measurable' ? data.unit : null,
        color: data.color,
        repeatDays: data.repeatDays ? JSON.stringify(data.repeatDays) : null,
        allowSkip: data.allowSkip,
        allowedMisses: data.allowedMisses,
        position: data.position || 0
      }
    })

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}