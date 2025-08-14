import { useState, useEffect } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { City } from '@/types/location'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface CitySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCity: (city: City) => void
  selectedCity?: City | null
}

export default function CitySelectionModal({
  isOpen,
  onClose,
  onSelectCity,
  selectedCity
}: CitySelectionModalProps) {
  const [search, setSearch] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch cities based on search
  const fetchCities = async (searchTerm: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/cities?search=${encodeURIComponent(searchTerm)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch cities')
      }
      
      const data = await response.json()
      setCities(data)
    } catch (err) {
      setError('Erro ao carregar cidades. Tente novamente.')
      console.error('Error fetching cities:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load initial popular cities
  useEffect(() => {
    if (isOpen) {
      fetchCities('')
    }
  }, [isOpen])

  // Search with debounce
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      fetchCities(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, isOpen])

  const handleSelectCity = (city: City) => {
    onSelectCity(city)
    onClose()
  }

  const handleClose = () => {
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Selecionar Cidade
          </DialogTitle>
          <DialogDescription>
            Escolha sua cidade para competir no ranking local
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Digite o nome da cidade ou estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected City */}
        {selectedCity && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Cidade atual:</p>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedCity.name}</span>
              <Badge variant="secondary">{selectedCity.stateCode}</Badge>
            </div>
          </div>
        )}

        {/* Cities List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando cidades...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => fetchCities(search)}
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma cidade encontrada</p>
              <p className="text-sm">Tente um termo diferente</p>
            </div>
          ) : (
            <div className="space-y-1">
              {!search && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  Cidades populares:
                </p>
              )}
              
              {cities.map((city) => (
                <Button
                  key={city.id}
                  variant="ghost"
                  onClick={() => handleSelectCity(city)}
                  className="w-full justify-start h-auto p-3 hover:bg-muted"
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{city.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {city.state}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {city.stateCode}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
