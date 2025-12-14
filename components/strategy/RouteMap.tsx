
import React, { useMemo, useState } from 'react';
import { FlightDeal } from '../../types';
import { AIRPORT_DB } from '../../data/airports';
import { WORLD_PATH_D } from '../../data/worldGeo';
import { Filter, CheckCircle2, Globe, Crosshair } from 'lucide-react';

interface RouteMapProps {
  deals: FlightDeal[];
  selectedDealId: string | null;
  onSelectDeal: (id: string) => void;
  budgetMax: number;
}

interface NodeData {
  x: number;
  y: number;
  code: string;
  city: string;
  country: string;
}

const project = (lat: number, lon: number) => {
  // Mercator-like projection fitting the SVG viewbox (1000x500)
  const x = (lon + 180) * (1000 / 360);
  const clampedLat = Math.max(Math.min(lat, 85), -85);
  const mercN = Math.log(Math.tan((Math.PI / 4) + (clampedLat * Math.PI / 180) / 2));
  const y = (500 / 2) - (500 * mercN / (2 * Math.PI)); // Align equator to middle
  return { x, y };
};

export default function RouteMap({ deals, selectedDealId, onSelectDeal, budgetMax }: RouteMapProps) {
  
  const [filters, setFilters] = useState({
    core: true,
    complex: true,
    underBudget: true,
    overBudget: true
  });

  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const routePaths = useMemo(() => {
    if (!deals) return [];
    
    return deals.filter(deal => {
        const price = parseFloat(deal.price.total);
        const isOver = price > budgetMax;
        if (isOver && !filters.overBudget) return false;
        if (!isOver && !filters.underBudget) return false;
        const isCore = deal.stops === 0;
        if (isCore && !filters.core) return false;
        if (!isCore && !filters.complex) return false;
        return true;
    }).map(deal => {
      // Safely map airports to coordinates
      const coords = deal.segments.reduce((acc, seg, idx) => {
        if (idx === 0) {
          const depCode = seg.departure.iataCode;
          const depGeo = AIRPORT_DB[depCode];
          if (depGeo) acc.push({ ...project(depGeo.lat, depGeo.lon), code: depCode, city: depGeo.city, country: depGeo.country });
        }
        const arrCode = seg.arrival.iataCode;
        const arrGeo = AIRPORT_DB[arrCode];
        if (arrGeo) acc.push({ ...project(arrGeo.lat, arrGeo.lon), code: arrCode, city: arrGeo.city, country: arrGeo.country });
        return acc;
      }, [] as NodeData[]);

      if (coords.length < 2) return null;

      // Create Curved Path
      let d = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2 - 40; // Curve factor
        d += ` Q ${cx} ${cy}, ${p2.x} ${p2.y}`;
      }

      const price = parseFloat(deal.price.total);
      const isOverBudget = price > budgetMax;
      const isSelected = deal.id === selectedDealId;

      return {
        id: deal.id,
        d,
        color: isOverBudget ? '#f97316' : '#22d3ee', // Orange vs Cyan
        opacity: isSelected ? 1 : (selectedDealId ? 0.1 : 0.6),
        strokeWidth: isSelected ? 3 : 1.5,
        zIndex: isSelected ? 10 : 1,
        nodes: coords
      };
    }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [deals, selectedDealId, budgetMax, filters]);

  return (
    <div className="relative w-full bg-slate-950/80 backdrop-blur-xl rounded-xl border border-brand-500/30 overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.3)]">
      
      <style>{`
        @keyframes dashFlow { to { stroke-dashoffset: -20; } }
        .animate-flow { stroke-dasharray: 4 4; animation: dashFlow 1s linear infinite; }
        @keyframes pulse-node { 0% { r: 2; opacity: 1; } 100% { r: 8; opacity: 0; } }
        .node-ping { animation: pulse-node 2s infinite; }
        @keyframes scan-line { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }
        .scan-beam { animation: scan-line 4s linear infinite; }
        @keyframes landPulse { 0%, 100% { fill-opacity: 0.8; } 50% { fill-opacity: 1; } }
        .land-anim { animation: landPulse 6s ease-in-out infinite; }
      `}</style>

      {/* Filter Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
         <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 shadow-xl ring-1 ring-white/5">
            <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> MAP FILTERS
            </div>
            <div className="space-y-1">
                <button onClick={() => toggleFilter('core')} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded w-full text-left transition-all ${filters.core ? 'bg-brand-900/40 text-brand-200 border border-brand-500/20' : 'text-slate-500 hover:bg-slate-900'}`}>{filters.core ? <CheckCircle2 className="w-3 h-3 text-brand-400" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}DIRECT</button>
                <button onClick={() => toggleFilter('complex')} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded w-full text-left transition-all ${filters.complex ? 'bg-purple-900/40 text-purple-200 border border-purple-500/20' : 'text-slate-500 hover:bg-slate-900'}`}>{filters.complex ? <CheckCircle2 className="w-3 h-3 text-purple-400" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}MULTI-STOP</button>
                <div className="h-px bg-slate-800 my-1" />
                <button onClick={() => toggleFilter('underBudget')} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded w-full text-left transition-all ${filters.underBudget ? 'bg-cyan-900/40 text-cyan-200 border border-cyan-500/20' : 'text-slate-500 hover:bg-slate-900'}`}>{filters.underBudget ? <CheckCircle2 className="w-3 h-3 text-cyan-400" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}UNDER BUDGET</button>
                <button onClick={() => toggleFilter('overBudget')} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded w-full text-left transition-all ${filters.overBudget ? 'bg-orange-900/40 text-orange-200 border border-orange-500/20' : 'text-slate-500 hover:bg-slate-900'}`}>{filters.overBudget ? <CheckCircle2 className="w-3 h-3 text-orange-400" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}OVER BUDGET</button>
            </div>
         </div>
      </div>

      <div className="aspect-[2/1] w-full bg-[#020617] relative">
        <svg viewBox="0 0 1000 500" className="w-full h-full pointer-events-auto">
          <defs>
            {/* Holographic Land Gradient */}
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            
            {/* Tech Grid Pattern */}
            <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.03)" strokeWidth="1"/>
                <rect x="0" y="0" width="1" height="1" fill="rgba(56, 189, 248, 0.2)" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#techGrid)" />

          {/* World Map - Glow Layer */}
          <path 
            d={WORLD_PATH_D} 
            fill="none"
            stroke="#38bdf8" 
            strokeWidth="2" 
            opacity="0.1"
            style={{ filter: 'blur(3px)' }}
          />

          {/* World Map - Main Layer */}
          <path 
            d={WORLD_PATH_D} 
            fill="url(#landGradient)" 
            stroke="#334155" 
            strokeWidth="0.5" 
            className="land-anim"
          />

          {/* Radar Circles */}
          <circle cx="500" cy="250" r="150" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.2" />
          <circle cx="500" cy="250" r="300" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="10 10" opacity="0.1" />

          {/* Flight Routes */}
          {routePaths.map((route) => (
            <g key={route.id} style={{ opacity: route.opacity, cursor: 'pointer' }} onClick={() => onSelectDeal(route.id)}>
              {/* Hit Area */}
              <path d={route.d} fill="none" stroke="transparent" strokeWidth="20" />
              
              {/* Main Line */}
              <path 
                d={route.d} 
                fill="none" 
                stroke={route.color} 
                strokeWidth={route.strokeWidth} 
                strokeLinecap="round"
                className={route.zIndex === 10 ? "animate-flow" : ""}
              />
              
              {/* Nodes */}
              {route.nodes.map((node, i) => (
                <g 
                    key={i} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                >
                    {route.zIndex === 10 && (
                        <circle r="6" fill={route.color} className="node-ping" opacity="0.5" />
                    )}
                    <circle r="2" fill="#fff" stroke={route.color} strokeWidth="1" />
                </g>
              ))}
            </g>
          ))}

          {/* Tooltip */}
          {hoveredNode && (
            <g transform={`translate(${hoveredNode.x}, ${hoveredNode.y - 25})`} style={{ pointerEvents: 'none' }}>
               <defs>
                 <filter id="tooltip-glow" x="-20%" y="-20%" width="140%" height="140%">
                   <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5"/>
                 </filter>
               </defs>
               <path d="M -60 -30 L 60 -30 L 60 0 L 5 0 L 0 5 L -5 0 L -60 0 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" filter="url(#tooltip-glow)" opacity="0.95" />
               <text x="0" y="-18" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900" style={{ textShadow: '0 0 10px rgba(56,189,248,0.5)' }}>{hoveredNode.code}</text>
               <text x="0" y="-8" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="500">{hoveredNode.city}, {hoveredNode.country}</text>
            </g>
          )}
        </svg>
        
        {/* Scanner Beam Overlay (HTML for robustness) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="w-full h-[20%] bg-gradient-to-b from-transparent via-brand-400/30 to-transparent scan-beam" />
        </div>
      </div>

      {selectedDealId && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-brand-500/50 p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 ring-1 ring-brand-500/20">
           {(() => {
             const deal = deals.find(d => d.id === selectedDealId);
             if (!deal) return null;
             const price = parseFloat(deal.price.total);
             const diff = budgetMax - price;
             return (
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="bg-brand-900/50 p-2.5 rounded-lg border border-brand-500/30">
                        <Crosshair className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-white font-black text-lg tracking-tight">
                            {deal.segments[0].departure.iataCode} <span className="text-brand-500">→</span> {deal.segments[deal.segments.length-1].arrival.iataCode}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 font-bold flex gap-2">
                            <span className="text-brand-200">{deal.airlines.join('/')}</span><span>•</span><span>{deal.duration}</span>
                        </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-3xl font-black text-white tracking-tighter">${deal.price.total}</div>
                    <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded mt-1 inline-block ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                        {diff >= 0 ? `-$${diff} UNDER BUDGET` : `+$${Math.abs(diff)} OVER BUDGET`}
                    </div>
                 </div>
               </div>
             );
           })()}
        </div>
      )}
      {(!deals || deals.length === 0) && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 flex items-center gap-3 backdrop-blur-sm">
                <Globe className="w-5 h-5 text-slate-500" />
                <span className="text-slate-400 text-sm font-medium font-mono">MAP UNAVAILABLE / NO ROUTES</span>
            </div>
         </div>
      )}
    </div>
  );
}
