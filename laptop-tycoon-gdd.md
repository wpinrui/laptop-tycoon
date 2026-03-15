# Laptop Tycoon — Game Design Document

## Overview

A text-driven tycoon game where the player runs a laptop company from 2000 onwards. The core fantasy is reading the market, speccing the right machine, and finding your niche. No art assets — driven entirely by text and basic UI elements.

**Tech stack:** Electron / React / TypeScript

**MVP scope:** 2000–2005, with the full component database and simulation tuned for this era before expanding.

---

## Core Loop

1. **Each quarter (Q1–Q4):**
   a. Design wizard available — design new laptop(s) if model slots are open (available any quarter before simulation runs)
   b. Manufacturing wizard available — set/adjust price, order units
   c. Manage marketing channels (activate/deactivate, set aggressive or premium mode)
   d. Sales simulation runs for that quarter's buyer pool
   e. Revenue collected, cash balance updated
   f. After Q1: laptop reviews are published
   g. After Q4: year-end awards, annual perception/reach update, advance to next year
2. **Repeat** — new components unlock as years progress

---

## Designing a Laptop

### Model Types

The player may have up to **2 models** on sale simultaneously. When creating a model, they choose one of:

- **Brand New:** Fresh design. Full body + component design from scratch. Highest R&D cost.
- **Successor:** Pre-populates component selections from a predecessor model. New body + new components. Reduced R&D cost. No special sales advantage over Brand New — purely a design-flow and cost distinction.
- **Spec Bump:** Reuses the previous model's body and screen size. Only component slots (Processing, Display & Media, Connectivity & Power) can be changed — Screen Size and Body steps are locked to the predecessor's choices. Lowest R&D cost. Improvement may be limited by carrying over an older chassis design.

### Design Wizard Flow

#### Step 1 — Metadata

Name the laptop and choose model type (Brand New, Successor, or Spec Bump). For Successor or Spec Bump, select the predecessor model from a dropdown showing name and year.

#### Step 2 — Screen Size

Choose a screen size (10"–18") via slider. This gates all downstream decisions (chassis options, cooling capacity, battery space, weight). Each size has fixed base stats for cooling capacity (W), battery capacity (Wh), and base weight (g). Larger screens offer more cooling and battery headroom but are heavier.

Different demographics prefer different screen sizes. This is reflected in the sales simulation.

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
- Cutting-edge components exist early at high cost (e.g., SSDs in 2006).
- Outdated components disappear from the list after a few years (manufacturer discontinuation).
- The number of choices per slot grows in later eras.

#### Step 4 — Body / Chassis

Given screen size and chosen components, configure the physical shell:

- **Material:** Plastic / Aluminium / Magnesium alloy / Carbon fibre (era-appropriate availability). Affects weight, cost, build quality, and Design stat.
- **Thickness target:** Thinner = better portability scores, but less cooling headroom and battery space.
- **Build quality / structural rigidity:** Can skimp to save cost and weight, at the expense of durability.
- **Keyboard features:** Per-era options such as key travel depth, backlit keys (later eras), layout quality. Specific features rather than abstract quality tiers.
- **Trackpad features:** Per-era options such as trackpoint, buttonless trackpad, haptic feedback, invisible trackpad (later eras).

**Volume & weight physics:** Battery technology improves across eras — both weight per Wh (14→4 g/Wh from 2000 to 2025) and volume per Wh (10→2.8 cm³/Wh) decrease as Li-Ion cylindrical cells give way to Li-Polymer pouches. Only 65% of gross chassis volume is usable for components (the rest is structural ribs, keyboard well, cable routing, hinge mechanisms, etc.). This means a 100 Wh battery in 2005 (800 cm³, 1.2 kg) physically cannot fit in a thin laptop, naturally constraining battery choices by era without artificial caps.

The wizard flags issues during this phase: "This chassis can only dissipate 45W — your components draw 65W. Expect thermal throttling and high noise." or "This battery + these components = ~3hr battery life."

#### Step 5 — Review

Full stat block with both raw specs and market-relative scores. Estimated cost per unit. Comparison view against your other model and all competitor models.

---

## Laptop Stats

### Component-Driven

