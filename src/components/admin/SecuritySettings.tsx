'use client';
// src/components/admin/SecuritySettings.tsx
// Optional TOTP 2FA enrollment card for researchers.
// Uses Supabase Auth MFA: enroll → challenge → verify.
// Supports unenrollment with confirmation guard.

import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  KeyRound,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  X,
  Fingerprint,
  Trash2,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type MfaState = 'loading' | 'inactive' | 'enrolling' | 'verifying' | 'active' | 'unenrolling';

interface Factor {
  id: string;
  friendly_name: string | null;
  status: 'verified' | 'unverified';
}

type PasskeyListItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export function SecuritySettings() {
  const supabase = createSupabaseBrowserClient();

  const [mfaState, setMfaState] = useState<MfaState>('loading');
  const [activeFactor, setActiveFactor] = useState<Factor | null>(null);

  // Passkey state
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([]);
  const [isPasskeysLoading, setIsPasskeysLoading] = useState(true);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  // Enrollment state
  const [factorId, setFactorId] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [secret, setSecret] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);

  // Verification state
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Unenroll confirm modal
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // ── On mount: check existing factors ──────────────────────────────
  const fetchPasskeys = async () => {
    setIsPasskeysLoading(true);
    setPasskeyError(null);
    const { data, error } = await supabase.auth.passkey.list();
    if (error) {
      setPasskeyError(error.message);
    } else if (data) {
      setPasskeys(data as PasskeyListItem[]);
    }
    setIsPasskeysLoading(false);
  };

  useEffect(() => {
    (async () => {
      // Concurrently fetch TOTP factors and passkeys
      const [mfaRes] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        fetchPasskeys(),
      ]);

      const { data, error } = mfaRes;
      if (!error && data) {
        const verified = data.totp.find((f) => f.factor_type === 'totp');
        if (verified) {
          setActiveFactor(verified as Factor);
          setMfaState('active');
        } else {
          setMfaState('inactive');
          // Clean up dangling unverified factors in background without blocking UI
          const unverified = data.all.filter((f) => f.factor_type === 'totp' && f.status === 'unverified');
          if (unverified.length > 0) {
            Promise.allSettled(unverified.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id }))).catch(() => {});
          }
        }
      } else {
        setMfaState('inactive');
      }
    })();
  }, []);

  // ── Passkey Handlers ──────────────────────────────────────────────
  const handleRegisterPasskey = async () => {
    setPasskeyError(null);
    setIsRegisteringPasskey(true);
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) throw new Error(error.message);
      await fetchPasskeys();
    } catch (err: unknown) {
      setPasskeyError(err instanceof Error ? err.message : 'Failed to register passkey.');
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setPasskeyError(null);
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
      if (error) throw new Error(error.message);
      setPasskeys((prev) => prev.filter((pk) => pk.id !== id));
    } catch (err: unknown) {
      setPasskeyError(err instanceof Error ? err.message : 'Failed to delete passkey.');
    }
  };

  // Focus OTP input when entering verifying state
  useEffect(() => {
    if (mfaState === 'verifying') {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [mfaState]);

  // ── Enroll: start enrollment ──────────────────────────────────────
  const handleStartEnroll = async () => {
    setMfaState('enrolling');
    setIsPending(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Inquestra',
        friendlyName: 'Authenticator App',
      });
      if (error || !data) throw new Error(error?.message ?? 'Enrollment failed.');
      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      setIsPending(false);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Enrollment failed.');
      setMfaState('inactive');
      setIsPending(false);
    }
  };

  // ── Verify: challenge then verify the TOTP code ───────────────────
  const handleVerify = async () => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setOtpError(null);
    setIsPending(true);
    try {
      // If no challengeId yet, create one
      let cId = challengeId;
      if (!cId) {
        const { data: cData, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
        if (cErr || !cData) throw new Error(cErr?.message ?? 'Challenge failed.');
        cId = cData.id;
        setChallengeId(cId);
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: cId,
        code: otp,
      });

      if (error) {
        // Challenge may have expired — create a fresh one and ask user to retry
        const { data: newChallenge } = await supabase.auth.mfa.challenge({ factorId });
        if (newChallenge) setChallengeId(newChallenge.id);
        setOtp('');
        throw new Error('Incorrect code or code expired. Please try again.');
      }

      if (data) {
        setActiveFactor({ id: factorId, friendly_name: 'Authenticator App', status: 'verified' });
        setMfaState('active');
        setOtp('');
        setChallengeId('');
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsPending(false);
    }
  };

  // ── Unenroll: remove factor ───────────────────────────────────────
  const handleUnenroll = async () => {
    if (!activeFactor) return;
    setIsPending(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: activeFactor.id });
    if (error) {
      setOtpError(error.message);
      setIsPending(false);
      setShowUnenrollConfirm(false);
      return;
    }
    setActiveFactor(null);
    setMfaState('inactive');
    setShowUnenrollConfirm(false);
    setIsPending(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── TOTP MFA Card ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-muted/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {mfaState === 'active' ? (
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Two-Factor Authentication (2FA)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Protect your account with a TOTP authenticator app.
            </p>
          </div>
        </div>

        {/* Status badge */}
        {mfaState === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
        ) : mfaState === 'active' ? (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 uppercase tracking-wider shrink-0">
            Active
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border bg-muted text-muted-foreground border-border uppercase tracking-wider shrink-0">
            Not Enabled
          </span>
        )}
      </div>

      <div className="p-6">
        {/* ── Loading ── */}
        {mfaState === 'loading' && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ── Inactive: prompt to enable ── */}
        {mfaState === 'inactive' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/40 border border-border/60 rounded-xl">
              <Smartphone className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                <p className="text-foreground font-medium">Authenticator app required</p>
                <p>
                  Use <strong>Google Authenticator</strong>, <strong>Apple Passwords</strong>,{' '}
                  <strong>1Password</strong>, or <strong>Authy</strong> to scan a QR code and
                  generate time-based login codes.
                </p>
              </div>
            </div>
            {otpError && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {otpError}
              </p>
            )}
            <button
              onClick={handleStartEnroll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Shield className="w-4 h-4" />
              Enable 2FA
            </button>
          </div>
        )}

        {/* ── Enrolling: show QR code ── */}
        {mfaState === 'enrolling' && (
          <div className="space-y-5">
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Step 1:</strong> Open your authenticator app
                  and scan the QR code below. Then click{' '}
                  <strong className="text-foreground">Next</strong> to enter the 6-digit code.
                </p>

                {/* QR code */}
                <div className="flex justify-center">
                  <div
                    className="bg-white rounded-xl p-3 shadow-lg flex items-center justify-center"
                    style={{ width: 180, height: 180 }}
                  >
                    {qrSvg.startsWith('data:') ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrSvg}
                        alt="Two-Factor QR Code"
                        className="w-full h-full object-contain select-none"
                      />
                    ) : (
                      <div
                        className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block select-none"
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                      />
                    )}
                  </div>
                </div>

                {/* Manual secret */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Can&apos;t scan? Enter this key manually:
                  </p>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <code className="text-xs font-mono text-foreground flex-1 break-all select-all">
                      {secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy secret"
                    >
                      {secretCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      supabase.auth.mfa.unenroll({ factorId });
                      setMfaState('inactive');
                      setOtpError(null);
                    }}
                    className="px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setMfaState('verifying'); setOtpError(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    Next — Enter Code →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Verifying: enter 6-digit code ── */}
        {mfaState === 'verifying' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Step 2:</strong> Enter the 6-digit code currently
              shown in your authenticator app.
            </p>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Authenticator Code
              </label>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="000000"
                className="w-full max-w-[160px] px-3 py-2.5 rounded-lg bg-background border border-border text-xl font-mono text-center text-foreground tracking-[0.4em] focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
              />
            </div>

            {otpError && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {otpError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setMfaState('enrolling'); setOtpError(null); setOtp(''); }}
                className="px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleVerify}
                disabled={isPending || otp.length !== 6}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {isPending ? 'Verifying…' : 'Activate 2FA'}
              </button>
            </div>
          </div>
        )}

        {/* ── Active: show status + unenroll ── */}
        {mfaState === 'active' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="text-foreground font-semibold">2FA is active on this account.</p>
                <p className="text-muted-foreground mt-0.5">
                  Your next login will require a 6-digit code from your authenticator app after
                  entering your password.
                </p>
              </div>
            </div>

            {otpError && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {otpError}
              </p>
            )}

            <button
              onClick={() => setShowUnenrollConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Remove 2FA
            </button>
          </div>
        )}
      </div>

      {/* ── Unenroll confirmation modal ── */}
      {showUnenrollConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <button
              onClick={() => setShowUnenrollConfirm(false)}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Remove 2FA?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account will only require a password to sign in.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowUnenrollConfirm(false)}
                className="flex-1 px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnenroll}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {isPending ? 'Removing…' : 'Yes, Remove 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── Passkeys & Hardware Keys Card ── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border bg-muted/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Passkeys & Hardware Keys</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in securely without a password using Touch ID, Windows Hello, or a YubiKey.
              </p>
            </div>
          </div>
          {isPasskeysLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
          ) : (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border bg-muted text-muted-foreground border-border uppercase tracking-wider shrink-0">
              {passkeys.length} Registered
            </span>
          )}
        </div>

        <div className="p-6 space-y-4">
          {passkeyError && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {passkeyError}
            </p>
          )}

          {isPasskeysLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : passkeys.length === 0 ? (
            <div className="flex items-start gap-3 p-4 bg-muted/40 border border-border/60 rounded-xl">
              <KeyRound className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="text-foreground font-medium">No passkeys registered</p>
                <p className="mt-1">
                  Add a passkey to securely log in with a fingerprint, face scan, or hardware key
                  instead of typing a password.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((pk) => (
                <div key={pk.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {pk.friendly_name || 'Unnamed Passkey'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Added {new Date(pk.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(pk.id)}
                    className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Remove Passkey"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleRegisterPasskey}
            disabled={isPasskeysLoading || isRegisteringPasskey}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isRegisteringPasskey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
            {isRegisteringPasskey ? 'Registering…' : 'Register New Passkey'}
          </button>
        </div>
      </div>
    </div>
  );
}
