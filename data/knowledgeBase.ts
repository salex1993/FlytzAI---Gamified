
import { KnowledgeEntry } from '../types';

export const KNOWLEDGE_DATA: KnowledgeEntry[] = [
  // --- EXISTING CONCEPTS ---
  {
    id: 'ita-matrix',
    term: 'ITA Matrix',
    category: 'Tool',
    definition: 'A powerful flight search engine acquired by Google. It allows for complex routing codes and granular search parameters but cannot book flights directly.',
    links: [{ text: 'Visit Tool', url: 'https://matrix.itasoftware.com/' }]
  },
  {
    id: 'open-jaw',
    term: 'Open Jaw (OJ)',
    category: 'Concept',
    definition: 'A return ticket where the destination of the outbound flight is different from the origin of the return flight, or the destination of the return flight is different from the origin of the outbound.',
    example: 'Fly NYC -> London, return Paris -> NYC.'
  },
  {
    id: 'positioning-flight',
    term: 'Positioning Flight',
    category: 'Concept',
    definition: 'A separate, usually cheap flight taken to get from your home airport to a major hub where a long-haul deal originates.',
    example: 'Home is Austin. Deal is LAX -> Tokyo ($400). You buy a $100 flight Austin -> LAX to catch it.'
  },
  {
    id: 'skiplagging',
    term: 'Hidden City Ticketing',
    category: 'Concept',
    definition: 'Booking a flight with a layover in your actual destination and skipping the final leg. Highly effective but frowned upon by airlines.',
    example: 'You want to go to Dallas. You buy NYC -> Dallas -> LA because it is cheaper than NYC -> Dallas. You get off in Dallas.'
  },
  {
    id: 'cpm',
    term: 'CPM',
    category: 'Acronym',
    definition: 'Cents Per Mile. A metric used by frequent flyers to calculate the value of a ticket relative to the distance flown. Lower is better for mileage runs.',
    example: '$500 ticket / 10,000 miles = 5.0 CPM'
  },
  {
    id: 'google-flights-explore',
    term: 'Google Flights Explore',
    category: 'Tool',
    definition: 'A map-based search feature allowing users to see prices for "Anywhere" or specific regions across a range of dates.',
    links: [{ text: 'Explore Map', url: 'https://www.google.com/travel/explore' }]
  },
  {
    id: 'fuel-dumping',
    term: 'Fuel Dumping',
    category: 'Concept',
    definition: 'An advanced technique involving adding a specific flight leg (often called a "strike") to an itinerary to cause the airline\'s pricing algorithm to drop the fuel surcharge component.',
    example: 'Warning: This practice is actively monitored and penalized by airlines.'
  },
  {
    id: 'ota',
    term: 'OTA',
    category: 'Acronym',
    definition: 'Online Travel Agency. Third-party sites like Expedia, Priceline, or Skyscanner that sell tickets, often cheaper than booking direct, but with harder customer service support.'
  },
  {
    id: 'stopover',
    term: 'Stopover',
    category: 'Concept',
    definition: 'A layover that lasts longer than 24 hours (international) or 4 hours (domestic). Some airlines allow free stopovers to encourage tourism in their hub city.',
  },
  {
    id: 'rtw',
    term: 'RTW',
    category: 'Acronym',
    definition: 'Round The World ticket. A specifically priced ticket offered by airline alliances (Star Alliance, OneWorld) allowing travel across multiple continents in one direction.'
  },

  // --- AIRPORT CODES (NORTH AMERICA) ---
  { id: 'jfk', term: 'JFK', category: 'Acronym', definition: 'John F. Kennedy International Airport (New York, USA)' },
  { id: 'ewr', term: 'EWR', category: 'Acronym', definition: 'Newark Liberty International Airport (New Jersey/New York Area, USA)' },
  { id: 'lga', term: 'LGA', category: 'Acronym', definition: 'LaGuardia Airport (New York, USA)' },
  { id: 'lax', term: 'LAX', category: 'Acronym', definition: 'Los Angeles International Airport (California, USA)' },
  { id: 'sfo', term: 'SFO', category: 'Acronym', definition: 'San Francisco International Airport (California, USA)' },
  { id: 'ord', term: 'ORD', category: 'Acronym', definition: 'O\'Hare International Airport (Chicago, USA)' },
  { id: 'atl', term: 'ATL', category: 'Acronym', definition: 'Hartsfield-Jackson Atlanta International Airport (Georgia, USA)' },
  { id: 'mia', term: 'MIA', category: 'Acronym', definition: 'Miami International Airport (Florida, USA)' },
  { id: 'dfw', term: 'DFW', category: 'Acronym', definition: 'Dallas/Fort Worth International Airport (Texas, USA)' },
  { id: 'sea', term: 'SEA', category: 'Acronym', definition: 'Seattle-Tacoma International Airport (Washington, USA)' },

  // --- AIRPORT CODES (EUROPE) ---
  { id: 'lhr', term: 'LHR', category: 'Acronym', definition: 'Heathrow Airport (London, UK)' },
  { id: 'lgw', term: 'LGW', category: 'Acronym', definition: 'Gatwick Airport (London, UK)' },
  { id: 'cdg', term: 'CDG', category: 'Acronym', definition: 'Charles de Gaulle Airport (Paris, France)' },
  { id: 'ams', term: 'AMS', category: 'Acronym', definition: 'Amsterdam Airport Schiphol (Netherlands)' },
  { id: 'fra', term: 'FRA', category: 'Acronym', definition: 'Frankfurt Airport (Germany)' },
  { id: 'mad', term: 'MAD', category: 'Acronym', definition: 'Adolfo Suárez Madrid-Barajas Airport (Spain)' },
  { id: 'lis', term: 'LIS', category: 'Acronym', definition: 'Humberto Delgado Airport (Lisbon, Portugal)' },
  { id: 'waw', term: 'WAW', category: 'Acronym', definition: 'Warsaw Chopin Airport (Poland)' },
  { id: 'bud', term: 'BUD', category: 'Acronym', definition: 'Budapest Ferenc Liszt International Airport (Hungary)' },
  { id: 'prg', term: 'PRG', category: 'Acronym', definition: 'Václav Havel Airport Prague (Czech Republic)' },

  // --- AIRPORT CODES (ASIA/MIDDLE EAST) ---
  { id: 'dxb', term: 'DXB', category: 'Acronym', definition: 'Dubai International Airport (UAE)' },
  { id: 'doh', term: 'DOH', category: 'Acronym', definition: 'Hamad International Airport (Doha, Qatar)' },
  { id: 'auh', term: 'AUH', category: 'Acronym', definition: 'Zayed International Airport (Abu Dhabi, UAE)' },
  { id: 'ist', term: 'IST', category: 'Acronym', definition: 'Istanbul Airport (Turkey)' },
  { id: 'hnd', term: 'HND', category: 'Acronym', definition: 'Haneda Airport (Tokyo, Japan)' },
  { id: 'nrt', term: 'NRT', category: 'Acronym', definition: 'Narita International Airport (Tokyo, Japan)' },
  { id: 'sin', term: 'SIN', category: 'Acronym', definition: 'Singapore Changi Airport (Singapore)' },
  { id: 'bkk', term: 'BKK', category: 'Acronym', definition: 'Suvarnabhumi Airport (Bangkok, Thailand)' },
  { id: 'sgn', term: 'SGN', category: 'Acronym', definition: 'Tan Son Nhat International Airport (Ho Chi Minh City, Vietnam)' },
  { id: 'kul', term: 'KUL', category: 'Acronym', definition: 'Kuala Lumpur International Airport (Malaysia)' },
  { id: 'hkg', term: 'HKG', category: 'Acronym', definition: 'Hong Kong International Airport (Hong Kong)' },
  { id: 'tpe', term: 'TPE', category: 'Acronym', definition: 'Taoyuan International Airport (Taipei, Taiwan)' },
  { id: 'icn', term: 'ICN', category: 'Acronym', definition: 'Incheon International Airport (Seoul, South Korea)' },

  // --- AIRPORT CODES (LATIN AMERICA) ---
  { id: 'gru', term: 'GRU', category: 'Acronym', definition: 'São Paulo/Guarulhos International Airport (Brazil)' },
  { id: 'bog', term: 'BOG', category: 'Acronym', definition: 'El Dorado International Airport (Bogotá, Colombia)' },
  { id: 'lim', term: 'LIM', category: 'Acronym', definition: 'Jorge Chávez International Airport (Lima, Peru)' },
  { id: 'eze', term: 'EZE', category: 'Acronym', definition: 'Ezeiza International Airport (Buenos Aires, Argentina)' },
  { id: 'pty', term: 'PTY', category: 'Acronym', definition: 'Tocumen International Airport (Panama City, Panama)' },
  { id: 'sjo', term: 'SJO', category: 'Acronym', definition: 'Juan Santamaría International Airport (San José, Costa Rica)' },
  { id: 'sal', term: 'SAL', category: 'Acronym', definition: 'El Salvador International Airport (San Salvador, El Salvador)' }
];
