
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart, Users, Zap, Globe, DollarSign, Shield, Rocket, Target, Layers, Cpu, TrendingUp, PieChart, Briefcase, Activity, CheckCircle2 } from 'lucide-react';
import { audioEffects } from '../services/audioEffects';

interface Slide {
    title: string;
    subtitle: string;
    content: React.ReactNode;
    icon: React.ReactNode;
}

// --- Visual Components for Robust Data Representation ---

const BarGraph = () => (
    <div className="w-full h-40 flex items-end gap-4 px-4 border-b border-slate-700/50">
        {[
            { label: 'Opaque Pricing', val: 'h-[60%]', color: 'bg-slate-700' },
            { label: 'Booking Fees', val: 'h-[40%]', color: 'bg-slate-600' },
            { label: 'Route Friction', val: 'h-[85%]', color: 'bg-slate-500' },
            { label: 'Flytz Delta', val: 'h-[100%]', color: 'bg-brand-500 shadow-[0_0_15px_rgba(56,189,248,0.4)]' },
        ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`${bar.color} w-full ${bar.val} rounded-t-sm transition-all duration-1000 delay-300 animate-in slide-in-from-bottom-full`} />
                <span className="text-[8px] font-mono text-slate-500 uppercase whitespace-nowrap">{bar.label}</span>
            </div>
        ))}
    </div>
);

const MarketFunnel = () => (
    <div className="relative flex flex-col items-center gap-1 py-4">
        <div className="w-full h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-500/5" />
            <span className="text-[10px] font-bold text-slate-400">TOTAL ADDRESSABLE MARKET (TAM) - $8.2T Global Travel</span>
        </div>
        <div className="w-[80%] h-12 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center relative">
            <div className="absolute inset-0 bg-brand-500/10" />
            <span className="text-[10px] font-bold text-slate-200">SERVICEABLE ADDRESSABLE MARKET (SAM) - $22B Private Sector</span>
        </div>
        <div className="w-[50%] h-12 bg-brand-600 border border-brand-400 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-[10px] font-black text-white">FLYTZ TARGET (SOM) - $450M Y3 Revenue</span>
        </div>
    </div>
);

const GrowthChart = () => (
    <div className="relative w-full h-48 mt-4">
        <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
            <path d="M0,150 Q100,140 200,80 T400,10" fill="none" stroke="#38bdf8" strokeWidth="4" className="drop-shadow-lg" />
            <circle cx="0" cy="150" r="4" fill="#38bdf8" />
            <circle cx="200" cy="80" r="4" fill="#38bdf8" />
            <circle cx="400" cy="10" r="6" fill="#fff" />
            <text x="400" y="35" textAnchor="end" className="fill-brand-400 text-[12px] font-bold font-mono">SCALING PHASE</text>
        </svg>
        <div className="absolute top-0 left-0 text-[10px] text-slate-500 font-mono">REVENUE PROJECTION</div>
    </div>
);

const RevenueSplit = () => (
    <div className="flex items-center gap-8 py-4">
        <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#38bdf8" strokeWidth="3" strokeDasharray="60 100" />
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="30 100" strokeDashoffset="-60" />
                <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#0284c7" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset="-90" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-lg font-black text-white">$</span>
            </div>
        </div>
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-400" />
                <span className="text-[10px] font-bold text-slate-300">Subscriptions (60%)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-600" />
                <span className="text-[10px] font-bold text-slate-300">Broker Commissions (30%)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-800" />
                <span className="text-[10px] font-bold text-slate-300">Partner APIs (10%)</span>
            </div>
        </div>
    </div>
);

