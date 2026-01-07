
import React, { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useFlightStrategy } from '../context/FlightStrategyContext';
import { RotateCw, Network, Plane, Sparkles, Loader2, ShieldAlert, ArrowRightCircle, Download, Ticket, ExternalLink, MapPin, CheckCircle2, ZapIcon, Briefcase, Crown, BarChart3, Lock, Zap, Globe, ShieldCheck, Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { BUTTON_PRIMARY_CLASSES } from '../constants';
import { searchDeals, confirmFlightPrice } from '../services/flightsApi';
import { refineStrategyWithAI, analyzeSeatConfiguration, analyzeVisaRequirements, generateSmartPackingList } from '../services/llmClient';
import { FlightDeal, AIAnalysis, RoutePattern, FlightSegment, Aircraft } from '../types';
import RouteMap from '../components/strategy/RouteMap';
import TacticalChat from '../components/strategy/TacticalChat';
import HackerTerminal from '../components/ui/HackerTerminal';
import { AIRPORT_DB } from '../data/airports';
import { audioEffects } from '../services/audioEffects';

const formatTime = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const AirportTooltip = ({ code }: { code: string }) => {
    const info = AIRPORT_DB[code];
    return (
        <div className="group relative inline-block">
            <span className="cursor-help border-b border-dotted border-slate-600 hover:border-brand-400 transition-colors font-black">{code}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[200px] bg-slate-950/95 backdrop-blur border border-slate-700 text-slate-200 text-[10px] p-2 rounded shadow-xl z-50 pointer-events-none">
                {info ? <><div className="font-bold text-white mb-0.5">{info.city}, {info.country}</div><div className="text-slate-400 font-mono">Lat: {info.lat.toFixed(2)}, Lon: {info.lon.toFixed(2)}</div></> : <span className="italic text-slate-500">Unknown Airport</span>}
            </div>
        </div>
    );
};

const AircraftSpecs = ({ aircraft }: { aircraft: Aircraft }) => (
    <div className="bg-slate-950/50 border border-amber-500/20 rounded-lg p-3 mt-4 animate-in zoom-in-95">
        <div className="flex items-center gap-2 mb-2 border-b border-amber-500/10 pb-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">{aircraft.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[9px] font-mono">
            <div className="flex flex-col"><span className="text-slate-500 uppercase">Class</span><span className="text-slate-200">{aircraft.category}</span></div>
            <div className="flex flex-col"><span className="text-slate-500 uppercase">Seats</span><span className="text-slate-200">{aircraft.paxMax} Max</span></div>
            <div className="flex flex-col"><span className="text-slate-500 uppercase">Range</span><span className="text-slate-200">{aircraft.rangeNm} NM</span></div>
            <div className="flex flex-col"><span className="text-slate-500 uppercase">Speed</span><span className="text-slate-200">{aircraft.speedKts} KTS</span></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
            {aircraft.amenities.map((a, i) => <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/10 text-[8px]">{a}</span>)}
        </div>
    </div>
);

const AIReportRenderer = ({ text }: { text: string }) => {
  const cleanMarkdown = (content: string) => content.replace(/\*\*/g, '').replace(/#{1,6}\s?/g, '').replace(/`/g, '').trim();
  return <div className="space-y-4 text-sm text-slate-300 leading-relaxed">{text.split('\n\n').map((p, i) => <p key={i}>{cleanMarkdown(p)}</p>)}</div>;
};

export default function StrategyPage() {
  const { strategy, profile, trip, deals: contextDeals, aiAnalysis: contextAnalysis, updateDeals, updateAiAnalysis, saveStrategy } = useFlightStrategy();
  const [activeTab, setActiveTab] = useState<'strategy' | 'details' | 'seats' | 'packing'>('strategy');
  const [filterMode, setFilterMode] = useState<'All' | 'Commercial' | 'Charter' | 'Empty Leg'>('All');
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  if (!strategy || !profile) return <Navigate to="/wizard" replace />;

  const filteredDeals = useMemo(() => {
    if (filterMode === 'All') return contextDeals;
    if (filterMode === 'Commercial') return contextDeals.filter(d => d.source !== 'Charter');
    if (filterMode === 'Charter') return contextDeals.filter(d => d.source === 'Charter' && !d.emptyLeg);
    if (filterMode === 'Empty Leg') return contextDeals.filter(d => d.source === 'Charter' && d.emptyLeg);
    return contextDeals;
  }, [contextDeals, filterMode]);

  const handleFetchDeals = async () => {
    if (!profile || !trip) return;
    setLoadingDeals(true);
    setSelectedDealId(null);
    audioEffects.playClick();
    try {
      const liveDeals = await searchDeals(profile, trip);
      updateDeals(liveDeals);
      audioEffects.playSuccess();
    } catch (e) {} finally { setLoadingDeals(false); }
  };

  const handleRefineStrategy = async () => {
    if (!strategy || !profile) return;
    setLoadingAI(true);
    setActiveTab('details');
    audioEffects.playPowerUp();
    try {
      const analysis = await refineStrategyWithAI(strategy, contextDeals, profile, trip || undefined);
      updateAiAnalysis(analysis);
    } catch (e) {} finally { setLoadingAI(false); }
  };

  const renderDealCard = (deal: FlightDeal) => {
      const isSelected = selectedDealId === deal.id;
      const isPrivate = deal.source === 'Charter';
      return (
          <div 
            key={deal.id} 
            onClick={() => { setSelectedDealId(deal.id); audioEffects.playClick(); }}
            className={`group glass-panel border rounded-xl p-4 transition-all cursor-pointer relative overflow-hidden ${isSelected ? (isPrivate ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-slate-900/90' : 'border-brand-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-slate-900/90 scale-[1.02]') : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'}`}
          >
              {deal.emptyLeg && <div className="absolute top-0 right-0 bg-amber-500 text-black px-3 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-lg z-10">Empty Leg Intel</div>}
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg border ${isPrivate ? 'bg-amber-900/30 border-amber-500/30' : 'bg-slate-800 border-slate-700'}`}>
                          {isPrivate ? <Crown className="w-4 h-4 text-amber-400" /> : <Plane className="w-4 h-4 text-brand-400" />}
                      </div>
                      <div className="font-mono text-[10px] font-bold text-slate-400 flex flex-col">
                          <span className={isPrivate ? "text-amber-400" : "text-brand-200"}>{deal.airlines.join('/')}</span>
                          <span className="uppercase text-[7px] tracking-[0.2em]">{deal.source} NETWORK</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className={`text-xl font-black ${isPrivate ? 'text-amber-400' : 'text-white'} tracking-tighter`}>${deal.price.total}</div>
                      <div className="text-[8px] font-mono font-bold text-slate-500 uppercase">{deal.duration} TRIP</div>
                  </div>
              </div>
              <div className="space-y-3 relative z-10">
                  {deal.segments.map((seg, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                              <div className="flex flex-col"><AirportTooltip code={seg.departure.iataCode} /><span className="text-[9px] text-slate-500 font-bold">{formatTime(seg.departure.at)}</span></div>
                              <div className="flex flex-col items-center gap-0.5 opacity-30"><div className="w-6 h-px bg-slate-700"></div><span className="text-[7px] font-bold">{seg.carrierCode}{seg.number}</span></div>
                              <div className="flex flex-col"><AirportTooltip code={seg.arrival.iataCode} /><span className="text-[9px] text-slate-500 font-bold">{formatTime(seg.arrival.at)}</span></div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${seg.cabin === 'PRIVATE' ? 'bg-amber-900/40 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>{seg.cabin || 'ECONOMY'}</span>
                      </div>
                  ))}
              </div>
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-slate-800/50 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-3">
                        {deal.aircraft && <AircraftSpecs aircraft={deal.aircraft} />}
                        <div className="flex items-center gap-2">
                            <a href={deal.deepLink} target="_blank" rel="noopener noreferrer" className={`flex-1 py-2 rounded-lg text-center text-xs font-black transition-all flex items-center justify-center gap-2 ${isPrivate ? 'bg-amber-500 text-black hover:bg-white' : 'bg-brand-600 text-white hover:bg-brand-500'}`} onClick={(e) => e.stopPropagation()}><ExternalLink className="w-3 h-3" /> {isPrivate ? 'INQUIRE SECTOR' : 'LOCK IN RATE'}</a>
                            <button onClick={(e) => { e.stopPropagation(); saveStrategy(deal.id); audioEffects.playSuccess(); }} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors" title="Export Plan"><Download className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
              )}
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <TacticalChat />
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
             <div className="bg-brand-500/20 p-2 rounded-lg"><RotateCw className="w-5 h-5 text-brand-400" /></div>
             <div><h2 className="text-white font-bold text-sm uppercase tracking-wide">Mission Control</h2><p className="text-xs text-slate-400 font-mono">Ref: {strategy.id.substring(0,8)}</p></div>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50 overflow-x-auto">
            {['strategy', 'details', 'seats', 'packing'].map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab as any); audioEffects.playClick(); }} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{tab === 'strategy' ? 'Mission' : tab}</button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {activeTab === 'strategy' && (
              <>
                <div className="glass-panel border-l-4 border-l-brand-500 rounded-r-xl p-8 relative overflow-hidden">
                    <h2 className="text-3xl font-black text-white mb-4 text-glow text-balance">Strategic Routing Summary</h2>
                    <p className="text-brand-100/90 font-medium leading-relaxed text-lg mb-6">{strategy.summary}</p>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={handleFetchDeals} disabled={loadingDeals} className={BUTTON_PRIMARY_CLASSES + " flex items-center gap-2"}>{loadingDeals ? <Loader2 className="w-5 h-5 animate-spin" /> : <Network className="w-5 h-5" />} {loadingDeals ? 'SCANNING SECTORS...' : 'LIVE MARKET SCAN'}</button>
                        <button onClick={handleRefineStrategy} disabled={loadingAI || contextDeals.length === 0} className="px-6 py-3 rounded-lg border border-brand-500/30 bg-brand-900/20 text-brand-300 font-black tracking-wide flex items-center gap-2 hover:bg-brand-900/40 transition-all disabled:opacity-50">{loadingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} AI REPORT</button>
                    </div>
                </div>
                {loadingDeals && <HackerTerminal />}
                {contextDeals.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/50 pb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tighter"><MapIcon className="w-5 h-5 text-brand-500" /> Sector Intel</h3>
                            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                                {(['All', 'Commercial', 'Charter', 'Empty Leg'] as const).map(m => (
                                    <button key={m} onClick={() => setFilterMode(m)} className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${filterMode === m ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>{m}</button>
                                ))}
                            </div>
                        </div>
                        <RouteMap deals={filteredDeals} selectedDealId={selectedDealId} onSelectDeal={setSelectedDealId} budgetMax={profile.budgetMax} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filteredDeals.map(renderDealCard)}</div>
                    </div>
                )}
              </>
          )}
          {activeTab === 'details' && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                  <div className="glass-panel border-brand-500/30 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                       <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-400" /> Operational Insights</h3>
                       {loadingAI ? (<div className="flex flex-col items-center justify-center py-12 gap-3"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>) : contextAnalysis ? (<AIReportRenderer text={contextAnalysis.recommendation} />) : (<p className="text-slate-500 text-sm font-mono">Waiting for data verification...</p>)}
                  </div>
              </div>
          )}
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4"><h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tighter"><ShieldAlert className="w-5 h-5 text-slate-400" /> Standard Protocols</h3>{strategy.solutions.map((sol, idx) => (<div key={idx} className="glass-panel border border-slate-700/50 p-5 rounded-xl"><h4 className="font-black text-white text-xs mb-2 uppercase tracking-widest">{sol.title}</h4><p className="text-slate-400 text-xs mb-3 leading-relaxed font-medium">{sol.description}</p><ul className="space-y-2">{sol.suggestedActions.map((action, i) => (<li key={i} className="flex items-start gap-2 text-xs text-brand-100 font-bold"><ArrowRightCircle className="w-3 h-3 text-brand-500 mt-0.5 flex-shrink-0" />{action}</li>))}</ul></div>))}</div>
        </div>
      </div>
    </div>
  );
}
