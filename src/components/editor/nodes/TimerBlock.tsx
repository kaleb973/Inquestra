'use client';
// src/components/editor/nodes/TimerBlock.tsx
// TipTap standalone block NodeView for /timer slash command.
// Real interactive countdown bench timer with audio chime, presets, and label.

import { useState, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Timer, Play, Pause, RotateCcw, Bell, X, Check, Volume2, VolumeX } from 'lucide-react';

export const TimerExtension = Node.create({
  name: 'timerBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      duration: { default: 300 }, // in seconds (default 5m)
      label: { default: 'Incubation' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timerBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timerBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimerNodeView);
  },
});

function playChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // AudioContext blocked
  }
}

function TimerNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const duration = (node.attrs.duration as number) || 300;
  const label = (node.attrs.label as string) || 'Incubation';

  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(label);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isRunning && !isDone) {
      setRemaining(duration);
    }
  }, [duration, isRunning, isDone]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setIsDone(true);
          if (!isMuted) playChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (isDone) {
      setIsDone(false);
      setRemaining(duration);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsDone(false);
    setRemaining(duration);
  };

  const handleSetPreset = (secs: number) => {
    setIsRunning(false);
    setIsDone(false);
    setRemaining(secs);
    updateAttributes({ duration: secs });
  };

  const saveLabel = () => {
    updateAttributes({ label: labelText.trim() || 'Timer' });
    setEditingLabel(false);
  };

  return (
    <NodeViewWrapper className="my-4">
      <div
        contentEditable={false}
        className={`max-w-md rounded-xl border p-4 shadow-sm transition-all ${
          isDone
            ? 'bg-emerald-500/10 border-emerald-500/40'
            : isRunning
            ? 'bg-card border-indigo-500/40 shadow-md ring-1 ring-indigo-500/20'
            : 'bg-card border-border hover:border-border/80'
        }`}
      >
        {/* Header with Label and Delete */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <Timer className={`w-4 h-4 ${isRunning ? 'text-indigo-500 animate-spin' : 'text-muted-foreground'}`} style={{ animationDuration: '3s' }} />
            {editingLabel ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveLabel();
                    if (e.key === 'Escape') setEditingLabel(false);
                  }}
                  autoFocus
                  className="bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 w-full"
                />
                <button onClick={saveLabel} className="p-1 hover:text-foreground text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              </div>
            ) : (
              <span
                onClick={() => setEditingLabel(true)}
                className="text-xs font-semibold text-foreground truncate cursor-pointer hover:underline"
                title="Click to rename timer"
              >
                {label}
              </span>
            )}
          </div>

          <button
            onClick={deleteNode}
            className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-muted transition-colors shrink-0"
            title="Delete timer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Digital Countdown Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="font-mono text-3xl font-bold tracking-tight text-foreground select-none">
            {formatTime(remaining)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                isDone
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                  : isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isDone ? (
                <>
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  <span>Restart</span>
                </>
              ) : isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isMuted
                  ? 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                  : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400'
              }`}
              title={isMuted ? 'Alarm audio muted' : 'Alarm audio active'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Preset Duration Buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground font-mono mr-1 uppercase">Presets:</span>
          {[
            { label: '30s', secs: 30 },
            { label: '1m', secs: 60 },
            { label: '5m', secs: 300 },
            { label: '15m', secs: 900 },
            { label: '30m', secs: 1800 },
            { label: '1h', secs: 3600 },
          ].map((preset) => (
            <button
              key={preset.secs}
              onClick={() => handleSetPreset(preset.secs)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                duration === preset.secs
                  ? 'bg-muted text-foreground font-bold border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
