
import React, { useEffect, useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useFlightStrategy } from '../context/FlightStrategyContext';
import { Copy, AlertTriangle, CheckCircle2, RotateCw, Network, Plane, Sparkles, Loader2, DollarSign, ShieldAlert, ArrowRightCircle, Lightbulb, Save, Upload, Download, Ticket, ExternalLink, BedDouble, Camera, MapPin, Check, X, ChevronDown, ChevronUp, Split, Clock, Calendar, Hourglass, Info, BarChart3, Lock, Zap, LayoutList, Briefcase, Tag, Armchair, Coins, Bus, ShieldCheck, Globe, ArrowLeft, Trophy, Crown, Medal, Bell, BellRing, Armchair as SeatIcon, FileWarning, Map as MapIcon, Luggage, ArrowUp } from 'lucide-react';
import { BUTTON_PRIMARY_CLASSES } from '../constants';
import { searchDeals, confirmFlightPrice, searchHotels, searchActivities } from '../services/flightsApi';
import { refineStrategyWithAI, analyzeSeatConfiguration, analyzeVisaRequirements, generateSmartPackingList } from '../services/llmClient';
import { FlightDeal, AIAnalysis, RoutePattern, SavedStrategy, HotelOffer, ActivityOffer, FlightSegment } from '../types';
import RouteMap from '../components/strategy/RouteMap';
import GlobeRouteMap from '../components/strategy/GlobeRouteMap';
import TacticalChat from '../components/strategy/TacticalChat';
import HackerTerminal from '../components/ui/HackerTerminal';
import { AIRPORT_DB } from '../data/airports';
import { storageService } from '../services/storage';
import { audioEffects } from '../services/audioEffects';

// --- HELPER FUNCTIONS ---

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getLayoverDuration = (arrivalAt: string, departureAt: string) => {
    const start = new Date(arrivalAt).getTime();
    const end = new Date(departureAt).getTime();
    const diff = end - start;
    if (isNaN(diff)) return '';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};

// --- HELPER COMPONENTS ---

const AirportTooltip = ({ code }: { code: string }) => {
    const info = AIRPORT_DB[code];
    return (
        <div className="group relative inline-block">
            <span className="cursor-help border-b border-dotted border-slate-600 hover:border-brand-400 transition-colors">
                {code}
            </span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[200px] bg-slate-900/95 backdrop-blur border border-slate-700 text-slate-200 text-[10px] p-2 rounded shadow-xl z-50 pointer-events-none">
                {info ? (
                    <>
                        <div className="font-bold text-white mb-0.5">{info.city}, {info.country}</div>
                        <div className="text-slate-400 font-mono">Lat: {info.lat.toFixed(2)}, Lon: {info.lon.toFixed(2)}</div>
                    </>
                ) : (
                    <span className="italic text-slate-500">Unknown Airport</span>
                )}
            </div>
        </div>
    );
};

