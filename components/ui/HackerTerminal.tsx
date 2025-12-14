
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ShieldAlert, Wifi, Lock } from 'lucide-react';
import { audioEffects } from '../../services/audioEffects';

const HACKER_LOGS = [
  "INITIALIZING NEURAL HANDSHAKE...",
  "ACCESSING AMADEUS GDS [SECURE CHANNEL]...",
  "BYPASSING GEO-FENCING PROTOCOLS...",
  "TRIANGULATING OPEN-JAW OPPORTUNITIES...",
  "ANALYZING 40,320 ROUTE PERMUTATIONS...",
  "DETECTING HIDDEN CITY TICKETS...",
  "INJECTING FUEL DUMP HEURISTICS...",
  "DECRYPTING FARE CLASS BUCKETS (J/C/Y)...",
  "OPTIMIZING LAYOVER EFFICIENCY...",
  "CROSS-REFERENCING ALLIANCE PARTNERS...",
  "FILTERING GHOST FLIGHTS...",
  "ESTABLISHING SECURE UPLINK...",
  "DOWNLOADING ITA MATRIX DATA...",
  "COMPILING STRATEGIC VECTORS..."
];

export default function HackerTerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Play sci-fi power up sound on mount
    audioEffects.playPowerUp();

    let currentIndex = 0;
    const interval = setInterval(() => {
      setLines(prev => {
        const newLine = HACKER_LOGS[currentIndex % HACKER_LOGS.length];
        // Keep last 8 lines
        const updated = [...prev, `> ${newLine}`];
        if (updated.length > 8) updated.shift();
        return updated;
      });
      currentIndex++;
    }, 400);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 font-mono text-sm relative group">
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-emerald-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      <div className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-slate-400">FLYTZ_KERNEL_V2.0</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          ref={scrollRef}
          className="p-6 h-64 overflow-hidden relative"
          style={{ 
            backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {/* CRT Scan Line Animation */}
          <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent h-[10%] w-full animate-scan-beam"></div>

          <div className="space-y-2 relative z-0">
            {lines.map((line, i) => (
              <div key={i} className="text-emerald-500/90 font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-300">
                {line}
              </div>
            ))}
            <div className="flex items-center gap-2 text-brand-400 animate-pulse mt-4">
              <Lock className="w-3 h-3" />
              <span>AWAITING SERVER RESPONSE<span className="animate-bounce">_</span></span>
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="bg-slate-900/50 px-4 py-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500 font-bold uppercase">
          <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-emerald-500"/> Connection Secure</span>
          <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-brand-500"/> Encryption: 256-BIT</span>
        </div>
      </div>
      
      <style>{`
        @keyframes scan-beam {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scan-beam {
          animation: scan-beam 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
