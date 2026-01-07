
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Plane, Settings, X, Save, Key, Wifi, AlertCircle, CheckCircle2, LayoutList, Download, Trash2, Database, Volume2, VolumeX, UserCircle2, Briefcase } from 'lucide-react';
import { INPUT_BASE_CLASSES, BUTTON_PRIMARY_CLASSES } from '../constants';
import { validateAmadeusConnection } from '../services/flightsApi';
import { audioEffects } from '../services/audioEffects';
import UserProfileModal from './gamification/UserProfileModal';
import AchievementToast from './gamification/AchievementToast';
import { useFlightStrategy } from '../context/FlightStrategyContext';

export default function AppShell() {
  const location = useLocation();
  const { userStats } = useFlightStrategy();
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false); 
  
  const [amadeusId, setAmadeusId] = useState('');
  const [amadeusSecret, setAmadeusSecret] = useState('');
  const [mondayKey, setMondayKey] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'success' | 'failed'>('unknown');
  const [keysMissing, setKeysMissing] = useState(false);
  const [emailLogs, setEmailLogs] = useState<{email: string, date: string}[]>([]);

  useEffect(() => {
    const id = localStorage.getItem('VITE_AMADEUS_CLIENT_ID');
    const secret = localStorage.getItem('VITE_AMADEUS_CLIENT_SECRET');
    setKeysMissing(!id || !secret);
    if (!showSettings) return;
    const monday = localStorage.getItem('MONDAY_API_TOKEN');
    setAmadeusId(id || '');
    setAmadeusSecret(secret || '');
    setMondayKey(monday || '');
    setConnectionStatus('unknown');
    try {
        const logs = JSON.parse(localStorage.getItem('flytz_email_waitlist_backup') || '[]');
        setEmailLogs(logs);
    } catch (e) { setEmailLogs([]); }
  }, [showSettings]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    audioEffects.toggle(newState);
    if (newState) audioEffects.playClick();
  };

  const handleTestConnection = async () => {
    audioEffects.playClick();
    if (!amadeusId || !amadeusSecret) { setConnectionStatus('failed'); return; }
    setConnectionStatus('testing');
    const success = await validateAmadeusConnection(amadeusId, amadeusSecret);
    setConnectionStatus(success ? 'success' : 'failed');
    if (success) audioEffects.playSuccess();
  };

  const handleSaveSettings = () => {
    audioEffects.playSuccess();
    if (amadeusId) localStorage.setItem('VITE_AMADEUS_CLIENT_ID', amadeusId);
    else localStorage.removeItem('VITE_AMADEUS_CLIENT_ID');
    if (amadeusSecret) localStorage.setItem('VITE_AMADEUS_CLIENT_SECRET', amadeusSecret);
    else localStorage.removeItem('VITE_AMADEUS_CLIENT_SECRET');
    if (mondayKey) localStorage.setItem('MONDAY_API_TOKEN', mondayKey);
    else localStorage.removeItem('MONDAY_API_TOKEN');
    setShowSettings(false);
    window.location.reload(); 
  };

  const isActive = (path: string) => location.pathname === path ? 'text-brand-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 hover:text-white transition-all hover:scale-105';

  const NavLink = ({ to, label, icon: Icon }: { to: string, label: string, icon?: any }) => (
      <Link 
        to={to} 
        className={`text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${isActive(to)}`}
        onMouseEnter={() => audioEffects.playHover()}
        onClick={() => audioEffects.playClick()}
      >
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </Link>
  );

  return (
    <div className="min-h-screen text-slate-50 font-sans flex flex-col bg-transparent">
      <AchievementToast />
      <nav className="border-b border-brand-500/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-black tracking-tighter text-white flex items-center gap-2 group" onClick={() => audioEffects.playClick()} onMouseEnter={() => audioEffects.playHover()}>
                <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-1.5 rounded-lg shadow-lg group-hover:shadow-brand-500/40 transition-all"><Plane className="w-5 h-5 text-white" fill="currentColor" /></div>
                FLYTZ<span className="text-brand-400">.</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4 sm:space-x-8">
              <div className="hidden sm:flex items-center space-x-6">
                <NavLink to="/wizard" label="Mission" />
                <NavLink to="/knowledge" label="Intelligence" />
                <NavLink to="/pitch" label="Pitch" icon={Briefcase} />
              </div>
              <span className="text-slate-800 hidden sm:inline">|</span>
              <button onClick={() => { setShowProfile(true); audioEffects.playClick(); }} className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 rounded-full px-2 py-1 transition-all group">
                  <UserCircle2 className="w-4 h-4 text-brand-400" />
                  <div className="text-left leading-none hidden sm:block">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">LVL {userStats.level}</div>
                      <div className="text-[10px] font-mono text-white font-bold">{userStats.currentXp} XP</div>
                  </div>
              </button>
              <button onClick={() => { setShowSettings(true); audioEffects.playClick(); }} className="relative text-slate-400 hover:text-brand-400 p-2 rounded-full hover:bg-white/5 transition-colors">
                <Settings className="w-5 h-5" />
                {keysMissing && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-slate-950"></span>}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"><Outlet /></main>
      <footer className="border-t border-white/5 py-8 mt-auto backdrop-blur-sm text-center text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em]"><p>FLYTZ v1.0 • DATASEC OPERATIONAL • <span className="text-brand-500">ENCRYPTED</span></p></footer>
      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel border-brand-500/30 p-8 rounded-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto shadow-2xl">
             <button onClick={() => { setShowSettings(false); audioEffects.playClick(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
             <div className="flex items-center gap-3 mb-8">
               <div className="bg-brand-900/50 p-3 rounded-xl border border-brand-500/20"><Key className="w-6 h-6 text-brand-400" /></div>
               <div><h3 className="text-xl font-black text-white uppercase tracking-tight">Data Uplink</h3><p className="text-[10px] text-slate-400 font-mono">Input credentials for live GDS synchronization.</p></div>
             </div>
             <div className="space-y-6">
               <div className="space-y-3">
                 <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Amadeus GDS Keys</label>{connectionStatus === 'success' && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">SYNCED</span>}</div>
                 <input type="text" placeholder="Client ID" value={amadeusId} onChange={(e) => setAmadeusId(e.target.value)} className={INPUT_BASE_CLASSES + " font-mono text-xs"} />
                 <input type="password" placeholder="Client Secret" value={amadeusSecret} onChange={(e) => setAmadeusSecret(e.target.value)} className={INPUT_BASE_CLASSES + " font-mono text-xs"} />
                 <div className="flex justify-end"><button onClick={handleTestConnection} disabled={!amadeusId || !amadeusSecret} className="text-[10px] font-bold text-brand-400 hover:text-white flex items-center gap-1">TEST CONNECTION</button></div>
               </div>
               <div className="h-px bg-white/5" />
               <div className="space-y-3">
                 <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Project Management (Monday.com)</label>
                 <input type="password" placeholder="API Token" value={mondayKey} onChange={(e) => setMondayKey(e.target.value)} className={INPUT_BASE_CLASSES + " font-mono text-xs"} />
               </div>
               <div className="pt-4 flex gap-3">
                 <button onClick={() => setShowSettings(false)} className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-colors">CANCEL</button>
                 <button onClick={handleSaveSettings} className={BUTTON_PRIMARY_CLASSES + " flex-1 py-3"}>SAVE CONFIG</button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
