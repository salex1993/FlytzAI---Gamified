import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlightStrategy } from '../context/FlightStrategyContext';
import { INPUT_BASE_CLASSES } from '../constants';
import { ArrowRight, ArrowLeft, Plane, AlertOctagon, Target, Calendar, Globe, Sparkles } from 'lucide-react';
import LocationMultiSelect from '../components/LocationMultiSelect';
import { ORIGIN_OPTIONS, DESTINATION_OPTIONS } from '../data/locations';
import { searchLocations } from '../services/flightsApi';
import { FlightProfile, TripPlan, ChaosLevel } from '../types';

export default function WizardPage() {
  const navigate = useNavigate();
  const { profile, trip, runStrategy } = useFlightStrategy();
  
  const [step, setStep] = useState(1);
  // Initialize from Context if available (fixes "Back" button data loss)
  const [homeAirports, setHomeAirports] = useState<string[]>(profile?.homeAirports || ['JFK']);
  const [chaos, setChaos] = useState<ChaosLevel>(profile?.chaosLevel || 3);
  const [budget, setBudget] = useState(profile?.budgetMax || 2000);
  const [destinations, setDestinations] = useState<string[]>(trip?.destinationRegions || ['Southeast Asia']);
  const [startDate, setStartDate] = useState(trip?.startDate || new Date().toISOString().split('T')[0]);

  const handleGenerate = () => {
    // Create objects explicitly
    const newProfile: FlightProfile = { 
      homeAirports: homeAirports, 
      chaosLevel: chaos as any, 
      budgetMax: budget 
    };
    const newTrip: TripPlan = {
      destinationRegions: destinations,
      durationMin: 7,
      startDate: startDate,
      flexibleDays: 3
    };

    // Pass data directly to ensure strategy generates synchronously with correct data
    runStrategy(newProfile, newTrip);
    navigate('/strategy');
  };

  const handleExplore = () => {
      // "Everywhere" mode
      const newProfile: FlightProfile = { 
        homeAirports: homeAirports, 
        chaosLevel: chaos as any, 
        budgetMax: budget 
      };
      const newTrip: TripPlan = {
        destinationRegions: ['Everywhere'],
        durationMin: 7,
        startDate: startDate,
        flexibleDays: 3
      };
      
      setDestinations(['Everywhere']);
      runStrategy(newProfile, newTrip);
      navigate('/strategy');
  };

  const chaosDescriptions = {
    1: "Comfort is King (Direct flights only)",
    2: "Standard Traveler (1 layover ok)",
    3: "Budget Conscious (Self-transfers ok)",
    4: "Travel Hacker (Positioning flights)",
    5: "Extreme Savings (Skiplagging, Long layovers)"
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-mono text-brand-300 mb-2 uppercase tracking-wider font-bold">
            <span>Step 1: Your Profile</span>
            <span>Step 2: Trip Details</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
                className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                style={{ width: step === 1 ? '50%' : '100%' }}
            />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-10 shadow-2xl">
        
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    <Plane className="text-brand-400" strokeWidth={3} />
                    Travel Preferences
                </h2>
                <p className="text-brand-100/70 mt-1 font-medium">Where are you flying from?</p>
             </div>

             <div className="space-y-6">
                 <div>
                   <LocationMultiSelect 
                      label="Home Airport / City"
                      options={ORIGIN_OPTIONS}
                      value={homeAirports}
                      onChange={setHomeAirports}
                      placeholder="Search airports (e.g. JFK)..."
                      onSearch={searchLocations}
                   />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-brand-200 mb-2 uppercase tracking-wide">Max Budget (USD)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                        <input 
                            type="number" 
                            min="100" 
                            max="50000"
                            step="100"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className={`${INPUT_BASE_CLASSES} pl-7 font-mono text-lg font-bold text-brand-400`}
                        />
                    </div>
                 </div>
                 
                 <div className="bg-slate-900/60 p-6 rounded-xl border border-brand-500/20">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide">
                            <AlertOctagon className="w-4 h-4 text-brand-400" />
                            Adventure Level
                        </label>
                        <span className="text-brand-400 font-mono text-2xl font-bold">{chaos}</span>
                    </div>
                    
                    <input 
                      type="range" min="1" max="5" 
                      value={chaos} 
                      onChange={(e) => setChaos(parseInt(e.target.value) as ChaosLevel)} 
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                    <div className="mt-4 text-center">
                         <span className="text-sm text-brand-200 font-bold bg-brand-900/50 px-3 py-1 rounded-full border border-brand-500/30">
                            {chaosDescriptions[chaos as keyof typeof chaosDescriptions]}
                         </span>
                    </div>
                 </div>
             </div>
             
             <div className="pt-4">
                <button 
                    onClick={() => setStep(2)}
                    disabled={homeAirports.length === 0 || budget < 100}
                    className="w-full bg-gradient-to-r from-brand-600 to-brand-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black tracking-wide py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                >
                    NEXT STEP <ArrowRight className="w-5 h-5" />
                </button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    <Target className="text-brand-400" strokeWidth={3} />
                    Destination & Dates
                </h2>
                <p className="text-brand-100/70 mt-1 font-medium">Where do you want to go?</p>
             </div>

             <div className="space-y-6">
                <div>
                   <LocationMultiSelect 
                      label="Target Region / City"
                      options={DESTINATION_OPTIONS}
                      value={destinations}
                      onChange={setDestinations}
                      placeholder="Search destinations (e.g. London)..."
                      onSearch={searchLocations}
                   />
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-brand-200 mb-2 uppercase tracking-wide flex items-center gap-2">
                     <Calendar className="w-4 h-4" />
                     Start Date
                   </label>
                   <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={INPUT_BASE_CLASSES + " [color-scheme:dark] font-medium"}
                   />
                 </div>
             </div>

             <div className="flex gap-4 pt-6">
               <button 
                  onClick={() => setStep(1)} 
                  className="flex-1 border border-brand-500/20 hover:bg-brand-900/20 py-4 rounded-xl text-brand-200 transition-all font-bold flex items-center justify-center gap-2 uppercase tracking-wide"
               >
                 <ArrowLeft className="w-4 h-4" /> Back
               </button>
               <button 
                  onClick={handleGenerate} 
                  disabled={destinations.length === 0}
                  className="flex-[2] bg-gradient-to-r from-brand-600 to-brand-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black tracking-wide py-4 rounded-xl transition-all shadow-lg shadow-brand-500/20"
                >
                 FIND FLIGHTS
               </button>
             </div>
             
             {/* Inspiration Search Trigger */}
             <div className="border-t border-white/5 pt-6 text-center">
                 <p className="text-xs text-slate-500 mb-3 font-bold uppercase">Or let us decide</p>
                 <button 
                    onClick={handleExplore}
                    className="w-full bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                 >
                    <Sparkles className="w-4 h-4" /> Explore Anywhere
                 </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}