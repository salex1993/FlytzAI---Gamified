
import { GoogleGenAI, Type } from "@google/genai";
import { FlightDeal, Strategy, FlightProfile, AIAnalysis, TripPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedQuery {
    destination: string | null;
    budget: number | null;
    origin: string | null;
    startDate: string | null;
    durationDays: number;
    keywords: string[];
    confidence: 'high' | 'medium' | 'low';
}

export async function parseNaturalLanguageQuery(query: string): Promise<ParsedQuery> {
    try {
        const today = new Date().toISOString().split('T')[0];
        const prompt = `System: Expert travel data parser. Today is ${today}. Task: Extract structured data from: "${query}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        origin: { type: Type.STRING },
                        destination: { type: Type.STRING },
                        budget: { type: Type.NUMBER },
                        startDate: { type: Type.STRING },
                        durationDays: { type: Type.NUMBER },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
                    },
                    required: ["origin", "destination", "budget", "startDate", "durationDays", "keywords", "confidence"]
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        return { destination: null, budget: null, origin: null, startDate: null, durationDays: 7, keywords: [], confidence: 'low' };
    }
}

export async function refineStrategyWithAI(
  strategy: Strategy,
  deals: FlightDeal[],
  profile: FlightProfile,
  trip?: TripPlan
): Promise<AIAnalysis> {
  try {
    const dealsContext = deals.slice(0, 5).map(d => `- $${d.price.total}: ${d.segments[0].departure.iataCode} -> ${d.segments[d.segments.length-1].arrival.iataCode} (${d.airlines.join(',')}, ${d.stops} stops, ${d.source})`).join('\n');
    const prompt = `You are Flytz AI Strategist. Generate a markdown report for this mission: User Budget $${profile.budgetMax}, Strategy: ${strategy.summary}. Data: ${dealsContext}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return { recommendation: response.text || "Failed.", hacksDetected: [], riskAssessment: "" };
  } catch (error) { return { recommendation: "Intelligence offline.", hacksDetected: [], riskAssessment: "" }; }
}

export interface ChatMessage { role: 'user' | 'model'; text: string; }

export async function sendTacticalChatMessage(
  history: ChatMessage[],
  newMessage: string,
  context: { strategy: Strategy, deals: FlightDeal[], profile: FlightProfile, trip: TripPlan | null }
): Promise<string> {
  try {
    const sys = `Professional travel assistant for mission ${context.trip?.destinationRegions[0]}. Strategy: ${context.strategy.summary}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: newMessage,
      config: { systemInstruction: sys }
    });
    return response.text || "Uplink lost.";
  } catch (e) { return "Connection error."; }
}

export async function analyzeSeatConfiguration(deal: FlightDeal): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze aircraft ${deal.segments[0].aircraftCode || 'Standard Jet'} configuration.`,
    });
    return response.text || "Unavailable.";
}

export async function analyzeVisaRequirements(deal: FlightDeal, profile: FlightProfile): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Check visa risks for ${deal.segments[0].departure.iataCode} to ${deal.segments[deal.segments.length-1].arrival.iataCode} via ${deal.segments.slice(0, -1).map(s => s.arrival.iataCode).join(',')}.`,
    });
    return response.text || "Consult official sources.";
}

export async function generateSmartPackingList(deal: FlightDeal, destination: string, startDate: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Packing list for ${destination} starting ${startDate}.`,
  });
  return response.text || "Failed.";
}
