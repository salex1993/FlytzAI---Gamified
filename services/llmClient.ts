
import { GoogleGenAI } from "@google/genai";
import { FlightDeal, Strategy, FlightProfile, AIAnalysis, TripPlan } from '../types';

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

// Initialize Gemini safely with localStorage fallback
const getApiKey = () => {
  const envKey = safeGetEnv('API_KEY');
  if (envKey) return envKey;
  
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('API_KEY') || undefined;
  }
  return undefined;
};

const apiKey = getApiKey() || 'mock-key';
const ai = new GoogleGenAI({ apiKey });

export async function refineStrategyWithAI(
  strategy: Strategy,
  deals: FlightDeal[],
  profile: FlightProfile
): Promise<AIAnalysis> {
  // If no API key, return stub
  if (!apiKey || apiKey === 'mock-key') {
      return {
          recommendation: "AI Refinement Skipped: No API Key found in settings. (Simulated Analysis): based on current pricing, the 'Core Plan' appears most viable. Consider shifting dates by +/- 1 day.",
          hacksDetected: [],
          riskAssessment: "Low"
      };
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Prepare context for the LLM
    const dealsContext = deals.slice(0, 5).map(d => 
      `- $${d.price.total}: ${d.segments[0].departure.iataCode} -> ${d.segments[d.segments.length-1].arrival.iataCode} (${d.airlines.join(',')}, ${d.stops} stops)`
    ).join('\n');

    const corePattern = strategy.corePlan[0];
    const backupPattern = strategy.backupPlans[0];

    const prompt = `
      You are Flytz AI, an elite flight hacking strategist.
      
      User Profile:
      - Adventure Level: ${profile.chaosLevel}/5 (1=Direct only, 5=Hidden city/Skiplagging/Long layovers)
      - Budget: $${profile.budgetMax}
      
      Current Strategy Generated:
      - Core Plan: ${corePattern ? corePattern.name : 'Standard'} (${corePattern?.nodes.join('->')})
      - Backup Plan: ${backupPattern ? backupPattern.name : 'None'}
      - Summary: ${strategy.summary}

      Live Market Data (Real-time prices found):
      ${dealsContext || "No direct matches found. Assume standard seasonal pricing."}

      Task: Generate a detailed "Strategic Analysis Report" in Markdown format.
      
      Include these sections:
      1. **Market Reality Check**: Are the live prices good compared to historical averages for this route? Are they under/over the user's budget?
      2. **Destination Intel**:
         - **Currency**: [Name] (Exchange Rate approx 1 USD = X).
         - **Transit**: Walkability score and public transport reliability.
         - **Safety**: Specific safety concerns for tourists.
      3. **Risk Assessment**: Analyze the specific risks of the cheapest options found (e.g., "50min layover in LHR is risky", "Self-transfer requires Visa check").
      4. **Optimization Tactics**: Give 2 specific actionable tips to lower the price further (e.g., "Shift to Tuesday departure", "Check separate tickets via [Specific Hub]").
      5. **Insider Tips**: Provide 2-3 unique insights or "hacks" for this specific route (e.g., "Lounge access at [Airport]", "Best seat on [Airline]", "Hidden transfer path").
      6. **Final Verdict**: Explicitly state "BUY NOW", "WAIT", or "CHANGE ROUTE".

      Keep the tone professional, insightful, and direct. Do not be generic.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text;

    return {
      recommendation: text || "AI Analysis unavailable.",
      hacksDetected: [],
      riskAssessment: ""
    };

  } catch (error) {
    console.error("AI Refinement Error:", error);
    return {
      recommendation: "System offline. AI Refinement temporarily unavailable. Proceed with manual strategy.",
      hacksDetected: [],
      riskAssessment: "Unknown"
    };
  }
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function sendTacticalChatMessage(
  history: ChatMessage[],
  newMessage: string,
  context: { strategy: Strategy, deals: FlightDeal[], profile: FlightProfile, trip: TripPlan | null }
): Promise<string> {
  if (!apiKey || apiKey === 'mock-key') {
    return "Assistant Offline. Please configure API Keys in settings.";
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Condensed Context
    const dealsSnapshot = context.deals.slice(0,3).map(d => `${d.airlines[0]} $${d.price.total}`).join(', ');
    const systemPrompt = `
      SYSTEM: You are the Flytz Travel Assistant.
      CONTEXT: User is planning ${context.profile.homeAirports[0]} -> ${context.trip?.destinationRegions[0]}.
      STRATEGY: ${context.strategy.summary}.
      LIVE DEALS: ${dealsSnapshot}.
      
      INSTRUCTIONS: Answer specific logistical questions about airports, visas, transfer times, and risks. Be concise, helpful, and professional.
    `;

    const fullPrompt = `${systemPrompt}\n\nUSER: ${newMessage}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });

    return response.text || "No data received.";

  } catch (e) {
    console.error("Chat Error", e);
    return "Connection Error. Retrying...";
  }
}

export async function analyzeSeatConfiguration(
    deal: FlightDeal, 
    userHeight: string = "average"
): Promise<string> {
    if (!apiKey || apiKey === 'mock-key') return "AI Seat analysis unavailable without API Key.";

    try {
        const airline = deal.airlines[0];
        const flightNum = deal.segments[0].number;
        const aircraft = deal.segments[0].aircraftCode || 'Unknown Aircraft';
        const route = `${deal.segments[0].departure.iataCode} to ${deal.segments[0].arrival.iataCode}`;
        const duration = deal.duration;

        const prompt = `
            Analyze the likely seat configuration for ${airline} flight ${flightNum} (${aircraft}) flying ${route} (${duration}).
            
            Provide a brief "Seat Map Recon" including:
            1. **Cabin Layout**: (e.g., 3-3-3 or 3-4-3).
            2. **Best Economy Seats**: Specific rows or seats with extra legroom (e.g., Exit rows, Bulkhead) that might be free.
            3. **Seats to Avoid**: Rows with no recline or near lavatories.
            4. **"Poor Man's Business Class"**: Likelihood of empty rows based on route/airline typical load factors.
            
            Keep it concise and tactical. 
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "No seat data found.";

    } catch (e) {
        return "Unable to retrieve seat map data.";
    }
}

export async function analyzeVisaRequirements(
    deal: FlightDeal,
    profile: FlightProfile
): Promise<string> {
    if (!apiKey || apiKey === 'mock-key') return "Visa analysis unavailable without API Key.";

    try {
        const origin = deal.segments[0].departure.iataCode;
        const dest = deal.segments[deal.segments.length - 1].arrival.iataCode;
        // Collect all layover points (arrival of segment n where n is not the last segment)
        const layovers = deal.segments.slice(0, -1).map(s => s.arrival.iataCode).join(', ');
        const airlines = deal.airlines.join(', ');
        
        if (!layovers) return "Direct flight. Standard entry requirements for destination apply.";

        const prompt = `
            Act as a travel immigration expert.
            Analyze this itinerary:
            Origin: ${origin} (Assume traveler has passport from this region/country).
            Destination: ${dest}.
            Layovers: ${layovers}.
            Airlines involved: ${airlines}.
            
            Task:
            1. Identify if this looks like a "Self-Transfer" (changing airlines that likely don't interline bags).
            2. **Visa Warning**: Determine if the traveler likely needs a Transit Visa or full entry visa to re-check bags at the layover airports (${layovers}).
            3. Provide a clear "Risk Level" (High/Medium/Low) for immigration issues on this specific route.
            
            Keep it short and warning-focused. Use normal, professional language.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Unable to analyze visa requirements.";

    } catch (e) {
        return "Visa check service offline.";
    }
}
