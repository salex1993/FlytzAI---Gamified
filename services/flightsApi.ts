
import { FlightProfile, TripPlan, FlightDeal, HotelOffer, ActivityOffer, InspirationFlight, LocationOption } from '../types';
import { AIRPORT_DB } from '../data/airports';

// Constants for Amadeus Test Environment
const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

// Endpoints
const ENDPOINTS = {
  SEARCH_FLIGHTS: '/v2/shopping/flight-offers',
  PRICE_FLIGHTS: '/v1/shopping/flight-offers/pricing',
  FLIGHT_INSPIRATION: '/v1/shopping/flight-destinations',
  SEARCH_LOCATIONS: '/v1/reference-data/locations',
  SEARCH_HOTELS: '/v1/reference-data/locations/hotels/by-city', // List hotels in city
  HOTEL_OFFERS: '/v3/shopping/hotel-offers', // Get prices for specific hotels
  ACTIVITIES: '/v1/shopping/activities',
  POINTS_OF_INTEREST: '/v1/reference-data/locations/pois',
};

// Internal cache for the token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Maps vague regions (like "Southeast Asia") to specific major hubs
 * so the API has a concrete destination to search for.
 */
const REGION_TO_HUBS: Record<string, string[]> = {
  'Southeast Asia': ['BKK', 'SIN', 'SGN', 'KUL'],
  'Thailand': ['BKK', 'HKT'],
  'Vietnam': ['SGN', 'HAN'],
  'Bali': ['DPS'],
  'Western Europe': ['LHR', 'CDG', 'AMS', 'FRA'],
  'Eastern Europe': ['WAW', 'BUD', 'IST', 'PRG'],
  'East Asia': ['HND', 'ICN', 'TPE', 'HKG'],
  'Japan': ['HND', 'NRT', 'KIX'],
  'Korea': ['ICN'],
  'China': ['PVG', 'PEK', 'HKG'],
  'South America': ['GRU', 'BOG', 'LIM', 'EZE'],
  'Central America': ['PTY', 'SJO', 'SAL'],
  'Mexico': ['MEX', 'CUN'],
  'Italy': ['FCO', 'MXP', 'VCE'],
  'France': ['CDG', 'ORY', 'NCE'],
  'UK': ['LHR', 'LGW', 'MAN'],
  'Spain': ['MAD', 'BCN'],
  'Portugal': ['LIS', 'OPO'],
  'London': ['LHR', 'LGW'],
  'Paris': ['CDG'],
  'Tokyo': ['HND', 'NRT'],
  'Bangkok': ['BKK'],
  'Everywhere': ['LHR', 'DXB', 'IST'] 
};

// --- SAFE ENV ACCESS ---
const safeGetEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

// --- HELPER: BOOKING LINK GENERATOR ---
const generateBookingLink = (deal: FlightDeal): string => {
  const origin = deal.segments[0].departure.iataCode;
  const dest = deal.segments[deal.segments.length - 1].arrival.iataCode;
  const date = deal.segments[0].departure.at.split('T')[0];
  return `https://www.google.com/travel/flights?q=Flights+to+${dest}+from+${origin}+on+${date}`;
};

// --- HELPER: UUID ---
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch(e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- AUTHENTICATION ---
async function getAmadeusToken(): Promise<string | null> {
  let clientId = safeGetEnv('VITE_AMADEUS_CLIENT_ID');
  let clientSecret = safeGetEnv('VITE_AMADEUS_CLIENT_SECRET');

  if (!clientId && typeof localStorage !== 'undefined') {
      clientId = localStorage.getItem('VITE_AMADEUS_CLIENT_ID') || undefined;
  }
  if (!clientSecret && typeof localStorage !== 'undefined') {
      clientSecret = localStorage.getItem('VITE_AMADEUS_CLIENT_SECRET') || undefined;
  }

  if (!clientId || !clientSecret) {
    console.log('Flytz: No Amadeus API keys found. Switching to Demo Mode.');
    return null;
  }

  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

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

    if (!response.ok) throw new Error('Failed to get Amadeus token');

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    return accessToken;
  } catch (error) {
    console.error('Auth Error:', error);
    return null;
  }
}

