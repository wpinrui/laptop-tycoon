import { GameState, getPlayerCompany } from "../state/gameTypes";

const SLOT_PREFIX = "laptop-tycoon-save-";
export const MAX_SLOTS = 5;

export interface SaveSlotMeta {
  slotIndex: number;
  companyName: string;
  year: number;
  savedAt: number; // Date.now()
}

interface SaveEnvelope {
  meta: SaveSlotMeta;
  state: GameState;
}

function slotKey(index: number): string {
  return `${SLOT_PREFIX}${index}`;
}

export function saveToSlot(index: number, state: GameState): boolean {
  try {
    const envelope: SaveEnvelope = {
      meta: {
        slotIndex: index,
        companyName: getPlayerCompany(state).name,
        year: state.year,
        savedAt: Date.now(),
      },
      state,
    };
    localStorage.setItem(slotKey(index), JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function loadFromSlot(index: number): GameState | null {
  try {
    const raw = localStorage.getItem(slotKey(index));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as SaveEnvelope;
    return envelope.state;
  } catch {
    return null;
  }
}

export function getSlotMeta(index: number): SaveSlotMeta | null {
  try {
    const raw = localStorage.getItem(slotKey(index));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as SaveEnvelope;
    return envelope.meta;
  } catch {
    return null;
  }
}

export function getAllSlotMeta(): (SaveSlotMeta | null)[] {
  return Array.from({ length: MAX_SLOTS }, (_, i) => getSlotMeta(i));
}

export function hasAnySave(): boolean {
  return getAllSlotMeta().some((m) => m !== null);
}

export function deleteSlot(index: number): void {
  localStorage.removeItem(slotKey(index));
}
