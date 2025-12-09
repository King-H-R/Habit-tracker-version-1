import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { id } = params
    
    const habit = await db.habit.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        type: data.type,
        frequency: data.frequency,
        targetValue: data.type === 'measurable' ? parseInt(data.targetValue) : null,
        unit: data.type === 'measurable' ? data.unit : null,
        color: data.color,
        repeatDays: data.repeatDays ? JSON.stringify(data.repeatDays) : null,
        allowSkip: data.allowSkip,
        allowedMisses: data.allowedMisses,
        position: data.position
      }
    })

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    await db.habit.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}