import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { id } = params
    const { status, value, notes } = data
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Create or update today's log
    const log = await db.habitLog.upsert({
      where: {
        habitId_date: {
          habitId: id,
          date: today
        }
      },
      update: {
        status,
        value: value || null,
        notes: notes || null,
        completedAt: status === 'done' ? new Date() : null
      },
      create: {
        habitId: id,
        userId: 'default-user', // TODO: Get from auth
        date: today,
        status,
        value: value || null,
        notes: notes || null,
        completedAt: status === 'done' ? new Date() : null
      }
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error checking in habit:', error)
    return NextResponse.json({ error: 'Failed to check in habit' }, { status: 500 })
  }
}