# Laptop Tycoon — Game Design Document

## Overview

A text-driven tycoon game where the player runs a laptop company from 2000 onwards. The core fantasy is reading the market, speccing the right machine, and finding your niche. No art assets — driven entirely by text and basic UI elements.

**Tech stack:** Electron / React / TypeScript

**MVP scope:** 2000–2005, with the full component database and simulation tuned for this era before expanding.

---

## Core Loop

1. **Design a laptop** (metadata → screen size → components → body → review)
2. **Set price and order manufacturing quantity**
3. **Year passes** — sales simulation runs, reviews and awards are generated
4. **Collect revenue**, review results, read demographic breakdowns
5. **Repeat** with new components available and market conditions shifted

---

## Designing a Laptop

### Model Types

The player may have up to **2 models** on sale simultaneously. When creating a model, they choose one of:

- **Brand New:** Fresh design. No loyalty base. Full body + component design from scratch. Highest cost.
- **Successor:** Inherits the loyalty base and niche reputation of a previous model. Market expects the niche to carry over — if it doesn't, loyalty erodes. New body + new components.
- **Spec Bump:** Reuses the previous model's body and screen size. Only component slots (Processing, Display & Media, Connectivity & Power) can be changed — Screen Size and Body steps are locked to the predecessor's choices. No body R&D cost, lower overall R&D cost. Retains loyalty base. Improvement may be limited by carrying over an older chassis design.

### Design Wizard Flow

#### Step 1 — Metadata

Name the laptop and choose model type (Brand New, Successor, or Spec Bump). For Successor or Spec Bump, select the predecessor model from a dropdown showing name and year.

#### Step 2 — Screen Size

Choose a screen size (10"–18") via slider. This gates all downstream decisions (chassis options, cooling capacity, battery space, weight). Each size has fixed base stats for cooling capacity (W), battery capacity (Wh), and base weight (g). Larger screens offer more cooling and battery headroom but are heavier.

Screen size acts as a **soft filter with penalties** in the sales simulation. Each buyer segment has a preferred screen size range. Offering a different size applies a purchase-likelihood penalty that scales with how far you are from their preference (per-inch penalty defined per demographic).

#### Step 3 — Components

Pick era-appropriate parts for each slot. The wizard displays cost, power draw, and stat contributions. Running totals are shown throughout.

**Component slots:**

- CPU
- GPU (or integrated graphics)
- RAM
- Storage (HDD/SSD, capacity)
- Display panel
- Battery
- WiFi / Bluetooth
- Webcam
- Speakers
- Ports / Connectivity

**Component availability:**

- Each component has an "available from" year and a cost curve that decreases over time as the tech matures.
- Cutting-edge components exist early at high cost (e.g., SSDs in 2006). Being first is expensive but builds niche reputation fast.
- Outdated components disappear from the list after a few years (manufacturer discontinuation).
- The number of choices per slot grows in later eras.

#### Step 4 — Body / Chassis

Given screen size and chosen components, configure the physical shell:

- **Material:** Plastic / Aluminium / Magnesium alloy / Carbon fibre (era-appropriate availability). Affects weight, cost, build quality, and Design stat.
- **Thickness target:** Thinner = better portability scores, but less cooling headroom and battery space.
- **Build quality / structural rigidity:** Can skimp to save cost and weight, at the expense of durability.
- **Keyboard features:** Per-era options such as key travel depth, backlit keys (later eras), layout quality. Specific features rather than abstract quality tiers.
- **Trackpad features:** Per-era options such as trackpoint, buttonless trackpad, haptic feedback, invisible trackpad (later eras).

The wizard flags issues during this phase: "This chassis can only dissipate 45W — your components draw 65W. Expect thermal throttling and high noise." or "This battery + these components = ~3hr battery life."

#### Step 5 — Review

Full stat block with both raw specs and market-relative scores. Estimated cost per unit. Comparison view against your other model and all competitor models.

---

## Laptop Stats

### Component-Driven

| Stat | Derived From |
|------|-------------|
| Performance | CPU + RAM + storage speed |
| Gaming Performance | GPU + CPU + RAM + thermals (throttle penalty) |
| Battery Life | Battery capacity + total component power draw + display power |
| Display | Panel choice (resolution, colour accuracy, refresh rate, brightness) |
| Connectivity | Ports, WiFi/Bluetooth generation |
| Speakers | Speaker component choice |
| Webcam | Webcam component choice |

### Chassis/Design-Driven

