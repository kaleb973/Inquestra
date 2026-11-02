# Inquestra ELN

A reproducible, real-time Electronic Lab Notebook and bench data acquisition workspace for wet-lab and engineering research.

## Language

**Trial**:
A single experimental run containing timestamped observations, notes, attached data, and linked protocols.
_Avoid_: Experiment, run, session, doc

**Protocol**:
A structured, sequential bench procedure embedded within a Trial that provides interactive step countdown timers and checkpoints.
_Avoid_: Recipe, procedure, workflow, SOP

**Local Notebook**:
A private notebook saved directly in your browser's local storage that works immediately without an account.
_Avoid_: Sandbox, playground, demo, guest session

**Cloud Notebook**:
A notebook backed by remote storage and database sync for cross-device access and team sharing.
_Avoid_: Account workspace, profile space, enterprise environment

## Relationships

- A **Trial** belongs to either a **Local Notebook** or a **Cloud Notebook**
- A **Trial** embeds zero or more **Protocols**
- A **Local Notebook** can be saved into a **Cloud Notebook** at any time

## Example dialogue

> **Researcher:** "Do I have to register before I can write down my protocol?"
> **Dev:** "No, you're already in your **Local Notebook** — everything saves right in your browser until you choose to back it up."

## Flagged ambiguities

- "Sandbox" was previously used to describe the unauthenticated mode — resolved: replaced with **Local Notebook** to use plain, natural laboratory terminology instead of developer jargon.
