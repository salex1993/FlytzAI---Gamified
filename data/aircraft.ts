
import { Aircraft } from '../types';

export const AIRCRAFT_DB: Record<string, Aircraft> = {
  'phenom-100': {
    id: 'phenom-100',
    name: 'Embraer Phenom 100',
    category: 'Very Light Jet',
    paxMax: 4,
    rangeNm: 1178,
    speedKts: 390,
    hourlyRateEstimate: 2500,
    amenities: ['Refreshment Center', 'Enclosed Lavatory', 'Executive Seating']
  },
  'citation-cj3': {
    id: 'citation-cj3',
    name: 'Cessna Citation CJ3',
    category: 'Light Jet',
    paxMax: 7,
    rangeNm: 1875,
    speedKts: 416,
    hourlyRateEstimate: 3200,
    amenities: ['Power Outlets', 'Satellite Phone', 'Galley']
  },
  'hawker-800xp': {
    id: 'hawker-800xp',
    name: 'Hawker 800XP',
    category: 'Midsize Jet',
    paxMax: 8,
    rangeNm: 2642,
    speedKts: 448,
    hourlyRateEstimate: 4500,
    amenities: ['Standing Cabin', 'Partial Galley', 'In-Flight Luggage Access']
  },
  'challenger-350': {
    id: 'challenger-350',
    name: 'Bombardier Challenger 350',
    category: 'Super Midsize',
    paxMax: 9,
    rangeNm: 3200,
    speedKts: 459,
    hourlyRateEstimate: 6000,
    amenities: ['WiFi', 'HD In-Flight Entertainment', 'Full Galley']
  },
  'gulfstream-g650': {
    id: 'gulfstream-g650',
    name: 'Gulfstream G650ER',
    category: 'Ultra Long Range',
    paxMax: 16,
    rangeNm: 7500,
    speedKts: 516,
    hourlyRateEstimate: 12000,
    amenities: ['Master Suite', 'Low Cabin Altitude', 'Ultra-High-Speed Connectivity', 'Kitchen']
  }
};

export const getAircraftForDistance = (distanceNm: number): Aircraft => {
  if (distanceNm < 1200) return AIRCRAFT_DB['phenom-100'];
  if (distanceNm < 2000) return AIRCRAFT_DB['citation-cj3'];
  if (distanceNm < 3000) return AIRCRAFT_DB['challenger-350'];
  return AIRCRAFT_DB['gulfstream-g650'];
};
