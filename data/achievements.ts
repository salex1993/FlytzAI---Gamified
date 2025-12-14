
import { Achievement } from '../types';

export const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'first_contact',
    title: 'First Contact',
    description: 'Executed your first flight search strategy.',
    icon: 'Terminal',
    xpReward: 100,
    condition: (stats) => stats.totalSearches >= 1
  },
  {
    id: 'deal_sniper',
    title: 'Deal Sniper',
    description: 'Found a flight significantly under budget.',
    icon: 'Crosshair',
    xpReward: 300,
    condition: (stats, deals, profile) => {
        if (!deals || !profile || deals.length === 0) return false;
        const cheapest = parseFloat(deals[0].price.total);
        // If cheapest is 40% less than budget
        return cheapest < (profile.budgetMax * 0.6); 
    }
  },
  {
    id: 'risk_taker',
    title: 'Risk Taker',
    description: 'Generated a strategy with Chaos Level 5.',
    icon: 'AlertTriangle',
    xpReward: 250,
    condition: (stats, deals, profile) => !!profile && profile.chaosLevel === 5
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Ran a search between 1 AM and 5 AM.',
    icon: 'Moon',
    xpReward: 150,
    condition: () => {
        const hour = new Date().getHours();
        return hour >= 1 && hour <= 5;
    }
  },
  {
    id: 'globe_trotter',
    title: 'Globe Trotter',
    description: 'Scanned 3 different destination regions.',
    icon: 'Globe',
    xpReward: 400,
    condition: (stats) => stats.regionsScanned.length >= 3
  },
  {
    id: 'master_hacker',
    title: 'The Architect',
    description: 'Reached Level 5 clearance.',
    icon: 'Crown',
    xpReward: 1000,
    condition: (stats) => stats.level >= 5
  }
];

export const LEVEL_TITLES: Record<number, string> = {
    1: "Script Kiddie",
    2: "Novice Hacker",
    3: "Operator",
    4: "Strategist",
    5: "The Architect",
    6: "Elite Phantom",
    7: "System Lord",
    8: "Time Lord",
    9: "Ascended",
    10: "Omniscient"
};
