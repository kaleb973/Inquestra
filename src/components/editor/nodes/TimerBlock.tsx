'use client';
// src/components/editor/nodes/TimerBlock.tsx
// TipTap standalone block NodeView for /timer slash command.
// Real interactive countdown bench timer with typed custom duration, audio chime, mute, presets, and label.

import { useState, useEffect } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Timer, Play, Pause, RotateCcw, Bell, X, Check, Volume2, VolumeX, Edit2 } from 'lucide-react';

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

export function parseUserInputTime(str: string): number | null {
  const clean = str.trim().toLowerCase();
  if (!clean) return null;

  // HH:MM:SS
  const hmsMatch = clean.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hmsMatch) {
    const h = parseInt(hmsMatch[1], 10);
    const m = parseInt(hmsMatch[2], 10);
    const s = parseInt(hmsMatch[3], 10);
    return h * 3600 + m * 60 + s;
  }

  // MM:SS
  const msMatch = clean.match(/^(\d+):(\d{1,2})$/);
  if (msMatch) {
    const m = parseInt(msMatch[1], 10);
    const s = parseInt(msMatch[2], 10);
    return m * 60 + s;
  }

  // Natural units e.g. 1h 30m, 45s, 12m
  let total = 0;
  let matched = false;

  const hMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:h|hours?)/);
  if (hMatch) {
    total += Math.round(parseFloat(hMatch[1]) * 3600);
    matched = true;
  }

  const mMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:m|mins?|minutes?)/);
  if (mMatch) {
    total += Math.round(parseFloat(mMatch[1]) * 60);
    matched = true;
  }

  const sMatch = clean.match(/(\d+)\s*(?:s|secs?|seconds?)/);
  if (sMatch) {
    total += parseInt(sMatch[1], 10);
    matched = true;
  }

  if (matched) return total > 0 ? total : null;

  // Pure number fallback (treat as minutes)
  const num = parseFloat(clean);
  if (!isNaN(num) && num > 0) {
    return Math.round(num * 60);
  }

  return null;
}

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

  // Direct typed time input state
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState('');

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
  }, [isRunning, isMuted]);

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
    if (editingTime) handleSaveTimeInput();
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
    setEditingTime(false);
    setRemaining(duration);
  };

  const handleSetPreset = (secs: number) => {
    setIsRunning(false);
    setIsDone(false);
    setEditingTime(false);
    setRemaining(secs);
    updateAttributes({ duration: secs });
  };

  const handleSaveTimeInput = () => {
    const parsed = parseUserInputTime(timeInput);
    if (parsed && parsed > 0) {
      handleSetPreset(parsed);
    }
    setEditingTime(false);
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
            ? 'bg-card border-primary/40 shadow-md ring-1 ring-indigo-500/20'
            : 'bg-card border-border hover:border-border/80'
        }`}
      >
        {/* Header with Label and Delete */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <Timer className={`w-4 h-4 ${isRunning ? 'text-foreground animate-spin' : 'text-muted-foreground'}`} style={{ animationDuration: '3s' }} />
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
                  className="bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none focus:border-primary w-full"
                />
                <button onClick={saveLabel} className="p-1 hover:text-foreground text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              </div>
            ) : (
              <span
                onClick={() => setEditingLabel(true)}
                className="text-xs font-semibold text-foreground truncate cursor-pointer hover:underline flex items-center gap-1"
                title="Click to rename timer"
              >
                {label}
                <Edit2 className="w-2.5 h-2.5 opacity-40 hover:opacity-100" />
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

        {/* Digital Countdown Display (Click to type directly) */}
        <div className="flex items-center justify-between mb-4">
          {editingTime && !isRunning ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTimeInput();
                  if (e.key === 'Escape') setEditingTime(false);
                }}
                onBlur={handleSaveTimeInput}
                autoFocus
                placeholder="e.g. 12:30 or 45s"
                className="font-mono text-3xl font-bold tracking-tight text-foreground bg-background border-2 border-primary rounded-lg px-2 py-0.5 w-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSaveTimeInput}
                className="px-2.5 py-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-xs text-xs font-semibold transition-colors shadow-xs"
              >
                Set
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                if (!isRunning) {
                  setTimeInput(formatTime(remaining));
                  setEditingTime(true);
                }
              }}
              className={`font-mono text-3xl font-bold tracking-tight text-foreground select-none rounded-lg px-1.5 py-0.5 transition-all flex items-baseline gap-2 ${
                !isRunning
                  ? 'cursor-pointer hover:bg-muted/80 hover:ring-1 hover:ring-border'
                  : ''
              }`}
              title={!isRunning ? 'Click to type custom time (e.g. 12:30, 45s, 1h)' : undefined}
            >
              <span>{formatTime(remaining)}</span>
              {!isRunning && (
                <span className="text-[11px] text-muted-foreground font-sans font-normal opacity-60 hover:opacity-100 flex items-center gap-0.5">
                  <Edit2 className="w-2.5 h-2.5" />
                  click to type
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                isDone
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                  : isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isDone ? (
                <>
                  <Bell className="w-3.5 h-3.5 animate-pulse motion-reduce:animate-none" />
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
                  : 'border-primary/30 bg-muted text-foreground hover:text-foreground'
              }`}
              title={isMuted ? 'Alarm audio muted (click to unmute)' : 'Alarm audio active (click to mute)'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Preset Duration Buttons & Custom Input */}
        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/60 flex-wrap">
          <div className="flex items-center gap-1">
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
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  duration === preset.secs && !editingTime
                    ? 'bg-muted text-foreground font-bold border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Quick custom text entry input */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Custom (e.g. 12m)"
              disabled={isRunning}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseUserInputTime((e.target as HTMLInputElement).value);
                  if (val && val > 0) {
                    handleSetPreset(val);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-foreground placeholder:text-muted-foreground w-28 focus:outline-none focus:border-primary disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
