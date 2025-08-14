import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RegionalStats } from '@/types/location'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cityId: string }> }
) {
  try {
    const { cityId } = await context.params
    const supabase = await createClient()

    // Buscar todos os usuários e entrevistas desta cidade
    const { data: cityData, error: cityError } = await supabase
      .from('interviews')
      .select(`
        user_id,
        score,
        users!inner(id, email, name, avatar_url, city_id)
      `)
      .eq('users.city_id', cityId)
      .not('score', 'is', null)

    if (cityError) {
      console.error('Error fetching city data:', cityError)
      return NextResponse.json(
        { error: 'Failed to fetch city data' },
        { status: 500 }
      )
    }

    if (!cityData || cityData.length === 0) {
      const stats: RegionalStats = {
        totalCandidates: 0,
        averageScore: 0,
        totalInterviews: 0,
        topPerformers: []
      }
      return NextResponse.json(stats)
    }

    // Calcular estatísticas
    const userScores = new Map<string, {
      user: { id: string; email: string; name?: string; avatar_url?: string },
      scores: number[],
      totalInterviews: number
    }>()

    let totalInterviews = 0

    cityData.forEach((interview: { user_id: string; users: { id: string; email: string; name?: string; avatar_url?: string }[]; score: number }) => {
      const userId = interview.user_id
      const user = interview.users[0] // Pegar o primeiro usuário do array
      const score = interview.score

      if (!userScores.has(userId)) {
        userScores.set(userId, {
          user,
          scores: [],
          totalInterviews: 0
        })
      }

      const userData = userScores.get(userId)!
      userData.scores.push(score)
      userData.totalInterviews++
      totalInterviews++
    })

    // Calcular médias dos usuários
    const candidates = Array.from(userScores.entries()).map(([userId, data]) => {
      const averageScore = Math.round(
        data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
      )

      return {
        id: userId,
        email: data.user.email,
        name: data.user.name,
        avatar_url: data.user.avatar_url,
        averageScore,
        interviewCount: data.totalInterviews
      }
    })

    // Calcular média geral da cidade
    const totalScores = Array.from(userScores.values()).flatMap(data => data.scores)
    const averageScore = Math.round(
      totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length
    )

    // Top performers (ordenados por pontuação)
    const topPerformers = candidates
      .sort((a, b) => {
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore
        }
        return b.interviewCount - a.interviewCount
      })
      .slice(0, 3)

    const stats: RegionalStats = {
      totalCandidates: candidates.length,
      averageScore,
      totalInterviews,
      topPerformers
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching regional stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