| Stat | Derived From |
|------|-------------|
| Design | Aesthetic tier of body, material choice |
| Material / Build Quality | Material + structural rigidity setting |
| Keyboard | Keyboard feature selections |
| Trackpad | Trackpad feature selections |
| Maintenance / Repairability | Chassis design choices (screws vs glue, modular vs soldered) |
| Weight | Chassis + all component weights + material density |
| Thinness | Thickness target setting |
| Thermals | Component TDP vs chassis cooling capacity (single combined stat for noise + temperature) |

### Spending-Driven

| Stat | Derived From |
|------|-------------|
| Support & Service | Money allocated per unit per year × number of years of support commitment |

### Stat Display

Two layers shown to the player at all times:

- **Spec sheet (raw values):** Real units — GHz, GB, kg, mm, mAh. Immersion and nostalgia.
- **Market-relative scores (1–100):** Recalculated each year against the current competitive field. A 2.0kg laptop scores 70/100 in 2002, 30/100 in 2020 (just an example). This is what the sales simulation uses.

---

## Manufacturing & Pricing

### Setting Price

Player sets the retail price per unit for each model.

### Ordering Quantity

Player commits to a manufacturing quantity before the year begins. Units are paid for upfront.

**Economies of scale:** Cost per unit decreases with volume ordered. Diminishing returns curve:

```
unit_cost = base_cost × (1 / (1 + 0.4 × log10(units_ordered / reference_quantity)))
```

**Multiple model overhead:** Running 2 distinct models incurs additional tooling/overhead costs beyond the per-unit manufacturing.

### Demand Projection

After design is finalised but before committing to a quantity, the player sees a projected demand range (e.g., "25,000–40,000 units"). The range tightens as brand recognition grows. This is derived from the same sales simulation that determines actual results.

### Unsold Inventory

Unsold units are written off. If you order 50,000 and sell 30,000, you eat the cost on 20,000. No carryover, no clearance system.

### Cash Flow

Simple model: costs are deducted when the manufacturing order is placed (player can go negative at this point). Revenue is added at end of year. If the player is still negative after year-end revenue, **game over**.

---

## Sales Simulation

### Buyer Demographics

Each buyer type has:

- A **weight vector** across all laptop stats
- A **price sensitivity** level
- A **population size** that shifts over the years
- A **screen size preference** distribution (soft filter with penalties)

| Demographic | Key Stats Valued | Price Sensitivity | Notes |
|-------------|-----------------|-------------------|-------|
| Corporate / Enterprise | Keyboard, support, build quality, reliability | Low (per unit), bulk orders | Values long support windows. Steady presence. |
| Business Professional | Design, portability, keyboard, performance | Moderate | Grows as laptops replace desktops. |
| Student | Price, battery, portability, performance | Very high | Large population throughout. |
| Creative Professional | Display, performance, build quality, design | Low | Small but high margin. Grows significantly post-2010. |
| Gamer | Gaming perf, display, thermals | Moderate | Tiny pre-2005, explodes after. |
| Tech Enthusiast | Performance, value-for-money, connectivity, repairability | Moderate | Small but outsized effect on brand reputation. Tastemakers. |
| General Consumer | Price, brand recognition, design | High | Largest group. Heavily influenced by marketing and brand. |
| Budget Buyer | Price above all else | Extreme | Tolerates bad everything if cheap. No brand loyalty. |

### Market Share Calculation

Each year, each buyer demographic has a **total demand pool** (grows over time as laptops become ubiquitous).

For each laptop (player's + competitors'), calculate an **appeal score** per demographic:

```
appeal = weighted_stat_score × price_competitiveness × brand_fit × loyalty_modifier
```

Where:

- **Weighted stat score:** Dot product of the laptop's market-relative stats and the demographic's weight vector
- **Price competitiveness:** How the laptop's price compares to what this demographic expects for this stat profile
- **Brand fit:** Does the brand have niche reputation matching what this demographic cares about?
- **Loyalty modifier:** For successors/spec bumps, returning customers from the previous model

**Market share** per demographic = laptop's appeal / sum of all appeals in that demographic.

**Units demanded** = market share × demand pool.

**Actual units sold** = min(units demanded, units manufactured).

### Sales Noise

Actual sales = sampled from a distribution centred on the simulation output, with **±10–15% variance**. This prevents purely deterministic outcomes and makes the ordering decision a calculated risk, not a solved puzzle. The demand projection shown to the player is the confidence interval of this distribution.

