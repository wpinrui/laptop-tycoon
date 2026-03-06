import { PressReleasePrompt } from "../types";

export const PRESS_RELEASE_PROMPTS: PressReleasePrompt[] = [
  { id: 1, text: "Describe this laptop in one sentence." },
  { id: 2, text: "What's the single standout feature?" },
  { id: 3, text: "Who is this laptop built for?" },
  { id: 4, text: "What problem does this laptop solve?" },
  { id: 5, text: "How does this compare to your previous model?", requiresModelType: "successor" },
  { id: 6, text: "What should customers expect from the build quality?" },
  { id: 7, text: "Describe the experience of using this laptop in one word, then explain." },
  { id: 8, text: "What would you say to someone choosing between this and a competitor?" },
  { id: 9, text: "What's something about this laptop that doesn't show up in the spec sheet?" },
  { id: 10, text: "If you could only keep one feature, which would it be and why?" },
  { id: 11, text: "What compromises did you make, and why are they worth it?" },
  { id: 12, text: "What's your ambition for this product line going forward?" },
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
