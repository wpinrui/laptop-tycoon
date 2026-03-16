/**
 * Headline template pools — 3 outlets × 9 event subcategories.
 * Templates use {placeholder} syntax; the engine interpolates at generation time.
 */

import { CompetitorArchetype } from "../data/competitors";
import { NewsOutletId } from "./newsTypes";

// ─── Template Type ──────────────────────────────────────────

export type TemplatePool = Record<NewsOutletId, string[]>;

// ─── Product Launch ─────────────────────────────────────────

export const PRODUCT_LAUNCH_TEMPLATES: TemplatePool = {
  techbuzz: [
    "{company} just dropped the {model} — {screenSize}\" of raw power at {price}",
    "JUST IN: {company} reveals the all-new {model}",
    "The {model} is here. {company} is swinging big at {price}",
  ],
  siliconStandard: [
    "{company} launches {model}: {screenSize}\", {price}, targeting {segment} buyers",
    "New from {company}: the {model} enters a crowded {segment} field",
    "{company} unveils {model} at {price} amid shifting market dynamics",
  ],
  consumerWeekly: [
    "{company}'s new {model} hits shelves at {price} — worth a look?",
    "First look: the {price} {model} from {company} aims for your shortlist",
    "New laptop alert: the {model} from {company} starts at {price}",
  ],
};

// ─── Product Launch (with press quote) ──────────────────────

export const PRODUCT_LAUNCH_QUOTE_TEMPLATES: TemplatePool = {
  techbuzz: [
    "{company} calls the {model} '{pressQuote}' — bold words, let's see if it delivers",
    "'{pressQuote}' — that's how {company} describes the new {model}. We're intrigued.",
    "{company} launches {model} with a promise: '{pressQuote}'",
  ],
  siliconStandard: [
    "In a statement, {company} described the {model} as '{pressQuote}'",
    "{company} positions {model} around a core message: '{pressQuote}'",
    "New from {company}: {model} — billed as '{pressQuote}'",
  ],
  consumerWeekly: [
    "{company} wants you to know the {model} is about '{pressQuote}'",
    "'{pressQuote}' — {company}'s pitch for the new {model}. Worth a look?",
    "The {model} from {company}: '{pressQuote}'. Here's what that means for buyers.",
  ],
};

// ─── AI Competitor Press Quotes ─────────────────────────────

export const COMPETITOR_PRESS_QUOTES: Record<CompetitorArchetype, string[]> = {
  budget: [
    "More for less — that's always been our promise",
    "Premium features at a price that makes sense",
    "We prove you don't have to overpay for quality",
    "Built for everyone, not just enthusiasts",
    "Affordability without apology",
    "The smart choice for smart buyers",
    "We stripped the markup, not the features",
    "Real performance at a real-world price",
    "Value is our north star",
    "Flagship specs, mid-range price",
  ],
  premium: [
    "Crafted without compromise",
    "We don't cut corners — we engineer them away",
    "Luxury is in the details you don't notice until they're gone",
    "For those who demand the best and won't settle",
    "Precision-engineered from the ground up",
    "The finest materials, the finest experience",
    "Excellence isn't a feature — it's the standard",
    "When only the best will do",
    "Performance, elegance, and nothing less",
    "We build for people who notice the difference",
  ],
  generalist: [
    "Engineered for what's next",
    "Performance without compromise",
    "Everything you need, nothing you don't",
    "Built for the way people actually work",
    "The laptop that adapts to your life",
    "Reliable, powerful, ready for anything",
    "Technology that gets out of your way",
    "Designed for real life, not spec sheets",
    "A smarter laptop for a smarter workflow",
    "We listened to our customers and built this",
  ],
};

// ─── Financial: Revenue Milestone ───────────────────────────

export const REVENUE_MILESTONE_TEMPLATES: TemplatePool = {
  techbuzz: [
    "{company} just smashed through the {threshold} revenue mark",
    "Milestone alert: {company} crosses {threshold} in total revenue",
    "{company} is officially a {threshold} company",
  ],
  siliconStandard: [
    "{company} reports cumulative revenue exceeding {threshold}",
    "Revenue milestone: {company} passes {threshold} in lifetime earnings",
    "{company} reaches {threshold} revenue threshold in Q{quarter} {year}",
  ],
  consumerWeekly: [
    "{company} just hit a big number: {threshold} in total sales",
    "From startup to {threshold}: {company} hits a major revenue milestone",
    "How {company} quietly built a {threshold} business",
  ],
};

