
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, MapPin, Plus, Loader2 } from 'lucide-react';
import { LocationOption } from '../types';

interface LocationMultiSelectProps {
  label: string;
  options: LocationOption[]; // Default/History options
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  onSearch?: (query: string) => Promise<LocationOption[]>; // NEW: Async search handler
}

export default function LocationMultiSelect({
  label,
  options: initialOptions,
  value,
  onChange,
  placeholder = "Select...",
  allowCustom = true,
  onSearch
}: LocationMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeOptions, setActiveOptions] = useState<LocationOption[]>(initialOptions);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Debounced Search Effect
  useEffect(() => {
      const timer = setTimeout(async () => {
          if (inputValue.length >= 2 && onSearch) {
              setIsLoading(true);
              const results = await onSearch(inputValue);
              setActiveOptions(results);
              setIsLoading(false);
          } else {
              setActiveOptions(initialOptions.filter(opt => 
                opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                opt.value.toLowerCase().includes(inputValue.toLowerCase()) ||
                opt.keywords?.some(k => k.toLowerCase().includes(inputValue.toLowerCase()))
              ));
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [inputValue, onSearch, initialOptions]);

  const handleSelect = (optionValue: string) => {
    if (!value.includes(optionValue)) {
      onChange([...value, optionValue]);
    }
    setInputValue('');
    setActiveOptions(initialOptions); // Reset to defaults after selection
    setIsOpen(false);
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter(v => v !== itemToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      handleSelect(inputValue);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Airport': return 'text-orange-400';
      case 'Region': return 'text-purple-400';
      case 'Country': return 'text-brand-400';
      case 'City': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-bold text-brand-200 mb-2 uppercase tracking-wide">{label}</label>
      
      <div 
        className="min-h-12 w-full rounded-xl border border-brand-500/20 bg-slate-950/50 backdrop-blur-md px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent flex flex-wrap gap-2 items-center cursor-text transition-all"
        onClick={() => {
            const input = wrapperRef.current?.querySelector('input');
            input?.focus();
            setIsOpen(true);
        }}
      >
        {value.map((item, idx) => {
          // Check both lists for the label
          const knownOption = activeOptions.find(o => o.value === item) || initialOptions.find(o => o.value === item);
          return (
            <span key={idx} className="inline-flex items-center gap-1 bg-brand-900/40 border border-brand-500/30 text-brand-100 px-2.5 py-1 rounded-lg text-xs font-bold animate-in fade-in zoom-in duration-200 shadow-sm">
              {knownOption ? knownOption.label.split('(')[0].trim() : item}
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
                className="hover:text-white hover:bg-red-500/50 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}
        
        <input
          type="text"
          className="bg-transparent outline-none flex-grow min-w-[120px] text-slate-50 placeholder:text-slate-500 font-medium h-8"
          placeholder={value.length === 0 ? placeholder : ''}
          value={inputValue}
          onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {isLoading && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl shadow-black/50 max-h-60 overflow-auto py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {activeOptions.length > 0 ? (
            activeOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                    <button
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        disabled={isSelected}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group border-b border-white/5 last:border-0 ${
                            isSelected ? 'opacity-50 cursor-default bg-slate-800' : 'hover:bg-brand-900/20'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black font-mono w-12 ${getTypeColor(opt.type)}`}>{opt.type.toUpperCase().substring(0,3)}</span>
                            <span className="text-slate-200 font-medium group-hover:text-white transition-colors">{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                    </button>
                )
            })
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              {inputValue ? (
                 allowCustom ? (
                    <button 
                        onClick={() => handleSelect(inputValue)}
                        className="flex items-center gap-2 text-brand-400 hover:text-brand-300 w-full font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        Add "{inputValue}"
                    </button>
                 ) : <span>No matches found</span>
              ) : (
                <span>Type to search...</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