export default function PitchDeckPage() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides: Slide[] = [
        {
            title: "The Vision",
            subtitle: "Redefining Travel Intelligence",
            icon: <Globe className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="space-y-6">
                    <p className="text-xl text-slate-200 leading-relaxed font-medium">
                        Flytz is the first professional-grade operating system designed to optimize high-value travel through cross-sector data synchronization and AI reasoning.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="glass-panel p-6 rounded-2xl border border-brand-500/10">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-brand-400" /> Executive Problem</h4>
                            <p className="text-sm text-slate-400">High-net-worth travel management is currently manually intensive, prone to opaque pricing, and lacks real-time arbitrage tools.</p>
                        </div>
                        <div className="bg-brand-900/10 p-6 rounded-2xl border border-brand-400/20">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-brand-400" /> The Edge</h4>
                            <p className="text-sm text-brand-100">Our engine identifies price loopholes across Commercial, Charter, and Empty Leg sectors instantly.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Market Opportunity",
            subtitle: "A Multi-Trillion Dollar Friction Point",
            icon: <BarChart className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-7 space-y-4">
                        <p className="text-slate-300">We target the intersection of global commercial aviation and the rapidly expanding private charter market.</p>
                        <MarketFunnel />
                    </div>
                    <div className="md:col-span-5 flex flex-col justify-center gap-4">
                        {[
                            { val: "22.4%", label: "Private Sector CAGR" },
                            { val: "$1.4T", label: "Business Travel Spend" },
                            { val: "3.2M", label: "Monthly High-Value Searches" }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                <div className="text-2xl font-black text-white">{stat.val}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            title: "The Problem",
            subtitle: "Systemic Travel Inefficiency",
            icon: <TrendingUp className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="space-y-8">
                    <div className="flex flex-col gap-2">
                        <p className="text-slate-300">Consumers and corporations lose billions to "Marketing Fares" and lack of route transparency.</p>
                        <BarGraph />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-red-500/10">
                            <div className="text-white font-bold text-sm mb-1">Information Silos</div>
                            <p className="text-[10px] text-slate-500">Commercial and Private data exist in separate, incompatible worlds.</p>
                        </div>
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-red-500/10">
                            <div className="text-white font-bold text-sm mb-1">Static Search</div>
                            <p className="text-[10px] text-slate-500">Traditional tools show fixed inventory, not strategic routing possibilities.</p>
                        </div>
                        <div className="p-3 bg-slate-900/40 rounded-lg border border-red-500/10">
                            <div className="text-white font-bold text-sm mb-1">Manual Vetting</div>
                            <p className="text-[10px] text-slate-500">Researching visas, layovers, and aircraft specs takes hours, not seconds.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Proprietary Architecture",
            subtitle: "GDS Integration x Generative AI",
            icon: <Layers className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="space-y-6">
                    <p className="text-slate-300">Flytz bridges the gap between raw Global Distribution System (GDS) data and actionable intelligence using Gemini 3.</p>
                    <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-4 bg-slate-900/80 p-5 rounded-2xl border border-brand-500/20 shadow-xl">
                            <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center font-black text-white shadow-lg">GDS</div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-sm">Real-Time Synchronization</div>
                                <p className="text-xs text-slate-400">Direct pipe to Amadeus for global commercial inventory and live pricing.</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-center h-8">
                             <div className="w-px h-full bg-gradient-to-b from-brand-400 to-transparent" />
                         </div>
                         <div className="flex items-center gap-4 bg-brand-900/20 p-5 rounded-2xl border border-brand-400/30 shadow-xl ring-2 ring-brand-400/10">
                            <div className="w-12 h-12 rounded-xl bg-brand-400 flex items-center justify-center font-black text-slate-950 shadow-lg"><Cpu className="w-6 h-6" /></div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-sm">AI Strategy Layer (Gemini 3)</div>
                                <p className="text-xs text-brand-100">Automatically parses 40,000+ permutations to construct the 'perfect' tactical route.</p>
                            </div>
                         </div>
                    </div>
                </div>
            )
        },
        {
            title: "Disrupting Private Aviation",
            subtitle: "The Empty Leg Arbitrage",
            icon: <Shield className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <p className="text-slate-300">We unlock the "Hidden Sector" of private aviation. By mapping commercial first-class routes against available private 'Empty Legs', we provide elite value.</p>
                        <div className="space-y-2">
                             <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-emerald-500/10">
                                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                 <span className="text-xs text-slate-300 font-medium">Automatic Sector Cross-Referencing</span>
                             </div>
                             <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-emerald-500/10">
                                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                 <span className="text-xs text-slate-300 font-medium">Verified Aircraft Performance Specs</span>
                             </div>
                        </div>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                        <div className="text-center mb-4">
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Pricing Disruption</div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Commercial First (LHR-JFK)</span>
                                <span className="text-white font-mono">$12,400</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full w-[80%] bg-slate-600" />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-brand-400 font-bold">Flytz Empty Leg Intel</span>
                                <span className="text-white font-mono font-bold">$6,200*</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full w-[40%] bg-brand-500" />
                            </div>
                            <p className="text-[8px] text-slate-600 italic">*Based on real-time empty leg availability algorithms.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Monetization Model",
            subtitle: "Built for High-Growth Scale",
            icon: <DollarSign className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-7">
                            <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Revenue Distribution</h5>
                            <RevenueSplit />
                        </div>
                        <div className="md:col-span-5 space-y-4">
                            <div className="p-4 bg-brand-900/10 rounded-xl border border-brand-500/20">
                                <h6 className="text-white font-bold text-sm mb-1">PRO SUBSCRIPTION</h6>
                                <p className="text-[10px] text-slate-400">$49/mo for frequent flyers and digital nomads.</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                <h6 className="text-white font-bold text-sm mb-1">ELITE TIER</h6>
                                <p className="text-[10px] text-slate-400">$299/mo for family offices and travel concierges.</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                <h6 className="text-white font-bold text-sm mb-1">SECTOR ARBITRAGE</h6>
                                <p className="text-[10px] text-slate-400">Fixed-fee brokerage on private sector bookings.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Traction & Roadmap",
            subtitle: "Path to Global Operational Dominance",
            icon: <Rocket className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                         <div className="space-y-4">
                            {[
                                { status: "Active", stage: "Engine Core", desc: "Live GDS and AI strategy module." },
                                { status: "Q4 2025", stage: "Booking Integration", desc: "Integrated checkout via partner APIs." },
                                { status: "2026", stage: "Global Concierge", desc: "Portfolio-style travel management." }
                            ].map((milestone, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${milestone.status === 'Active' ? 'bg-brand-500' : 'bg-slate-700'}`} />
                                        <div className="w-px h-full bg-slate-800" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{milestone.stage}</span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${milestone.status === 'Active' ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-500'}`}>{milestone.status}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500">{milestone.desc}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                    <div>
                        <GrowthChart />
                        <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">Anticipated growth based on conversion of 0.5% of premium GDS search volume to subscribed users within the first 24 months.</p>
                    </div>
                </div>
            )
        },
        {
            title: "Join the Mission",
            subtitle: "Investment & Partnership Inquiry",
            icon: <Target className="w-12 h-12 text-brand-400" />,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full items-center">
                    <div className="space-y-6">
                        <p className="text-lg text-slate-300 leading-relaxed">
                            We are seeking strategic partners to scale the intelligence engine and formalize institutional brokerage agreements.
                        </p>
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
                             <div className="flex items-center gap-4">
                                 <div className="p-2 bg-brand-500/20 rounded-lg"><CheckCircle2 className="w-5 h-5 text-brand-400" /></div>
                                 <span className="text-sm font-bold text-white">Proven AI Logic Layer</span>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="p-2 bg-brand-500/20 rounded-lg"><CheckCircle2 className="w-5 h-5 text-brand-400" /></div>
                                 <span className="text-sm font-bold text-white">Real-Time Data Pipelines</span>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="p-2 bg-brand-500/20 rounded-lg"><CheckCircle2 className="w-5 h-5 text-brand-400" /></div>
                                 <span className="text-sm font-bold text-white">Scalable Global Infrastructure</span>
                             </div>
                        </div>
                    </div>
                    <div className="bg-brand-600 p-8 rounded-3xl text-center shadow-2xl shadow-brand-500/20">
                        <Briefcase className="w-12 h-12 text-white mx-auto mb-4" />
                        <h4 className="text-2xl font-black text-white mb-2">READY FOR DEPLOYMENT</h4>
                        <p className="text-sm text-brand-100 mb-6 font-medium">Institutional Briefing available upon request.</p>
                        <button 
                            onClick={() => window.location.href = '/#/wizard'}
                            className="w-full py-4 bg-white text-brand-600 font-black rounded-xl hover:scale-105 transition-all shadow-xl"
                        >
                            ACCESS ENGINE
                        </button>
                    </div>
                </div>
            )
        }
    ];

    const next = () => { audioEffects.playClick(); if (currentSlide < slides.length - 1) setCurrentSlide(prev => prev + 1); };
    const prev = () => { audioEffects.playClick(); if (currentSlide > 0) setCurrentSlide(prev => prev - 1); };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
            <div className="max-w-5xl w-full glass-panel border-brand-500/30 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(56,189,248,0.15)] flex flex-col min-h-[600px] relative">
                
                {/* Visual "Operational" Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-slate-800">
                    <div className="h-full bg-brand-500 transition-all duration-700 ease-out" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}></div>
                </div>

                <div className="p-8 sm:p-12 flex-grow flex flex-col relative z-10">
                    <div className="flex items-center gap-6 mb-10 border-b border-white/5 pb-8">
                        <div className="bg-brand-900/50 p-4 rounded-2xl border border-brand-500/30 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                            {slides[currentSlide].icon}
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-2 uppercase">{slides[currentSlide].title}</h2>
                            <p className="text-brand-400 font-bold uppercase tracking-[0.2em] text-xs font-mono">{slides[currentSlide].subtitle}</p>
                        </div>
                    </div>

                    <div className="flex-grow animate-in slide-in-from-right-8 fade-in duration-700">
                        {slides[currentSlide].content}
                    </div>

                    <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
                        <button 
                            onClick={prev} 
                            disabled={currentSlide === 0}
                            className="p-4 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-brand-500 transition-all disabled:opacity-0"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        
                        <div className="flex gap-3">
                            {slides.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-brand-400 w-12' : 'bg-slate-800 w-4'}`} />
                            ))}
                        </div>

                        <button 
                            onClick={currentSlide === slides.length - 1 ? () => window.location.href = '/#/wizard' : next}
                            className="group p-4 pr-10 rounded-full bg-brand-600 text-white hover:bg-brand-500 transition-all flex items-center gap-3 shadow-2xl shadow-brand-500/30"
                        >
                            <span className="font-black uppercase text-xs pl-6 tracking-widest">{currentSlide === slides.length - 1 ? 'Start Mission' : 'Continue Brief'}</span>
                            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex items-center gap-4 text-slate-600 text-[10px] font-mono uppercase tracking-[0.4em]">
                <span>Proprietary Data</span>
                <span>•</span>
                <span>Flytz Strategy Brief v1.02</span>
                <span>•</span>
                <span className="text-brand-500/50">L7 Clearance Required</span>
            </div>
        </div>
    );
}
