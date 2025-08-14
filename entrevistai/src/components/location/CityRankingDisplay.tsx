import { useState, useEffect } from 'react'
import { Trophy, Users, MapPin, TrendingUp, Medal, Crown, Award } from 'lucide-react'
import { CityRanking, RegionalStats } from '@/types/location'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CityRankingDisplayProps {
  cityId: string
  cityName: string
  stateCode: string
  userId: string
}

export default function CityRankingDisplay({
  cityId,
  cityName,
  stateCode,
  userId
}: CityRankingDisplayProps) {
  const [ranking, setRanking] = useState<CityRanking | null>(null)
  const [stats, setStats] = useState<RegionalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRankingData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [rankingResponse, statsResponse] = await Promise.all([
          fetch(`/api/ranking/city/${cityId}?userId=${userId}`),
          fetch(`/api/ranking/stats/${cityId}`)
        ])

        if (!rankingResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to fetch ranking data')
        }

        const [rankingData, statsData] = await Promise.all([
          rankingResponse.json(),
          statsResponse.json()
        ])

        setRanking(rankingData)
        setStats(statsData)
      } catch (err) {
        setError('Erro ao carregar ranking')
        console.error('Error fetching ranking:', err)
      } finally {
        setLoading(false)
      }
    }

    if (cityId && userId) {
      fetchRankingData()
    }
  }, [cityId, userId])

  if (loading) {
    return <RankingLoadingSkeleton />
  }

  if (error || !ranking || !stats) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {error || 'Dados do ranking não disponíveis'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <Trophy className="h-4 w-4 text-muted-foreground" />
  }

  const getRankBadgeVariant = (position: number) => {
    if (position <= 3) return 'default'
    if (position <= 10) return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      {/* Header com informações da cidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ranking de {cityName}
            <Badge variant="outline">{stateCode}</Badge>
          </CardTitle>
          <CardDescription>
            Sua posição entre os candidatos da sua cidade
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Posição do usuário */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getRankIcon(ranking.userPosition)}
                <div>
                  <div className="text-2xl font-bold">#{ranking.userPosition}</div>
                  <div className="text-sm text-muted-foreground">Sua posição</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold">{ranking.userScore}%</div>
                <div className="text-sm text-muted-foreground">Pontuação média</div>
              </div>
            </div>
            
            <Badge variant={getRankBadgeVariant(ranking.userPosition)} className="text-lg py-2 px-4">
              Top {Math.round((ranking.userPosition / stats.totalCandidates) * 100)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas da cidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalCandidates}</div>
                <div className="text-sm text-muted-foreground">Candidatos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Média da cidade</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.totalInterviews}</div>
                <div className="text-sm text-muted-foreground">Entrevistas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 do ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top 5 - {cityName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranking.topCandidates.map((candidate, index) => (
              <div
                key={candidate.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  candidate.id === userId ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRankIcon(index + 1)}
                    <span className="font-semibold">#{index + 1}</span>
                  </div>
                  
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={candidate.avatar_url || ''} />
                    <AvatarFallback>
                      {candidate.name?.charAt(0) || candidate.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">
                      {candidate.name || candidate.email.split('@')[0]}
                      {candidate.id === userId && (
                        <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {candidate.interviewCount} entrevistas
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold">{candidate.averageScore}%</div>
                  <Progress value={candidate.averageScore} className="w-20 h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RankingLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
