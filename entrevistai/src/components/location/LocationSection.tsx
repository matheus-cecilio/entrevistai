'use client'

import { useState, useEffect } from 'react'
import { MapPin, Settings, Trophy } from 'lucide-react'
import { City } from '@/types/location'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CitySelectionModal from '@/components/location/CitySelectionModal'
import CityRankingDisplay from '@/components/location/CityRankingDisplay'
import { updateProfileAction } from '@/lib/profile-actions'
import { toast } from '@/hooks/use-toast'

interface LocationSectionProps {
  userId: string
  initialCity?: string | null
  initialState?: string | null
}

export default function LocationSection({ userId, initialCity, initialState }: LocationSectionProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const [showCityModal, setShowCityModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Inicializar com dados do perfil se disponível
  useEffect(() => {
    if (initialCity && initialState) {
      setSelectedCity({
        id: 'current',
        name: initialCity,
        state: initialState,
        stateCode: initialState.length <= 2 ? initialState : initialState.substring(0, 2).toUpperCase()
      })
    }
  }, [initialCity, initialState])

  const handleSelectCity = async (city: City) => {
    setLoading(true)
    try {
      const result = await updateProfileAction({
        city: city.name,
        state: city.state
      })

      if (result.success) {
        setSelectedCity(city)
        toast({
          title: "Cidade atualizada!",
          description: `Agora você está competindo no ranking de ${city.name}, ${city.stateCode}`
        })
      } else {
        toast({
          title: "Erro ao atualizar cidade",
          description: result.error || "Tente novamente",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating city:', error)
      toast({
        title: "Erro inesperado",
        description: "Tente novamente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header da localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Competição Local
          </CardTitle>
          <CardDescription>
            Compare seu desempenho com outros candidatos da sua cidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              {selectedCity ? (
                <div>
                  <p className="font-medium">{selectedCity.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCity.state}</p>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground">Nenhuma cidade selecionada</p>
                  <p className="text-sm text-muted-foreground">
                    Escolha sua cidade para ver o ranking local
                  </p>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowCityModal(true)}
              disabled={loading}
            >
              <Settings className="mr-2 h-4 w-4" />
              {selectedCity ? 'Alterar' : 'Escolher'} Cidade
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ranking da cidade */}
      {selectedCity && (
        <CityRankingDisplay
          cityId={selectedCity.id}
          cityName={selectedCity.name}
          stateCode={selectedCity.stateCode}
          userId={userId}
        />
      )}

      {/* Modal de seleção de cidade */}
      <CitySelectionModal
        isOpen={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleSelectCity}
        selectedCity={selectedCity}
      />
    </div>
  )
}