### Market Weight Shifts

Buyer demographic weight vectors drift over time with **momentum** (slow, consistent shifts, not sudden reversals):

```
new_weight = old_weight × 0.85 + era_target × 0.15 + small_random_noise
```

Era target vectors are predefined at anchor points (2000, 2005, 2010, 2015, 2020, 2025) and interpolated between them. This creates natural transitions — the market gradually prioritises battery life over 2010–2020 without abrupt jumps.

---

## Brand Reputation

Two dimensions:

### Brand Recognition (0–100)

How many people have heard of you. Affects General Consumer and Budget Buyer demographics heavily.

- Grows with: sales volume, marketing spend, time in market.
- Decays with: inactivity (no products on sale), poor sales.

Also affects accuracy of demand projections (higher recognition = tighter estimate range).

### Niche Reputation (vector across stat categories)

Where the market believes your brand is strong. For example, a brand known for great displays and build quality.

- Built by: consistently shipping laptops that score well in a niche.
- Erodes when: you shift away from your established niche.
- **Tech Enthusiast multiplier:** Tech Enthusiast perception accelerates niche reputation movement (positive or negative). They are the tastemakers.

---

## Marketing

Part of the manufacturing wizard. The player selects one ad campaign per model before committing to manufacturing.

### Ad Campaigns

Five campaign tiers with increasing risk/reward:

| Campaign | Base Cost | Risk | Sales Impact Range |
|----------|-----------|------|-------------------|
| No Campaign | Free | None | 0% (guaranteed) |
| Product Showcase | $2,000,000 | Low | +1% to +10% |
| Lifestyle Campaign | $1,200,000 | Medium | -3% to +20% |
| Comparative Ad | $600,000 | High | -10% to +30% |
| Stunt / Viral | $200,000 | Very High | -20% to +40% |

Each campaign has a **skew-normal distribution** defining the probability of different sales impact outcomes. Higher-risk campaigns are cheaper but have wider variance and negative skew (downside tail is fatter).

### Campaign Cost Inflation

Campaign costs inflate at **3% per year** from the base year (2000):

```
actual_cost = base_cost × 1.03^(current_year - 2000)
```

### Sales Impact

The campaign's outcome is sampled from its distribution at year-end. The result is a percentage modifier applied to demand:

```
adjusted_demand = base_demand × (1 + campaign_bonus / 100)
```

The player sees the distribution shape (via a chart) and the min/mean/max range before choosing, but the actual outcome is only revealed after the year simulates.

---

## Press Release

Part of the manufacturing wizard. The player answers short-form prompts that shape how the laptop is perceived at launch.

### Prompt System

Each manufacturing plan includes **3 press release prompts** randomly selected from a pool of 12. Prompts are short questions about the laptop's positioning:

- "Describe this laptop in one phrase."
- "What's the single standout feature?"
- "Who is this laptop built for?"
- "What problem does this laptop solve?"
- "How does this compare to your previous model?" *(only for successors)*
- "What should customers expect from the build quality?"
- "Sum up this laptop in one word, then explain."
- "Why pick this over a competitor?"
- "What doesn't show up in the spec sheet?"
- "If you could only keep one feature, which one?"
- "What compromises did you make, and why?"
- "What's your ambition for this product line?"

### Constraints

- **Character limit:** 150 characters per response.
- **No repeat sets:** The system avoids presenting the exact same 3 prompts as the player's previous manufacturing plan.
- **Model-type gating:** Some prompts (e.g., "How does this compare to your previous model?") only appear for successor or spec bump models.

### Effect on Game

Press release responses feed into the **review generation system**. Reviewer templates can quote the player's responses, creating a feedback loop between marketing claims and critical reception. Overpromising relative to actual specs risks negative review commentary.

---

## AI Competitors

### MVP: 3 Competitors

Each has an archetype, a niche focus, and simple decision rules for generating 1 laptop model per year.

| Competitor | Archetype | Strategy |
|-----------|-----------|----------|
| Budget Brand | Aggressive pricing, low quality | Targets Student and Budget Buyer. Lower quartile on build quality, design, support. Upper quartile on price competitiveness. |
| Premium Brand | High quality, overpriced | Targets Business Professional and Creative. Upper quartile on design, display, build quality. Consistently overprices by 10–15%. |
| Generalist | Middle of the road | Targets General Consumer. Never leads on any stat. Competitive pricing. |

