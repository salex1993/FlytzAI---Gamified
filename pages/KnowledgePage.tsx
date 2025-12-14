
import React, { useState } from 'react';
import { Search, Book, ExternalLink, Filter } from 'lucide-react';
import { KNOWLEDGE_DATA } from '../data/knowledgeBase';
import { KnowledgeCategory } from '../types';
import { INPUT_BASE_CLASSES } from '../constants';

export default function KnowledgePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory | 'All'>('All');

  const filteredData = KNOWLEDGE_DATA.filter((item) => {
    const matchesSearch = 
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.definition.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (cat: KnowledgeCategory) => {
    switch (cat) {
      case 'Concept': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'Tool': return 'bg-brand-500/10 text-brand-300 border-brand-500/30';
      case 'Acronym': return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
            <Book className="text-brand-500 w-8 h-8" />
            Knowledge Base
          </h1>
          <p className="text-brand-100/70 mt-2 font-medium">
            Guide to travel hacking concepts and tools.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 glass-panel p-4 rounded-xl">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            className={`${INPUT_BASE_CLASSES} pl-10`}
            placeholder="Search terms, definitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {(['All', 'Concept', 'Tool', 'Acronym'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${
                activeCategory === cat 
                  ? 'bg-brand-600 text-white border-brand-400 shadow-lg shadow-brand-500/20' 
                  : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div 
              key={item.id} 
              className="flex flex-col glass-panel p-6 rounded-xl hover:border-brand-500/50 transition-all group hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-black text-white group-hover:text-brand-400 transition-colors">
                  {item.term}
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getCategoryColor(item.category)}`}>
                  {item.category}
                </span>
              </div>
              
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-grow font-medium">
                {item.definition}
              </p>

              {(item.example || item.links) && (
                <div className="pt-4 mt-auto border-t border-white/5 space-y-3">
                  {item.example && (
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/50 text-xs text-slate-400 font-mono">
                      <span className="text-brand-500 font-bold mr-2">EX:</span>
                      {item.example}
                    </div>
                  )}
                  {item.links && item.links.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-wide"
                    >
                      {link.text} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No results found.</p>
            <button 
              onClick={() => {setSearchTerm(''); setActiveCategory('All');}}
              className="text-brand-400 hover:text-brand-300 text-sm mt-2 font-bold uppercase"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
