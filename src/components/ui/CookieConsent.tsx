'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Cookie, X, ChevronRight, Check } from 'lucide-react';

interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  telemetry: boolean;
}

const STORAGE_KEY = 'inquestra_cookie_consent';

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    telemetry: false,
  });

  useEffect(() => {
    // Check if user already set preferences
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Small delay so layout settles without flashing
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setPreferences({
            essential: true,
            analytics: Boolean(parsed.analytics),
            telemetry: Boolean(parsed.telemetry),
          });
        }
      }
    } catch {
      // In case localStorage is blocked in incognito
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    // Global listener for the footer "Cookie Preferences" trigger
    const handleOpen = () => {
      setShowDetails(true);
      setIsOpen(true);
    };

    window.addEventListener('inquestra:open-cookie-settings', handleOpen);
    return () => {
      window.removeEventListener('inquestra:open-cookie-settings', handleOpen);
    };
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...prefs,
          essential: true,
          updatedAt: new Date().toISOString(),
        })
      );
      window.dispatchEvent(
        new CustomEvent('inquestra:cookie-consent-updated', { detail: prefs })
      );
    } catch {
      // Ignore localStorage write error
    }
    setPreferences(prefs);
    setIsOpen(false);
    setShowDetails(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      telemetry: true,
    });
  };

  const handleEssentialOnly = () => {
    savePreferences({
      essential: true,
      analytics: false,
      telemetry: false,
    });
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-5 text-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
              <Cookie className="w-4 h-4" />
            </div>
            <span>Cookie &amp; Data Privacy</span>
          </div>
          <button
            type="button"
            onClick={handleEssentialOnly}
            aria-label="Dismiss cookie notice with essential cookies only"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
          Inquestra keeps research records in local browser storage and uses only strictly necessary cookies unless you opt into optional usage analytics below. See our{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-border/70 space-y-3 text-xs">
            {/* Essential */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
              <div className="pr-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Strictly Necessary
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Optional self-hosted authentication, CSRF protection, and saving this preference choice. Always active.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                Required
              </span>
            </div>

            {/* Performance / Analytics */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40">
              <div className="pr-2">
                <p className="font-semibold text-foreground">Optional Usage Analytics (PostHog / GA4)</p>
                <p className="text-[11px] text-muted-foreground">
                  Off by default. Enables PostHog and Google Analytics pageview diagnostics only if you opt in.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      analytics: e.target.checked,
                      telemetry: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 text-xs">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-muted-foreground hover:text-foreground font-mono text-[11px] flex items-center gap-1 transition-colors"
          >
            {showDetails ? 'Hide preferences' : 'Customize options'}
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showDetails ? 'rotate-90' : ''
              }`}
            />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {showDetails ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted font-medium text-xs transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Save Preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-xs transition-colors"
              >
                Essential Only
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs transition-colors shadow-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