// ─── Financial: First Profitable Quarter / Year ─────────────

export const PROFITABILITY_TEMPLATES: TemplatePool = {
  techbuzz: [
    "{company} turns a profit for the first time — the hustle pays off",
    "It happened: {company}'s first black-ink quarter",
    "{company} is finally making money",
  ],
  siliconStandard: [
    "{company} posts first profitable quarter at {profit}",
    "Inflection point: {company} achieves profitability",
    "{company} reaches profitability in Q{quarter} {year}",
  ],
  consumerWeekly: [
    "{company} is officially in the black",
    "Good news for {company} fans: the company just turned profitable",
    "{company} finally profitable — {profit} in the quarter",
  ],
};

// ─── Market Share ───────────────────────────────────────────

export const MARKET_SHARE_TEMPLATES: TemplatePool = {
  techbuzz: [
    "{company} now owns {pct}% of the {demographic} market — and they're not slowing down",
    "{pct}% market share! {company} is dominating with {demographic} buyers",
    "{company} breaks through the {pct}% barrier in {demographic}",
  ],
  siliconStandard: [
    "{company} captures {pct}% market share among {demographic} buyers",
    "Market data: {company} crosses {pct}% share in {demographic} segment",
    "{demographic} segment: {company} share reaches {pct}%",
  ],
  consumerWeekly: [
    "{pct}% of {demographic} buyers now going with {company}",
    "{company} is the go-to for {demographic} — {pct}% market share",
    "If you're in {demographic}, you probably own a {company}",
  ],
};

// ─── Perception: Positive ───────────────────────────────────

export const PERCEPTION_UP_TEMPLATES: TemplatePool = {
  techbuzz: [
    "{demographic} buyers can't get enough of {company} right now",
    "{company} is on a roll — {demographic} sentiment is surging",
    "The vibes are good: {company} wins over {demographic} fans",
  ],
  siliconStandard: [
    "Brand sentiment improves for {company} among {demographic} — {reason}",
    "Perception data: {company} trending upward with {demographic} buyers",
    "{company} sees positive sentiment shift in {demographic} segment",
  ],
  consumerWeekly: [
    "{demographic} shoppers warming up to {company}",
    "Word on the street: {demographic} buyers increasingly trust {company}",
    "{company} is growing on {demographic} buyers this quarter",
  ],
};

// ─── Perception: Negative ───────────────────────────────────

export const PERCEPTION_DOWN_TEMPLATES: TemplatePool = {
  techbuzz: [
    "Yikes — {demographic} buyers cooling on {company}",
    "{company} has a {demographic} problem — sentiment is tanking",
    "Not a good look: {demographic} trust in {company} is slipping",
  ],
  siliconStandard: [
    "{company} faces declining trust among {demographic}: {reason}",
    "Sentiment analysis: {company} loses ground with {demographic}",
    "{demographic} perception of {company} drops — {reason}",
  ],
  consumerWeekly: [
    "{demographic} buyers looking elsewhere after disappointing quarter",
    "Is {company} losing its {demographic} fanbase?",
    "{demographic} shoppers have questions about {company}",
  ],
};

// ─── Review ─────────────────────────────────────────────────

export const REVIEW_TEMPLATES: TemplatePool = {
  techbuzz: [
    "We tested the {model} — here's the verdict: {score}/10",
    "The {model} review is in: {score}/10",
    "{score}/10 — our full take on the {model}",
  ],
  siliconStandard: [
    "{model} review: {score}/10",
    "In review: {model} scores {score}/10",
    "Benchmark report: {model} earns a {score}/10",
  ],
  consumerWeekly: [
    "Should you buy the {model}? Our verdict: {score}/10",
    "The {model}: a {score}/10 in our tests",
    "We put the {model} through its paces — {score}/10",
  ],
};

// ─── Award ──────────────────────────────────────────────────

export const AWARD_TEMPLATES: TemplatePool = {
  techbuzz: [
    "And the {category} award goes to... {company}'s {model}!",
    "Winner! {model} takes home {category}",
    "{company}'s {model} crowned {category} of the year",
  ],
  siliconStandard: [
    "{company}'s {model} wins {category}",
    "Year-end awards: {model} by {company} takes {category}",
    "{category}: {model} ({company}) leads the field",
  ],
  consumerWeekly: [
    "Best of {year}: {model} wins {category}",
    "Our pick for {category}? The {model} from {company}",
    "The {category} winner is in: {model} by {company}",
  ],
};
