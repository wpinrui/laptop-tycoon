# Laptop Tycoon — Game Design Document

## Overview

A text-driven tycoon game where the player runs a laptop company from 2000 onwards. The core fantasy is reading the market, speccing the right machine, and finding your niche. No art assets — driven entirely by text and basic UI elements.

**Tech stack:** Electron / React / TypeScript

**MVP scope:** 2000–2005, with the full component database and simulation tuned for this era before expanding.

---

## Core Loop

1. **Start of year:** Design laptop(s) via design wizard (only available at year start)
2. **Each quarter (Q1–Q4):**
   a. Manufacturing wizard available — set/adjust price, order units, run campaigns
   b. Purchase sponsorships, set awareness budget
   c. Sales simulation runs for that quarter's buyer pool
   d. Revenue collected, cash balance updated
   e. After Q1: laptop reviews are published
   f. After Q4: year-end awards, annual perception/reach update, advance to next year
3. **Repeat** — new components unlock, new year begins, design wizard available again

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

Costs are deducted when a manufacturing order is placed (at any quarter). The player can go negative at this point. Revenue is collected quarterly as units sell.

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

| Demographic | Key Stats Valued | Price Sensitivity | Notes |
|-------------|-----------------|-------------------|-------|
| Corporate / Enterprise | Keyboard, support, build quality, reliability | Low (per unit), bulk orders | Values long support windows. Steady presence. |
| Business Professional | Design, portability, keyboard, performance | Moderate | Grows as laptops replace desktops. |
| Student | Price, battery, portability, performance | Very high | Large population throughout. |
| Creative Professional | Display, performance, build quality, design | Low | Small but high margin. Grows significantly post-2010. |
| Gamer | Gaming perf, display, thermals | Moderate | Tiny pre-2005, explodes after. |
| Tech Enthusiast | Performance, value-for-money, connectivity, repairability | Moderate | Small population. 2-year replacement cycle. |
| General Consumer | Price, design | High | Largest group. |
| Budget Buyer | Price above all else | Extreme | Tolerates bad everything if cheap enough. |

### Quarterly Structure

The game year is divided into 4 quarters. The annual pool of active buyers is split across quarters using a front-loaded distribution:

```
Q1: 8/15 of annual active buyers (~53%)
Q2: 4/15 (~27%)
Q3: 2/15 (~13%)
Q4: 1/15 (~7%)
```

This rewards getting the launch right — the majority of sales happen in Q1. The player can react to poor Q1 results by adjusting price, ordering more units, or running new campaigns in Q2–Q4, but most of the opportunity has already passed.

