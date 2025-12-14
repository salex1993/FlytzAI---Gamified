// Simulating shared CSS utility classes for inputs
// Using blue focus rings and glass backgrounds
export const INPUT_BASE_CLASSES = "flex h-10 w-full rounded-md border border-brand-500/20 bg-slate-950/50 backdrop-blur-md px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 disabled:cursor-not-allowed disabled:opacity-50 text-slate-50 transition-all duration-300";

// Buttons now use a gradient
export const BUTTON_PRIMARY_CLASSES = "inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-brand-400 px-8 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-105 hover:shadow-brand-500/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400";

export const BUTTON_SECONDARY_CLASSES = "inline-flex h-12 items-center justify-center rounded-lg border border-brand-500/20 bg-slate-900/40 backdrop-blur-sm px-8 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:text-white hover:bg-brand-500/10 hover:border-brand-500/50";