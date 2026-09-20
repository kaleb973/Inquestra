'use client';
// src/components/layout/AIAssistant.tsx

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, Send } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';

export function AIAssistant() {
  const telemetryBuffer = useNotebookStore((s) => s.telemetryBuffer);
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "I'm Inquestra Intelligence. Ask me about your telemetry data or trial notes." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expose an effect to listen for slash command triggers
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent).detail?.query;
      if (q) {
        setQuery(q);
        // Optionally auto-send
      }
    };
    document.addEventListener('inquestra:open-ai', handler);
    return () => document.removeEventListener('inquestra:open-ai', handler);
  }, []);

  const handleSend = () => {
    if (!query.trim()) return;
    
    const userMsg = query.trim();
    // Cap chat history to prevent unbounded array growth memory leak
    setChatLog(prev => [...prev.slice(-49), { role: 'user', text: userMsg }]);
    setQuery('');
    setIsTyping(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Simulate AI response based on telemetry
    timeoutRef.current = setTimeout(() => {
      let reply = "I've analyzed your trial context.";
      
      if (userMsg.toLowerCase().includes('anomaly') || userMsg.toLowerCase().includes('spike')) {
        const hasData = telemetryBuffer.length > 0;
        if (hasData) {
          const vals = telemetryBuffer.map(p => p.value);
          const max = Math.max(...vals);
          reply = `I see a maximum reading of ${max.toFixed(2)} in the current buffer. This is within nominal ranges for this assay.`;
        } else {
          reply = "I don't see any active telemetry data to analyze. Please connect the hardware.";
        }
      } else if (userMsg.toLowerCase().includes('average') || userMsg.toLowerCase().includes('mean')) {
        if (telemetryBuffer.length > 0) {
          const avg = telemetryBuffer.reduce((acc, t) => acc + t.value, 0) / telemetryBuffer.length;
          reply = `The rolling average for the current buffer is ${avg.toFixed(2)}.`;
        } else {
          reply = "The telemetry buffer is currently empty. Connect a device or start the simulator.";
        }
      } else {
        reply = "I'm a local inference mock for the time being. Try asking me to 'check for an anomaly' or 'calculate the average' of the current telemetry stream.";
      }

      setChatLog(prev => [...prev.slice(-49), { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <div className="flex items-center gap-2 mb-4 px-5 pt-5">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Inquestra AI
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
        {chatLog.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              </div>
            )}
            <div className={`text-xs px-3 py-2 rounded-lg max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm' 
                : 'bg-card text-foreground border border-border rounded-tl-sm shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className="text-xs px-3 py-2 rounded-lg bg-card text-muted-foreground border border-border rounded-tl-sm flex items-center gap-1 shadow-sm">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background/50">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI about this trial..."
            className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-indigo-500 transition-colors p-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
