
import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle } from 'lucide-react';
import { FAQ_DATA } from '../data/faqData';
import { INPUT_BASE_CLASSES } from '../constants';

export default function FaqPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenItems(newOpen);
  };

  const filteredFaq = FAQ_DATA.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(FAQ_DATA.map(i => i.category)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl sm:text-5xl font-black text-white flex items-center justify-center gap-3 tracking-tight">
          <HelpCircle className="text-brand-500 w-8 h-8 sm:w-10 sm:h-10" />
          F.A.Q.
        </h1>
        <p className="text-brand-100/70 text-lg font-medium max-w-2xl mx-auto">
          Common questions about flight hacking, safety protocols, and using the Flytz engine.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500" />
        </div>
        <input
          type="text"
          className={`${INPUT_BASE_CLASSES} pl-10 h-12 text-base`}
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* FAQ List */}
      <div className="grid gap-6 pt-6">
        {categories.map(cat => {
          const catItems = filteredFaq.filter(i => i.category === cat);
          if (catItems.length === 0) return null;

          return (
            <div key={cat} className="space-y-4">
              <h3 className="text-brand-400 font-bold uppercase tracking-widest text-xs ml-2 mb-2">{cat}</h3>
              {catItems.map((item) => {
                const isOpen = openItems.has(item.id);
                return (
                  <div 
                    key={item.id}
                    className={`glass-panel rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-brand-500/40 bg-slate-900/80' : 'hover:bg-slate-900/60'}`}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className={`font-bold text-lg ${isOpen ? 'text-white' : 'text-slate-300'}`}>
                        {item.question}
                      </span>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-brand-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </button>
                    
                    {isOpen && (
                      <div className="px-5 pb-5 text-slate-400 leading-relaxed text-sm animate-in fade-in slide-in-from-top-1">
                        <div className="h-px w-full bg-white/5 mb-4"></div>
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {filteredFaq.length === 0 && (
           <div className="text-center text-slate-500 py-12">
              <p>No answers found for "{searchTerm}".</p>
           </div>
        )}
      </div>

      {/* Support CTA */}
      <div className="glass-panel p-8 rounded-2xl text-center border-brand-500/20 mt-12 bg-gradient-to-b from-slate-900/50 to-brand-900/10">
          <MessageCircle className="w-10 h-10 text-brand-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
              Use the <span className="text-brand-300 font-bold">Tactical Chat</span> on the Strategy Page to ask our AI Assistant specific questions about your itinerary.
          </p>
      </div>

    </div>
  );
}
