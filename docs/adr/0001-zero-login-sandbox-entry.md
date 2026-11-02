# Zero-Login Local Notebook Entry

To eliminate onboarding drop-off and overcome cold-start skepticism from researchers, Inquestra will open directly into a private, browser-stored Local Notebook without requiring an account upfront.

## Status

accepted

## Context

Inquestra initially required authentication for `/app`, redirecting all new visitors to `/app/login`. Cold outreach to researchers yielded high bounce rates because academic researchers will not create an account or provide credentials for an unproven tool from an independent developer.

## Decision

We will remove the mandatory login gate on the primary notebook URL. First-time visitors immediately enter a **Local Notebook** powered by client-side browser storage (Zustand + `localStorage`). Full functionality—including protocol steps, rich text editing, serial DAQ streaming, and local data persistence—is available without authentication. Users can back up to a **Cloud Notebook** whenever they want cross-device sync or team sharing.

## Consequences

- Eliminates time-to-value friction; anyone with the link can test the tool within seconds.
- Requires robust local export (Markdown/JSON) and an upgrade path that migrates local notebook trials into a cloud account upon signup.
- Protects researcher privacy by avoiding unnecessary data collection upfront.
