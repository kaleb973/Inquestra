'use client';
// src/components/layout/AIAssistant.tsx

import { useState, useEffect } from 'react';
import { Sparkles, Bot, Send } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';

export function AIAssistant() {
  const telemetryBuffer = useNotebookStore((s) => s.telemetryBuffer);
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: "I'm Inquestra Intelligence. Ask me about your telemetry data or trial notes." }
  ]);
  const [isTyping, setIsTyping] = useState(false);

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
    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setIsTyping(true);

    // Simulate AI response based on telemetry
    setTimeout(() => {
      let reply = "I've analyzed your trial context.";
      
      if (userMsg.toLowerCase().includes('anomaly') || userMsg.toLowerCase().includes('spike')) {
        const hasData = telemetryBuffer.length > 0;
        if (hasData) {
          const maxTemp = Math.max(...telemetryBuffer.map(t => t.value));
          reply = `Looking at the current DAQ buffer (${telemetryBuffer.length} points), the maximum recorded value is ${maxTemp.toFixed(2)}. This is within expected nominal bounds if baseline is 37°C. No critical anomalies detected.`;
        } else {
          reply = "I don't see any active telemetry data in the buffer right now to check for anomalies. Please start the acquisition stream first.";
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

      setChatLog(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

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
              <div className="w-6 h-6 rounded bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
              </div>
            )}
            <div className={`text-xs px-3 py-2 rounded-lg max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-neutral-800 text-neutral-200 rounded-tr-sm' 
                : 'bg-blue-950/30 text-blue-100 border border-blue-900/50 rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded bg-blue-900/40 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xs px-3 py-2 rounded-lg bg-blue-950/30 text-blue-300 border border-blue-900/50 rounded-tl-sm flex items-center gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/60 bg-background/50">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI about this trial..."
            className="w-full bg-muted border border-border rounded-lg pl-3 pr-10 py-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400 transition-colors p-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