| Stat | Derived From |
|------|-------------|
| Performance | CPU + RAM + storage speed |
| Gaming Performance | GPU + CPU + RAM (proportionally throttled when cooling < power draw) |
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
| Weight | Chassis + all component weights + material density |
| Thinness | Thickness target setting |
| Thermals | Derived from cooling headroom ratio (effectiveCooling / totalPower). Scales linearly up to 1.5× headroom = max score, capped at 2×. When cooling < power, performance and gaming performance are proportionally throttled. |

### Stat Display

Two layers shown to the player at all times:

- **Spec sheet (raw values):** Real units — GHz, GB, kg, mm, mAh. Immersion and nostalgia.
- **Market-relative scores (0–100):** Normalised each year against the theoretical maximum for that stat (best possible single-stat build from available components). A 2.0kg laptop scores 70/100 in 2002, 30/100 in 2020 (just an example). Scores are intrinsic — they don't change based on what competitors build.

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

### Market Size Display

The manufacturing wizard shows the player the projected market size for the current quarter — the total number of active buyers expected to purchase a laptop.

**Layout:** A card displaying:
```
Projected market size for Q1
          40,000
       General Consumer
```

The demographic name is a dropdown selector. The player can switch between demographics to see each segment's market size. Defaults to showing the total across all demographics.

This is not a demand projection for the player's laptop — it's the size of the market the player is competing in. The player uses this information alongside their brand reach and product specs to decide how many units to order.

### Unsold Inventory

Unsold units carry over as inventory to the next year. If you order 50,000 and sell 30,000, the remaining 20,000 stay in stock and are available for sale next year alongside any new manufacturing batch. No clearance system.

### Cash Flow

Costs are deducted when a manufacturing order is placed (at any quarter). The player can go negative at this point. Revenue is collected quarterly as units sell, minus a **20% channel margin** (retailer cut). The company receives 80% of the retail price per unit sold.

Game over check occurs at the end of Q4 only. The player has the full year to recover from a bad quarter. If cash balance is negative after Q4 revenue is collected, the game is over.

Mid-year manufacturing orders (Q2–Q4) are costed independently — they do not benefit from the economies-of-scale discount of the original Q1 order.

---

## Sales Simulation

### Buyer Demographics

Each buyer type has:

- A **weight vector** across all laptop stats
- A **price sensitivity** level
- A **population size** that shifts over the years
- A **screen size preference** distribution (soft filter with penalties)

**Generalist Demographics (10):**

| Demographic | Key Stats Valued | Price Sensitivity | Notes |
|-------------|-----------------|-------------------|-------|
| Corporate / Enterprise | Keyboard, build quality, reliability | Low (per unit), bulk orders | Steady presence. |
| Business Professional | Design, portability, keyboard, performance | Moderate | Grows as laptops replace desktops. |
| Student | Price, battery, portability, performance | Very high | Large population throughout. |
| Creative Professional | Display, performance, build quality, design | Low | Small but high margin. Grows significantly post-2010. |
| Gamer | Gaming perf, display, thermals | Moderate | Tiny pre-2005, explodes after. |
| Tech Enthusiast | Performance, value-for-money, connectivity, thermals | Moderate | Small population. 2-year replacement cycle. |
| General Consumer | Price, design | High | Largest group. |
| Budget Buyer | Price above all else | Extreme | Tolerates bad everything if cheap enough. |
| Developer | Performance, keyboard, connectivity | Moderate | Grows significantly with software industry. |
| Education (K-12) | Price, build quality, battery | High | Institutional buyers. |

**Niche Demographics (10):**

| Demographic | Key Stats Valued | Price Sensitivity | Notes |
|-------------|-----------------|-------------------|-------|
| Video Editor | Performance, display, storage | Low | Needs raw power + colour accuracy. |
| 3D Artist / Architect | Gaming perf (GPU), display, performance | Low | GPU-dependent workflows. |
| Music Producer | Performance, connectivity, keyboard | Moderate | Audio I/O matters. |
| Esports Pro | Gaming perf, display, thermals | Moderate | 2-year replacement cycle. |
| Streamer | Gaming perf, webcam, connectivity | Moderate | Multi-tasking workflows. |
| Digital Nomad | Battery, weight, connectivity | Moderate | Portability above all. |
| Field Worker | Build quality, battery, weight | High | Rugged + long-lasting. |
| Writer | Keyboard, battery, weight | High | Keyboard quality is paramount. |
| Day Trader | Display, performance, connectivity | Low | Multi-monitor, fast refresh. |
| Desktop Replacement | Performance, gaming perf, display | Low | Power over portability. |

