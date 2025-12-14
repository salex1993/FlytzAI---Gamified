
import React, { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useFlightStrategy } from '../../context/FlightStrategyContext';

export default function AchievementToast() {
  const { recentUnlock, clearRecentUnlock } = useFlightStrategy();

  useEffect(() => {
    if (recentUnlock) {
      const timer = setTimeout(() => {
        clearRecentUnlock();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentUnlock, clearRecentUnlock]);

  if (!recentUnlock) return null;

  return (
    <div className="fixed top-24 right-4 z-[200] animate-in slide-in-from-right-10 fade-in duration-500">
      <div className="bg-slate-900/90 backdrop-blur-md border border-brand-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(56,189,248,0.3)] flex items-center gap-4 max-w-xs relative overflow-hidden">
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] animate-[shine_1s_infinite]"></div>
        
        <div className="bg-brand-500/20 p-3 rounded-full border border-brand-500/50">
            <Trophy className="w-6 h-6 text-brand-400 animate-bounce" />
        </div>
        <div>
            <div className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-0.5">Achievement Unlocked</div>
            <div className="text-white font-bold text-sm">{recentUnlock.title}</div>
            <div className="text-emerald-400 text-xs font-mono font-bold">+{recentUnlock.xpReward} XP</div>
        </div>
      </div>
    </div>
  );
}