const renderLegBookingOptions = (seg: FlightSegment) => {
    const origin = seg.departure.iataCode;
    const dest = seg.arrival.iataCode;
    const date = seg.departure.at.split('T')[0]; // YYYY-MM-DD
    
    // Google Flights
    const googleUrl = `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${date}`;
    
    // Skyscanner (YYMMDD)
    const skyDate = date.slice(2).replace(/-/g, '');
    const skyUrl = `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${skyDate}`;

    return (
        <div className="flex gap-2 mt-1.5 sm:mt-0 sm:ml-auto">
            <a 
                href={googleUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                Google
            </a>
            <a 
                href={skyUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
            >
                Skyscanner
            </a>
        </div>
    );
};

const AIReportRenderer = ({ text }: { text: string }) => {
  // Helper to strip markdown formatting for cleaner display
  const cleanMarkdown = (content: string) => {
    return content
      .replace(/\*\*/g, '') // Remove bold
      .replace(/#{1,6}\s?/g, '') // Remove headers
      .replace(/`/g, '') // Remove code ticks
      .trim();
  };

  const extractSection = (keywords: string[]) => {
      const keywordPattern = keywords.join('|');
      const regex = new RegExp(
          `(?:^|\\n)(?:[#*\\d.\\s]*)(?:${keywordPattern})[:*]*\\s*([\\s\\S]*?)(?=(?:\\n(?:[#*\\d.\\s]*)(?:Market|Risk|Optimization|Insider|Tips|Destination|Intel|Final|Verdict|Power|Cultural|Health|Airline|Loadout)|$))`, 
          'i'
      );
      const match = text.match(regex);
      return match ? cleanMarkdown(match[1]) : null;
  };

  const marketReality = extractSection(['Market Reality Check', 'Market Reality']);
  const riskAssessment = extractSection(['Risk Assessment', 'Risks']);
  const optimizationTactics = extractSection(['Optimization Tactics', 'Optimization', 'Tactics']);
  const insiderTips = extractSection(['Insider Tips', 'Insider', 'Tips']);
  const destinationIntel = extractSection(['Destination Intel', 'Destination Intelligence', 'Logistics']);
  const finalVerdict = extractSection(['Final Verdict', 'Verdict']);
  
  const powerConnect = extractSection(['Power', 'Connectivity']);
  const culturalApparel = extractSection(['Cultural', 'Apparel']);
  const healthSurvival = extractSection(['Health', 'Survival']);
  const airlineLoadout = extractSection(['Airline', 'Loadout']);

  const renderBulletPoints = (content: string) => {
      return content.split('\n').filter(line => line.trim()).map((line, i) => (
          <li key={i} className="flex items-start gap-2 mb-1.5">
             <span className="text-brand-500 mt-1.5 text-[6px]">•</span>
             <span className="flex-1">{line.replace(/^[*-]\s*/, '').replace(/^\d+\.\s*/, '').trim()}</span>
          </li>
      ));
  };

  const renderSegmentedText = (content: string) => {
      let parts = content.split('\n').filter(p => p.trim().length > 0);
      if (parts.length === 1 && parts[0].length > 150) {
          const sentences = content.match(/[^.!?]+[.!?]+(\s|$)/g);
          if (sentences && sentences.length > 1) {
             parts = [];
             let chunk = "";
             sentences.forEach((s, idx) => {
                 chunk += s;
                 if ((idx + 1) % 2 === 0 || idx === sentences.length - 1) {
                     parts.push(chunk);
                     chunk = "";
                 }
             });
          }
      }
      return (
          <div className="space-y-4">
              {parts.map((part, i) => (
                 <p key={i} className="text-slate-300 text-sm leading-relaxed font-medium opacity-90">{part.trim()}</p>
              ))}
          </div>
      );
  };

  if (powerConnect || culturalApparel || healthSurvival || airlineLoadout) {
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
              {powerConnect && (
                  <div className="glass-panel p-5 rounded-xl border-l-4 border-l-yellow-500 bg-slate-900/40">
                      <h4 className="font-bold text-yellow-400 text-xs uppercase tracking-wide mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> Power & Connectivity</h4>
                      <ul className="text-slate-300 text-sm leading-relaxed">{renderBulletPoints(powerConnect)}</ul>
                  </div>
              )}
              {culturalApparel && (
                  <div className="glass-panel p-5 rounded-xl border-l-4 border-l-purple-500 bg-slate-900/40">
                      <h4 className="font-bold text-purple-400 text-xs uppercase tracking-wide mb-3 flex items-center gap-2"><Globe className="w-4 h-4"/> Cultural & Apparel</h4>
                      <ul className="text-slate-300 text-sm leading-relaxed">{renderBulletPoints(culturalApparel)}</ul>
                  </div>
              )}
              {healthSurvival && (
                  <div className="glass-panel p-5 rounded-xl border-l-4 border-l-red-500 bg-slate-900/40">
                      <h4 className="font-bold text-red-400 text-xs uppercase tracking-wide mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Health & Survival</h4>
                      <ul className="text-slate-300 text-sm leading-relaxed">{renderBulletPoints(healthSurvival)}</ul>
                  </div>
              )}
              {airlineLoadout && (
                  <div className="glass-panel p-5 rounded-xl border-l-4 border-l-brand-500 bg-slate-900/40">
                      <h4 className="font-bold text-brand-400 text-xs uppercase tracking-wide mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Airline Tactics</h4>
                      <ul className="text-slate-300 text-sm leading-relaxed">{renderBulletPoints(airlineLoadout)}</ul>
                  </div>
              )}
          </div>
      )
  }

  if (!marketReality && !riskAssessment && !optimizationTactics && !finalVerdict) {
      return <div className="p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{cleanMarkdown(text)}</div>;
  }

  return (
    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {marketReality && (
            <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-6 shadow-sm">
                <h4 className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider mb-4"><BarChart3 className="w-4 h-4" /> Market Reality</h4>
                {renderSegmentedText(marketReality)}
            </div>
        )}
        {destinationIntel && (
            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-5 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <h4 className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-4"><MapPin className="w-4 h-4" /> Destination Intel</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {destinationIntel.toLowerCase().includes('currency') ? (
                         destinationIntel.split('\n').filter(l => l.trim()).map((line, i) => {
                             let Icon = Info;
                             let colorClass = "text-slate-300";
                             if (line.toLowerCase().includes('currency') || line.includes('$')) { Icon = Coins; colorClass = "text-amber-200"; }
                             else if (line.toLowerCase().includes('transit') || line.toLowerCase().includes('walk')) { Icon = Bus; colorClass = "text-blue-200"; }
                             else if (line.toLowerCase().includes('safety')) { Icon = ShieldCheck; colorClass = "text-red-200"; }
                             return (
                                 <div key={i} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 flex flex-col gap-2">
                                     <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-emerald-500" /><span className="text-[10px] uppercase font-bold text-slate-500">{line.split(':')[0].replace(/[*]/g,'')}</span></div>
                                     <p className={`text-xs font-medium leading-relaxed ${colorClass}`}>{line.split(':').slice(1).join(':').trim() || line.replace(/^[*-]\s*/, '')}</p>
                                 </div>
                             )
                         })
                     ) : <ul className="col-span-3 text-slate-300 text-sm leading-relaxed">{renderBulletPoints(destinationIntel)}</ul>}
                </div>
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskAssessment && (
                <div className="bg-orange-900/10 border border-orange-500/20 rounded-xl p-5">
                    <h4 className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-3"><Lock className="w-4 h-4" /> Risk Assessment</h4>
                    <ul className="text-slate-300 text-sm leading-relaxed">{renderBulletPoints(riskAssessment)}</ul>
                </div>
            )}
            {optimizationTactics && (
                <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-5">
                    <h4 className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-3"><Zap className="w-4 h-4" /> Optimization Tactics</h4>
                    <ul className="text-slate-300 text-sm leading-relaxed">{renderBulletPoints(optimizationTactics)}</ul>
                </div>
            )}
        </div>
        {insiderTips && (
            <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-5 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                <h4 className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-3"><Lightbulb className="w-4 h-4" /> Insider Tips</h4>
                <ul className="text-slate-300 text-sm leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">{renderBulletPoints(insiderTips)}</ul>
            </div>
        )}
        {finalVerdict && (
            <div className="mt-2 pt-4 border-t border-slate-800/50">
                 <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-3">Recommendation</span>
                 <div className="flex items-start gap-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${finalVerdict.toLowerCase().includes('buy') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : finalVerdict.toLowerCase().includes('wait') ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-slate-500'}`} />
                    <p className="text-lg text-slate-200 font-medium leading-relaxed">{finalVerdict}</p>
                 </div>
            </div>
        )}
    </div>
  );
};

const SeatAnalysisRenderer = ({ text }: { text: string }) => {
    const extract = (key: string) => {
        const regex = new RegExp(`(?:\\*\\*|##|\\d\\.\\s)*${key}[:*]*\\s*([\\s\\S]*?)(?=(?:\\n(?:\\*\\*|##|\\d\\.\\s)*(?:Cabin|Best|Seats|Poor|Likelihood)|$))`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    };

    const layout = extract('Cabin Layout');
    const bestSeats = extract('Best Economy Seats');
    const avoidSeats = extract('Seats to Avoid');
    const hacks = extract("Poor Man's Business Class") || extract('Likelihood');

    return (
        <div className="space-y-4">
            {layout && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Configuration</span>
                    <span className="text-white font-mono text-lg font-bold bg-slate-800 px-3 py-1 rounded border border-slate-600">{layout}</span>
                </div>
            )}
            <div className="grid grid-cols-1 gap-4">
                {bestSeats && (
                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4">
                        <h4 className="text-emerald-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Best Seats</h4>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">{bestSeats}</p>
                    </div>
                )}
                {avoidSeats && (
                    <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
                        <h4 className="text-red-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Avoid</h4>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">{avoidSeats}</p>
                    </div>
                )}
            </div>
            {hacks && (
                <div className="bg-brand-900/10 border border-brand-500/20 rounded-lg p-4 shadow-[0_0_15px_rgba(56,189,248,0.05)]">
                    <h4 className="text-brand-400 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Crown className="w-4 h-4" /> Insider Hack: "Poor Man's Business"</h4>
                    <p className="text-slate-300 text-sm leading-relaxed font-medium">{hacks}</p>
                </div>
            )}
            {!layout && !bestSeats && !avoidSeats && <div className="text-slate-300 text-sm whitespace-pre-wrap">{text}</div>}
        </div>
    );
};

export default function StrategyPage() {
  const { strategy, profile, trip, deals: contextDeals, aiAnalysis: contextAnalysis, updateDeals, updateAiAnalysis, saveStrategy, loadStrategy } = useFlightStrategy();
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'strategy' | 'details' | 'seats' | 'hotels' | 'activities' | 'packing'>('strategy');
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [verifyingPrice, setVerifyingPrice] = useState<string | null>(null); 
  const [verifiedPrices, setVerifiedPrices] = useState<Record<string, { confirmed: boolean; price?: string; error?: string }>>({});
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState<string>('');
  const [expandedDealIds, setExpandedDealIds] = useState<Set<string>>(new Set());
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [activities, setActivities] = useState<ActivityOffer[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState<number>(0);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [seatAnalysis, setSeatAnalysis] = useState<string | null>(null);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [visaAnalysis, setVisaAnalysis] = useState<string | null>(null);
  const [loadingVisa, setLoadingVisa] = useState(false);
  const [packingList, setPackingList] = useState<string | null>(null);
  const [loadingPacking, setLoadingPacking] = useState(false);
  const [selectedDetailCountry, setSelectedDetailCountry] = useState<string | null>(null);
  const [countryAiCache, setCountryAiCache] = useState<Record<string, AIAnalysis>>({});
  const [loadingSpecificAI, setLoadingSpecificAI] = useState(false);

  const destinationCountries = useMemo(() => {
    if (!contextDeals.length) return [];
    const countrySet = new Set<string>();
    contextDeals.forEach(deal => {
        const lastSegment = deal.segments[deal.segments.length - 1];
        const airport = AIRPORT_DB[lastSegment.arrival.iataCode];
        if (airport?.country) countrySet.add(airport.country);
    });
    return Array.from(countrySet).sort();
  }, [contextDeals]);

  const hackerScore = useMemo(() => {
    if (!contextDeals.length || !profile) return null;
    const cheapest = parseFloat(contextDeals[0].price.total);
    const budget = profile.budgetMax;
    const savings = budget - cheapest;
    const savingsPercent = (savings / budget) * 100;
    
    let rank = 'C';
    let title = 'Novice';
    let color = 'text-slate-400';
    let bg = 'bg-slate-800';
    let icon = Info;

    if (savingsPercent > 40) {
        rank = 'S'; title = 'Elite Phantom'; color = 'text-emerald-400'; bg = 'bg-emerald-900/50'; icon = Crown;
    } else if (savingsPercent > 20) {
        rank = 'A'; title = 'Grey Hat'; color = 'text-brand-400'; bg = 'bg-brand-900/50'; icon = Trophy;
    } else if (savingsPercent > 0) {
        rank = 'B'; title = 'Operator'; color = 'text-blue-300'; bg = 'bg-blue-900/50'; icon = Medal;
    } else {
        rank = 'D'; title = 'Over Budget'; color = 'text-orange-400'; bg = 'bg-orange-900/50'; icon = AlertTriangle;
    }

    return { rank, title, color, bg, savings, savingsPercent, Icon: icon };
  }, [contextDeals, profile]);

  const handleCountrySelect = async (country: string) => {
      audioEffects.playClick();
      setSelectedDetailCountry(country);
      if (countryAiCache[country]) return;

      setLoadingSpecificAI(true);
      const relevantDeals = contextDeals.filter(d => {
           const lastSegment = d.segments[d.segments.length - 1];
           return AIRPORT_DB[lastSegment.arrival.iataCode]?.country === country;
      });
      const specificStrategy = {
          ...strategy,
          summary: `FOCUS: Provide specific travel intelligence, currency, safety, and flight hacking tips exclusively for ${country.toUpperCase()}. Ignore other regions. ${strategy.summary}`
      };
      try {
          const analysis = await refineStrategyWithAI(specificStrategy, relevantDeals, profile as any, trip!);
          setCountryAiCache(prev => ({ ...prev, [country]: analysis }));
      } catch (error) {
          console.error("Specific AI failed", error);
      } finally {
          setLoadingSpecificAI(false);
      }
  };

  const handleBackToCountries = () => {
      audioEffects.playClick();
      setSelectedDetailCountry(null);
  };

  const isMultiCountry = destinationCountries.length > 1;
  const showCountryGrid = isMultiCountry && !selectedDetailCountry;
  const activeAnalysis = selectedDetailCountry ? countryAiCache[selectedDetailCountry] : contextAnalysis;
  const isLoadingAI = loadingAI || loadingSpecificAI;

  useEffect(() => {
    if (strategy?.id) {
        const storedAlerts = JSON.parse(localStorage.getItem('flytz_price_alerts') || '{}');
        const alertVal = storedAlerts[strategy.id];
        if (alertVal) {
            setIsAlertActive(true);
            setAlertTargetPrice(Number(alertVal));
        } else {
            setIsAlertActive(false);
            setAlertTargetPrice(0);
        }
    }
  }, [strategy?.id]);

  useEffect(() => {
    if (!profile || !trip || !strategy) return;
    if (contextDeals.length > 0 || loadingDeals || hasAttemptedFetch === strategy.id) return;
    const fetchDeals = async () => {
        setLoadingDeals(true);
        try {
            const currentDeals = await searchDeals(profile, trip);
            updateDeals(currentDeals);
        } catch (error) {
            console.error("Failed to fetch deals", error);
        } finally {
            setLoadingDeals(false);
            setHasAttemptedFetch(strategy.id);
        }
    };
    fetchDeals();
  }, [strategy?.id, contextDeals.length, loadingDeals, profile, trip, updateDeals, hasAttemptedFetch]);

  useEffect(() => {
    if (!profile || !strategy) return;
    if (contextDeals.length === 0) return;
    if (contextAnalysis || loadingAI) return;
    const runAnalysis = async () => {
         setLoadingAI(true);
         try {
             const analysis = await refineStrategyWithAI(strategy, contextDeals, profile, trip!);
             updateAiAnalysis(analysis);
         } catch (error) {
             console.error("AI Analysis failed", error);
         } finally {
             setLoadingAI(false);
         }
    };
    runAnalysis();
  }, [strategy, contextDeals, profile, contextAnalysis, loadingAI, updateAiAnalysis, trip]);

  useEffect(() => {
      if (activeTab === 'hotels' && hotels.length === 0 && !loadingExtras) fetchHotelsOnly();
  }, [activeTab]);
  useEffect(() => {
      if (activeTab === 'activities' && activities.length === 0 && !loadingExtras) fetchActivitiesOnly();
  }, [activeTab]);
  useEffect(() => {
      if (activeTab === 'seats' && selectedDealId && !seatAnalysis && !loadingSeats) {
          const deal = contextDeals.find(d => d.id === selectedDealId);
          if (deal) {
              setLoadingSeats(true);
              analyzeSeatConfiguration(deal).then(res => { setSeatAnalysis(res); setLoadingSeats(false); });
          }
      }
      if (selectedDealId) {
          const deal = contextDeals.find(d => d.id === selectedDealId);
          if (deal && deal.stops > 0) {
              setVisaAnalysis(null); setLoadingVisa(true);
              analyzeVisaRequirements(deal, profile!).then(res => { setVisaAnalysis(res); setLoadingVisa(false); });
          } else { setVisaAnalysis(null); }
      }
  }, [activeTab, selectedDealId]);
  useEffect(() => {
      if (activeTab === 'packing' && selectedDealId && !packingList && !loadingPacking && trip) {
          const deal = contextDeals.find(d => d.id === selectedDealId);
          if (deal) {
             setLoadingPacking(true);
             const lastSeg = deal.segments[deal.segments.length - 1];
             const arrivalCode = lastSeg.arrival.iataCode;
             const airportInfo = AIRPORT_DB[arrivalCode];
             const specificDest = airportInfo ? `${airportInfo.city}, ${airportInfo.country}` : (trip.destinationRegions[0] || "Destination");
             generateSmartPackingList(deal, specificDest, trip.startDate).then(res => { setPackingList(res); setLoadingPacking(false); });
          }
      }
  }, [activeTab, selectedDealId, packingList, loadingPacking, trip]);

  const fetchHotelsOnly = async () => { if (!contextDeals[0]) return; setLoadingExtras(true); const lastSegment = contextDeals[0].segments[contextDeals[0].segments.length - 1]; const destCode = lastSegment.arrival.iataCode; const foundHotels = await searchHotels(destCode); setHotels(foundHotels); setLoadingExtras(false); }
  const fetchActivitiesOnly = async () => { if (!contextDeals[0]) return; setLoadingExtras(true); const lastSegment = contextDeals[0].segments[contextDeals[0].segments.length - 1]; const destCode = lastSegment.arrival.iataCode; const airportGeo = AIRPORT_DB[destCode]; if (airportGeo) { const foundActivities = await searchActivities(airportGeo.lat, airportGeo.lon); setActivities(foundActivities); } setLoadingExtras(false); }
  const handleVerifyPrice = async (deal: FlightDeal, e: React.MouseEvent) => { e.stopPropagation(); audioEffects.playClick(); if (!deal.rawOffer) { alert("This deal is a simulation/mock and cannot be live verified."); return; } setVerifyingPrice(deal.id); const result = await confirmFlightPrice(deal.rawOffer); setVerifiedPrices(prev => ({ ...prev, [deal.id]: result })); setVerifyingPrice(null); };
  const handleAddToCalendar = (deal: FlightDeal, e: React.MouseEvent) => { e.stopPropagation(); audioEffects.playSuccess(); alert("Trip added to calendar (simulation)."); };
  const toggleDealExpanded = (id: string, e: React.MouseEvent) => { e.stopPropagation(); audioEffects.playClick(); const newSet = new Set(expandedDealIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setExpandedDealIds(newSet); };
  const handleSave = () => { if (!saveName) return; saveStrategy(saveName); setShowSaveModal(false); setSaveName(''); audioEffects.playSuccess(); alert('Trip Saved Successfully.'); };
  const handleLoad = (s: SavedStrategy) => { loadStrategy(s); setShowLoadModal(false); audioEffects.playClick(); };
  const handleDelete = (e: React.MouseEvent, id: string) => { e.stopPropagation(); audioEffects.playClick(); if (confirm("Delete this saved trip?")) { storageService.delete(id); setSavedStrategies(storageService.getAll()); } };
  const handleSetAlert = async () => { if (!strategy || !alertTargetPrice) return; if ("Notification" in window && Notification.permission !== "granted") { await Notification.requestPermission(); } const storedAlerts = JSON.parse(localStorage.getItem('flytz_price_alerts') || '{}'); storedAlerts[strategy.id] = alertTargetPrice; localStorage.setItem('flytz_price_alerts', JSON.stringify(storedAlerts)); setIsAlertActive(true); setShowAlertModal(false); audioEffects.playSuccess(); alert(`Alert Set! We'll notify you if we find a price below $${alertTargetPrice} on your next search.`); };
  const checkAlertTrigger = (newDeals: FlightDeal[]) => { 
      // Simplified alert check logic
      if (newDeals.length > 0 && newDeals[0].price && parseFloat(newDeals[0].price.total) <= alertTargetPrice) {
          new Notification("Flytz Alert", { body: `Deal found below $${alertTargetPrice}!` });
      }
  };
  const handleRefresh = async () => { audioEffects.playClick(); if (!profile || !trip || !strategy) return; setLoadingDeals(true); setLoadingAI(true); const foundDeals = await searchDeals(profile, trip); updateDeals(foundDeals); checkAlertTrigger(foundDeals); setLoadingDeals(false); setHasAttemptedFetch(strategy.id); const analysis = await refineStrategyWithAI(strategy, foundDeals, profile, trip!); updateAiAnalysis(analysis); setLoadingAI(false); };
  const handleExportToMonday = () => { audioEffects.playClick(); const token = localStorage.getItem('MONDAY_API_TOKEN'); if (!token) { alert("Please connect your Monday.com API Token in the Settings menu (Gear Icon) first."); return; } alert("Monday.com integration connected! Export feature coming soon to your board."); };

  if (!strategy || !profile) return <Navigate to="/wizard" replace />;

  const renderPatternCard = (pattern: RoutePattern, type: 'Core' | 'Backup' | 'Chaos') => (
    <div key={pattern.id} className={`glass-panel border rounded-xl p-6 relative overflow-hidden transition-all hover:scale-[1.01] ${type === 'Core' ? 'border-brand-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : type === 'Chaos' ? 'border-orange-500/30' : 'border-slate-700/50'}`} onMouseEnter={() => audioEffects.playHover()}>
        {/* ... Card Content ... */}
        <div className="flex justify-between items-start mb-4">
            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded tracking-wider ${type === 'Core' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : type === 'Chaos' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600'}`}>{type === 'Core' ? 'Primary Plan' : type === 'Chaos' ? 'Advanced' : 'Backup'}</span>
            <span className="text-brand-400 text-xs font-mono font-bold">{pattern.estimatedSavings} SAVINGS</span>
        </div>
        <div className="mb-4">
            <h4 className="text-xl font-black text-white mb-2 tracking-tight">{pattern.name}</h4>
            <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-brand-100">{pattern.nodes.map((node, i) => (<React.Fragment key={i}><span className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">{node}</span>{i < pattern.nodes.length - 1 && <span className="text-slate-600">→</span>}</React.Fragment>))}</div>
        </div>
        <div className="space-y-4 text-sm">
            <div><span className="text-slate-500 font-bold text-xs uppercase block mb-1 tracking-wide">Rationale</span><p className="text-slate-300 leading-relaxed font-medium">{pattern.rationale}</p></div>
            {pattern.stepLinks && pattern.stepLinks.length > 0 && (<div><span className="text-orange-400 font-bold text-xs uppercase block mb-2 tracking-wide flex items-center gap-1"><Ticket className="w-3 h-3" /> Booking Links</span><div className="space-y-2">{pattern.stepLinks.map((link, idx) => (<a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-brand-500/30 p-2 rounded-lg transition-colors group" onClick={() => audioEffects.playClick()}><span className="text-xs font-mono text-slate-300 group-hover:text-white font-bold">{link.label}</span><span className="text-brand-400 bg-brand-900/20 px-1.5 py-0.5 rounded border border-brand-500/10 flex items-center gap-1">{link.provider} <ExternalLink className="w-2.5 h-2.5" /></span></a>))}</div></div>)}
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <TacticalChat />
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-3">
             <div className="bg-brand-500/20 p-2 rounded-lg"><RotateCw className="w-5 h-5 text-brand-400" /></div>
             <div><h2 className="text-white font-bold text-sm uppercase tracking-wide">Mission Control</h2><p className="text-xs text-slate-400 font-mono">Ref: {strategy.id.substring(0,8)}</p></div>
        </div>
        {hackerScore && !loadingDeals && (
            <div className={`hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg border border-white/5 animate-in fade-in slide-in-from-right-2 ${hackerScore.bg}`}>
                <hackerScore.Icon className={`w-6 h-6 ${hackerScore.color}`} />
                <div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hacker Rank</div><div className={`font-black text-sm ${hackerScore.color} flex items-center gap-2`}>{hackerScore.title}<span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded border border-white/10">{hackerScore.rank}</span></div></div>
                <div className="ml-2 pl-3 border-l border-white/10 text-right"><div className="text-[10px] font-bold text-slate-400 uppercase">Savings</div><div className="font-mono text-white text-sm font-bold">{hackerScore.savings > 0 ? `+$${Math.round(hackerScore.savings)}` : `-$${Math.abs(Math.round(hackerScore.savings))}`}</div></div>
            </div>
        )}
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50 overflow-x-auto">
            {['strategy', 'details', 'seats', 'hotels', 'activities', 'packing'].map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab as any); audioEffects.playClick(); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{tab === 'strategy' ? 'Flights' : tab === 'hotels' ? 'Stays' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
            ))}
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleRefresh} title="Refresh Live Data" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><RotateCw className="w-4 h-4" /></button>
            <button onClick={() => { setShowAlertModal(true); audioEffects.playClick(); }} title="Set Price Alert" className={`p-2 rounded-lg transition-colors ${isAlertActive ? 'bg-brand-900/50 text-brand-400 hover:bg-brand-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>{isAlertActive ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}</button>
            <button onClick={() => { setShowSaveModal(true); audioEffects.playClick(); }} title="Save Trip" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><Save className="w-4 h-4" /></button>
            <button onClick={() => { setShowLoadModal(true); audioEffects.playClick(); }} title="Load Saved Trip" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
            <button onClick={handleExportToMonday} title="Export to Monday.com" className="p-2 hover:bg-brand-900/50 rounded-lg text-brand-400 hover:text-white transition-colors"><LayoutList className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'strategy' && (/* ... core flight content ... */ 
              <>
                <div className="glass-panel border-l-4 border-l-brand-500 rounded-r-xl p-8 relative overflow-hidden">
                    <h2 className="text-3xl font-black text-white mb-4 text-glow">Strategic Brief</h2>
                    <p className="text-brand-100/90 font-medium leading-relaxed text-lg mb-6">{strategy.summary}</p>
                    <button onClick={() => { setActiveTab('details'); audioEffects.playClick(); }} className="bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"><Sparkles className="w-4 h-4" /> View AI Details</button>
                </div>
                <div><h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-brand-500" /> Primary Plan</h3><div className="grid grid-cols-1 gap-4">{strategy.corePlan.map(p => renderPatternCard(p, 'Core'))}</div></div>
                {strategy.backupPlans.length > 0 && (<div className="pt-4"><h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 opacity-80"><Network className="w-5 h-5 text-slate-400" /> Backup Options</h3><div className="grid grid-cols-1 gap-4">{strategy.backupPlans.map(p => renderPatternCard(p, 'Backup'))}</div></div>)}
                <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black text-white flex items-center gap-2"><DollarSign className="w-6 h-6 text-brand-400" /> Live Market Data</h3>
                        <div className="flex items-center gap-2">
                           <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700"><button onClick={() => { setMapMode('2d'); audioEffects.playClick(); }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${mapMode === '2d' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>Map</button><button onClick={() => { setMapMode('3d'); audioEffects.playClick(); }} className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${mapMode === '3d' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-white'}`}>Globe</button></div>
                           <span className="text-xs font-mono text-brand-300 font-bold bg-brand-900/40 px-3 py-1 rounded-full border border-brand-500/20">{loadingDeals ? 'SCANNING...' : `${contextDeals.length} ROUTES`}</span>
                        </div>
                    </div>
                    {loadingDeals ? <HackerTerminal /> : contextDeals.length > 0 ? (
                        <div className="space-y-6">
                            {mapMode === '3d' ? <GlobeRouteMap deals={contextDeals} selectedDealId={selectedDealId} onSelectDeal={setSelectedDealId} /> : <RouteMap deals={contextDeals} selectedDealId={selectedDealId} onSelectDeal={setSelectedDealId} budgetMax={profile.budgetMax} />}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {contextDeals.map((deal) => {
                                    // ... Deal Card Render (condensed for brevity, logic maintained)
                                    const verification = verifiedPrices[deal.id]; const isVerifying = verifyingPrice === deal.id; const isExpanded = expandedDealIds.has(deal.id);
                                    const firstSeg = deal.segments[0]; const lastSeg = deal.segments[deal.segments.length - 1];
                                    return (
                                        <div key={deal.id} onClick={() => { setSelectedDealId(deal.id); audioEffects.playClick(); }} onMouseEnter={() => audioEffects.playHover()} className={`glass-panel p-5 rounded-xl transition-all duration-300 cursor-pointer group flex flex-col h-full ${selectedDealId === deal.id ? 'border-brand-400 bg-brand-900/30 shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-brand-400 transform scale-[1.02]' : 'border-slate-700/50 hover:bg-slate-800/40 hover:border-brand-500/30'}`}>
                                            <div className="flex justify-between items-start mb-4"><div><span className="text-3xl font-black text-white tracking-tight">${Math.round(parseFloat(deal.price.total))}</span><div className="text-xs text-brand-300 font-bold mt-1 uppercase tracking-wide">{deal.airlines.join(' + ')}</div></div><button onClick={(e) => handleVerifyPrice(deal, e)} className={`text-[10px] font-bold uppercase px-2 py-1 rounded border transition-all flex items-center gap-1 ${verification?.confirmed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : verification?.error ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-brand-400'}`}>{isVerifying ? <Loader2 className="w-3 h-3 animate-spin"/> : verification?.confirmed ? <Check className="w-3 h-3"/> : <DollarSign className="w-3 h-3"/>}{isVerifying ? 'Checking...' : verification?.confirmed ? 'Verified' : 'Verify'}</button></div>
                                            <div className="flex justify-between items-center mb-5 px-1"><div className="text-center"><div className="text-xl font-black text-white">{formatTime(firstSeg.departure.at)}</div><div className="text-xs text-brand-400 font-black tracking-wider"><AirportTooltip code={firstSeg.departure.iataCode} /></div><div className="text-[10px] text-slate-500 font-medium mt-0.5">{formatDate(firstSeg.departure.at)}</div></div><div className="flex-1 px-3 flex flex-col items-center"><div className="text-[10px] text-slate-400 mb-1 font-mono">{deal.duration}</div><div className="w-full h-px bg-slate-700 relative">{deal.stops > 0 && (<><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-900 border border-orange-500"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-orange-500/50"></div></>)}<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-brand-500 rounded-full"></div><div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-brand-500 rounded-full"></div></div><div className={`text-[10px] mt-1 font-bold ${deal.stops === 0 ? 'text-emerald-400' : 'text-orange-400'}`}>{deal.stops === 0 ? 'Direct' : `${deal.stops} Stop${deal.stops > 1 ? 's' : ''}`}</div></div><div className="text-center"><div className="text-xl font-black text-white">{formatTime(lastSeg.arrival.at)}</div><div className="text-xs text-brand-400 font-black tracking-wider"><AirportTooltip code={lastSeg.arrival.iataCode} /></div><div className="text-[10px] text-slate-500 font-medium mt-0.5">{formatDate(lastSeg.arrival.at)}</div></div></div>
                                            {isExpanded && (<div className="mb-4 space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800 animate-in slide-in-from-top-2 fade-in duration-200"><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Network className="w-3 h-3" /> Itinerary Breakdown</div>{deal.segments.map((seg, i) => (<React.Fragment key={i}><div className="p-3 rounded bg-slate-900/50 border border-slate-800/50 sm:flex sm:justify-between sm:items-center"><div className="mb-2 sm:mb-0"><div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1"><span className="text-brand-500 bg-brand-900/20 px-1.5 rounded text-[10px]">LEG {i+1}</span> {seg.departure.iataCode} <ArrowRightCircle className="w-3 h-3 text-slate-600"/> {seg.arrival.iataCode}</div><div className="text-[10px] text-slate-400 font-medium space-y-0.5"><div className="flex gap-2"><span><span className="text-slate-600">Flt:</span> {seg.carrierCode}{seg.number}</span><span><span className="text-slate-600">Dur:</span> {seg.duration}</span></div>{seg.cabin && <div><span className="text-slate-600">Class:</span> {seg.cabin}</div>}{seg.aircraftCode && <div><span className="text-slate-600">Plane:</span> {seg.aircraftCode}</div>}</div></div>{renderLegBookingOptions(seg)}</div>{i < deal.segments.length - 1 && (<div className="flex items-center justify-center gap-2 py-1"><div className="h-px bg-slate-800 flex-1"></div><div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1"><Hourglass className="w-2.5 h-2.5" /> Layover: {getLayoverDuration(seg.arrival.at, deal.segments[i+1].departure.at)}</div><div className="h-px bg-slate-800 flex-1"></div></div>)}</React.Fragment>))}</div>)}
                                            <div className="flex gap-2 mt-auto pt-2 border-t border-white/5"><button onClick={(e) => toggleDealExpanded(deal.id, e)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" title="View Details">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button><button onClick={(e) => handleAddToCalendar(deal, e)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" title="Add to Calendar"><Calendar className="w-4 h-4" /></button><a href={deal.deepLink || '#'} target="_blank" rel="noopener noreferrer" className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 uppercase shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]"><Ticket className="w-3 h-3" /> Book Full Itinerary</a></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500 font-medium">No flights found.</div>}
                </div>
              </>
          )}
          {activeTab === 'details' && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                  {showCountryGrid ? (
                      <div className="space-y-6">
                          <h2 className="text-2xl font-black text-white flex items-center gap-2"><Globe className="w-6 h-6 text-brand-400" /> Select Destination Intel</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {destinationCountries.map(country => (
                                 <button key={country} onClick={() => handleCountrySelect(country)} className="glass-panel p-6 rounded-xl border border-slate-700 hover:border-brand-500/50 hover:bg-slate-800/50 transition-all group text-left relative overflow-hidden" onMouseEnter={() => audioEffects.playHover()}>
                                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><MapPin className="w-16 h-16 text-brand-400" /></div>
                                     <div className="relative z-10"><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Analyze</div><h3 className="text-2xl font-black text-white group-hover:text-brand-400 transition-colors">{country}</h3><div className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-500">VIEW INTEL <ArrowRightCircle className="w-4 h-4" /></div></div>
                                 </button>
                             ))}
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="glass-panel border-brand-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-400" /><h3 className="text-lg font-black text-white uppercase tracking-tight">{selectedDetailCountry ? `${selectedDetailCountry} Insights` : 'AI Strategic Analysis'}</h3></div>
                                {isMultiCountry && (<button onClick={handleBackToCountries} className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"><ArrowLeft className="w-3 h-3" /> Change Country</button>)}
                             </div>
                             {isLoadingAI ? (<div className="flex flex-col items-center justify-center py-12 gap-3"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /><p className="text-brand-200 text-sm font-mono animate-pulse">{loadingSpecificAI ? `Analyzing data for ${selectedDetailCountry}...` : 'Running strategic analysis...'}</p></div>) : activeAnalysis ? (<AIReportRenderer text={activeAnalysis.recommendation} />) : (<p className="text-slate-500 text-sm">Waiting for data...</p>)}
                        </div>
                        {loadingVisa ? <div className="glass-panel border border-brand-500/20 p-5 rounded-xl flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 text-brand-500 animate-spin" /><span className="text-sm font-bold text-slate-300">Checking entry requirements...</span></div> : visaAnalysis ? <div className="glass-panel border border-red-500/30 bg-red-900/10 p-5 rounded-xl relative overflow-hidden"><div className="flex items-center gap-2 mb-3"><FileWarning className="w-5 h-5 text-red-400" /><h4 className="text-red-300 font-bold uppercase tracking-wide text-sm">Visa & Entry Requirements</h4></div><p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">{visaAnalysis}</p></div> : null}
                        {!selectedDealId && (<div className="glass-panel p-12 flex flex-col items-center justify-center text-center border-dashed border-slate-700"><div className="bg-slate-900 p-4 rounded-full mb-4"><Ticket className="w-8 h-8 text-slate-500" /></div><h3 className="text-xl font-bold text-white mb-2">No Flight Selected</h3><p className="text-slate-400 max-w-sm mx-auto mb-6">Select a flight option from the <span className="text-brand-400 font-bold cursor-pointer" onClick={() => setActiveTab('strategy')}>Flights</span> tab to view its complete technical breakdown.</p><button onClick={() => setActiveTab('strategy')} className={BUTTON_PRIMARY_CLASSES}>View Flights</button></div>)}
                      </>
                  )}
              </div>
          )}
          {activeTab === 'seats' && (/* ... seats tab content ... */ 
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                   <h2 className="text-2xl font-black text-white flex items-center gap-2"><SeatIcon className="w-6 h-6 text-brand-400" /> Seat Map Analysis</h2>
                   {!selectedDealId ? (<div className="glass-panel p-12 text-center border-dashed border-slate-700"><p className="text-slate-400">Select a flight from the main tab to view seat insights.</p></div>) : loadingSeats ? (<div className="text-center py-12"><Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto"/></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-8"><SeatAnalysisRenderer text={seatAnalysis || "No analysis available."} /><div className="glass-panel p-8 rounded-xl border border-slate-700/50 flex flex-col items-center relative overflow-hidden"><div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-64 bg-slate-900/50 rounded-full border-x-2 border-slate-800 -z-10"></div><h3 className="text-sm font-bold text-white uppercase tracking-wide mb-8 z-10 bg-slate-950/80 px-4 py-1 rounded-full border border-slate-800 shadow-lg">Boeing 787-9 (3-3-3)</h3><div className="space-y-1.5 z-10"><div className="flex justify-between text-[10px] text-slate-500 font-mono px-2 mb-2 w-full max-w-[200px] mx-auto"><span>A B C</span><span>D E F</span><span>H J K</span></div>{Array.from({ length: 14 }).map((_, i) => { const rowNum = 30 + i; const isExit = rowNum === 40; return (<React.Fragment key={i}>{isExit && (<div className="flex justify-between items-center py-2 text-[9px] text-brand-400 font-bold uppercase tracking-widest px-4 opacity-70 w-full max-w-[240px]"><div className="flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> EXIT</div><div className="h-px bg-brand-500/30 flex-grow mx-2"></div><div className="flex items-center gap-1">EXIT <ArrowRightCircle className="w-3 h-3"/></div></div>)}<div className={`flex gap-3 justify-center ${isExit ? 'mb-4' : ''}`}><div className="flex gap-0.5">{[0,1,2].map(s => <div key={s} className={`w-3.5 h-3.5 rounded-sm ${isExit ? 'bg-emerald-500/80' : 'bg-slate-700/80'} border border-black/20`} />)}</div><div className="flex gap-0.5 relative">{[0,1,2].map(s => <div key={s} className={`w-3.5 h-3.5 rounded-sm ${isExit ? 'bg-emerald-500/80' : 'bg-slate-700/80'} border border-black/20`} />)}<div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-600 font-mono">{rowNum}</div></div><div className="flex gap-0.5">{[0,1,2].map(s => <div key={s} className={`w-3.5 h-3.5 rounded-sm ${isExit ? 'bg-emerald-500/80' : 'bg-slate-700/80'} border border-black/20`} />)}</div></div></React.Fragment>)})}</div><div className="mt-8 flex gap-4 text-[10px] font-bold uppercase tracking-wide bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800 shadow-lg z-10"><div className="flex items-center gap-1.5 text-slate-400"><div className="w-2 h-2 bg-slate-700 rounded-sm"></div> Standard</div><div className="flex items-center gap-1.5 text-emerald-400"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Good</div><div className="flex items-center gap-1.5 text-red-400"><div className="w-2 h-2 bg-red-500 rounded-sm"></div> Avoid</div></div></div></div>)}
              </div>
          )}
          {activeTab === 'hotels' && (/* ... hotels content ... */ <div className="animate-in fade-in slide-in-from-right-4"><h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><BedDouble className="w-6 h-6 text-brand-400" /> Recommended Stays</h2>{loadingExtras ? (<div className="text-center py-12"><Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto"/></div>) : hotels.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{hotels.map((h, i) => (<div key={i} className="glass-panel p-5 rounded-xl border-slate-700/50 hover:border-brand-500/30 transition-all"><div className="flex justify-between items-start mb-2"><h4 className="font-bold text-white text-lg">{h.name}</h4><span className="text-emerald-400 font-mono font-bold">${h.price.total}</span></div><div className="text-xs text-slate-400 flex items-center gap-1 mb-4"><MapPin className="w-3 h-3"/> {h.cityCode} • {h.rating} Stars</div><button className="w-full py-2 rounded-lg bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white text-xs font-bold transition-colors">Check Availability</button></div>))}</div>) : (<div className="text-slate-500 text-center py-8">No hotels found for this destination.</div>)}</div>)}
          {activeTab === 'activities' && (/* ... activities content ... */ <div className="animate-in fade-in slide-in-from-right-4"><h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><Camera className="w-6 h-6 text-brand-400" /> Local Activities</h2>{loadingExtras ? (<div className="text-center py-12"><Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto"/></div>) : activities.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{activities.map((a, i) => (<div key={i} className="glass-panel p-5 rounded-xl border-slate-700/50 hover:border-brand-500/30 transition-all flex flex-col"><h4 className="font-bold text-white text-lg mb-1">{a.name}</h4><p className="text-xs text-slate-400 mb-4 line-clamp-2 flex-grow">{a.shortDescription}</p><div className="flex justify-between items-center border-t border-white/5 pt-3 mt-auto"><span className="text-xs font-mono text-brand-300 font-bold">{a.price?.amount ? `${a.price.amount} ${a.price.currencyCode}` : 'See Price'}</span><a href={a.bookingLink || '#'} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-white hover:text-brand-400 flex items-center gap-1">View Details <ExternalLink className="w-3 h-3" /></a></div></div>))}</div>) : (<div className="text-slate-500 text-center py-8">No activities found nearby.</div>)}</div>)}
          {activeTab === 'packing' && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2"><Luggage className="w-6 h-6 text-brand-400" /> Smart Packing List</h2>
                  {!selectedDealId ? (<div className="glass-panel p-12 text-center border-dashed border-slate-700"><p className="text-slate-400">Select a flight deal to generate a tailored packing list.</p></div>) : loadingPacking ? (<div className="text-center py-12 flex flex-col items-center gap-4"><Loader2 className="w-8 h-8 text-brand-500 animate-spin"/><p className="text-slate-400 font-mono text-sm">Analyzing weather, power grids, and cultural norms...</p></div>) : (<div className="glass-panel p-6 rounded-xl border border-brand-500/30 bg-slate-900/40"><AIReportRenderer text={packingList || "No packing list available."} /></div>)}
              </div>
          )}
        </div>
        {/* Right Column / Sidebar - UNCHANGED */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4"><h3 className="text-lg font-bold text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-slate-400" /> Helpful Tips</h3>{strategy.solutions.map((sol, idx) => (<div key={idx} className="glass-panel border border-slate-700/50 p-5 rounded-xl"><div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black font-mono text-orange-300 border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 rounded uppercase tracking-wide">IF: {sol.condition}</span></div><h4 className="font-bold text-white text-sm mb-2">{sol.title}</h4><p className="text-slate-400 text-xs mb-3 leading-relaxed">{sol.description}</p><ul className="space-y-2">{sol.suggestedActions.map((action, i) => (<li key={i} className="flex items-start gap-2 text-xs text-brand-100 font-medium"><ArrowRightCircle className="w-3 h-3 text-brand-500 mt-0.5 flex-shrink-0" />{action}</li>))}</ul></div>))}</div>
        </div>
      </div>
      {/* Modals - UNCHANGED */}
      {showSaveModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"><div className="glass-panel border-brand-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl"><h3 className="text-xl font-black text-white mb-4">Save Trip</h3><input type="text" placeholder="E.g., Tokyo Spring Trip" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-brand-500 outline-none" value={saveName} onChange={(e) => setSaveName(e.target.value)} autoFocus /><div className="flex gap-3"><button onClick={() => setShowSaveModal(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 font-bold hover:bg-slate-800">Cancel</button><button onClick={handleSave} className="flex-1 py-3 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/20">Save</button></div></div></div>)}
      {showAlertModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"><div className="glass-panel border-brand-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl"><h3 className="text-xl font-black text-white mb-2 flex items-center gap-2"><BellRing className="w-5 h-5 text-brand-400" /> Set Price Alert</h3><p className="text-slate-400 text-sm mb-6">Enter a target price for this trip. We will notify you if a flight is found below this amount when you refresh the search.</p><label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Target Price (USD)</label><input type="number" placeholder="500" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white mb-6 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-lg" value={alertTargetPrice || ''} onChange={(e) => setAlertTargetPrice(Number(e.target.value))} autoFocus /><div className="flex gap-3"><button onClick={() => setShowAlertModal(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 font-bold hover:bg-slate-800">Cancel</button><button onClick={handleSetAlert} className="flex-1 py-3 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-500 shadow-lg shadow-brand-500/20">Set Alert</button></div></div></div>)}
      {showLoadModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"><div className="glass-panel border-slate-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto"><div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900/0 backdrop-blur-md pb-4 border-b border-white/10"><h3 className="text-xl font-black text-white">Select Saved Trip</h3><button onClick={() => setShowLoadModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button></div>{savedStrategies.length === 0 ? <div className="text-center text-slate-500 py-8">No saved trips found.</div> : <div className="grid gap-3">{savedStrategies.map(s => (<div key={s.id} className="flex justify-between items-center p-4 bg-slate-900/50 hover:bg-brand-900/20 border border-slate-800 hover:border-brand-500/50 rounded-xl transition-all group cursor-pointer" onClick={() => handleLoad(s)}><div><div className="font-bold text-white group-hover:text-brand-300">{s.name}</div><div className="text-xs text-slate-500 mt-1 font-mono">{new Date(s.createdAt).toLocaleDateString()} • {s.originSummary} → {s.targetSummary}</div></div><div className="flex items-center gap-3"><button onClick={(e) => handleDelete(e, s.id)} className="p-2 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded-lg transition-colors" title="Delete"><X className="w-4 h-4" /></button><ArrowRightCircle className="w-5 h-5 text-slate-600 group-hover:text-brand-500" /></div></div>))}</div>}</div></div>)}
    </div>
  );
}
