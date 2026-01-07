
import { FlightProfile, TripPlan, FlightDeal, HotelOffer, ActivityOffer, InspirationFlight, LocationOption, FlightSegment } from '../types';
import { AIRPORT_DB } from '../data/airports';
import { AIRCRAFT_DB, getAircraftForDistance } from '../data/aircraft';

const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

const ENDPOINTS = {
  SEARCH_FLIGHTS: '/v2/shopping/flight-offers',
  PRICE_FLIGHTS: '/v1/shopping/flight-offers/pricing',
  FLIGHT_INSPIRATION: '/v1/shopping/flight-destinations',
  SEARCH_LOCATIONS: '/v1/reference-data/locations',
  SEARCH_HOTELS: '/v1/reference-data/locations/hotels/by-city',
  HOTEL_OFFERS: '/v3/shopping/hotel-offers',
  ACTIVITIES: '/v1/shopping/activities',
  POINTS_OF_INTEREST: '/v1/reference-data/locations/pois',
};

let accessToken: string | null = null;
let tokenExpiry: number = 0;

const REGION_TO_HUBS: Record<string, string[]> = {
  'Southeast Asia': ['BKK', 'SIN', 'SGN', 'KUL'],
  'Western Europe': ['LHR', 'CDG', 'AMS', 'FRA'],
  'Eastern Europe': ['WAW', 'BUD', 'IST', 'PRG'],
  'East Asia': ['HND', 'ICN', 'TPE', 'HKG'],
  'South America': ['GRU', 'BOG', 'LIM', 'EZE'],
  'Central America': ['PTY', 'SJO', 'SAL'],
  'Everywhere': ['LHR', 'DXB', 'IST'] 
};

const generateBookingLink = (deal: FlightDeal): string => {
  const origin = deal.segments[0].departure.iataCode;
  const dest = deal.segments[deal.segments.length - 1].arrival.iataCode;
  const date = deal.segments[0].departure.at.split('T')[0];
  if (deal.source === 'Charter') {
      return `https://www.privatefly.com/private-jet-hire/search-results?departureAirport=${origin}&arrivalAirport=${dest}&departureDate=${date}`;
  }
  return `https://www.google.com/travel/flights?q=Flights+to+${dest}+from+${origin}+on+${date}`;
};

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch(e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getAmadeusToken(): Promise<string | null> {
  const clientId = localStorage.getItem('VITE_AMADEUS_CLIENT_ID');
  const clientSecret = localStorage.getItem('VITE_AMADEUS_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    const response = await fetch(AMADEUS_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    if (!response.ok) throw new Error('Auth failed');
    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    return accessToken;
  } catch (error) { return null; }
}

export async function validateAmadeusConnection(id: string, secret: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', id);
    params.append('client_secret', secret);
    const response = await fetch(AMADEUS_AUTH_URL, { method: 'POST', body: params });
    return response.ok;
  } catch (e) { return false; }
}

async function searchPrivateDeals(origin: string, dest: string, date: string): Promise<FlightDeal[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      const originGeo = AIRPORT_DB[origin];
      const destGeo = AIRPORT_DB[dest];
      if (!originGeo || !destGeo) { resolve([]); return; }
      const dist = Math.sqrt(Math.pow(originGeo.lat - destGeo.lat, 2) + Math.pow(originGeo.lon - destGeo.lon, 2)) * 60;
      const aircraft = getAircraftForDistance(dist);
      const isEmptyLeg = Math.random() > 0.6;
      const flightTimeHours = dist / aircraft.speedKts;
      const basePrice = flightTimeHours * aircraft.hourlyRateEstimate;
      const finalPrice = isEmptyLeg ? basePrice * 0.4 : basePrice;

      const deal: FlightDeal = {
        id: generateUUID(),
        source: 'Charter',
        price: { total: finalPrice.toFixed(2), currency: 'USD' },
        airlines: ['PRIVATE'],
        duration: `${Math.floor(flightTimeHours)}h ${Math.floor((flightTimeHours % 1) * 60)}m`,
        stops: 0,
        segments: [{
          departure: { iataCode: origin, at: `${date}T10:00:00`, terminal: 'FBO' },
          arrival: { iataCode: dest, at: `${date}T${10 + Math.floor(flightTimeHours)}:00:00`, terminal: 'FBO' },
          carrierCode: 'PVT', number: 'N'+Math.floor(Math.random()*900+100), duration: `PT${Math.floor(flightTimeHours)}H`,
          cabin: 'PRIVATE', amenities: aircraft.amenities
        }],
        aircraft, emptyLeg: isEmptyLeg
      };
      deal.deepLink = generateBookingLink(deal);
      resolve([deal]);
    }, 1000);
  });
}

