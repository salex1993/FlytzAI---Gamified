
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
  provider: 'Google Flights' | 'Skyscanner' | 'Kiwi' | 'Direct Airline';
}

export interface RoutePattern {
  id: string;
  name: string;
  nodes: string[];
  type: 'Direct' | 'Positioning' | 'Split-Ticket' | 'Hub-Spoke' | 'Hidden-City' | 'Loop';
  description: string;
  rationale: string; // Why this works
  tradeOffs: string[]; // Downsides
  actionPlans: StrategyActionPlan[]; // Tool-specific steps
  stepLinks?: BookingStepLink[]; // NEW: Specific links to book the legs
  risk: 'Low' | 'Medium' | 'High';
  estimatedSavings: string;
  // Enhanced metadata
  seasonality?: string[]; // e.g., ["May", "Sep", "Oct"] for best prices
  minConnectionTime?: string; // Recommended buffer e.g., "4h"
  bookingWindow?: string; // e.g., "45-60 days out"
}

export interface StrategySolution {
  condition: string; // e.g. "Over Budget"
  title: string;
  description: string;
  suggestedActions: string[];
}

export interface SearchLink {
  provider: 'Google Flights' | 'Google Explore' | 'Skyscanner' | 'Kayak';
  label: string;
  url: string;
  primary: boolean;
}

export interface Strategy {
  id: string;
  summary: string;
  // Layered Plans
  corePlan: RoutePattern[];
  backupPlans: RoutePattern[];
  chaosPlans: RoutePattern[];
  // Tactics
  solutions: StrategySolution[];
  // Deep Links
  searchLinks: SearchLink[];
  // Legacy/Helper
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

// Live Data Types
export interface FlightSegment {
  departure: { iataCode: string; at: string; terminal?: string };
  arrival: { iataCode: string; at: string; terminal?: string };
  carrierCode: string;
  number: string;
  duration: string;
  // Enhanced segment details
  cabin?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  aircraftCode?: string; // e.g. "789"
  amenities?: string[]; // e.g. ["WiFi", "Power"]
}

export interface FlightDeal {
  id: string;
  source: 'Amadeus' | 'Mock';
  rawOffer?: any; // Store original Amadeus object for Pricing confirmation
  price: {
    total: string;
    currency: string;
    base?: string;
    fees?: string;
  };
  airlines: string[];
  segments: FlightSegment[]; // Simplified to just outbound for v1 display
  deepLink?: string;
  duration: string;
  stops: number;
  // Enhanced deal details
  fareClass?: string; // e.g. "Basic Economy"
  layoverDurations?: string[]; // Calculated duration of stops between segments
  baggageInfo?: {
    includedCheckedBags: number;
    estimatedBagFee?: number;
    unit?: 'KG' | 'PC';
  };
}

// --- NEW TYPES FOR EXPANDED AMADEUS FEATURES ---

export interface HotelOffer {
  id: string;
  name: string;
  hotelId: string;
  cityCode: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  price: {
    total: string;
    currency: string;
  };
  description?: string;
  amenities?: string[];
  media?: { uri: string; category?: string }[];
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
  geoCode?: {
    latitude: number;
    longitude: number;
  };
}

export interface InspirationFlight {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: {
    total: string;
  };
  links: {
    flightDates: string;
    flightOffers: string;
  };
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
