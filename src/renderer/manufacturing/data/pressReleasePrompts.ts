import { PressReleasePrompt } from "../types";

export const PRESS_RELEASE_PROMPTS: PressReleasePrompt[] = [
  { id: 1, text: "Describe this laptop in one phrase.", example: "A powerhouse for creators on the go" },
  { id: 2, text: "What's the single standout feature?", example: "All-day battery that outlasts the competition" },
  { id: 3, text: "Who is this laptop built for?", example: "Students who need power without breaking the bank" },
  { id: 4, text: "What problem does this laptop solve?", example: "No more choosing between portability and performance" },
  { id: 5, text: "How does this compare to your previous model?", example: "Faster, lighter, and better in every way", requiresModelType: "successor" },
  { id: 6, text: "What should customers expect from the build quality?", example: "Premium aluminium that survives the daily commute" },
  { id: 7, text: "Sum up this laptop in one word, then explain.", example: "Relentless — it keeps up no matter what you throw at it" },
  { id: 8, text: "Why pick this over a competitor?", example: "More screen, more power, less money" },
  { id: 9, text: "What doesn't show up in the spec sheet?", example: "The satisfying click of our custom keyboard" },
  { id: 10, text: "If you could only keep one feature, which one?", example: "The display — once you see it, there's no going back" },
  { id: 11, text: "What compromises did you make, and why?", example: "Heavier for better cooling — throttling ruins everything" },
  { id: 12, text: "What's your ambition for this product line?", example: "The laptop people recommend to their friends" },
  { id: 13, text: "What's the first thing people will notice?", example: "A screen so vivid you'll forget it's a laptop" },
  { id: 14, text: "What would you tell someone on the fence?", example: "Try the keyboard — that's all it takes" },
  { id: 15, text: "What surprised you most during development?", example: "We got 20% more battery without adding weight" },
  { id: 16, text: "Describe the experience in three words.", example: "Fast, quiet, beautiful" },
  { id: 17, text: "What makes this worth the price?", example: "Every dollar goes into the parts you actually touch" },
  { id: 18, text: "What's the boldest decision you made?", example: "We ditched the fan — silence matters more" },
  { id: 19, text: "How does this fit into your customers' lives?", example: "From morning commute to midnight deadline, it keeps up" },
  { id: 20, text: "What did you learn from the last model?", example: "People want thin, but they won't sacrifice the keyboard", requiresModelType: "successor" },
  { id: 21, text: "Why should someone upgrade from the previous version?", example: "Same price, twice the speed, half the weight", requiresModelType: "successor" },
  { id: 22, text: "What's different about this refresh?", example: "New internals, same beloved design — just faster everywhere", requiresModelType: "specBump" },
  { id: 23, text: "What's one thing the spec sheet can't capture?", example: "How it feels to open the lid and just start working" },
  { id: 24, text: "What are you most proud of?", example: "We built the laptop we personally wanted to use" },
  { id: 25, text: "What will reviewers talk about first?", example: "The thermals — full power with zero throttling" },
  { id: 26, text: "If this laptop had a motto, what would it be?", example: "No compromises. No excuses." },
  { id: 27, text: "What's one thing competitors can't match?", example: "Our display calibration — it's studio-grade out of the box" },
  { id: 28, text: "What would a customer say after a month of use?", example: "I forgot I was using a laptop" },
  { id: 29, text: "Pitch this laptop to a sceptic.", example: "Benchmarks don't lie — and neither does the price tag" },
  { id: 30, text: "What's the story behind this product?", example: "We asked a thousand users what they hated and fixed all of it" },
];

export const PROMPTS_PER_RELEASE = 3;
export const PRESS_RELEASE_CHAR_LIMIT = 150;

export function selectPrompts(
  modelType: "brandNew" | "successor" | "specBump",
  previousPromptIds: number[] | null,
): number[] {
  const eligible = PRESS_RELEASE_PROMPTS.filter((p) => {
    if (p.requiresModelType && p.requiresModelType !== modelType) return false;
    return true;
  });

  // Shuffle with Fisher-Yates
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  let selected = shuffled.slice(0, PROMPTS_PER_RELEASE).map((p) => p.id);

  // Avoid repeating exact same set as previous release
  if (
    previousPromptIds &&
    selected.length === previousPromptIds.length &&
    selected.every((id) => previousPromptIds.includes(id))
  ) {
    // Try next candidate
    if (shuffled.length > PROMPTS_PER_RELEASE) {
      selected = [
        ...shuffled.slice(0, PROMPTS_PER_RELEASE - 1).map((p) => p.id),
        shuffled[PROMPTS_PER_RELEASE].id,
      ];
    }
  }

  return selected;
}