// --- EXPORTED VALIDATOR ---
export async function validateAmadeusConnection(id: string, secret: string): Promise<boolean> {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', id);
        params.append('client_secret', secret);

        const response = await fetch(AMADEUS_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.access_token;
            tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// --- 1. FLIGHT SEARCH ---
export async function searchDeals(profile: FlightProfile, trip: TripPlan): Promise<FlightDeal[]> {
  const token = await getAmadeusToken();
  const region = trip.destinationRegions[0];
  
  let hubs = REGION_TO_HUBS[region];
  if (!hubs) {
      if (region.length === 3) hubs = [region];
      else hubs = ['LHR', 'IST', 'DXB']; 
  }

  if (!token) return getMockDeals(region, hubs);

  const origin = profile.homeAirports[0] || 'NYC';
  const results: FlightDeal[] = [];

  for (const hub of hubs.slice(0, 2)) {
    try {
      const url = new URL(AMADEUS_BASE_URL + ENDPOINTS.SEARCH_FLIGHTS);
      url.searchParams.append('originLocationCode', origin);
      url.searchParams.append('destinationLocationCode', hub);
      url.searchParams.append('departureDate', trip.startDate);
      url.searchParams.append('adults', '1');
      url.searchParams.append('max', '5');
      url.searchParams.append('currencyCode', 'USD');

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) continue;
      const data = await response.json();
      if (!data.data) continue;

      const deals: FlightDeal[] = data.data.map((offer: any) => {
        const itinerary = offer.itineraries[0];
        const segments = itinerary.segments;
        
        const dealObj: FlightDeal = {
          id: offer.id,
          source: 'Amadeus',
          rawOffer: offer, // Save for pricing
          price: {
            total: offer.price.total,
            currency: offer.price.currency
          },
          airlines: [segments[0].carrierCode],
          duration: itinerary.duration.replace('PT', '').toLowerCase(),
          stops: segments.length - 1,
          segments: segments.map((seg: any) => ({
            departure: { iataCode: seg.departure.iataCode, at: seg.departure.at },
            arrival: { iataCode: seg.arrival.iataCode, at: seg.arrival.at },
            carrierCode: seg.carrierCode,
            number: seg.number,
            duration: seg.duration
          }))
        };
        dealObj.deepLink = generateBookingLink(dealObj);
        return dealObj;
      });
      results.push(...deals);
    } catch (e) {
      console.error(`Search failed for ${hub}`, e);
    }
  }
  return results.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
}

// --- 2. FLIGHT PRICING CONFIRMATION ---
export async function confirmFlightPrice(offer: any): Promise<{ confirmed: boolean; price?: string; error?: string }> {
    const token = await getAmadeusToken();
    if (!token) return { confirmed: true, price: offer.price.total }; // Mock pass

    try {
        const url = AMADEUS_BASE_URL + ENDPOINTS.PRICE_FLIGHTS;
        const body = {
            data: {
                type: "flight-offers-pricing",
                flightOffers: [offer]
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            return { confirmed: false, error: err.errors?.[0]?.detail || "Pricing verification failed" };
        }

        const data = await response.json();
        const pricedOffer = data.data.flightOffers[0];
        return { confirmed: true, price: pricedOffer.price.total };

    } catch (e) {
        return { confirmed: false, error: "Network error during verification" };
    }
}

// --- 3. LOCATION SEARCH (AUTOCOMPLETE) ---
export async function searchLocations(keyword: string): Promise<LocationOption[]> {
    const token = await getAmadeusToken();
    if (!token || keyword.length < 2) return [];

    try {
        const url = new URL(AMADEUS_BASE_URL + ENDPOINTS.SEARCH_LOCATIONS);
        url.searchParams.append('subType', 'AIRPORT,CITY');
        url.searchParams.append('keyword', keyword);
        url.searchParams.append('page[limit]', '10');

        const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return [];
        const data = await response.json();
        
        return data.data.map((loc: any) => ({
            label: `${loc.name} (${loc.iataCode})`,
            value: loc.iataCode,
            type: loc.subType === 'AIRPORT' ? 'Airport' : 'City',
            keywords: [loc.address?.countryName]
        }));
    } catch (e) {
        return [];
    }
}

// --- 4. HOTEL SEARCH ---
export async function searchHotels(cityCode: string): Promise<HotelOffer[]> {
    const token = await getAmadeusToken();
    if (!token) return getMockHotels(cityCode);

    try {
        // Step 1: Get list of hotels in city (Reference Data)
        const listUrl = new URL(AMADEUS_BASE_URL + ENDPOINTS.SEARCH_HOTELS);
        listUrl.searchParams.append('cityCode', cityCode);
        
        const listResp = await fetch(listUrl.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
        if (!listResp.ok) return [];
        const listData = await listResp.json();
        
        // Take top 5 hotels to get offers for
        const hotelIds = listData.data.slice(0, 5).map((h: any) => h.hotelId);
        if (hotelIds.length === 0) return [];

        // Step 2: Get offers for these hotels
        const offerUrl = new URL(AMADEUS_BASE_URL + ENDPOINTS.HOTEL_OFFERS);
        offerUrl.searchParams.append('hotelIds', hotelIds.join(','));
        offerUrl.searchParams.append('adults', '1');

        const offerResp = await fetch(offerUrl.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
        if (!offerResp.ok) return [];
        const offerData = await offerResp.json();

        return offerData.data.map((offer: any) => ({
            id: offer.offers[0].id,
            hotelId: offer.hotel.hotelId,
            name: offer.hotel.name,
            cityCode: offer.hotel.cityCode,
            rating: offer.hotel.rating,
            price: {
                total: offer.offers[0].price.total,
                currency: offer.offers[0].price.currency
            }
        }));

    } catch (e) {
        console.error("Hotel Search Failed", e);
        return [];
    }
}

// --- 5. ACTIVITIES SEARCH ---
export async function searchActivities(lat: number, lon: number): Promise<ActivityOffer[]> {
    const token = await getAmadeusToken();
    if (!token) return getMockActivities();

    try {
        const url = new URL(AMADEUS_BASE_URL + ENDPOINTS.ACTIVITIES);
        url.searchParams.append('latitude', lat.toString());
        url.searchParams.append('longitude', lon.toString());
        url.searchParams.append('radius', '10');

        const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) return [];
        const data = await response.json();

        return data.data.map((act: any) => ({
            id: act.id,
            name: act.name,
            shortDescription: act.shortDescription,
            rating: act.rating,
            price: act.price,
            pictures: act.pictures?.map((p: any) => p),
            bookingLink: act.bookingLink
        }));
    } catch (e) {
        return [];
    }
}

// --- 6. FLIGHT INSPIRATION ---
export async function getFlightInspiration(origin: string): Promise<InspirationFlight[]> {
    const token = await getAmadeusToken();
    if (!token) return [];

    try {
        const url = new URL(AMADEUS_BASE_URL + ENDPOINTS.FLIGHT_INSPIRATION);
        url.searchParams.append('origin', origin);
        // url.searchParams.append('maxPrice', '500'); 

        const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) return [];
        const data = await response.json();

        return data.data.map((item: any) => ({
            origin: item.origin,
            destination: item.destination,
            departureDate: item.departureDate,
            returnDate: item.returnDate,
            price: { total: item.price.total },
            links: item.links
        }));
    } catch (e) {
        return [];
    }
}


// --- MOCKS ---
function getMockDeals(region: string, hubs: string[]): Promise<FlightDeal[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            const MOCK_DEALS: FlightDeal[] = [
                {
                    id: 'mock-1', source: 'Mock', airlines: ['TK'], duration: '16h 20m', stops: 1,
                    price: { total: '485.00', currency: 'USD' },
                    segments: [{ departure: { iataCode: 'JFK', at: '2024-05-10T18:00' }, arrival: { iataCode: 'IST', at: '2024-05-11T11:00' }, carrierCode: 'TK', number: '001', duration: '10h' }, { departure: { iataCode: 'IST', at: '2024-05-11T14:00' }, arrival: { iataCode: 'BKK', at: '2024-05-12T03:00' }, carrierCode: 'TK', number: '068', duration: '9h' }]
                },
                {
                    id: 'mock-2', source: 'Mock', airlines: ['SQ'], duration: '21h 00m', stops: 1,
                    price: { total: '620.00', currency: 'USD' },
                    segments: [{ departure: { iataCode: 'EWR', at: '2024-05-10T09:00' }, arrival: { iataCode: 'SIN', at: '2024-05-11T16:00' }, carrierCode: 'SQ', number: '21', duration: '18h 30m' }]
                },
                {
                    id: 'mock-3', source: 'Mock', airlines: ['BA'], duration: '7h 00m', stops: 0,
                    price: { total: '550.00', currency: 'USD' },
                    segments: [{ departure: { iataCode: 'JFK', at: '2024-05-10T18:00' }, arrival: { iataCode: 'LHR', at: '2024-05-11T06:00' }, carrierCode: 'BA', number: '112', duration: '7h' }]
                }
            ];
            
            const filtered = MOCK_DEALS.filter(d => {
                if (region === 'Everywhere') return true;
                const dest = d.segments[d.segments.length-1].arrival.iataCode;
                if (region.includes('Asia') && ['BKK','SIN'].includes(dest)) return true;
                if (region.includes('Europe') && ['LHR','IST'].includes(dest)) return true;
                if (hubs.includes(dest)) return true;
                return false;
            });
            
            resolve(filtered.map(d => ({ ...d, id: generateUUID(), deepLink: generateBookingLink(d) })));
        }, 800);
    });
}

function getMockHotels(cityCode: string): HotelOffer[] {
    return [
        { id: 'h1', hotelId: 'H1', name: 'Grand Hyatt', cityCode, rating: 5, price: { total: '250.00', currency: 'USD' } },
        { id: 'h2', hotelId: 'H2', name: 'Ibis Budget', cityCode, rating: 3, price: { total: '85.00', currency: 'USD' } },
        { id: 'h3', hotelId: 'H3', name: 'Marriott Downtown', cityCode, rating: 4, price: { total: '180.00', currency: 'USD' } },
    ];
}

function getMockActivities(): ActivityOffer[] {
    return [
        { id: 'a1', name: 'City Walking Tour', shortDescription: 'Explore the historic center.', rating: '4.5', price: { amount: '25.00', currencyCode: 'USD' } },
        { id: 'a2', name: 'Museum Entry', shortDescription: 'Skip the line tickets.', rating: '4.8', price: { amount: '40.00', currencyCode: 'USD' } },
    ];
}
