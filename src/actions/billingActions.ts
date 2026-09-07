'use server';
// src/actions/billingActions.ts
// Stripe billing — deferred. Will be implemented when the platform is ready
// for commercial launch. Currently a no-op stub.

export async function createCheckoutSession(_tier: 'pro' | 'enterprise') {
  throw new Error('Billing is not yet enabled. Coming soon.');
}

export async function createPortalSession() {
  throw new Error('Billing is not yet enabled. Coming soon.');
}
