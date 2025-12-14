
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, ShieldCheck, Map, Terminal, ChevronRight, Mail, Loader2, Check, Sparkles, Search } from 'lucide-react';
import { BUTTON_PRIMARY_CLASSES, BUTTON_SECONDARY_CLASSES } from '../constants';
import { useFlightStrategy } from '../context/FlightStrategyContext';
import { parseNaturalLanguageQuery } from '../services/llmClient';
import { audioEffects } from '../services/audioEffects';

/**
 * --- GOOGLE SHEETS BACKEND SETUP ---
 * ... (Comments kept for reference)
 */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwt96-2REo4TEsMq2wdzT_9HlGjw0Xp5KMSCQp8ZLMqehx-7w8u8CIJ3sFRPODu2NyjTg/exec"; 

export default function HomePage() {
  const navigate = useNavigate();
  const { updateProfile, updateTrip, profile } = useFlightStrategy();
  
  // Waitlist State
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // AI Search State
  const [aiQuery, setAiQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('submitting');
    try {
        const logKey = 'flytz_email_waitlist_backup';
        const existingLogs = localStorage.getItem(logKey);
        const logs = existingLogs ? JSON.parse(existingLogs) : [];
        logs.push({ email: email, date: new Date().toISOString(), synced: false });
        localStorage.setItem(logKey, JSON.stringify(logs));
    } catch (err) { console.warn("Failed to save local backup", err); }
    try {
      if (GOOGLE_SCRIPT_URL) {
          await fetch(GOOGLE_SCRIPT_URL, {
              method: 'POST',
              body: JSON.stringify({ email }),
              mode: 'no-cors', 
              headers: { 'Content-Type': 'application/json' }
          });
      } else { await new Promise(resolve => setTimeout(resolve, 1500)); }
      setStatus('success'); setEmail('');
    } catch (error) { console.error("Submission failed", error); setStatus('error'); }
  };

  const handleAiSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiQuery.trim()) return;
      
      setIsParsing(true);
      audioEffects.playClick();

      try {
          // Parse natural language input via Gemini
          const result = await parseNaturalLanguageQuery(aiQuery);
          
          if (result) {
              // Create default or load existing profile state
              const currentProfile = profile || { 
                  homeAirports: ['JFK'], 
                  chaosLevel: 3, 
                  budgetMax: 2000 
              };

              // Update Profile Context
              updateProfile({
                  ...currentProfile,
                  homeAirports: result.origin ? [result.origin] : currentProfile.homeAirports,
                  budgetMax: result.budget || currentProfile.budgetMax
              });

              // Update Trip Context including new keywords
              updateTrip({
                  destinationRegions: result.destination ? [result.destination] : ['Southeast Asia'],
                  durationMin: 7,
                  startDate: new Date().toISOString().split('T')[0],
                  flexibleDays: 3,
                  contextKeywords: result.keywords // Store these for the Strategy AI
              });

              audioEffects.playSuccess();
              // Navigate to wizard which will now have these pre-filled defaults
              navigate('/wizard');
          }
      } catch (error) {
          console.error("AI Parse Failed", error);
          navigate('/wizard'); // Fallback
      } finally {
          setIsParsing(false);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-20 pb-12 space-y-16 text-center">
      
      {/* Hero Section */}
      <div className="space-y-6 max-w-5xl animate-fade-in relative z-10">
        <div className="inline-flex items-center justify-center px-4 py-1.5 bg-brand-900/30 border border-brand-500/30 rounded-full mb-4 backdrop-blur-sm animate-pulse-glow">
            <Terminal className="w-4 h-4 text-brand-400 mr-2" />
            <span className="text-xs font-mono text-brand-300 tracking-widest font-bold">READY TO TRAVEL?</span>
        </div>
        
        <h1 className="text-8xl sm:text-[10rem] font-black tracking-tighter title-cyber leading-[0.85] pb-2">
          FLYTZ
        </h1>
        
        <div className="text-3xl sm:text-5xl font-black tracking-tight uppercase bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 bg-clip-text text-transparent drop-shadow-lg pb-2">
            FLIGHT HACKING ENGINE
        </div>
        
        <p className="text-xl sm:text-2xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium tracking-tight pt-4">
          Turn messy flight deals into precise routes with smart strategies, real data, and <span className="text-brand-400 font-bold border-b-2 border-brand-500/50">AI-powered search</span>.
        </p>
      </div>

      {/* AI Search Bar (Added between Hero and Buttons) */}
      <div className="w-full max-w-2xl relative z-20 animate-in slide-in-from-bottom-4 duration-500 delay-100 px-4">
          <form onSubmit={handleAiSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-slate-950/80 backdrop-blur-xl border border-brand-500/30 rounded-2xl p-2 flex items-center shadow-2xl">
                  <div className="pl-4 pr-3 text-brand-400">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <input 
                      type="text" 
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="I want a trip to a country with private beaches, jacuzzis, under $600..."
                      className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-slate-500 text-sm sm:text-lg font-medium w-full"
                      disabled={isParsing}
                  />
                  <button 
                      type="submit" 
                      disabled={isParsing || !aiQuery}
                      className="bg-brand-600 hover:bg-brand-500 text-white p-3 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                  >
                      {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
              </div>
          </form>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              <span>Auto-Parse Budget</span> • <span>Detect Amenities</span> • <span>Infer Region</span>
          </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto relative z-10 px-4">
        <Link 
          to="/wizard" 
          className={BUTTON_PRIMARY_CLASSES + " text-lg px-12 py-5 h-auto ring-1 ring-white/20"}
        >
          START PLANNING <ChevronRight className="w-5 h-5 ml-1" />
        </Link>
        <Link to="/knowledge" className={BUTTON_SECONDARY_CLASSES + " text-lg px-12 py-5 h-auto"}>
          VIEW GLOSSARY
        </Link>
      </div>

      {/* Waitlist / Email Capture Section */}
      <div className="w-full max-w-sm mx-auto relative z-10 animate-in slide-in-from-bottom-4 duration-700 fade-in px-4">
        <div className={`glass-panel p-1.5 rounded-2xl flex items-center border transition-all duration-300 ${status === 'success' ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-brand-500/30 hover:border-brand-500/50'}`}>
            <div className="pl-3 pr-2">
                {status === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                    <Mail className="w-4 h-4 text-slate-400" />
                )}
            </div>
            <form onSubmit={handleJoinWaitlist} className="flex-1 flex gap-2">
                <input 
                    type="email" 
                    placeholder={status === 'success' ? "Welcome aboard!" : "Enter email for updates..."}
                    className="bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 w-full px-2 py-1.5 outline-none font-medium text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'success' || status === 'submitting'}
                />
                <button 
                    type="submit"
                    disabled={status === 'submitting' || status === 'success'}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-lg whitespace-nowrap flex items-center gap-2 ${
                        status === 'success' 
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100'
                    }`}
                >
                    {status === 'submitting' ? (
                        <>
                           <Loader2 className="w-3 h-3 animate-spin" />
                        </>
                    ) : status === 'success' ? (
                        'JOINED'
                    ) : (
                        'GET ACCESS'
                    )}
                </button>
            </form>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">
            {status === 'success' 
                ? <span className="text-emerald-400">You're on the list! We'll notify you when full features launch.</span>
                : "Join the waitlist for the full v2.0 platform launch."
            }
        </p>
      </div>

      {/* Features Grid - Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left w-full max-w-6xl px-4">
        {[ 
          { icon: Map, title: 'Analyze', desc: 'Input home base & travel preferences.' },
          { icon: Rocket, title: 'Strategize', desc: 'Get step-by-step route options.' },
          { icon: ShieldCheck, title: 'Book', desc: 'Use direct links or tools to book.' }
        ].map((feat, i) => (
          <div key={i} className="group glass-panel p-8 rounded-3xl transition-all duration-300 hover:bg-brand-900/20 hover:border-brand-500/40 hover:-translate-y-1">
             <div className="bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-brand-500/20 group-hover:border-brand-400 group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                <feat.icon className="w-8 h-8 text-brand-400" />
             </div>
             <h3 className="font-bold text-white mb-3 text-2xl tracking-tight">{feat.title}</h3>
             <p className="text-slate-400 text-base leading-relaxed font-medium">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
