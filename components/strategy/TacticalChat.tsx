
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Terminal, Cpu, HelpCircle, ChevronRight, Trash2 } from 'lucide-react';
import { useFlightStrategy } from '../../context/FlightStrategyContext';
import { sendTacticalChatMessage, ChatMessage } from '../../services/llmClient';

const CHAT_STORAGE_KEY = 'flytz_chat_history_v1';

export default function TacticalChat() {
  const { strategy, deals, profile, trip } = useFlightStrategy();
  const [isOpen, setIsOpen] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  
  // Initialize messages from localStorage or default
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [{ role: 'model', text: 'Hello! I am your Trip Assistant. Ask me anything about your flight options or travel logistics.' }];
    } catch (e) {
      return [{ role: 'model', text: 'Hello! I am your Trip Assistant. Ask me anything about your flight options or travel logistics.' }];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, showFaq]);

  const handleSend = async (textOverride?: string) => {
    const userMsg = textOverride || input;
    if (!userMsg.trim() || loading || !strategy || !profile) return;

    setInput('');
    setShowFaq(false); // Close FAQ if open
    
    // Optimistic UI update
    const newHistory: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    const response = await sendTacticalChatMessage(newHistory, userMsg, { strategy, deals, profile, trip });
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Clear chat history?')) {
      const defaultMsg: ChatMessage[] = [{ role: 'model', text: 'History cleared. How can I help you with your current trip?' }];
      setMessages(defaultMsg);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(defaultMsg));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const FAQ_QUESTIONS = [
    { cat: 'Logistics', q: "Do I need a transit visa for these layovers?" },
    { cat: 'Logistics', q: "Is the connection time sufficient for this route?" },
    { cat: 'Risk', q: "What are the risks of self-transfer here?" },
    { cat: 'Baggage', q: "Can I check bags on this split-ticket itinerary?" },
    { cat: 'Strategy', q: "Explain the 'Skiplagging' risk in detail." },
    { cat: 'Deals', q: "What is the absolute cheapest route found?" },
    { cat: 'Comfort', q: "Are there overnight layovers I should worry about?" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] bg-slate-950/90 backdrop-blur-xl border border-brand-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 ring-1 ring-brand-500/20">
          
          {/* Header */}
          <div className="bg-brand-900/30 p-3 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold font-mono text-brand-300 tracking-wider">TRIP ASSISTANT</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={handleClearHistory} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowFaq(!showFaq)} 
                className={`p-1.5 rounded-lg transition-colors ${showFaq ? 'bg-brand-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                title="FAQ / Suggested Questions"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            
            {/* Messages List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-brand-900 scrollbar-track-transparent">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-br-none' 
                      : 'bg-slate-900 border border-slate-700 text-slate-300 rounded-bl-none font-mono'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg rounded-bl-none flex items-center gap-1">
                    <span className="w-1 h-1 bg-brand-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-brand-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-1 bg-brand-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Overlay */}
            {showFaq && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-10 animate-in fade-in slide-in-from-top-5 p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HelpCircle className="w-3 h-3" /> Suggested Queries
                </h3>
                <div className="space-y-2">
                  {FAQ_QUESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.q)}
                      className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-brand-900/20 hover:border-brand-500/30 transition-all group flex items-center justify-between"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-brand-500 mb-0.5">{item.cat}</div>
                        <div className="text-xs text-slate-300 font-medium group-hover:text-white">{item.q}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-900/50 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 font-mono"
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-brand-500/20 transition-all hover:scale-110 active:scale-95 border border-brand-400/30 ${
          isOpen ? 'bg-slate-800 text-slate-400 rotate-90' : 'bg-gradient-to-tr from-brand-600 to-brand-400 text-white animate-pulse-glow'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        
        {/* Notification Dot */}
        {!isOpen && messages.length > 1 && (
           <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-950"></span>
        )}
      </button>
    </div>
  );
}
