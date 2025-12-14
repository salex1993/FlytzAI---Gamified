import { LocationOption } from '../types';

export const ORIGIN_OPTIONS: LocationOption[] = [
  // US Major Hubs
  { label: 'New York (NYC - All Airports)', value: 'NYC', type: 'City', keywords: ['JFK', 'EWR', 'LGA'] },
  { label: 'New York (JFK)', value: 'JFK', type: 'Airport' },
  { label: 'Newark (EWR)', value: 'EWR', type: 'Airport' },
  { label: 'Los Angeles (LAX)', value: 'LAX', type: 'Airport' },
  { label: 'San Francisco (SFO)', value: 'SFO', type: 'Airport' },
  { label: 'Chicago (ORD)', value: 'ORD', type: 'Airport' },
  { label: 'Atlanta (ATL)', value: 'ATL', type: 'Airport' },
  { label: 'Dallas (DFW)', value: 'DFW', type: 'Airport' },
  { label: 'Miami (MIA)', value: 'MIA', type: 'Airport' },
  { label: 'Seattle (SEA)', value: 'SEA', type: 'Airport' },
  
  // European Hubs
  { label: 'London (LON - All Airports)', value: 'LON', type: 'City', keywords: ['LHR', 'LGW'] },
  { label: 'London Heathrow (LHR)', value: 'LHR', type: 'Airport' },
  { label: 'Paris (CDG)', value: 'CDG', type: 'Airport' },
  { label: 'Amsterdam (AMS)', value: 'AMS', type: 'Airport' },
  { label: 'Frankfurt (FRA)', value: 'FRA', type: 'Airport' },
  
  // Asia/Pacific Hubs
  { label: 'Tokyo (TYO - All Airports)', value: 'TYO', type: 'City', keywords: ['HND', 'NRT'] },
  { label: 'Singapore (SIN)', value: 'SIN', type: 'Airport' },
  { label: 'Dubai (DXB)', value: 'DXB', type: 'Airport' },
];

export const DESTINATION_OPTIONS: LocationOption[] = [
  // Regions
  { label: 'Anywhere', value: 'Everywhere', type: 'Region' },
  { label: 'Southeast Asia', value: 'Southeast Asia', type: 'Region', keywords: ['Thailand', 'Vietnam', 'Bali'] },
  { label: 'Western Europe', value: 'Western Europe', type: 'Region', keywords: ['France', 'UK', 'Spain'] },
  { label: 'Eastern Europe', value: 'Eastern Europe', type: 'Region' },
  { label: 'East Asia', value: 'East Asia', type: 'Region', keywords: ['Japan', 'Korea', 'China'] },
  { label: 'South America', value: 'South America', type: 'Region' },
  { label: 'Central America', value: 'Central America', type: 'Region' },
  
  // Specific Popular Countries
  { label: 'Japan', value: 'Japan', type: 'Country' },
  { label: 'Thailand', value: 'Thailand', type: 'Country' },
  { label: 'Italy', value: 'Italy', type: 'Country' },
  { label: 'Portugal', value: 'Portugal', type: 'Country' },
  { label: 'Mexico', value: 'Mexico', type: 'Country' },
  
  // Specific Cities
  { label: 'Tokyo, Japan', value: 'Tokyo', type: 'City' },
  { label: 'Bangkok, Thailand', value: 'Bangkok', type: 'City' },
  { label: 'London, UK', value: 'London', type: 'City' },
  { label: 'Paris, France', value: 'Paris', type: 'City' },
  { label: 'Bali (Denpasar)', value: 'Denpasar', type: 'City' },
];