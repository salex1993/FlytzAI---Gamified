
import { FlightProfile, TripPlan, Strategy, RoutePattern, StrategyPrompt, StrategyStep, StrategySolution, SearchLink, BookingStepLink } from '../types';

// --- Helper: Robust UUID Generator ---
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Helper: Link Generators for Specific Legs ---
const generateLegLink = (origin: string, dest: string, date: string, provider: BookingStepLink['provider']): string => {
  const safeOrigin = origin.split('/')[0].substring(0,3);
  const safeDest = dest.split('/')[0].substring(0,3);
  
  if (provider === 'Google Flights') {
    return `https://www.google.com/travel/flights?q=Flights+from+${safeOrigin}+to+${safeDest}+on+${date}`;
  }
  if (provider === 'Skyscanner') {
    // Format: YYMMDD
    const dateFormatted = date.slice(2).replace(/-/g,'');
    return `https://www.skyscanner.com/transport/flights/${safeOrigin}/${safeDest}/${dateFormatted}`;
  }
  return '#';
};

// --- Helper: Pattern Factory ---
const createPattern = (
  name: string,
  nodes: string[],
  type: RoutePattern['type'],
  rationale: string,
  tradeOffs: string[],
  risk: RoutePattern['risk'],
  savings: string,
  origin: string,
  dest: string,
  tripDate: string // Needed to generate links
): RoutePattern => {
  
  // Auto-generate deep links for multi-leg strategies
  const stepLinks: BookingStepLink[] = [];
  
  if (type === 'Split-Ticket' || type === 'Positioning') {
      // Leg 1: Origin -> Hub
      const hub = nodes[1].split('/')[0];
      stepLinks.push({
          label: `Book Leg 1: ${origin} → ${hub}`,
          provider: 'Google Flights',
          url: generateLegLink(origin, hub, tripDate, 'Google Flights')
      });

      // Leg 2: Hub -> Destination
      // Assume Leg 2 is same day or +1 day for safety (logic simplified here)
      stepLinks.push({
          label: `Book Leg 2: ${hub} → ${dest}`,
          provider: 'Skyscanner', // Skyscanner often better for budget carriers like Scoot/Norse
          url: generateLegLink(hub, dest, tripDate, 'Skyscanner')
      });
  }

  return {
    id: generateUUID(),
    name,
    nodes,
    type,
    description: `Routing via ${nodes.slice(1, -1).join(' & ')}`,
    rationale,
    tradeOffs,
    risk,
    estimatedSavings: savings,
    stepLinks, // Attached specific links
    actionPlans: [
      {
        tool: 'Google Flights',
        instruction: `Select "Multi-city". Leg 1: ${nodes[0]} to ${nodes[1]}. Leg 2: ${nodes[1]} to ${nodes[nodes.length-1]}. Check pricing separately then combined.`
      },
      {
        tool: 'ITA Matrix',
        instruction: `Advanced routing code: ${origin} :: ${nodes.slice(1, -1).map(n => n.split('/')[0]).join(' ')} ${dest}`
      }
    ]
  };
};

// --- Helper: Solution Generator ---
const generateSolutions = (profile: FlightProfile, trip: TripPlan): StrategySolution[] => {
  const solutions: StrategySolution[] = [];

  // 1. Budget Solution
  if (profile.budgetMax < 1500) {
    solutions.push({
      condition: "Budget Optimization",
      title: "Shoulder Season Shift",
      description: "Prices drop 30-40% outside peak windows (June-Aug, Dec).",
      suggestedActions: [
        "Shift dates to late October or February.",
        "Fly mid-week (Tuesday/Wednesday).",
        "Check departures from secondary airports (e.g., SWF instead of JFK)."
      ]
    });
  }

  // 2. Flexibility Solution
  if (trip.flexibleDays < 2) {
    solutions.push({
      condition: "Low Flexibility",
      title: "The Fixed-Date Tax",
      description: "Rigid dates prevent accessing the best fare buckets.",
      suggestedActions: [
        "Enable 'Track Prices' on Google Flights now.",
        "Consider an overnight layover to reduce cost.",
        "Check +1/-1 day manually if the grid tool is restricted."
      ]
    });
  } else {
    solutions.push({
      condition: "High Flexibility",
      title: "Date Grid Arbitrage",
      description: "You have the advantage. Use it to find 'error fares'.",
      suggestedActions: [
        "Use Google Flights 'Date Grid' view.",
        "Look for green dates up to 3 weeks away.",
        "Consider extending/shortening trip by 1-2 days."
      ]
    });
  }

  // 3. Document/Visa Safety
  if (trip.destinationRegions.some(r => !['USA', 'Canada'].includes(r))) {
      solutions.push({
          condition: "International Routing",
          title: "Visa & Transfer Protocols",
          description: "Self-transfers often require entering the country to re-check bags.",
          suggestedActions: [
              "Verify Transit Visa requirements for all connection points.",
              "If booking separate tickets, you MUST pass immigration to re-check bags.",
              "Ensure at least 4 hours between separate tickets."
          ]
      });
  }

  // 4. Chaos/Skiplagging Solution (Detailed)
  if (profile.chaosLevel >= 4) {
    solutions.push({
      condition: "High Chaos / Hidden City",
      title: "Skiplagging Protocol (WARNING)",
      description: "Booking a flight BEYOND your destination and getting off early. Requires strict adherence to rules.",
      suggestedActions: [
        "NO CHECKED BAGS: They will go to the final destination.",
        "ONE-WAY ONLY: Airlines will cancel your return flight if you miss a leg.",
        "NO FREQUENT FLYER #: Do not associate your account; you risk a ban.",
        "LAST ON: If gate checked, your bag goes to the final city. Board last."
      ]
    });
  } else {
      solutions.push({
          condition: "Standard Protocol",
          title: "Packing Strategy",
          description: "Budget airlines survive on bag fees. Beat them at their game.",
          suggestedActions: [
              "Stick to One-Bag (40L backpack) travel.",
              "Wear your heaviest clothes on the plane.",
              "Pre-pay for carry-on if absolutely necessary (cheaper online)."
          ]
      });
  }

  return solutions;
};

