// src/store/useAuthStore.ts
// Zustand authentication state machine for Inquestra.
// Handles pre-auth risk assessment, HTTP 428 Step-Up Challenges, and credentials retention.

import { create } from 'zustand';

export type AuthStatus =
  | 'idle'
  | 'submitting'
  | 'challenge_required'
  | 'verifying_challenge'
  | 'mfa_required'
  | 'success'
  | 'error';

export interface AuthState {
  email: string;
  password: string;
  status: AuthStatus;
  errorMessage: string | null;
  riskScore: number | null;
  riskReasons: string[];
  challengeToken: string | null;
  factorId: string | null;

  // Actions
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setChallengeToken: (token: string | null) => void;
  resetError: () => void;
  submitLogin: (tokenOverride?: string) => Promise<{
    success: boolean;
    challengeRequired?: boolean;
    mfaRequired?: boolean;
    factorId?: string;
    error?: string;
  }>;
  solveInlineChallenge: () => Promise<string>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  email: '',
  password: '',
  status: 'idle',
  errorMessage: null,
  riskScore: null,
  riskReasons: [],
  challengeToken: null,
  factorId: null,

  setEmail: (email) => set({ email, errorMessage: null }),
  setPassword: (password) => set({ password, errorMessage: null }),
  setChallengeToken: (challengeToken) => set({ challengeToken }),
  resetError: () => set({ errorMessage: null }),

  submitLogin: async (tokenOverride) => {
    const { email, password, challengeToken } = get();
    const token = tokenOverride ?? challengeToken;

    set({ status: 'submitting', errorMessage: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-turnstile-token': token } : {}),
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          challengeToken: token ?? undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      // HTTP 428: Precondition Required -> Reveal Inline Verification Challenge
      if (response.status === 428) {
        set({
          status: 'challenge_required',
          riskScore: data.riskScore ?? null,
          riskReasons: Array.isArray(data.reasons) ? data.reasons : [],
          errorMessage: data.message ?? 'Security verification required to proceed.',
        });
        return { success: false, challengeRequired: true };
      }

      // HTTP 403: High risk drop
      if (response.status === 403) {
        set({
          status: 'error',
          errorMessage: data.error ?? 'Access blocked by automated security controls.',
          riskScore: data.riskScore ?? null,
        });
        return { success: false, error: data.error };
      }

      // HTTP 401: Invalid credentials
      if (response.status === 401) {
        set({
          status: 'error',
          errorMessage: data.error ?? 'Invalid email or password.',
        });
        return { success: false, error: data.error };
      }

      // HTTP 503: Concurrency throttle
      if (response.status === 503) {
        set({
          status: 'error',
          errorMessage: 'Server is experiencing high volume. Retrying shortly...',
        });
        return { success: false, error: 'Server busy' };
      }

      // Check for MFA step
      if (data.mfaRequired && data.factorId) {
        set({
          status: 'mfa_required',
          factorId: data.factorId,
        });
        return { success: true, mfaRequired: true, factorId: data.factorId };
      }

      // Success
      if (response.ok && data.success) {
        set({ status: 'success' });
        return { success: true };
      }

      // Other error
      const errorMsg = data.error ?? `Authentication failed (status ${response.status})`;
      set({ status: 'error', errorMessage: errorMsg });
      return { success: false, error: errorMsg };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error during login.';
      set({ status: 'error', errorMessage: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Generates a sub-second client-side Proof-of-Work token if Turnstile is unavailable.
   */
  solveInlineChallenge: async () => {
    set({ status: 'verifying_challenge' });
    const timestamp = Date.now();
    let nonce = 0;
    let foundHash = '';

    // Lightweight browser SHA-256 worker / loop searching for leading zeros
    while (nonce < 100_000) {
      const candidate = `${timestamp}:${nonce}`;
      const msgBuffer = new TextEncoder().encode(candidate);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      if (hex.startsWith('000')) {
        foundHash = hex;
        break;
      }
      nonce++;
    }

    const token = `pow:${timestamp}:${nonce}:${foundHash}`;
    set({ challengeToken: token, status: 'challenge_required' });
    return token;
  },

  reset: () =>
    set({
      email: '',
      password: '',
      status: 'idle',
      errorMessage: null,
      riskScore: null,
      riskReasons: [],
      challengeToken: null,
      factorId: null,
    }),
}));
