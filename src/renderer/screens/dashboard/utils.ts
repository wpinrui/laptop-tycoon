import { GameState } from "../../state/gameTypes";

export const MAX_MODELS = 2;

export function getActiveModels(state: GameState) {
  return state.models.filter((m) => m.status !== "discontinued");
}
