
export type ChaosLevel = 1 | 2 | 3 | 4 | 5;

// --- GAMIFICATION TYPES ---
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  xpReward: number;
  condition: (stats: UserStats, currentDeals?: FlightDeal[], profile?: FlightProfile) => boolean;
  unlockedAt?: string; // ISO Date if unlocked
}

export interface UserStats {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  totalSearches: number;
  totalSavings: number; // In USD
  regionsScanned: string[];
  badges: string[]; // IDs of unlocked achievements
}

export interface FlightProfile {
  homeAirports: string[];
  chaosLevel: ChaosLevel;
  budgetMax: number;
}

export interface TripPlan {
  destinationRegions: string[];
  durationMin: number;
  startDate: string; // ISO String for simplicity in v1
  flexibleDays: number;
  contextKeywords?: string[]; 
}

export interface StrategyPrompt {
  tool: 'Google Flights' | 'Skyscanner' | 'ITA Matrix' | 'Kayak' | 'Google Gemini / ChatGPT';
  description: string;
  promptText: string;
}

export interface StrategyStep {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface StrategyActionPlan {
  tool: string;
  instruction: string;
}

export interface BookingStepLink {
  label: string;
  url: string;
  provider: 'Google Flights' | 'Skyscanner' | 'Kiwi' | 'Direct Airline' | 'PrivateFly' | 'JSX';
}

export interface RoutePattern {
  id: string;
  name: string;
  nodes: string[];
  type: 'Direct' | 'Positioning' | 'Split-Ticket' | 'Hub-Spoke' | 'Hidden-City' | 'Loop' | 'Private-Charter';
  description: string;
  rationale: string; // Why this works
  tradeOffs: string[]; // Downsides
  actionPlans: StrategyActionPlan[]; // Tool-specific steps
  stepLinks?: BookingStepLink[]; 
  risk: 'Low' | 'Medium' | 'High';
  estimatedSavings: string;
  seasonality?: string[]; 
  minConnectionTime?: string; 
  bookingWindow?: string; 
}

export interface StrategySolution {
  condition: string; 
  title: string;
  description: string;
  suggestedActions: string[];
}

export interface SearchLink {
  provider: 'Google Flights' | 'Google Explore' | 'Skyscanner' | 'Kayak' | 'PrivateFly';
  label: string;
  url: string;
  primary: boolean;
}

export interface Strategy {
  id: string;
  summary: string;
  corePlan: RoutePattern[];
  backupPlans: RoutePattern[];
  chaosPlans: RoutePattern[];
  solutions: StrategySolution[];
  searchLinks: SearchLink[];
  prompts: StrategyPrompt[]; 
  steps: StrategyStep[]; 
}

// Knowledge Base Types
export type KnowledgeCategory = 'Concept' | 'Acronym' | 'Tool';

export interface KnowledgeEntry {
  id: string;
  term: string;
  category: KnowledgeCategory;
  definition: string;
  example?: string;
  links?: Array<{
    text: string;
    url: string;
  }>;
}

// Location Types
export type LocationType = 'Region' | 'Country' | 'City' | 'Airport';

export interface LocationOption {
  label: string;
  value: string;
  type: LocationType;
  keywords?: string[];
}

// Private Sector Types
export interface Aircraft {
  id: string;
  name: string;
  category: 'Very Light Jet' | 'Light Jet' | 'Midsize Jet' | 'Super Midsize' | 'Heavy Jet' | 'Ultra Long Range';
  paxMax: number;
  rangeNm: number;
  speedKts: number;
  hourlyRateEstimate: number;
  amenities: string[];
}

// Live Data Types
export interface FlightSegment {
  departure: { iataCode: string; at: string; terminal?: string };
  arrival: { iataCode: string; at: string; terminal?: string };
  carrierCode: string;
  number: string;
  duration: string;
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST' | 'PRIVATE';
  aircraftCode?: string; 
  amenities?: string[]; 
}

export interface FlightDeal {
  id: string;
  source: 'Amadeus' | 'Mock' | 'Charter';
  rawOffer?: any; 
  price: {
    total: string;
    currency: string;
    base?: string;
    fees?: string;
  };
  airlines: string[];
  segments: FlightSegment[]; 
  deepLink?: string;
  duration: string;
  stops: number;
  fareClass?: string; 
  layoverDurations?: string[]; 
  baggageInfo?: {
    includedCheckedBags: number;
    estimatedBagFee?: number;
    unit?: 'KG' | 'PC';
  };
  aircraft?: Aircraft;
  emptyLeg?: boolean;
}

export interface AIAnalysis {
  recommendation: string;
  topPickId?: string;
  riskAssessment: string;
  hacksDetected: string[];
}

export interface SavedStrategy {
  id: string;
  name: string;
  createdAt: string;
  originSummary: string;
  targetSummary: string;
  profile: FlightProfile;
  trip: TripPlan;
  strategy: Strategy;
  deals: FlightDeal[];
  aiAnalysis: AIAnalysis | null;
}

export interface HotelOffer {
  id: string;
  hotelId: string;
  name: string;
  cityCode: string;
  rating?: number;
  price: {
    total: string;
    currency: string;
  };
}

export interface ActivityOffer {
  id: string;
  name: string;
  shortDescription?: string;
  rating?: string;
  price?: {
    amount: string;
    currencyCode: string;
  };
  pictures?: string[];
  bookingLink?: string;
}

export interface InspirationFlight {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: { total: string };
  links?: any;
}