Each demographic also has a **permeability** value (0.0–1.0) that sets a floor on how quickly brand reach can grow even at 0% reach. Tech-permeable demographics (gamers, tech enthusiasts) grow reach faster from cold start; mass-market demographics (general consumer, corporate) require more sustained effort.

### Quarterly Structure

The game year is divided into 4 quarters. The annual pool of active buyers is split across quarters using a front-loaded distribution:

```
Q1: 8/15 of annual active buyers (~53%)
Q2: 4/15 (~27%)
Q3: 2/15 (~13%)
Q4: 1/15 (~7%)
```

This rewards getting the launch right — the majority of sales happen in Q1. The player can react to poor Q1 results by adjusting price or ordering more units in Q2–Q4, but most of the opportunity has already passed.

Each quarter, the player may:
- Design new laptops (if model slots are open, before the quarter is simulated)
- Reopen the manufacturing wizard for existing designs (adjust price, order additional manufacturing runs)
- Manage marketing channels (activate/deactivate, switch between aggressive and premium modes)

Additional manufacturing orders placed in Q2+ are calculated with their own independent economies-of-scale discount. They do not pool with the Q1 order. This creates a natural cost penalty for not forecasting correctly at launch.

### Step 1: Raw Value Proposition

For each laptop in the market (player + AI), for each demographic:

```
For each stat:
  normalized_stat = raw_stat / theoretical_max(stat, year)
  transformed_stat = viability_transform(normalized_stat, stat)

weighted_score = dot_product(transformed_stats, demographic_weight_vector)
price_score = e^(-retail_price / median_build_cost)
raw_vp = (weighted_score + price_score × price_weight) × screen_penalty
```

**Stat viability transform**: A non-linear curve `(1 - e^(-k·x)) / (1 - e^(-k))` applied to each normalized stat before weighting. This models the fact that near-zero values for critical stats (e.g. 1-hour battery, no WiFi) make a laptop nearly unsellable, while pushing already-good stats higher has diminishing returns. Each stat has its own steepness constant `k`:

| k value | Effect | Stats |
|---------|--------|-------|
| 5 | Very steep floor | connectivity |
| 4 | Strong floor + diminishing returns | batteryLife, performance |
| 3 | Moderate floor | thermals, display, weight, gamingPerformance |
| 2–2.5 | Mild curve | buildQuality, keyboard, trackpad, design, thinness |
| 1.5 | Nearly linear | speakers, webcam |

This ensures the optimiser (and sales engine) naturally land in sensible ranges rather than min-maxing binary outcomes.

**Theoretical max**: For each stat independently, the highest value that stat could reach in a valid laptop build this year — a virtual laptop optimised exclusively for that one stat. Computed once per year from the component/chassis database (no dependency on actual laptops built). This means a laptop's score is intrinsic and does not change based on competitor builds.