// --- Helper: Region Logic ---
const getRegionPatterns = (origin: string, region: string, chaos: number, tripDate: string): { core: RoutePattern[], backup: RoutePattern[], chaos: RoutePattern[] } => {
  const core: RoutePattern[] = [];
  const backup: RoutePattern[] = [];
  const chaosList: RoutePattern[] = [];

  // REGION: EUROPE
  if (region.includes('Europe') || ['Italy', 'Portugal', 'France', 'UK', 'Spain'].includes(region)) {
    core.push(createPattern(
      'The Heathrow/Amsterdam Pivot',
      [origin, 'LHR/AMS', region],
      'Hub-Spoke',
      'Major alliance hubs offer frequency and reliability. Competition keeps trunk route prices stable.',
      ['High taxes at LHR', 'Potential for delays at AMS'],
      'Low',
      'Baseline', origin, region, tripDate
    ));
    
    backup.push(createPattern(
      'The Iberian Bridge',
      [origin, 'LIS/MAD', region],
      'Positioning',
      'Southern Europe often has cheaper transatlantic taxes than the North.',
      ['Requires separate ticket on LCC (Ryanair/Vueling)'],
      'Medium',
      '20%', origin, region, tripDate
    ));

    if (chaos >= 3) {
      chaosList.push(createPattern(
        'Split Ticket via Norse',
        [origin, 'OSL/LGW', region],
        'Split-Ticket',
        'Use low-cost long-haul carriers (Norse) to get across the pond cheaply, then self-transfer.',
        ['Self-transfer risk', 'No baggage interlining', 'Strict weight limits'],
        'High',
        '40%', origin, region, tripDate
      ));
    }
  } 
  // REGION: SOUTHEAST ASIA
  else if (region.includes('Asia') || ['Thailand', 'Vietnam', 'Japan', 'Korea', 'China', 'Bali', 'Singapore'].includes(region)) {
    core.push(createPattern(
      'The Pacific Rim',
      [origin, 'TYO/TPE', region],
      'Hub-Spoke',
      'Trans-pacific routes via Japan/Taiwan are efficient and often price-matched by major carriers.',
      ['Long total travel time', 'Slightly more expensive than Chinese carriers'],
      'Low',
      'Baseline', origin, region, tripDate
    ));

    backup.push(createPattern(
      'The Middle East Pivot',
      [origin, 'IST/DOH/AUH', region],
      'Hub-Spoke',
      'Turkish, Qatar, and Etihad often run aggressive sales to capture traffic flow to Asia.',
      ['Long layovers common', 'Geographically longer route'],
      'Low',
      '15%', origin, region, tripDate
    ));

    if (chaos >= 3) {
      chaosList.push(createPattern(
        'Split Ticket via Europe',
        [origin, 'ATH/IST', 'SIN/BKK'],
        'Split-Ticket',
        'Fly cheap to Athens or Istanbul, then switch to Scoot or a budget Asian carrier.',
        ['Two separate long-haul tickets', 'Very high fatigue risk', 'Check Scoot/AirAsia directly for leg 2'],
        'High',
        '30-40%', origin, region, tripDate
      ));
    }
  }
  // GENERIC
  else {
    core.push(createPattern(
      'Direct Hub Target',
      [origin, 'Primary Hub', region],
      'Hub-Spoke',
      'Identify the largest airport in the region and fly there first.',
      ['May require train/bus to final city'],
      'Low',
      'Baseline', origin, region, tripDate
    ));

    if (chaos >= 3) {
      chaosList.push(createPattern(
        'Global Positioning',
        [origin, 'Cheapest Entry Point', region],
        'Split-Ticket',
        'Use "Everywhere" search to find cheapest continent entry, then LCC to destination.',
        ['Complex booking', 'Requires research'],
        'High',
        'Variable', origin, region, tripDate
      ));
    }
  }

  return { core, backup, chaos: chaosList };
};

