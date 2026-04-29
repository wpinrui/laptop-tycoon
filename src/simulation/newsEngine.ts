/**
 * News generation engine — produces NewsItem[] from game events.
 *
 * Three entry points:
 * - generateQuarterNews()  — called from APPLY_QUARTER_RESULT (milestones, competitor launches, perception)
 * - generateReviewNews()   — called from SET_REVIEWS
 * - generateAwardNews()    — called from SET_AWARDS
 */

import { DEMOGRAPHICS } from "../data/demographics";
import { CompetitorArchetype } from "../data/competitors";
import { DemographicId } from "../data/types";
import { ALL_COMPONENTS } from "../data/components";
import { SLOT_CONFIGS } from "../data/slotConfigs";
import { GameState, getPlayerCompany, Quarter, Milestone } from "../renderer/state/gameTypes";
import { QuarterSimulationResult } from "./salesTypes";
import { LaptopReview, Award } from "./reviewsAwards";
import { PERCEPTION_NEWS_THRESHOLD, QUOTE_HEADLINE_PROBABILITY } from "./tunables";
import { NewsItem, NewsOutletId, OUTLETS } from "./newsTypes";
import {
  TemplatePool,
  PRODUCT_LAUNCH_TEMPLATES,
  PRODUCT_LAUNCH_QUOTE_TEMPLATES,
  COMPETITOR_PRESS_QUOTES,
  REVENUE_MILESTONE_TEMPLATES,
  PROFITABILITY_TEMPLATES,
  MARKET_SHARE_TEMPLATES,
  PERCEPTION_UP_TEMPLATES,
  PERCEPTION_DOWN_TEMPLATES,
  REVIEW_TEMPLATES,
  AWARD_TEMPLATES,
  COMPONENT_LAUNCH_TEMPLATES,
  COMPONENT_LAUNCH_MULTI_TEMPLATES,
} from "./newsTemplates";
import { pickRandom, shuffled, formatCompact } from "./utils";

// ─── Helpers ────────────────────────────────────────────────

const OUTLET_IDS: NewsOutletId[] = Object.keys(OUTLETS) as NewsOutletId[];