export async function searchDeals(profile: FlightProfile, trip: TripPlan): Promise<FlightDeal[]> {
  const token = await getAmadeusToken();
  const region = trip.destinationRegions[0];
  const keywords = trip.contextKeywords?.map(k => k.toLowerCase()) || [];
  const isPrivateRequest = keywords.includes('private') || keywords.includes('charter') || profile.chaosLevel >= 4;
  
  let hubs = REGION_TO_HUBS[region];
  if (!hubs) hubs = region.length === 3 ? [region] : ['LHR', 'DXB', 'SIN'];

  const results: FlightDeal[] = [];
  if (isPrivateRequest) {
    const priv = await searchPrivateDeals(profile.homeAirports[0], hubs[0], trip.startDate);
    results.push(...priv);
  }

  if (!token) {
    results.push(...await getMockDeals(region, hubs));
    return results.sort((a,b) => parseFloat(a.price.total) - parseFloat(b.price.total));
  }

  for (const hub of hubs.slice(0, 2)) {
    try {
      const url = new URL(AMADEUS_BASE_URL + ENDPOINTS.SEARCH_FLIGHTS);
      url.searchParams.append('originLocationCode', profile.homeAirports[0]);
      url.searchParams.append('destinationLocationCode', hub);
      url.searchParams.append('departureDate', trip.startDate);
      url.searchParams.append('adults', '1');
      url.searchParams.append('currencyCode', 'USD');
      const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.data) {
        results.push(...data.data.map((offer: any) => {
          const itin = offer.itineraries[0];
          const segs = itin.segments;
          const d: FlightDeal = {
            id: offer.id, source: 'Amadeus', rawOffer: offer,
            price: { total: offer.price.total, currency: 'USD' },
            airlines: [segs[0].carrierCode], duration: itin.duration.replace('PT','').toLowerCase(), stops: segs.length - 1,
            segments: segs.map((s: any) => ({
              departure: { iataCode: s.departure.iataCode, at: s.departure.at },
              arrival: { iataCode: s.arrival.iataCode, at: s.arrival.at },
              carrierCode: s.carrierCode, number: s.number, duration: s.duration
            }))
          };
          d.deepLink = generateBookingLink(d);
          return d;
        }));
      }
    } catch (e) {}
  }
  return results.sort((a,b) => parseFloat(a.price.total) - parseFloat(b.price.total));
}

export async function confirmFlightPrice(offer: any): Promise<{ confirmed: boolean; price?: string; error?: string }> {
  const token = await getAmadeusToken();
  if (!token) return { confirmed: true, price: offer.price.total };
  try {
    const response = await fetch(AMADEUS_BASE_URL + ENDPOINTS.PRICE_FLIGHTS, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { type: "flight-offers-pricing", flightOffers: [offer] } })
    });
    if (!response.ok) return { confirmed: false, error: "Verification failed" };
    const data = await response.json();
    return { confirmed: true, price: data.data.flightOffers[0].price.total };
  } catch (e) { return { confirmed: false, error: "Network error" }; }
}

export async function searchLocations(keyword: string): Promise<LocationOption[]> {
  const token = await getAmadeusToken();
  if (!token || keyword.length < 2) return [];
  try {
    const url = new URL(AMADEUS_BASE_URL + ENDPOINTS.SEARCH_LOCATIONS);
    url.searchParams.append('subType', 'AIRPORT,CITY');
    url.searchParams.append('keyword', keyword);
    const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data.map((loc: any) => ({
      label: `${loc.name} (${loc.iataCode})`, value: loc.iataCode,
      type: loc.subType === 'AIRPORT' ? 'Airport' : 'City',
      keywords: [loc.address?.countryName]
    }));
  } catch (e) { return []; }
}

export async function searchHotels(cityCode: string): Promise<HotelOffer[]> {
  return [
    { id: 'h1', hotelId: 'H1', name: 'Grand Hotel', cityCode, rating: 5, price: { total: '250.00', currency: 'USD' } },
    { id: 'h2', hotelId: 'H2', name: 'Elite Stay', cityCode, rating: 4, price: { total: '180.00', currency: 'USD' } },
  ];
}

export async function searchActivities(lat: number, lon: number): Promise<ActivityOffer[]> {
  return [
    { id: 'a1', name: 'VIP City Tour', shortDescription: 'Private chauffeur tour of city landmarks.', rating: '4.9', price: { amount: '120.00', currencyCode: 'USD' } },
  ];
}

async function getMockDeals(region: string, hubs: string[]): Promise<FlightDeal[]> {
  return [
    { id: 'm1', source: 'Mock', airlines: ['TK'], duration: '14h', stops: 1, price: { total: '520.00', currency: 'USD' }, segments: [{ departure: { iataCode: 'JFK', at: '2025-06-10T18:00' }, arrival: { iataCode: 'IST', at: '2025-06-11T11:00' }, carrierCode: 'TK', number: '1', duration: '10h' }] },
  ];
}
