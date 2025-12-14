
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Plane, Settings, X, Save, Key, Wifi, AlertCircle, CheckCircle2, LayoutList, Download, Trash2, Database, Volume2, VolumeX, UserCircle2 } from 'lucide-react';
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
  const [showProfile, setShowProfile] = useState(false); // NEW
  
  // Settings State
  const [amadeusId, setAmadeusId] = useState('');
  const [amadeusSecret, setAmadeusSecret] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [mondayKey, setMondayKey] = useState('');
  
  // Audio State
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Connection Status
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'success' | 'failed'>('unknown');
  const [keysMissing, setKeysMissing] = useState(false);

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<{email: string, date: string}[]>([]);

  // Load existing keys and logs on mount/open
  useEffect(() => {
    // Check missing keys for indicator
    const id = localStorage.getItem('VITE_AMADEUS_CLIENT_ID');
    const secret = localStorage.getItem('VITE_AMADEUS_CLIENT_SECRET');
    setKeysMissing(!id || !secret);

    if (!showSettings) return;

    const key = localStorage.getItem('API_KEY');
    const monday = localStorage.getItem('MONDAY_API_TOKEN');
    
    setAmadeusId(id || '');
    setAmadeusSecret(secret || '');
    setGeminiKey(key || '');
    setMondayKey(monday || '');
    setConnectionStatus('unknown');
    
    // Load Logs
    try {
        const logs = JSON.parse(localStorage.getItem('flytz_email_waitlist_backup') || '[]');
        setEmailLogs(logs);
    } catch (e) {
        setEmailLogs([]);
    }
  }, [showSettings]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    audioEffects.toggle(newState);
    if (newState) audioEffects.playClick();
  };

  const handleTestConnection = async () => {
    audioEffects.playClick();
    if (!amadeusId || !amadeusSecret) {
        setConnectionStatus('failed');
        return;
    }
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

    if (geminiKey) localStorage.setItem('API_KEY', geminiKey);
    else localStorage.removeItem('API_KEY');

    if (mondayKey) localStorage.setItem('MONDAY_API_TOKEN', mondayKey);
    else localStorage.removeItem('MONDAY_API_TOKEN');

    setShowSettings(false);
    window.location.reload(); 
  };

  const downloadEmailLogs = () => {
    audioEffects.playClick();
    if (emailLogs.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Email\n" 
        + emailLogs.map(e => `${e.date},${e.email}`).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "flytz_waitlist_backup.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearEmailLogs = () => {
      audioEffects.playClick();
      if (confirm('Are you sure you want to clear the local email backup? This cannot be undone.')) {
          localStorage.removeItem('flytz_email_waitlist_backup');
          setEmailLogs([]);
      }
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-brand-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400 hover:text-white transition-all hover:scale-105';
  };

  const NavLink = ({ to, label }: { to: string, label: string }) => (
      <Link 
        to={to} 
        className={`text-sm font-bold tracking-wide uppercase ${isActive(to)}`}
        onMouseEnter={() => audioEffects.playHover()}
        onClick={() => audioEffects.playClick()}
      >
        {label}
      </Link>
  );

  return (
    <div className="min-h-screen text-slate-50 font-sans selection:bg-brand-500 selection:text-white flex flex-col bg-transparent">
      
      {/* Toast Notification */}
      <AchievementToast />

      {/* Navigation */}
      <nav className="border-b border-brand-500/10 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="text-2xl font-black tracking-tighter text-white flex items-center gap-2 group"
                onClick={() => audioEffects.playClick()}
                onMouseEnter={() => audioEffects.playHover()}
              >
                <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-1.5 rounded-lg shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all">
                  <Plane className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                FLYTZ<span className="text-brand-400">.</span>
              </Link>
            </div>
            <div className="flex items-center space-x-6 sm:space-x-8">
              <NavLink to="/wizard" label="Strategy" />
              <NavLink to="/knowledge" label="Intel" />
              <NavLink to="/faq" label="FAQ" />
              
              <span className="text-slate-800 hidden sm:inline">|</span>
              
              {/* Profile Button (NEW) */}
              <button
                onClick={() => { setShowProfile(true); audioEffects.playClick(); }}
                className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 rounded-full pl-1 pr-3 py-1 transition-all group"
                title="Operative Dossier"
              >
                  <div className="bg-brand-900/50 p-1 rounded-full border border-brand-500/30">
                      <UserCircle2 className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="text-left leading-none">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Level {userStats.level}</div>
                      <div className="text-xs font-mono text-white font-bold">{userStats.currentXp} XP</div>
                  </div>
              </button>

              <button 
                onClick={toggleSound}
                className="text-slate-500 hover:text-brand-400 transition-colors p-2"
                title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button 
                onClick={() => { setShowSettings(true); audioEffects.playClick(); }}
                className="relative text-slate-400 hover:text-brand-400 transition-colors p-2 rounded-full hover:bg-white/5"
                title="API Configuration"
                onMouseEnter={() => audioEffects.playHover()}
              >
                <Settings className="w-5 h-5" />
                {keysMissing && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-slate-950"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-auto backdrop-blur-sm">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-xs font-mono">
            <p>FLYTZ v1.0 • SYSTEM OPERATIONAL • <span className="text-brand-500">SECURE CONNECTION</span></p>
         </div>
      </footer>

      {/* Profile Modal */}
      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}

      {/* API Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel border-brand-500/30 p-6 sm:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
             <button 
                onClick={() => { setShowSettings(false); audioEffects.playClick(); }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
             >
               <X className="w-5 h-5" />
             </button>

             <div className="flex items-center gap-3 mb-6">
               <div className="bg-brand-900/50 p-3 rounded-xl border border-brand-500/20">
                 <Key className="w-6 h-6 text-brand-400" />
               </div>
               <div>
                 <h3 className="text-xl font-black text-white tracking-tight">System Configuration</h3>
                 <p className="text-xs text-slate-400 font-mono">Inject API keys for live intelligence.</p>
               </div>
             </div>

             <div className="space-y-5">
               
               {/* Amadeus Section */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        Amadeus Flight API
                        <a href="https://developers.amadeus.com/my-apps" target="_blank" rel="noreferrer" className="ml-2 text-brand-400 hover:underline text-[10px] opacity-70">Get Free Keys →</a>
                    </label>
                    {/* Status Pill */}
                    {connectionStatus === 'success' && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Online</span>}
                    {connectionStatus === 'failed' && <span className="text-[10px] font-bold text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Connection Failed</span>}
                 </div>
                 
                 <input 
                   type="text" 
                   placeholder="Client ID (API Key)"
                   value={amadeusId}
                   onChange={(e) => setAmadeusId(e.target.value)}
                   className={INPUT_BASE_CLASSES + " font-mono text-xs"}
                 />
                 <input 
                   type="password" 
                   placeholder="Client Secret"
                   value={amadeusSecret}
                   onChange={(e) => setAmadeusSecret(e.target.value)}
                   className={INPUT_BASE_CLASSES + " font-mono text-xs"}
                 />
                 
                 <div className="flex justify-end">
                    <button 
                        onClick={handleTestConnection}
                        disabled={!amadeusId || !amadeusSecret || connectionStatus === 'testing'}
                        className="text-xs font-bold text-brand-400 hover:text-white flex items-center gap-1 disabled:opacity-50"
                    >
                        {connectionStatus === 'testing' ? <Wifi className="w-3 h-3 animate-ping" /> : <Wifi className="w-3 h-3" />}
                        {connectionStatus === 'testing' ? 'Verifying...' : 'Test Connection'}
                    </button>
                 </div>
               </div>

               <div className="h-px bg-white/5 my-2" />

               {/* Gemini Section */}
               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                   Google Gemini API
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline text-[10px] opacity-70">Get Key →</a>
                 </label>
                 <input 
                   type="password" 
                   placeholder="AI Studio API Key"
                   value={geminiKey}
                   onChange={(e) => setGeminiKey(e.target.value)}
                   className={INPUT_BASE_CLASSES + " font-mono text-xs"}
                 />
               </div>

               <div className="h-px bg-white/5 my-2" />

               {/* Monday.com Section */}
               <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                   Monday.com API
                   <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <LayoutList className="w-3 h-3" />
                      Task Sync
                   </div>
                 </label>
                 <input 
                   type="password" 
                   placeholder="Monday.com API Token"
                   value={mondayKey}
                   onChange={(e) => setMondayKey(e.target.value)}
                   className={INPUT_BASE_CLASSES + " font-mono text-xs"}
                 />
               </div>

               <div className="h-px bg-white/5 my-2" />
               
               {/* WAITLIST LOGS SECTION */}
               <div className="space-y-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <Database className="w-3 h-3 text-brand-400" />
                             Waitlist Backup
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{emailLogs.length} emails captured</span>
                    </label>
                    <div className="flex gap-2">
                        <button 
                            onClick={downloadEmailLogs}
                            disabled={emailLogs.length === 0}
                            className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-3 h-3" /> Download CSV
                        </button>
                        <button 
                            onClick={clearEmailLogs}
                            disabled={emailLogs.length === 0}
                            className="px-3 py-2 rounded-lg bg-red-900/10 text-red-400 text-xs font-bold border border-red-500/10 hover:bg-red-900/30 hover:border-red-500/30 disabled:opacity-50 transition-colors"
                            title="Clear Logs"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
               </div>
               
               <div className="pt-4 flex gap-3">
                 <button 
                    onClick={() => { setShowSettings(false); audioEffects.playClick(); }}
                    className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                    onClick={handleSaveSettings}
                    className={BUTTON_PRIMARY_CLASSES + " flex-1 py-3 w-full"}
                 >
                   <Save className="w-4 h-4 mr-2" /> Save & Reload
                 </button>
               </div>
               
               <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                 Keys are stored locally in your browser (localStorage). They are never sent to any Flytz server, only directly to the API providers.
               </p>

             </div>
          </div>
        </div>
      )}
    </div>
  );
}
