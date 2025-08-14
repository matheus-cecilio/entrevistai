import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CityRanking } from '@/types/location'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cityId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { cityId } = await context.params
    const supabase = await createClient()

    // Buscar todos os usuários desta cidade com suas médias
    const { data: cityUsers, error: usersError } = await supabase
      .from('interviews')
      .select(`
        user_id,
        score,
        users!inner(id, email, name, avatar_url, city_id)
      `)
      .eq('users.city_id', cityId)
      .not('score', 'is', null)

    if (usersError) {
      console.error('Error fetching city users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch city users' },
        { status: 500 }
      )
    }

    // Calcular médias por usuário
    const userScores = new Map<string, {
      user: { id: string; email: string; name?: string; avatar_url?: string },
      scores: number[],
      totalInterviews: number
    }>()

    cityUsers?.forEach((interview: { user_id: string; users: { id: string; email: string; name?: string; avatar_url?: string }[]; score: number }) => {
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
    })

    // Calcular médias e criar ranking
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

    // Ordenar por pontuação (maior para menor)
    candidates.sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore
      }
      // Em caso de empate, considerar quem tem mais entrevistas
      return b.interviewCount - a.interviewCount
    })

    // Encontrar posição do usuário
    const userPosition = candidates.findIndex(c => c.id === userId) + 1
    const userScore = candidates.find(c => c.id === userId)?.averageScore || 0

    // Top 5 candidatos
    const topCandidates = candidates.slice(0, 5)

    const ranking: CityRanking = {
      cityId,
      userPosition,
      userScore,
      topCandidates,
      totalCandidates: candidates.length
    }

    return NextResponse.json(ranking)

  } catch (error) {
    console.error('Error fetching city ranking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
