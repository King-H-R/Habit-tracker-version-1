import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json()
    const { goal, lifestyle, currentHabits } = data

    const zai = await ZAI.create()

    const prompt = `As a habit formation expert, suggest specific, actionable habits based on the following information:

Goal: ${goal}
Lifestyle: ${lifestyle}
Current Habits: ${currentHabits?.map((h: any) => h.name).join(', ') || 'None'}

Please suggest 5-7 specific habits that would help achieve this goal. For each habit, provide:
1. A clear, specific habit name
2. Category (health, study, finance, personal, social, creative, other)
3. Type (yesno or measurable)
4. Target value and unit if measurable
5. Brief description
6. Best time of day to do it
7. Frequency (daily, weekly, custom)

Format your response as a JSON array of objects with these properties:
{
  "name": "habit name",
  "category": "category",
  "type": "yesno|measurable",
  "targetValue": number (if applicable),
  "unit": "unit" (if applicable),
  "description": "brief description",
  "bestTime": "morning|afternoon|evening|anytime",
  "frequency": "daily|weekly|custom",
  "reasoning": "why this habit helps achieve the goal"
}

Make the habits specific, measurable, and realistic for someone with this lifestyle.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a habit formation expert and productivity coach. Provide practical, evidence-based habit suggestions tailored to individual goals and lifestyles.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    const suggestions = JSON.parse(completion.choices[0]?.message?.content || '[]')

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error generating AI suggestions:', error)

    // Fallback suggestions if AI fails
    const fallbackSuggestions = [
      {
        name: 'Morning Review',
        category: 'personal',
        type: 'yesno',
        description: 'Review your goals and priorities for the day',
        bestTime: 'morning',
        frequency: 'daily',
        reasoning: 'Starting the day with clear purpose improves focus and productivity'
      },
      {
        name: 'Progress Tracking',
        category: 'personal',
        type: 'yesno',
        description: 'Log your habit completion and reflect on progress',
        bestTime: 'evening',
        frequency: 'daily',
        reasoning: 'Regular tracking builds awareness and motivation'
      }
    ]

    return NextResponse.json({ suggestions: fallbackSuggestions })
  }
}