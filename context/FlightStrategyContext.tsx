
import React, { createContext, useContext, useState, PropsWithChildren, useEffect } from 'react';
import { FlightProfile, TripPlan, Strategy, FlightDeal, AIAnalysis, SavedStrategy, UserStats, Achievement } from '../types';
import { generateStrategy } from '../services/strategyEngine';
import { ACHIEVEMENTS } from '../data/achievements';
import { audioEffects } from '../services/audioEffects';

interface FlightStrategyContextType {
  profile: FlightProfile | null;
  trip: TripPlan | null;
  strategy: Strategy | null;
  deals: FlightDeal[];
  aiAnalysis: AIAnalysis | null;
  
  // Gamification State
  userStats: UserStats;
  recentUnlock: Achievement | null;
  clearRecentUnlock: () => void;

  updateProfile: (p: FlightProfile) => void;
  updateTrip: (t: TripPlan) => void;
  updateDeals: (d: FlightDeal[]) => void;
  updateAiAnalysis: (a: AIAnalysis) => void;
  runStrategy: (overrideProfile?: FlightProfile, overrideTrip?: TripPlan) => void;
  saveStrategy: (name: string) => void;
  loadStrategy: (saved: SavedStrategy) => void;
  reset: () => void;
}

const FlightStrategyContext = createContext<FlightStrategyContextType | undefined>(undefined);

const DEFAULT_STATS: UserStats = {
    level: 1,
    currentXp: 0,
    nextLevelXp: 500,
    totalSearches: 0,
    totalSavings: 0,
    regionsScanned: [],
    badges: []
};

export const FlightStrategyProvider = ({ children }: PropsWithChildren) => {
  const [profile, setProfile] = useState<FlightProfile | null>(null);
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [deals, setDeals] = useState<FlightDeal[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  
  const [userStats, setUserStats] = useState<UserStats>(() => {
      try {
          const stored = localStorage.getItem('flytz_user_stats');
          return stored ? JSON.parse(stored) : DEFAULT_STATS;
      } catch { return DEFAULT_STATS; }
  });
  
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);

  // Save stats on change
  useEffect(() => {
      localStorage.setItem('flytz_user_stats', JSON.stringify(userStats));
  }, [userStats]);

  const addXp = (amount: number) => {
      setUserStats(prev => {
          let newXp = prev.currentXp + amount;
          let newLevel = prev.level;
          let nextReq = prev.nextLevelXp;

          // Level Up Logic
          while (newXp >= nextReq) {
              newXp -= nextReq;
              newLevel++;
              nextReq = Math.floor(nextReq * 1.5);
              // Play special level up sound (reuse success for now)
              setTimeout(() => audioEffects.playSuccess(), 500); 
          }

          return { ...prev, currentXp: newXp, level: newLevel, nextLevelXp: nextReq };
      });
  };

  const checkAchievements = (currentDeals?: FlightDeal[], currentProfile?: FlightProfile) => {
      setUserStats(prev => {
          let updatedStats = { ...prev };
          let earnedXp = 0;
          let newBadge = false;

          ACHIEVEMENTS.forEach(ach => {
              if (!prev.badges.includes(ach.id)) {
                  if (ach.condition(updatedStats, currentDeals, currentProfile)) {
                      updatedStats.badges = [...updatedStats.badges, ach.id];
                      earnedXp += ach.xpReward;
                      // Trigger visual unlock
                      setRecentUnlock({ ...ach, unlockedAt: new Date().toISOString() });
                      audioEffects.playSuccess();
                      newBadge = true;
                  }
              }
          });

          return newBadge ? updatedStats : prev; 
      });
      
      // Since we can't easily update XP inside the reducer above without side effects or complexity,
      // we run a secondary check to award XP. Ideally this is done in one pass but this is safer for now.
      ACHIEVEMENTS.forEach(ach => {
          if (!userStats.badges.includes(ach.id) && ach.condition(userStats, currentDeals, currentProfile)) {
              addXp(ach.xpReward);
          }
      });
  };

  const runStrategy = (overrideProfile?: FlightProfile, overrideTrip?: TripPlan) => {
    const activeProfile = overrideProfile || profile;
    const activeTrip = overrideTrip || trip;

    if (!activeProfile || !activeTrip) return;

    if (overrideProfile) setProfile(overrideProfile);
    if (overrideTrip) setTrip(overrideTrip);

    const result = generateStrategy(activeProfile, activeTrip);
    setStrategy(result);
    setDeals([]);
    setAiAnalysis(null);

    // Update Stats
    setUserStats(prev => {
        const regions = new Set(prev.regionsScanned);
        if (activeTrip.destinationRegions[0]) regions.add(activeTrip.destinationRegions[0]);
        return {
            ...prev,
            totalSearches: prev.totalSearches + 1,
            regionsScanned: Array.from(regions)
        };
    });
    
    // XP for searching
    addXp(50);
  };

  // Check achievements when deals arrive
  useEffect(() => {
      if (deals.length > 0 && profile) {
          // Calculate savings
          const cheapest = parseFloat(deals[0].price.total);
          const savings = Math.max(0, profile.budgetMax - cheapest);
          
          setUserStats(prev => ({
              ...prev,
              totalSavings: prev.totalSavings + savings
          }));

          // Trigger checks
          checkAchievements(deals, profile);
      }
  }, [deals]);

  const saveStrategy = (name: string) => {
    if (!profile || !trip || !strategy) return;
    const newSaved: SavedStrategy = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      originSummary: profile.homeAirports[0],
      targetSummary: trip.destinationRegions[0],
      profile,
      trip,
      strategy,
      deals,
      aiAnalysis
    };
    const existing = localStorage.getItem('flytz_strategies_v1');
    const strategies: SavedStrategy[] = existing ? JSON.parse(existing) : [];
    strategies.push(newSaved);
    localStorage.setItem('flytz_strategies_v1', JSON.stringify(strategies));
  };

  const loadStrategy = (saved: SavedStrategy) => {
    setProfile(saved.profile);
    setTrip(saved.trip);
    setStrategy(saved.strategy);
    setDeals(saved.deals || []);
    setAiAnalysis(saved.aiAnalysis || null);
  };

  const reset = () => {
    setProfile(null);
    setTrip(null);
    setStrategy(null);
    setDeals([]);
    setAiAnalysis(null);
  };

  return (
    <FlightStrategyContext.Provider 
      value={{ 
        profile, trip, strategy, deals, aiAnalysis,
        userStats, recentUnlock, clearRecentUnlock: () => setRecentUnlock(null),
        updateProfile: setProfile, updateTrip: setTrip, updateDeals: setDeals, updateAiAnalysis: setAiAnalysis,
        runStrategy, saveStrategy, loadStrategy, reset 
      }}
    >
      {children}
    </FlightStrategyContext.Provider>
  );
};

export const useFlightStrategy = () => {
  const context = useContext(FlightStrategyContext);
  if (!context) throw new Error('useFlightStrategy must be used within FlightStrategyProvider');
  return context;
};
