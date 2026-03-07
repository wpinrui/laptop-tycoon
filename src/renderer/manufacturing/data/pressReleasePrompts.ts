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
