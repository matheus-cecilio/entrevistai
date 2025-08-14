import { NextRequest, NextResponse } from 'next/server'
import { City } from '@/types/location'

// Cache das cidades para evitar múltiplas requisições
let citiesCache: City[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Verificar se temos cache válido
    const now = Date.now();
    if (citiesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      const filteredCities = filterCities(citiesCache, search);
      return NextResponse.json(filteredCities);
    }

    // Buscar estados do IBGE
    const statesResponse = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
    );
    
    if (!statesResponse.ok) {
      throw new Error('Failed to fetch states');
    }

    const states = await statesResponse.json();
    
    // Buscar cidades de todos os estados
    const allCities: City[] = [];
    
    for (const state of states) {
      try {
        const citiesResponse = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state.id}/municipios?orderBy=nome`
        );
        
        if (citiesResponse.ok) {
          const cities = await citiesResponse.json();
          
          cities.forEach((city: { id: string; nome: string }) => {
            allCities.push({
              id: city.id,
              name: city.nome,
              state: state.nome,
              stateCode: state.sigla
            });
          });
        }
      } catch (error) {
        console.error(`Error fetching cities for state ${state.nome}:`, error);
      }
    }

    // Atualizar cache
    citiesCache = allCities;
    cacheTimestamp = now;

    const filteredCities = filterCities(allCities, search);
    return NextResponse.json(filteredCities);

  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

function filterCities(cities: City[], search: string): City[] {
  if (!search || search.length < 2) {
    // Retornar as 20 cidades mais populares do Brasil
    const popularCities = [
      'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza',
      'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia',
      'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís',
      'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina'
    ];
    
    return cities.filter(city => 
      popularCities.includes(city.name)
    ).slice(0, 20);
  }

  const searchLower = search.toLowerCase();
  return cities
    .filter(city => 
      city.name.toLowerCase().includes(searchLower) ||
      city.state.toLowerCase().includes(searchLower)
    )
    .slice(0, 50); // Limitar a 50 resultados
}