Each quarter, the player may:
- Reopen the manufacturing wizard for existing designs (adjust price, order additional manufacturing runs, select new ad campaigns)
- Purchase sponsorships
- Adjust the general awareness budget
- NOT design new laptops (locked until next year's start)

Additional manufacturing orders placed in Q2+ are calculated with their own independent economies-of-scale discount. They do not pool with the Q1 order. This creates a natural cost penalty for not forecasting correctly at launch.

### Step 1: Raw Value Proposition

For each laptop in the market (player + AI), for each demographic:

```
For each stat:
  normalized_stat = this_laptop_stat / max(that stat across all laptops this year)

weighted_score = dot_product(normalized_stats, demographic_weight_vector)
screen_penalty = screen size fit penalty (1.0 if preferred, 0.5 if one class off, 0.1 if two+ off)
sensitivity_factor = PRICE_SENSITIVITY_EXPONENT[demographic.priceSensitivity]
raw_vp = (weighted_score × screen_penalty) / price ^ sensitivity_factor
```

**Price sensitivity exponent** varies by demographic. At `moderate` (1.0) the formula behaves as a simple inverse. Lower exponents (Corporate, Creative Professional) make the demographic more tolerant of high prices — enabling high-margin niche strategies. Higher exponents (Student, Budget Buyer) punish price increases more steeply — these segments flock to whoever is cheapest.

| Sensitivity Level | Exponent | Demographics |
|-------------------|----------|-------------|
| low | 0.8 | Corporate, Creative Professional |
| moderate | 1.0 | Business Professional, Gamer, Tech Enthusiast |
| high | 1.2 | General Consumer |
| veryHigh | 1.4 | Student |
| extreme | 1.6 | Budget Buyer |

### Step 2: Biased Value Proposition

```
brand_perception_mod = brand_perception[this_demographic] for this company  (-50 to +50)
laptop_perception_mod = campaign result for this laptop
biased_vp = raw_vp × (1 + brand_perception_mod / 100) × (1 + laptop_perception_mod / 100)
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
- Business Professional: 3 years
- Student: 3 years
- Creative Professional: 3 years
- Gamer: 3 years
- General Consumer: 3 years
- Corporate / Enterprise: 4 years
- Budget Buyer: 5 years

(These are starting values — tune during playtesting.)

Everyone in the active buyer pool WILL buy a laptop. There is no "don't buy" option in the probability distribution. The replacement cycle already filters out people who aren't in the market this year.

```
addressable_pool = quarterly_active_buyers × (brand_reach[demographic] / 100)

For each company's laptop(s) in this demographic's addressable pool:
  purchase_probability = biased_vp / sum(all biased_vps)

units_demanded = addressable_pool × purchase_probability
units_sold = min(units_demanded, units_remaining_in_manufacturing_order)
```

### Step 4: Sales Noise

```
actual_sales = units_sold × random_factor
random_factor sampled uniformly from [0.85, 1.15]  (±15% variance)
```

### Market Size (shown in manufacturing wizard)

The player sees the projected market size for the upcoming quarter — the total number of active buyers in the market. This can be filtered by demographic via a dropdown. The market size is calculated directly from `demographic_population / replacement_cycle_years × (quarter_share / 15)`.

This gives the player enough information to estimate their own demand based on their brand reach and product competitiveness, without the game solving the problem for them.

### Market Weight Shifts

Buyer demographic weight vectors drift over time with **momentum** (slow, consistent shifts, not sudden reversals):

```
new_weight = old_weight × 0.85 + era_target × 0.15 + small_random_noise
```

Era target vectors are predefined at anchor points (2000, 2005, 2010, 2015, 2020, 2025) and interpolated between them. This creates natural transitions — the market gradually prioritises battery life over 2010–2020 without abrupt jumps.

---

## Brand System

Three components, each serving a distinct role in the sales funnel.

### Brand Reach (per demographic, 0–100%)

The percentage of a demographic that has heard of your company. Acts as a hard gate on your addressable market. If your reach among Students is 20%, you can only compete for 20% of the Student demand pool.

**Starting values:**
- Player: 0% across all demographics. Must be bootstrapped through marketing.
- AI competitors: Pre-set per archetype (e.g., ValueTech 70% uniform, Prestige Computing 60% uniform, OmniBook 75% uniform).

**Growth sources (per demographic, per year):**

| Source | Calculation | Notes |
|--------|------------|-------|
| Word of mouth | units_sold_to_this_demographic / WOM_DIVISOR | Only per-demographic organic source. Creates natural flywheel. |
| Campaign spend | total_campaign_spend / CAMPAIGN_DIVISOR | Uniform across all demographics. Small contribution. |
| Sponsorships | Fixed bonuses per sponsorship option | Targeted to specific demographics. Primary mechanism for directed reach growth. |
| General awareness budget | annual_awareness_spend / AWARENESS_DIVISOR | Uniform across all demographics. |

All sources are summed into a raw growth input, then passed through an **S-curve (logistic function)**:

```
actual_growth = L / (1 + e^(-k * (raw_input - midpoint)))
```

Where the midpoint shifts based on current reach, producing:
- Slow growth at low reach (hard to get started)
- Fast growth in the mid-range (momentum)
- Plateauing at high reach (diminishing returns)

**Campaign reach is applied before sales simulation runs in the same year.** This ensures a first-year player with 0% reach and a marketing campaign can still generate sales. The projection in the manufacturing wizard must include the prospective campaign's reach contribution.

### Brand Perception (per demographic, -50 to +50)

The accumulated sentiment a demographic has about your company, based on their purchasing experience. Positive perception means buyers give you the benefit of the doubt. Negative perception means scepticism even toward a good product.

**Starting values:**
- Player: 0 (neutral) across all demographics.
- AI competitors: Pre-set per archetype to reflect their market position (e.g., ValueTech: +25 Budget Buyer, -15 Business Professional; Prestige Computing: +25 Creative Professional, -20 Budget Buyer; OmniBook: +5 to +10 broadly).

**How it changes:** See Post-Sales Feedback section for the quarterly update formula.

**Key properties:**
- **Recency bias:** Exponential decay means old experiences fade. A bad laptop from 4 years ago barely registers.
- **Negativity bias:** Bad experiences hit 1.5× harder than good experiences help. Getting ripped off is memorable.
- **Only purchasers matter:** A demographic that never buys from you has no perception of you (stays at 0/neutral). This means entering a new market segment starts from a blank slate, not from baggage accumulated in other segments.
- **Value-for-money drives perception, not raw quality:** The experience score is based on raw value proposition (stats/price), not raw stats alone. An overpriced premium laptop can hurt perception even if technically excellent.

**Edge case behaviour:**
- *Ultrabook company enters gaming market:* Gamers have 0 perception (never bought from you). Your gaming laptop is evaluated on its merits. No penalty, no bonus.
- *Company sells both ultraportable and gaming laptop:* Gamers buy the gaming laptop, business professionals buy the ultraportable. Each demographic's perception is shaped only by the product they bought. No cross-contamination.
- *A few gamers accidentally buy the ultraportable:* Small negative experience (bad value for gamers), but volume_weight is tiny so the perception hit is negligible.

### Laptop Perception (per model, from ad campaign)

How a specific laptop is perceived due to its marketing campaign. This is a one-off modifier for that product in that year, not a persistent brand attribute.

**Source:** The ad campaign selected in the manufacturing wizard. The campaign outcome is sampled from the campaign's distribution (skewed normal, as previously specified). The result is a percentage modifier to perceived value, not a direct sales modifier.

**Range:** Depends on campaign type. Safe campaigns produce small positive modifiers. Risky campaigns can produce large positive or negative modifiers.

---

## Sponsorship / Partnership Options

Available as discrete purchases during the yearly planning phase. The player may purchase multiple sponsorships per year. Each targets specific demographics for reach growth.

| Option | Cost | Reach Effect |
|--------|------|-------------|
| Gaming tournament sponsor | $150K | +5% Gamer, +2% Tech Enthusiast |
| University laptop programme | $300K | +6% Student |
| Enterprise IT conference | $400K | +5% Corporate, +3% Business Professional |
| Tech blog partnership | $100K | +4% Tech Enthusiast, +2% Gamer |
| Retail shelf placement deal | $500K | +3% all demographics |
| Airport/transit advertising | $250K | +2% Business Professional, +2% General Consumer |
| TV commercial | $800K | +4% General Consumer, +2% Budget Buyer, +2% all others |

Sponsorship costs should scale with a simple inflation factor per year (same as campaign costs).

A **general awareness budget** slider is also available — annual spend that provides a small uniform reach boost across all demographics, fed through the S-curve.

---

## Marketing

The player may select one ad campaign per model per quarter. Each campaign lasts one quarter only. The player can run a new campaign for the same model in subsequent quarters.

### Ad Campaigns

Five campaign tiers with increasing risk/reward:

| Campaign | Base Cost | Risk | Perception Modifier Range |
|----------|-----------|------|--------------------------|
| No Campaign | Free | None | 0% (guaranteed) |
| Product Showcase | $2,000,000 | Low | +1% to +10% |
| Lifestyle Campaign | $1,200,000 | Medium | -3% to +20% |
| Comparative Ad | $600,000 | High | -10% to +30% |
| Stunt / Viral | $200,000 | Very High | -20% to +40% |

Each campaign has a **skew-normal distribution** defining the probability of different perception modifier outcomes. Higher-risk campaigns are cheaper but have wider variance and negative skew (downside tail is fatter).

### Campaign Cost Inflation

Campaign costs inflate at **3% per year** from the base year (2000):

```
actual_cost = base_cost × 1.03^(current_year - 2000)
```

### Sales Impact

The campaign's outcome is sampled from its distribution when the quarter simulates. The result is a **percentage modifier to perceived value** (laptop perception), not a direct sales modifier:

```
biased_vp = raw_vp × (1 + brand_perception_mod / 100) × (1 + laptop_perception_mod / 100)
```

The player sees the distribution shape (via a chart) and the min/mean/max range before choosing, but the actual outcome is only revealed after the quarter simulates.

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

## Post-Sales Feedback

### Perception Update

Perception updates run quarterly, applying 1/4 of the annual effect each quarter. The formula per quarter is:

```
experience = company_laptop_raw_vp - mean(raw_vp of all purchased laptops
             in this demographic this quarter)
perception_contribution = experience × volume_weight × negativity_multiplier
new_perception = old_perception × (DECAY ^ 0.25) + perception_contribution
```

Using DECAY^0.25 per quarter produces the same annual decay as DECAY over 4 quarters. E.g., if DECAY = 0.5, quarterly decay factor = 0.5^0.25 ≈ 0.84.

Clamp to [-50, +50].

### Reach Update

Reach growth sources accumulate quarterly. Each quarter:

```
raw_growth = word_of_mouth_this_quarter + (campaign_reach / 4)
             + (sponsorship_reach if purchased this quarter)
             + (awareness_budget_reach / 4)
new_reach = old_reach + S_curve(raw_growth, current_reach)
```

Clamp to [0, 100].

### Player Feedback

After each quarter, show a brief summary:
- Units sold this quarter (per model)
- Cumulative units sold year-to-date
- Revenue this quarter
- Cash balance

After Q4, show the full year-end results screen:
- Annual totals: units ordered vs sold, revenue, costs, profit/loss
- Per-model breakdown
- Per-demographic breakdown with loss reasons (top 2-3 ranked by impact)
- Perception changes with explanations
- Cash balance after year-end resolution
- Quarterly trend (Q1–Q4 sales graph/table)

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

AI competitors use the exact same simulation pipeline as the player. Same perception feedback, same reach mechanics, same appeal formula. No special cases.

**AI campaign selection:** Budget brand picks cheap/risky campaigns. Premium brand picks expensive/safe campaigns. Generalist picks mid-tier. Simple lookup per archetype, not a decision engine.

**AI support budget:** Budget brand: minimal. Premium: generous. Generalist: moderate. Fixed per archetype.

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
  models: LaptopModel[];
  // For AI only:
  archetype?: "budget" | "premium" | "generalist";
  engineeringBonus?: number;
}
```

Both player and AI competitors use this interface. The simulation iterates over all companies uniformly. Save/load covers one array of CompanyState.

---

## Tunables (centralised in config)

| Constant | Starting Value | Notes |
|----------|---------------|-------|
| PRICE_SENSITIVITY_EXPONENT | low=0.8, moderate=1.0, high=1.2, veryHigh=1.4, extreme=1.6 | Exponent on price in raw VP formula per demographic sensitivity level |
| WOM_DIVISOR | TBD | Units sold per 1 raw reach point from word of mouth |
| CAMPAIGN_DIVISOR | 2,000,000 | Campaign spend per 1 raw reach point |
| AWARENESS_DIVISOR | 500,000 | Awareness budget spend per 1 raw reach point |
| PERCEPTION_DECAY | 0.5–0.6 | Yearly decay on brand perception |
| NEGATIVITY_MULTIPLIER | 1.5 | Bad experiences hit 1.5× harder |
| S_CURVE_L | TBD | Max reach growth per year |
| S_CURVE_K | TBD | S-curve steepness |
| CAMPAIGN_COST_INFLATION | 1.03 | Annual scaling for campaign and sponsorship costs |
| REPLACEMENT_CYCLE_TECH_ENTHUSIAST | 2 | Years between upgrades |
| REPLACEMENT_CYCLE_BUSINESS_PRO | 3 | |
| REPLACEMENT_CYCLE_STUDENT | 3 | |
| REPLACEMENT_CYCLE_CREATIVE_PRO | 3 | |
| REPLACEMENT_CYCLE_GAMER | 3 | |
| REPLACEMENT_CYCLE_GENERAL_CONSUMER | 3 | |
| REPLACEMENT_CYCLE_CORPORATE | 4 | |
| REPLACEMENT_CYCLE_BUDGET_BUYER | 5 | |
| QUARTER_SHARES | [8, 4, 2, 1] | Out of 15. Buyer distribution across Q1–Q4 |
| AWARD_PERCEPTION_BONUS | 2 | Global perception boost from winning an award |
| AWARD_REACH_BONUS | 1 | Global reach % boost from winning an award |

---

## Reviews & Awards

### Laptop Reviews

Reviews are published after Q1 sales resolve (not at launch). This means the reviewer has had time with the product and early sales data exists.

Two reviews per laptop:

- **Tech Enthusiast outlet:** Evaluates through the lens of performance, value, repairability, connectivity.
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

**Winning an award grants +2 brand perception across all demographics and +1% brand reach across all demographics.** Everyone sees the award coverage.

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
- [ ] Sales simulation with 8 buyer demographics
- [ ] Quarterly game loop (Q1–Q4 per year, front-loaded buyer distribution)
- [ ] Mid-year manufacturing wizard access (price adjustment, additional orders, new campaigns)
- [ ] Quarterly sales summaries
- [ ] Independent EoS for mid-year manufacturing orders
- [ ] Replacement cycle per demographic (active buyer pool sizing)
- [ ] Momentum-based market weight shifting (annual, runs after Q4)
- [ ] 3 AI competitors (budget, premium, generalist), 1 model each, full stats visible
- [ ] Brand reach (per demographic) + brand perception (per demographic) + laptop perception (from campaigns)
- [ ] Sponsorship/partnership system (7 options, targeted reach per demographic)
- [ ] General awareness budget slider
- [ ] Laptop reviews (2 per model, template-driven, published after Q1)
- [ ] Year-end awards (after Q4)
- [ ] ~550 sentence templates for reviews and awards
- [ ] Marketing campaigns (5 tiers, skew-normal distributions, cost inflation)
- [ ] Press release prompts (3 per model from pool of 12, feeds into reviews)
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
