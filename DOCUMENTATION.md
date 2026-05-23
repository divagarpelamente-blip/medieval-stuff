# Medieval Stuff - Project Documentation

## Project Overview
**Medieval Stuff** (Eldoria) is a premium, mobile-first gamified web application built with a modern tech stack. The application simulates a medieval kingdom management experience where players manage buildings, collect resources, and interact with a dynamic, high-fidelity landscape.

## Tech Stack
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS (Modern aesthetics, glassmorphism, responsive design)
- **Backend:** Supabase (PostgreSQL, Authentication, Real-time state)
- **Design:** Vector-style isometric artwork with high-fidelity background integration.

## Core Features

### 1. Dynamic Interactive Map
The heart of the application is the `IsometricMap` component. Recently revamped, it uses a high-fidelity background image (`Medieval_Town_Backround.png`) with a custom **HitZone System**:
- **Invisible HitZones:** Instead of floating building sprites, the map uses transparent, hover-aware interactive zones perfectly aligned with the background artwork.
- **Tooltips:** Hovering over a zone reveals the building name in a premium, medieval-themed tooltip.
- **Perspective Scaling:** Interactive zones are scaled and positioned according to the landscape's depth.

### 2. Management Systems (Modals)
Each building area triggers a management modal with unique thematic styling:
- **Royal Treasury:** Manage gold collection and building upgrades.
- **Gold Mine:** Primary resource extraction point.
- **Central Market:** Trading hub for items and resources.
- **Town Hall:** The central administrative hub of the kingdom.
- **Bounty Board:** Access contracts for fame and fortune.
- **The Tavern:** Hire mercenaries and gather rumors.
- **Village Housing:** Manage population and residential growth.
- **Enchanted Lake:** A "secret" forest area for special interactions.

### 3. Real-time Resource Logic
- **Passive Income:** Buildings generate resources (Gold) based on their level.
- **Automated Calculations:** The app calculates accumulated resources since the last login/collection using server-side timestamps.
- **HUD (Heads-Up Display):** Real-time tracking of Gold, Gems, and Active Missions.

### 4. Treasury Financial System
The Royal Treasury features a sophisticated accounting suite:
- **Royal Ledger:** A data-driven system for registering daily financial transactions.
- **CSV Import:** Capability to bulk-import historical records from external archives.
- **Account Management:** Track liabilities, loans, and recurring expenses using the **Dragon Finance Model**.

### 5. Dragon Finance Model
A thematic metaphorical model for managing kingdom liabilities:
- **Metaphor:** Debts are represented as **Dragons** with RPG-style stats (HP, Regeneration, Shield).
- **Core Concept:** Paying principal "deals damage" to the dragon's health, while interest causes the dragon to "regenerate" its HP.
- **Strategic Layers:** Status effects like *Enraged* (Overdue) or *Frozen* (Limit Reached) impact treasury decisions.

## Project Structure
- `/client`: Frontend React application.
  - `/src/components`: UI components (`IsometricMap`, `HUD`, `Modal`, `Auth`, etc.)
  - `/src/assets`: High-quality PNG assets and icons.
- `/server`: Node.js/Supabase backend logic (if applicable).
- `/backups`: Versioned project state snapshots.

## Recent Major Changes (Revamp)
- **Full Translation:** Migrated entire UI from Portuguese to English.
*   **Asset Migration:** Replaced all individual building placeholders with a single high-fidelity town background.
*   **HitZone Implementation:** Developed the invisible interactive layer for the town map.
*   **Scale Refinement:** Optimized building sizes and positions for realistic perspective.
*   **Feature Expansion:** Added Bounty Board and Tavern interaction logic.

---
*Last Updated: 2026-05-16*