function pickOutlet(): NewsOutletId {
  return pickRandom(OUTLET_IDS);
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

function generateHeadline(
  pool: TemplatePool,
  outlet: NewsOutletId,
  vars: Record<string, string | number>,
): string {
  const template = pickRandom(pool[outlet]);
  return interpolate(template, vars);
}

function demName(demId: DemographicId): string {
  return DEMOGRAPHICS.find((d) => d.id === demId)?.shortName ?? demId;
}

const ARCHETYPE_SEGMENT: Record<CompetitorArchetype, string> = {
  budget: "budget",
  premium: "premium",
  generalist: "mainstream",
};

function makeProductLaunchItem(
  id: string,
  year: number,
  quarter: Quarter,
  companyName: string,
  modelName: string,
  screenSize: number,
  retailPrice: number,
  segment: string,
  isPlayer: boolean,
  pressQuotes?: string[],
): NewsItem {
  const outlet = pickOutlet();
  const hasQuotes = pressQuotes && pressQuotes.length > 0;

  // Pick two distinct quotes if available (headline + subheadline)
  let headlineQuote: string | undefined;
  let subheadlineQuote: string | undefined;
  if (hasQuotes) {
    const picks = shuffled(pressQuotes);
    headlineQuote = picks[0];
    subheadlineQuote = picks.length > 1 ? picks[1] : undefined;
  }

  const vars: Record<string, string | number> = {
    company: companyName,
    model: modelName,
    screenSize,
    price: formatCompact(retailPrice),
    segment,
  };

  // Prefer quote templates when a quote is available (80% of the time)
  let pool = PRODUCT_LAUNCH_TEMPLATES;
  if (headlineQuote && Math.random() < QUOTE_HEADLINE_PROBABILITY) {
    pool = PRODUCT_LAUNCH_QUOTE_TEMPLATES;
    vars.pressQuote = headlineQuote;
  }

  return {
    id,
    year,
    quarter,
    category: "productLaunch",
    outlet,
    headline: generateHeadline(pool, outlet, vars),
    subheadline: subheadlineQuote,
    body: {
      type: "productLaunch",
      companyName,
      modelName,
      screenSize,
      price: retailPrice,
      isPlayer,
      pressQuotes: hasQuotes ? pressQuotes : undefined,
    },
  };
}

// ─── Quarter News ───────────────────────────────────────────

export function generateQuarterNews(
  state: GameState,
  result: QuarterSimulationResult,
  newMilestones: Milestone[],
): NewsItem[] {
  const items: NewsItem[] = [];
  const { year, quarter } = result;
  let index = 0;

  function makeId(): string {
    return `news_${year}_q${quarter}_${index++}`;
  }

  const player = getPlayerCompany(state);

  // ── News from milestones ──
  for (const ms of newMilestones) {
    if (ms.type === "model") {
      const model = player.models.find((m) => m.design.id === ms.modelId);
      if (!model) continue;
      const responses = model.manufacturingPlan?.pressRelease?.responses;
      const pressQuotes = responses ? Object.values(responses).filter((s) => s.length > 0) : undefined;
      items.push(makeProductLaunchItem(
        makeId(), year, quarter, player.name,
        model.design.name, model.design.screenSize, model.retailPrice ?? 0,
        "consumer", true, pressQuotes,
      ));
    } else if (ms.type === "financial") {
      const outlet = pickOutlet();
      const isProfitability = ms.title.includes("profitable");
      const pool = isProfitability ? PROFITABILITY_TEMPLATES : REVENUE_MILESTONE_TEMPLATES;

      // Extract threshold or profit value from milestone detail
      const moneyMatch = ms.detail.match(/\$[\d.]+[BMK]?/);
      const moneyStr = moneyMatch ? moneyMatch[0] : "";

      const vars: Record<string, string | number> = {
        company: player.name,
        quarter,
        year,
      };
      if (isProfitability) {
        vars.profit = moneyStr;
      } else {
        vars.threshold = moneyStr;
      }

      items.push({
        id: makeId(),
        year,
        quarter,
        category: "financial",
        outlet,
        headline: generateHeadline(pool, outlet, vars),
        body: {
          type: "financial",
          milestoneTitle: ms.title,
        },
      });
    } else if (ms.type === "market") {
      const outlet = pickOutlet();
      // Parse demographic and percentage from milestone title
      // Title format: "Reached X% market share in DemographicShortName"
      const pctMatch = ms.title.match(/(\d+)%/);
      const pct = pctMatch ? Number(pctMatch[1]) : 0;
      // Extract demographic name — everything after "market share in "
      const demMatch = ms.title.match(/market share in (.+)/);
      const demographic = demMatch ? demMatch[1] : "";

      const vars = {
        company: player.name,
        pct,
        demographic,
      };
      items.push({
        id: makeId(),
        year,
        quarter,
        category: "marketShare",
        outlet,
        headline: generateHeadline(MARKET_SHARE_TEMPLATES, outlet, vars),
        body: {
          type: "marketShare",
          demographic,
          share: pct / 100,
          threshold: pct / 100,
        },
      });
    }
  }

  // ── Competitor product launches ──
  if (quarter === 1) {
    const reportedCompetitorModels = new Set(
      state.newsHistory
        .filter((n) => n.category === "productLaunch" && n.body?.type === "productLaunch" && !n.body.isPlayer)
        .map((n) => n.body?.type === "productLaunch" ? n.body.modelName : ""),
    );

    for (const company of state.companies) {
      if (company.isPlayer) continue;
      // Pick at most one model per competitor — the highest-priced new model this year
      const newModels = company.models
        .filter((m) => m.yearDesigned === year && !reportedCompetitorModels.has(m.design.name))
        .sort((a, b) => (b.retailPrice ?? 0) - (a.retailPrice ?? 0));
      if (newModels.length === 0) continue;
      const model = newModels[0];
      const archetype = company.archetype ?? "generalist";
      const segment = ARCHETYPE_SEGMENT[archetype];
      const quotePool = COMPETITOR_PRESS_QUOTES[archetype];
      const competitorQuotes = shuffled(quotePool).slice(0, 2);
      items.push(makeProductLaunchItem(
        makeId(), year, quarter, company.name,
        model.design.name, model.design.screenSize, model.retailPrice ?? 0,
        segment, false, competitorQuotes,
      ));
    }
  }

  // ── Perception shifts (|delta| >= 3) ──
  for (const pc of result.perceptionChanges) {
    if (Math.abs(pc.delta) < PERCEPTION_NEWS_THRESHOLD) continue;
    const direction = pc.delta > 0 ? "up" : "down";
    const pool = direction === "up" ? PERCEPTION_UP_TEMPLATES : PERCEPTION_DOWN_TEMPLATES;
    const outlet = pickOutlet();
    const demographic = demName(pc.demographicId);
    const vars = {
      company: player.name,
      demographic,
      reason: pc.reason,
    };
    items.push({
      id: makeId(),
      year,
      quarter,
      category: "perception",
      outlet,
      headline: generateHeadline(pool, outlet, vars),
      body: {
        type: "perception",
        demographic,
        delta: pc.delta,
        direction,
      },
    });
  }

  // ── New component launches ──
  const newComponents = ALL_COMPONENTS.filter(
    (c) => c.yearIntroduced === year && (c.quarterIntroduced ?? 1) === quarter,
  );

  if (newComponents.length === 1) {
    const comp = newComponents[0];
    const outlet = pickOutlet();
    const slotLabel = SLOT_CONFIGS.find((s) => s.slot === comp.slot)?.name ?? comp.slot;
    items.push({
      id: makeId(),
      year,
      quarter,
      category: "componentLaunch",
      outlet,
      headline: generateHeadline(COMPONENT_LAUNCH_TEMPLATES, outlet, { component: comp.name, slot: slotLabel }),
      subheadline: comp.description,
      body: {
        type: "componentLaunch",
        components: [{ name: comp.name, slot: slotLabel, description: comp.description }],
      },
    });
  } else if (newComponents.length > 1) {
    // One consolidated article listing all parts, grouped by slot in the subheadline
    const outlet = pickOutlet();
    const componentsWithLabels = newComponents.map((c) => ({
      ...c,
      slotLabel: SLOT_CONFIGS.find((s) => s.slot === c.slot)?.name ?? c.slot,
    }));
    const bySlot = new Map<string, string[]>();
    for (const c of componentsWithLabels) {
      const list = bySlot.get(c.slotLabel) ?? [];
      list.push(c.name);
      bySlot.set(c.slotLabel, list);
    }
    const slotKeys = Array.from(bySlot.keys());
    const primarySlot = slotKeys.length === 1 ? slotKeys[0] : "hardware";
    const subheadline = slotKeys
      .map((slot) => `${slot}: ${bySlot.get(slot)!.join(", ")}`)
      .join(" · ");
    items.push({
      id: makeId(),
      year,
      quarter,
      category: "componentLaunch",
      outlet,
      headline: generateHeadline(COMPONENT_LAUNCH_MULTI_TEMPLATES, outlet, { count: newComponents.length, slot: primarySlot }),
      subheadline,
      body: {
        type: "componentLaunch",
        components: componentsWithLabels.map((c) => ({
          name: c.name,
          slot: c.slotLabel,
          description: c.description,
        })),
      },
    });
  }

  return items;
}

// ─── Review News ────────────────────────────────────────────

export function generateReviewNews(
  reviews: LaptopReview[],
  year: number,
  quarter: Quarter,
): NewsItem[] {
  const items: NewsItem[] = [];
  let index = 0;

  for (const review of reviews) {
    const outlet = pickOutlet();
    const vars = {
      model: review.laptopName,
      score: review.score,
    };
    items.push({
      id: `news_${year}_q${quarter}_review_${index++}`,
      year,
      quarter,
      category: "review",
      outlet,
      headline: generateHeadline(REVIEW_TEMPLATES, outlet, vars),
      body: {
        type: "review",
        laptopName: review.laptopName,
        outlet: review.outletName,
        score: review.score,
        sentences: review.sentences,
      },
    });
  }

  return items;
}

// ─── Award News ─────────────────────────────────────────────

export function generateAwardNews(awards: Award[], year: number): NewsItem[] {
  const items: NewsItem[] = [];
  let index = 0;

  for (const award of awards) {
    const outlet = pickOutlet();
    // Extract model name (strip company prefix from winnerName "Company Model")
    const modelName = award.winnerName.replace(`${award.ownerCompanyName} `, "");
    const vars = {
      company: award.ownerCompanyName,
      model: modelName,
      category: award.categoryLabel,
      year,
    };
    items.push({
      id: `news_${year}_award_${index++}`,
      year,
      quarter: 4,
      category: "award",
      outlet,
      headline: generateHeadline(AWARD_TEMPLATES, outlet, vars),
      body: {
        type: "award",
        category: award.categoryLabel,
        winnerName: award.winnerName,
        ownerName: award.ownerCompanyName,
        runnerUpName: award.runnerUpName,
      },
    });
  }

  return items;
}