// --- Helper: Search Links Generator ---
const generateSearchLinks = (origin: string, dest: string, date: string): SearchLink[] => {
  // 1. Google Flights
  const gBase = "https://www.google.com/travel/flights?q=";
  const gQuery = `Flights from ${origin} to ${dest} on ${date}`;
  const googleLink: SearchLink = {
    provider: 'Google Flights',
    label: 'Launch Precise Search',
    url: `${gBase}${encodeURIComponent(gQuery)}`,
    primary: true
  };

  // 2. Google Explore
  const exploreLink: SearchLink = {
    provider: 'Google Explore',
    label: 'Explore Map Radius',
    url: `https://www.google.com/travel/explore?q=Flights+from+${origin}`,
    primary: false
  };

  // 3. Skyscanner
  const safeOrigin = origin.substring(0,3);
  const safeDest = dest.length === 3 ? dest : 'anywhere'; 
  const skyscannerLink: SearchLink = {
    provider: 'Skyscanner',
    label: 'Compare on Skyscanner',
    url: `https://www.skyscanner.com/transport/flights/${safeOrigin}/${safeDest}/${date.slice(2).replace(/-/g,'')}`,
    primary: false
  };

  // 4. Kayak
  const kayakLink: SearchLink = {
    provider: 'Kayak',
    label: 'Compare on Kayak',
    url: `https://www.kayak.com/flights/${safeOrigin}-${safeDest.substring(0,3)}/${date}`,
    primary: false
  };

  return [googleLink, exploreLink, skyscannerLink, kayakLink];
};


export const generateStrategy = (profile: FlightProfile, trip: TripPlan): Strategy => {
  const origin = profile.homeAirports[0] || 'NYC';
  const targetRegion = trip.destinationRegions[0] || 'Everywhere';
  
  // 1. Get Patterns with Trip Date for Deep Links
  const { core, backup, chaos: chaosPlans } = getRegionPatterns(origin, targetRegion, profile.chaosLevel, trip.startDate);
  
  // 2. Get Solutions
  const solutions = generateSolutions(profile, trip);

  // 3. Generate Search Links
  const searchLinks = generateSearchLinks(origin, targetRegion, trip.startDate);

  // 4. Generate Summary
  const summary = `The recommended approach is the ${core[0]?.name || 'Standard'} route. ` +
    `Alternatives are available via ${backup[0]?.name || 'Alternative'} routing. ` +
    `${chaosPlans.length > 0 ? 'Advanced savings options detected.' : 'Advanced options suppressed based on your preferences.'}`;

  // 5. Generate Legacy Steps (Simple high level flow)
  const steps: StrategyStep[] = [
    {
      title: 'Analyze Base Fares',
      description: `Check the Core Plan: ${core[0]?.nodes.join(' -> ')}. Note the price.`,
      difficulty: 'Easy'
    },
    {
      title: 'Check Contingencies',
      description: `Compare against Backup Plan: ${backup[0]?.nodes.join(' -> ')}. Is the saving >$150?`,
      difficulty: 'Medium'
    }
  ];

  if (chaosPlans.length > 0) {
    steps.push({
      title: 'Try Advanced Option',
      description: `If budget is critical, attempt ${chaosPlans[0].name}. Ensure 4h+ buffer between tickets.`,
      difficulty: 'Hard'
    });
  }

  // 6. Generate Prompts
  const prompts: StrategyPrompt[] = [];
  
  // Google Flights Prompt
  prompts.push({
    tool: 'Google Flights',
    description: 'Precise multi-city construction',
    promptText: `Search Type: Multi-city / Round Trip
1. Origin: ${origin}
2. Connection: ${core[0]?.nodes[1]} (or ${backup[0]?.nodes[1]})
3. Destination: ${targetRegion}
Dates: ${trip.startDate} (+/- ${trip.flexibleDays} days)
Filters: 
- Mode: Flights only
- Price Graph: ON`
  });

  // ITA Matrix Prompt
  const routingCodes = [core, backup].flat().map(p => p.nodes[1].split('/')[0]).join(' ');
  prompts.push({
    tool: 'ITA Matrix',
    description: 'Advanced routing language',
    promptText: `Origin: ${origin} :: ${routingCodes}
Destination: ${targetRegion.substring(0,3).toUpperCase()}
Date: ${trip.startDate}
Cabins: Cheapest Available
Stops: Up to 2`
  });

  // AI Prompt
  prompts.push({
    tool: 'Google Gemini / ChatGPT',
    description: 'Deal hunting query',
    promptText: `I need to get from ${origin} to ${targetRegion} around ${trip.startDate}.
Budget: $${profile.budgetMax}.
Check for:
1. Error fares on ${core[0]?.nodes[1]} routes.
2. Positioning flights via ${backup[0]?.nodes[1]}.
3. Open-jaw tickets returning from a nearby city.`
  });

  return {
    id: generateUUID(),
    summary,
    corePlan: core,
    backupPlans: backup,
    chaosPlans: chaosPlans,
    solutions,
    searchLinks,
    prompts,
    steps,
  };
};
