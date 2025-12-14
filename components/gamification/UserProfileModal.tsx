
import React from 'react';
import { X, Trophy, Map, DollarSign, Crosshair, Terminal, Crown, Shield, Globe, Moon, AlertTriangle } from 'lucide-react';
import { useFlightStrategy } from '../../context/FlightStrategyContext';
import { LEVEL_TITLES, ACHIEVEMENTS } from '../../data/achievements';

interface UserProfileModalProps {
  onClose: () => void;
}

const IconMap: Record<string, any> = {
    'Terminal': Terminal,
    'Crosshair': Crosshair,
    'Crown': Crown,
    'Shield': Shield,
    'Globe': Globe,
    'Moon': Moon,
    'AlertTriangle': AlertTriangle
};

export default function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { userStats } = useFlightStrategy();
  
  const progressPercent = Math.min(100, (userStats.currentXp / userStats.nextLevelXp) * 100);
  const title = LEVEL_TITLES[userStats.level] || "Unknown Agent";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
        <div className="relative w-full max-w-2xl bg-slate-950 border border-brand-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.2)]">
            
            {/* Header (Holographic Card Style) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 border-b border-brand-500/30 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"><X className="w-6 h-6" /></button>

                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                    {/* Avatar / Rank Icon */}
                    <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-brand-400 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                        <Trophy className="w-12 h-12 text-brand-400" />
                    </div>
                    
                    <div className="text-center sm:text-left flex-1">
                        <div className="text-brand-500 text-xs font-mono font-bold tracking-[0.2em] mb-1">OPERATIVE DOSSIER</div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">{title}</h2>
                        <div className="flex items-center gap-2 justify-center sm:justify-start mt-2">
                            <span className="bg-brand-900/50 border border-brand-500/30 text-brand-300 text-xs font-bold px-2 py-0.5 rounded">LVL {userStats.level}</span>
                            <span className="text-slate-500 text-xs font-mono">{userStats.currentXp} / {userStats.nextLevelXp} XP</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Stats Column */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Career Stats</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Total Saved</div>
                            <div className="text-emerald-400 font-mono text-xl font-bold">${userStats.totalSavings.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Crosshair className="w-3 h-3"/> Missions</div>
                            <div className="text-white font-mono text-xl font-bold">{userStats.totalSearches}</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 col-span-2">
                            <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Map className="w-3 h-3"/> Regions Infiltrated</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {userStats.regionsScanned.length > 0 ? (
                                    userStats.regionsScanned.map((r, i) => (
                                        <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{r}</span>
                                    ))
                                ) : <span className="text-slate-600 text-xs italic">No data yet</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Column */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Badges ({userStats.badges.length})</h3>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {ACHIEVEMENTS.map(ach => {
                            const isUnlocked = userStats.badges.includes(ach.id);
                            const Icon = IconMap[ach.icon] || Trophy;
                            
                            return (
                                <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isUnlocked ? 'bg-brand-900/20 border-brand-500/30 opacity-100' : 'bg-slate-900/20 border-slate-800 opacity-40 grayscale'}`}>
                                    <div className={`p-2 rounded-full ${isUnlocked ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-600'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</div>
                                        <div className="text-[10px] text-slate-500 leading-tight">{ach.description}</div>
                                    </div>
                                    {isUnlocked && <div className="ml-auto text-[10px] font-mono text-emerald-500 font-bold">+{ach.xpReward} XP</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}