**Component selection algorithm:** Each competitor has stat priorities. For stats they care about, they pick upper-quartile components. For stats they don't, they pick lower-quartile options. (These percentiles can be tuned — not always strictly upper/lower.)

**Balance lever:** If competitors are too weak or too strong, apply a hidden "engineering bonus" modifier to their stat output. Purely for balance, not exposed to the player.

**Visibility:** All competitor laptops are fully visible to the player — full stat blocks (raw + market-relative), price, screen size. No hidden information about the products themselves. The only hidden information is competitor sales figures (available via paid demographic breakdowns — post-MVP).

*For development, use real brand names (Dell, HP, Lenovo, etc.). Replace with fictional names for release.*

---

## Reviews & Awards

### Laptop Reviews

When a laptop launches, 2 generated reviews appear:

- **Tech Enthusiast outlet:** Evaluates through the lens of performance, value, repairability, connectivity.
- **Mainstream outlet:** Evaluates through the lens of design, price, ease of use, brand.

Each review is assembled from **sentence templates**. The template system reads the laptop's stat profile relative to the competition and selects appropriate commentary.

**Template structure:** Keyed by `stat → sentiment (good/neutral/bad) → intensity (slightly above average / best in class / etc.) → [array of template strings]`.

Templates use placeholder variables: `{{laptop}}`, `{{competitor}}`, `{{rawSpec}}`, `{{score}}`, etc.

Each review touches ~8–10 template slots (intro, 5–6 stat commentaries, comparison line, verdict, final score out of 10).

### Year-End Awards

A magazine-style summary at the end of each year. Award categories:

- Best Overall
- Best Value
- Best Portable
- Best Performance
- Best for Business
- (Additional categories can be added)

Determined by highest scorer in each relevant stat/segment combination. Player and AI competitors are all eligible.

**Winning an award = small brand reputation boost** in the corresponding niche.

### Template Budget

**Estimated templates needed:**

| Category | Count |
|----------|-------|
| Stat commentary (16 stats × 3 sentiments × 4 variants) | ~192 |
| Structural (intro/outro/comparison/verdict × 4 variants) | ~40 |
| Award announcements (8 categories × 4 variants) | ~32 |
| Award scene-setting intros | ~10 |
| **Subtotal** | **~274** |
| **×2 for comfortable non-repetition** | **~550** |

Templates are stored in a JSON file. Can be batch-written and refined for voice consistency.

---

## Paid Information (Deferred — Post-MVP)

*For the prototype, show full sales breakdowns for free. Add the cost mechanic later.*

Post-year, the player can pay for a detailed demographic breakdown: which buyer segments purchased their laptops, in what quantities, and how their appeal score compared to competitors in each segment.

---

## Progression & End State

**Sandbox mode.** No explicit win condition or score target.

**Timeline:** 2000–2026. After 2026, no new components are introduced — the game continues but the market is frozen in terms of available technology.

**Game over:** If the player's cash balance is negative after year-end revenue is collected.

---

## MVP Feature Checklist (2000–2005 Prototype)

### In Scope

- [ ] Design wizard (screen size → components → body → review)
- [ ] Real, era-accurate component database for 2000–2005
- [ ] Keyboard and trackpad as separate stats with specific per-era feature options
- [ ] 2 model slots with new/successor/spec-bump system
- [ ] Manufacturing orders with economies of scale
- [ ] Pricing per model
- [ ] Demand projection with confidence interval
- [ ] Sales simulation with 8 buyer demographics
- [ ] Momentum-based market weight shifting
- [ ] 3 AI competitors (budget, premium, generalist), 1 model each, full stats visible
- [ ] Brand recognition + niche reputation vector
- [ ] Laptop reviews (2 per model, template-driven)
- [ ] Year-end awards
- [ ] ~550 sentence templates for reviews and awards
- [ ] Marketing campaigns (5 tiers, skew-normal distributions, cost inflation)
- [ ] Press release prompts (3 per model from pool of 12, feeds into reviews)
- [ ] Unsold inventory written off
- [ ] Game over on negative cash after year-end
- [ ] Thermals as single collapsed stat (noise + temperature)

### Deferred to Post-Prototype

- [ ] Paid demographic breakdowns
- [ ] Timeline beyond 2005
- [ ] More AI competitors / multiple models per competitor
- [ ] Model cap beyond 2

### Out of Scope (Permanently)

- Employees / hiring
- Supply chain management
- R&D tech trees
- OS variation
- Market influence (Apple-style demand creation)
- Art assets