**Exponential price scoring**: `e^(-price / scaleFactor)` where scaleFactor is the median build cost for the year (median-tier component per slot, mid-range battery, one colour, 14" screen). This concentrates price sensitivity in the range where most laptops actually live — saving $30 on a $700 build matters more than saving $30 on a $2500 build. Price sensitivity per demographic is handled via the `price_weight` in each demographic's stat weight vector (higher weight = more price-sensitive).

### Step 2: Biased Value Proposition

```
brand_perception_mod = brand_perception[this_demographic] for this company  (-50 to +50)
biased_vp = raw_vp × (1 + brand_perception_mod / 100)
```

### Step 3: Demand Resolution

Active buyer pool calculation:

```
annual_active_buyers = demographic_population / replacement_cycle_years
quarterly_active_buyers = annual_active_buyers × (quarter_share / 15)
```

Where quarter_share is: Q1=8, Q2=4, Q3=2, Q4=1.

Replacement cycle varies by demographic:
- Tech Enthusiast: 2 years
- Developer: 2 years
- Esports Pro: 2 years
- Streamer: 2 years
- Business Professional: 3 years
- Student: 3 years
- Creative Professional: 3 years
- Gamer: 3 years
- General Consumer: 3 years
- Video Editor: 3 years
- 3D Artist: 3 years
- Music Producer: 3 years
- Digital Nomad: 3 years
- Day Trader: 3 years
- Corporate / Enterprise: 4 years
- Education (K-12): 4 years
- Field Worker: 4 years
- Writer: 4 years
- Desktop Replacement: 4 years
- Budget Buyer: 5 years

Everyone in the active buyer pool WILL buy a laptop. There is no "don't buy" option in the probability distribution. The replacement cycle already filters out people who aren't in the market this year.

```
For each company's laptop(s):
  effective_vp = biased_vp × (brand_reach[demographic] / 100)

purchase_probability = effective_vp / sum(all effective_vps across all companies)
units_demanded = quarterly_active_buyers × purchase_probability
units_sold = min(units_demanded, units_remaining_in_manufacturing_order)
```

Reach is a multiplier on competitive strength, not a gate on pool size. Low reach dilutes your effective VP (fewer people in the demographic consider you), high reach lets you compete at full strength. A company with 0% reach gets 0 effective VP and 0 share. Total units across all companies never exceeds the pool.

### Step 4: Sales Noise

```
noise_percent = uniform_random(10, 15)
direction = random_sign()  (50% chance +1, 50% chance -1)
actual_sales = units_sold × (1 + direction × noise_percent / 100)
```

Bimodal noise: each demographic's demand is nudged either up or down by 10–15%. This avoids clustering near the mean and creates more varied outcomes than uniform noise.

### Market Size (shown in manufacturing wizard)

The player sees the projected market size for the upcoming quarter — the total number of active buyers in the market. This can be filtered by demographic via a dropdown. The market size is calculated directly from `demographic_population / replacement_cycle_years × (quarter_share / 15)`.

This gives the player enough information to estimate their own demand based on their brand reach and product competitiveness, without the game solving the problem for them.

### Market Weight Shifts

*Not yet implemented.* Stat weight vectors are currently static per demographic.

**Planned:** Buyer demographic weight vectors drift over time with **momentum** (slow, consistent shifts, not sudden reversals):

```
new_weight = old_weight × 0.85 + era_target × 0.15 + small_random_noise
```

Era target vectors are predefined at anchor points (2000, 2005, 2010, 2015, 2020, 2025) and interpolated between them. This creates natural transitions — the market gradually prioritises battery life over 2010–2020 without abrupt jumps.

**Currently implemented instead:** Demand pool sizes (population) grow via year-based anchors with interpolation, so demographics get bigger/smaller over time even though what they care about stays constant.

---

## Brand System

Three components, each serving a distinct role in the sales funnel.

### Brand Reach (per demographic, 0–100%)

The percentage of a demographic that has heard of your company. Acts as a multiplier on your competitive strength within the shared demand pool. If your reach among Students is 20%, your effective value proposition is scaled to 20% — most students don't know you exist, so your pull on the pool is weak. A company with 0% reach gets 0 effective VP and sells nothing.

**Starting values:**
- Player: 0% across all demographics. Must be bootstrapped through marketing channels and word of mouth.
- AI competitors: Pre-set per demographic to reflect each archetype's niche (e.g., ValueTech has 50% Budget Buyer but only 5% Creative Professional; Prestige Computing has 60% Creative Professional but only 10% Budget Buyer; OmniBook is broadly 25–40% across all demographics).

**Growth sources (per demographic, per quarter):**

| Source | Calculation | Notes |
|--------|------------|-------|
| Marketing channels | CHANNEL_REACH_PER_TIER[tier] per active channel targeting this demographic | Primary mechanism for directed reach growth. Premium mode delivers 0.7× reach but adds perception bonus and WoM multiplier. |
| Word of mouth | (units_sold_to_this_demographic / WOM_DIVISOR) × (1 + perception / 100) × wom_multiplier | Per-demographic organic source. Positive perception amplifies WOM; negative perception dampens it. Premium marketing channels add +0.1 to the WoM multiplier. |

All sources are summed into a raw growth input, then passed through an **S-curve (logistic derivative)** with a permeability floor:

```
base_factor = k × e^(-k(x - midpoint)) / (1 + e^(-k(x - midpoint)))²
floor = permeability × (k / 4)
growth_factor = max(base_factor, floor)
actual_growth = raw_input × growth_factor × 100
```

Where `permeability` is a per-demographic constant (0.0–1.0) that ensures permeable demographics (tech enthusiasts, gamers) can grow reach from cold start, while mass-market demographics require more sustained investment. This produces:
- Slow growth at low reach (hard to get started, unless demographic is permeable)
- Fast growth in the mid-range (momentum)
- Plateauing at high reach (diminishing returns)

**Inactivity decay:** If no products are on sale, reach decays at REACH_INACTIVITY_DECAY (10%) per year (applied as 2.5% per quarter).

### Brand Perception (per demographic, -50 to +50)

The accumulated sentiment a demographic has about your company, based on their purchasing experience. Positive perception means buyers give you the benefit of the doubt. Negative perception means scepticism even toward a good product.

**Starting values:**
- Player: 0 (neutral) across all demographics.
- AI competitors: Pre-set per archetype to reflect their market position (e.g., ValueTech: +25 Budget Buyer, -15 Business Professional; Prestige Computing: +25 Creative Professional, -20 Budget Buyer; OmniBook: +5 to +10 broadly).

**How it changes:** See Post-Sales Feedback section for the quarterly update formula.

**Key properties:**
- **Recency bias:** Rolling window (last 12 quarters = 3 years) means old experiences naturally drop off. A bad laptop from 4 years ago is no longer in the window.
- **Negativity bias:** Bad experiences hit 1.5× harder than good experiences help. Getting ripped off is memorable.
- **Only purchasers matter:** A demographic that never buys from you has no perception of you (stays at 0/neutral). This means entering a new market segment starts from a blank slate, not from baggage accumulated in other segments.
- **Value-for-money drives perception, not raw quality:** The experience score is based on raw value proposition (stats/price), not raw stats alone. An overpriced premium laptop can hurt perception even if technically excellent.
- **Marketing quality matters:** Aggressive marketing channels apply a slight perception penalty per targeted demographic; premium channels apply a slight bonus. This creates a cost/perception trade-off.

**Edge case behaviour:**
- *Ultrabook company enters gaming market:* Gamers have 0 perception (never bought from you). Your gaming laptop is evaluated on its merits. No penalty, no bonus.
- *Company sells both ultraportable and gaming laptop:* Gamers buy the gaming laptop, business professionals buy the ultraportable. Each demographic's perception is shaped only by the product they bought. No cross-contamination.
- *A few gamers accidentally buy the ultraportable:* Small negative experience (bad value for gamers), but volume_weight is tiny so the perception hit is negligible.

---

## Marketing Channel System

The player manages marketing channels from the Brand Management screen. Channels can be activated or deactivated at any time (costs are charged quarterly). Each channel targets specific demographics for reach growth and has two operating modes.

### Channel Tiers

| Tier | Category | Cost Range (per quarter, year-2000 dollars) | Demographics Targeted |
|------|----------|----------------------------------------------|----------------------|
| 1 | Grassroots / Niche | $20K–$50K | 2–4 demographics |
| 2 | Professional / Trade | $100K–$150K | 4–6 demographics |
| 3 | Mass Market | $250K–$500K | 8–20 demographics |

Higher tiers are more expensive but target more demographics simultaneously.

### Channel Availability

Each channel has a `yearAvailable` (first year it can be activated) and an optional `yearDeprecated` (last year it remains available). Deprecated channels are automatically deactivated at year transition. Examples:
- Tech Forum Sponsorship: 2000–2012 (forums decline as social media rises)
- YouTube Tech Reviewers: 2010+ (platform didn't exist before)
- Influencer Network: 2015+ (modern marketing channel)

### Operating Modes

Each active channel runs in one of two modes:

| Mode | Cost | Reach | Perception Effect | WoM Bonus |
|------|------|-------|-------------------|-----------|
| **Aggressive** | Base cost | Full reach (CHANNEL_REACH_PER_TIER) | -0.2 perception penalty per targeted demographic | None |
| **Premium** | 1.5× base cost | 0.7× reach | +0.2 perception bonus per targeted demographic | +0.1 WoM multiplier |

**Aggressive** maximises reach growth at the expense of brand perception — good for early-stage growth when perception doesn't matter yet.

**Premium** sacrifices some reach for perception improvement and WoM amplification — better for established brands protecting their reputation.

### Reach Contribution

Raw reach contribution per quarter per targeted demographic, by tier:
- Tier 1: 0.5
- Tier 2: 0.3
- Tier 3: 0.2

Higher tiers have lower per-demographic contribution but target more demographics, spreading the investment.

### Cost Inflation

All channel costs inflate annually at 3% from base year 2000 (same COST_INFLATION factor as other costs).

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

Press release responses feed into the **review generation system**. Reviewer templates can quote the player's responses, creating a feedback loop between launch claims and critical reception. Overpromising relative to actual specs risks negative review commentary.

---

## Post-Sales Feedback

### Perception Update (Rolling Window)

Perception uses a rolling window of the last 12 quarters (3 years) of experience scores. Each quarter:

```
experience = weighted_avg(company_laptop_raw_vp - market_avg_raw_vp)
             across all units sold to this demographic

// Negativity bias: bad experiences hit harder
if experience < 0:
  experience *= NEGATIVITY_MULTIPLIER (1.5)

// Marketing quality modifier
experience += sum(perception_modifier per active channel targeting this demographic)
  // aggressive channels: -0.2 per channel
  // premium channels: +0.2 per channel

// Push into rolling window (drop oldest if > 12 entries)
history[demographic].push(experience)

// Perception = mean of window × scale factor
perception = mean(history[demographic]) × PERCEPTION_CONTRIBUTION_SCALE (5)
```

Clamp to [-50, +50].

No exponential decay — perception is purely a function of recent experience in the rolling window.

### Reach Update

Reach growth sources accumulate quarterly. Each quarter:

```
raw_growth = marketing_channel_contributions
             + word_of_mouth_this_quarter
new_reach = old_reach + S_curve(raw_growth, current_reach, permeability)
```

Where marketing channel contributions sum CHANNEL_REACH_PER_TIER for each active channel targeting this demographic (scaled by 0.7× for premium mode). WoM = (units_sold / WOM_DIVISOR) × (1 + perception/100) × wom_multiplier.

Clamp to [0, 100].

### Player Feedback

After each quarter, show a brief summary:
- Units sold this quarter (per model)
- Cumulative units sold year-to-date
- Revenue this quarter
- Cash balance
- "View details" drill-down into per-demographic comparison table (see below)

After Q4, show the full year-end results screen:
- Annual totals: units ordered vs sold, revenue, costs, profit/loss
- Per-model breakdown
- Per-demographic comparison table (same as quarterly drill-down)
- Perception changes with explanations
- Cash balance after year-end resolution
- Quarterly trend (Q1–Q4 sales graph/table)

### Per-Demographic Comparison Table

The primary feedback mechanism for understanding sales performance. Available every quarter (as a drill-down from the brief summary) and at year-end.

**How it works:**
1. Player selects a model to compare (any model released that year — theirs or a competitor's)
2. For each demographic, shows a comparison table with:
   - The top 4–5 stats that demographic weights most heavily (market-relative scores, 1–100)
   - Price
   - Units sold to that demographic
3. Up to 5 models shown, sorted by market share in that demographic
4. Searchable — player can swap in any model not in the default top 5

**Stats shown change per demographic** based on their weight vector:
- Students see: price, battery life, portability, performance
- Gamers see: gaming performance, thermals, display, performance
- Corporate sees: keyboard, build quality, reliability
- etc.

**Design rationale:** No computed "loss reasons" or appeal score decomposition. The sales formula is multiplicative (stats × screen penalty × perception / price^sensitivity), so decomposing it into independent factors is inherently approximate. Instead, show the player what each demographic sees — the specs they care about, the price, and who won — and let them draw their own conclusions. Brand perception and reach are visible on the brand management screen for cross-referencing.

---

## AI Competitors

### MVP: 3 Competitors

Each has an archetype, a niche focus, and simple decision rules for generating 1 laptop model per year.

| Competitor | Archetype | Strategy |
|-----------|-----------|----------|
| Budget Brand | Aggressive pricing, low quality | Targets Student and Budget Buyer. Lower quartile on build quality, design. Upper quartile on price competitiveness. |
| Premium Brand | High quality, overpriced | Targets Business Professional and Creative. Upper quartile on design, display, build quality. Consistently overprices by 10–15%. |
| Generalist | Middle of the road | Targets General Consumer. Never leads on any stat. Competitive pricing. |

**Component selection algorithm:** Each competitor has stat priorities. For stats they care about, they pick upper-quartile components. For stats they don't, they pick lower-quartile options. (These percentiles can be tuned — not always strictly upper/lower.)

AI competitors use the exact same simulation pipeline as the player. Same perception feedback, same reach mechanics, same appeal formula. No special cases.

**AI death spiral prevention:** The `engineeringBonus` field on competitor definitions serves as a safety valve. If an AI brand's total sales drop below a threshold for 2+ consecutive years, nudge their bonus up slightly to keep them competitive. This is a balance lever, not exposed to the player.

**Visibility:** All competitor laptops are fully visible to the player — full stat blocks (raw + market-relative), price, screen size. No hidden information about the products themselves. The only hidden information is competitor sales figures (available via paid demographic breakdowns — post-MVP).

*For development, use real brand names (Dell, HP, Lenovo, etc.). Replace with fictional names for release.*

---

## Unified Data Model

```typescript
interface CompanyState {
  id: string;
  name: string;
  isPlayer: boolean;
  brandReach: Record<DemographicId, number>;       // 0-100 per demographic
  brandPerception: Record<DemographicId, number>;   // -50 to +50 per demographic
  perceptionHistory: Record<DemographicId, number[]>; // rolling window of quarterly experience scores
  models: LaptopModel[];
  // For AI only:
  archetype?: "budget" | "premium" | "generalist";
  engineeringBonus?: number;
}

interface ActiveMarketingChannel {
  channelId: string;
  mode: "aggressive" | "premium";
}

interface GameState {
  companies: CompanyState[];
  year: number;
  quarter: 1 | 2 | 3 | 4;
  cash: number;
  activeMarketingChannels: ActiveMarketingChannel[];
  yearHistory: YearSimulationResult[];
  quarterHistory: QuarterSimulationResult[];
  currentYearReviews: LaptopReview[];
  currentYearAwards: Award[];
  // ... additional UI state
}
```

Both player and AI competitors use the CompanyState interface. The simulation iterates over all companies uniformly. Save/load covers the full GameState.

---

## Tunables (centralised in config)

| Constant | Starting Value | Notes |
|----------|---------------|-------|
| PRICE_WEIGHT | Varies per demographic stat weight vector | Weight on price_score in VP dot product; higher = more price-sensitive |
| WOM_DIVISOR | 5,000 | Units sold per 1 raw reach point from word of mouth |
| PERCEPTION_CONTRIBUTION_SCALE | 5 | Scales rolling-window mean experience into perception points |
| PERCEPTION_WINDOW_SIZE | 12 | Rolling window in quarters (12 = 3 years of history) |
| NEGATIVITY_MULTIPLIER | 1.5 | Bad experiences hit 1.5× harder |
| S_CURVE_STEEPNESS | 0.08 | S-curve steepness for reach growth |
| S_CURVE_MIDPOINT | 50 | Reach % where growth is fastest |
| REACH_INACTIVITY_DECAY | 0.10 | Annual reach decay when no products on sale |
| CHANNEL_MARGIN_RATE | 0.20 | Retailer takes 20% of retail price; company receives 80% |
| COST_INFLATION | 1.03 | Annual scaling for marketing channel / infrastructure costs |
| CHANNEL_REACH_PER_TIER | {1: 0.5, 2: 0.3, 3: 0.2} | Raw reach contribution per quarter per targeted demographic |
| PREMIUM_COST_MULTIPLIER | 1.5 | Premium mode costs 1.5× base |
| PREMIUM_REACH_MULTIPLIER | 0.7 | Premium mode delivers 0.7× reach |
| AGGRESSIVE_PERCEPTION_PENALTY | -0.2 | Perception experience modifier per aggressive channel |
| PREMIUM_PERCEPTION_BONUS | 0.2 | Perception experience modifier per premium channel |
| PREMIUM_WOM_BONUS | 0.1 | WoM multiplier bonus per premium channel |
| REPLACEMENT_CYCLE | varies | Per-demographic; 2–5 years (see Sales Simulation section) |
| QUARTER_SHARES | [8, 4, 2, 1] | Out of 15. Buyer distribution across Q1–Q4 |
| AWARD_PRIMARY_PERCEPTION_BONUS | 5 | Perception boost for primary demographics (matching outlet affinity) |
| AWARD_PRIMARY_REACH_BONUS | 3 | Reach % boost for primary demographics |
| AWARD_SECONDARY_PERCEPTION_BONUS | 1 | Perception boost for secondary demographics |
| AWARD_SECONDARY_REACH_BONUS | 0.5 | Reach % boost for secondary demographics |

---

## Reviews & Awards

### Laptop Reviews

Reviews are published after Q1 sales resolve (not at launch). This means the reviewer has had time with the product and early sales data exists.

Two reviews per laptop:

- **Tech Enthusiast outlet:** Evaluates through the lens of performance, value, thermals, connectivity.
- **Mainstream outlet:** Evaluates through the lens of design, price, ease of use, brand.

Each review is assembled from **sentence templates**. The template system reads the laptop's stat profile relative to the competition and selects appropriate commentary.

**Template structure:** Keyed by `stat → sentiment (good/neutral/bad) → intensity (slightly above average / best in class / etc.) → [array of template strings]`.

Templates use placeholder variables: `{{laptop}}`, `{{competitor}}`, `{{rawSpec}}`, `{{score}}`, etc.

Each review touches ~8–10 template slots (intro, 5–6 stat commentaries, comparison line, verdict, final score out of 10).

### Year-End Awards

Awards are published after Q4 — the full year's data determines winners. A magazine-style summary at the end of each year. Award categories:

- Best Overall
- Best Value
- Best Portable
- Best Performance
- Best for Business
- (Additional categories can be added)

Determined by highest scorer in each relevant stat/segment combination. Player and AI competitors are all eligible.

**Award bonuses are demographic-specific**, based on outlet affinity. Each award is associated with a review outlet (tech enthusiast, mainstream, or both). Demographics that follow that outlet type receive the bonus:
- **Primary demographics** (strong affinity): +5 perception, +3% reach
- **Secondary demographics** (adjacent interest): +1 perception, +0.5% reach
- **Unrelated demographics**: no effect

For example, "Best Performance" is a tech-enthusiast award, so gamers and developers (primary) get the full bonus, while video editors (secondary) get a reduced bonus, and budget buyers get nothing.

### Template Budget

**Estimated templates needed:**

| Category | Count |
|----------|-------|
| Stat commentary (14 stats × 3 sentiments × 4 variants) | ~168 |
| Structural (intro/outro/comparison/verdict × 4 variants) | ~40 |
| Award announcements (8 categories × 4 variants) | ~32 |
| Award scene-setting intros | ~10 |
| **Subtotal** | **~250** |
| **×2 for comfortable non-repetition** | **~500** |

Templates are stored in a JSON file. Can be batch-written and refined for voice consistency.

---

## Paid Information (Deferred — Post-MVP)

*For the prototype, show full sales breakdowns for free. Add the cost mechanic later.*

Post-year, the player can pay for a detailed demographic breakdown: which buyer segments purchased their laptops, in what quantities, and how their appeal score compared to competitors in each segment.

---

## Progression & End State

**Sandbox mode.** No explicit win condition or score target.

**Timeline:** 2000–2026. After 2026, no new components are introduced — the game continues but the market is frozen in terms of available technology.

**Game over:** If the player's cash balance is negative after Q4 revenue is collected.

---

## MVP Feature Checklist (2000–2005 Prototype)

### In Scope

- [ ] Design wizard (screen size → components → body → review)
- [ ] Real, era-accurate component database for 2000–2005
- [ ] Keyboard and trackpad as separate stats with specific per-era feature options
- [ ] 2 model slots with new/successor/spec-bump system
- [ ] Manufacturing orders with economies of scale
- [ ] Pricing per model
- [ ] Market size display (total and per-demographic, per quarter)
- [ ] Sales simulation with 20 buyer demographics (10 generalist + 10 niche)
- [ ] Quarterly game loop (Q1–Q4 per year, front-loaded buyer distribution)
- [ ] Mid-year manufacturing wizard access (price adjustment, additional orders)
- [ ] Quarterly sales summaries
- [ ] Independent EoS for mid-year manufacturing orders
- [ ] Replacement cycle per demographic (active buyer pool sizing)
- [ ] Momentum-based market weight shifting (annual, runs after Q4) *(not yet implemented — weights are static, only demand pool sizes shift)*
- [ ] 3 AI competitors (budget, premium, generalist), 1 model each, full stats visible
- [ ] Brand reach (per demographic) + brand perception (per demographic)
- [ ] Marketing channel system (3 tiers, aggressive/premium modes, year-gated availability)
- [ ] Laptop reviews (2 per model, template-driven, published after Q1)
- [ ] Year-end awards (after Q4)
- [ ] ~500 sentence templates for reviews and awards
- [ ] Press release prompts (3 per model from pool of 12) *(implemented, but not yet feeding into reviews — see #107, #108)*
- [ ] Unsold inventory carried over
- [ ] Game over on negative cash after Q4
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
