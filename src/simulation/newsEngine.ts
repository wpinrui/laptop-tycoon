/**
 * News generation engine — produces NewsItem[] from game events.
 *
 * Three entry points:
 * - generateQuarterNews()  — called from APPLY_QUARTER_RESULT (milestones, competitor launches, perception)
 * - generateReviewNews()   — called from SET_REVIEWS
 * - generateAwardNews()    — called from SET_AWARDS
 */

import { DEMOGRAPHICS } from "../data/demographics";
import { DemographicId } from "../data/types";
import { GameState, getPlayerCompany, Quarter } from "../renderer/state/gameTypes";
import { QuarterSimulationResult } from "./salesTypes";
import { LaptopReview, Award } from "./reviewsAwards";
import { NewsItem, NewsOutletId, OUTLETS } from "./newsTypes";
import {
  TemplatePool,
  PRODUCT_LAUNCH_TEMPLATES,
  REVENUE_MILESTONE_TEMPLATES,
  PROFITABILITY_TEMPLATES,
  MARKET_SHARE_TEMPLATES,
  PERCEPTION_UP_TEMPLATES,
  PERCEPTION_DOWN_TEMPLATES,
  REVIEW_TEMPLATES,
  AWARD_TEMPLATES,
} from "./newsTemplates";
import type { Milestone } from "../renderer/state/gameTypes";

// ─── Helpers ────────────────────────────────────────────────

const OUTLET_IDS: NewsOutletId[] = Object.keys(OUTLETS) as NewsOutletId[];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `$${n}`;
}

const ARCHETYPE_SEGMENT: Record<string, string> = {
  budget: "budget",
  premium: "premium",
  generalist: "mainstream",
};

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
      // Player product launch
      const model = player.models.find((m) => m.design.id === ms.modelId);
      if (!model) continue;
      const outlet = pickOutlet();
      const vars = {
        company: player.name,
        model: model.design.name,
        screenSize: model.design.screenSize,
        price: formatMoney(model.retailPrice ?? 0),
        segment: "consumer",
      };
      items.push({
        id: makeId(),
        year,
        quarter,
        category: "productLaunch",
        outlet,
        headline: generateHeadline(PRODUCT_LAUNCH_TEMPLATES, outlet, vars),
        body: {
          type: "productLaunch",
          companyName: player.name,
          modelName: model.design.name,
          screenSize: model.design.screenSize,
          price: model.retailPrice ?? 0,
          isPlayer: true,
        },
      });
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
          value: 0, // raw value not easily available; headline has the formatted string
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
      for (const model of company.models) {
        if (model.yearDesigned !== year) continue;
        if (reportedCompetitorModels.has(model.design.name)) continue;

        const outlet = pickOutlet();
        const segment = ARCHETYPE_SEGMENT[company.archetype ?? "generalist"] ?? "mainstream";
        const price = formatMoney(model.retailPrice ?? 0);
        const vars = {
          company: company.name,
          model: model.design.name,
          screenSize: model.design.screenSize,
          price,
          segment,
        };
        items.push({
          id: makeId(),
          year,
          quarter,
          category: "productLaunch",
          outlet,
          headline: generateHeadline(PRODUCT_LAUNCH_TEMPLATES, outlet, vars),
          body: {
            type: "productLaunch",
            companyName: company.name,
            modelName: model.design.name,
            screenSize: model.design.screenSize,
            price: model.retailPrice ?? 0,
            isPlayer: false,
          },
        });
      }
    }
  }

  // ── Perception shifts (|delta| >= 3) ──
  for (const pc of result.perceptionChanges) {
    if (Math.abs(pc.delta) < 3) continue;
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
      quarter: 4 as 1 | 2 | 3 | 4,
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
