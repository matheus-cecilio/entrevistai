// src/types/location.ts

export interface City {
  id: string;
  name: string;
  state: string;
  stateCode: string;
}

export interface LocationData {
  city: City;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RankingCandidate {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  averageScore: number;
  interviewCount: number;
}

export interface CityRanking {
  cityId: string;
  userPosition: number;
  userScore: number;
  topCandidates: RankingCandidate[];
  totalCandidates: number;
}

export interface RegionalStats {
  totalCandidates: number;
  averageScore: number;
  totalInterviews: number;
  topPerformers: RankingCandidate[];
}
