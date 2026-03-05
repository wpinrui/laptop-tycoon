# Laptop Tycoon - Project Context

## Overview

Text-driven tycoon game where the player runs a laptop company from 2000 onwards. Design laptops, set pricing, order manufacturing, and compete against AI rivals. No art assets — driven entirely by text and basic UI elements.

**MVP scope:** 2000–2005, with full component database and simulation tuned for this era.

## Tech Stack

- **Framework**: Electron + React + TypeScript
- **State**: TBD (likely Zustand)
- **Package Manager**: yarn
- **Platform**: Desktop (Windows, Mac, Linux)

## Core Loop

1. Design a laptop (screen size → components → body → tweaks → review)
2. Set price and order manufacturing quantity
3. Year passes — sales simulation runs, reviews and awards generated
4. Collect revenue, review results
5. Repeat with new components and shifted market conditions

## Key Systems

### Design Wizard
- Step 1: Screen size (in inches, era-appropriate range)
- Step 2: Components (CPU, GPU, RAM, Storage, Display, Battery, WiFi, Webcam, Speakers, Ports)
- Step 3: Body/Chassis (Material, thickness, build quality, keyboard, trackpad)
- Step 4: Review with full stat block

### Model Types
- **Brand New**: Fresh design, no loyalty base, highest cost
- **Successor**: Inherits loyalty/reputation, new body + components
- **Spec Bump**: Reuses body, component upgrades only, cheapest

### Laptop Stats
- **Component-driven**: Performance, Gaming Performance, Battery Life, Display, Connectivity, Speakers, Webcam
- **Chassis-driven**: Design, Material/Build Quality, Keyboard, Trackpad, Maintenance, Weight, Thinness, Thermals
- **Spending-driven**: Support & Service
- Two display modes: raw specs (GHz, GB, kg) and market-relative scores (1–100)

### Manufacturing & Pricing
- Player sets retail price per unit
- Manufacturing quantity with economies of scale curve
- Multiple model overhead costs
- Demand projection with confidence intervals
- Unsold inventory written off (no carryover)
- Costs deducted upfront, revenue at year-end

### Sales Simulation
- 8 buyer demographics with stat weight vectors and price sensitivity
- Appeal score: weighted_stat_score × price_competitiveness × brand_fit × loyalty_modifier
- ±10–15% sales variance
- Market weight shifts with momentum (anchor points at 2000, 2005, 2010, 2015, 2020, 2025)

### Brand Reputation
- Brand Recognition (0–100): awareness level, grows with sales/marketing
- Niche Reputation: vector across stat categories, built by consistency

### AI Competitors (MVP: 3)
- Budget Brand: aggressive pricing, low quality
- Premium Brand: high quality, overpriced
- Generalist: middle of the road

### Reviews & Awards
- 2 template-driven reviews per laptop (Tech Enthusiast + Mainstream)
- Year-end awards (Best Overall, Best Value, Best Portable, etc.)
- ~550 sentence templates for non-repetition

## Game Over
- Cash balance negative after year-end revenue collection

## Key Design Docs
- `laptop-tycoon-gdd.md` - Full game design document (source of truth)

## Deferred Features (Post-MVP)
- Marketing subsystem
- Paid demographic breakdowns
- Timeline beyond 2005
- More AI competitors / multiple models per competitor
- Model cap beyond 2
