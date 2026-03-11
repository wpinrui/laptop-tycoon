import { GameState, Quarter, getPlayerCompany } from "../state/gameTypes";

/** Exposed by preload.ts via contextBridge. */
interface SaveAPI {
  listSlots(): Promise<string[]>;
  readFile(slotId: string, filename: string): Promise<string | null>;
  writeFile(slotId: string, filename: string, data: string): Promise<boolean>;
  deleteSlot(slotId: string): Promise<boolean>;
  deleteFile(slotId: string, filename: string): Promise<boolean>;
  listFiles(slotId: string): Promise<string[]>;
}

declare global {
  interface Window {
    saveAPI: SaveAPI;
  }
}

const api = (): SaveAPI => window.saveAPI;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaveSlotMeta {
  slotId: string;
  companyName: string;
  year: number;
  quarter: Quarter;
  savedAt: number; // Date.now()
}

export interface AutosaveMeta {
  slotId: string;
  autoIndex: number;
  companyName: string;
  year: number;
  quarter: Quarter;
  savedAt: number;
}

interface SaveEnvelope {
  meta: SaveSlotMeta;
  state: GameState;
}

interface AutosaveEnvelope {
  meta: AutosaveMeta;
  state: GameState;
}

interface SlotIndex {
  nextAutoIndex: number; // ring buffer pointer (0-9)
}

export const MAX_AUTOSAVES = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// Active slot tracking (which slot autosaves target)
// ---------------------------------------------------------------------------

let activeSlotId: string | null = null;

export function getActiveSlotId(): string | null {
  return activeSlotId;
}

export function setActiveSlotId(slotId: string | null): void {
  activeSlotId = slotId;
}

// ---------------------------------------------------------------------------
// Slot operations
// ---------------------------------------------------------------------------

export async function getAllSlotMeta(): Promise<SaveSlotMeta[]> {
  const slotIds = await api().listSlots();
  const results = await Promise.all(
    slotIds.map(async (slotId) => {
      const raw = await api().readFile(slotId, "save.json");
      if (!raw) return null;
      try {
        return (JSON.parse(raw) as SaveEnvelope).meta;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((m): m is SaveSlotMeta => m !== null);
}

export async function hasAnySave(): Promise<boolean> {
  const slots = await api().listSlots();
  return slots.length > 0;
}

export async function saveToSlot(slotId: string, state: GameState): Promise<boolean> {
  try {
    const envelope: SaveEnvelope = {
      meta: {
        slotId,
        companyName: getPlayerCompany(state).name,
        year: state.year,
        quarter: state.quarter,
        savedAt: Date.now(),
      },
      state,
    };
    await api().writeFile(slotId, "save.json", JSON.stringify(envelope));
    setActiveSlotId(slotId);
    return true;
  } catch {
    return false;
  }
}

export async function saveToNewSlot(state: GameState): Promise<string | null> {
  const slotId = makeSlotId();
  const ok = await saveToSlot(slotId, state);
  if (!ok) return null;
  // Initialise ring buffer index
  const idx: SlotIndex = { nextAutoIndex: 0 };
  await api().writeFile(slotId, "index.json", JSON.stringify(idx));
  return slotId;
}

export async function loadFromSlot(slotId: string): Promise<GameState | null> {
  try {
    const raw = await api().readFile(slotId, "save.json");
    if (!raw) return null;
    const envelope = JSON.parse(raw) as SaveEnvelope;
    setActiveSlotId(slotId);
    return envelope.state;
  } catch {
    return null;
  }
}

export async function deleteSlot(slotId: string): Promise<void> {
  await api().deleteSlot(slotId);
  if (activeSlotId === slotId) setActiveSlotId(null);
}

// ---------------------------------------------------------------------------
// Autosave operations
// ---------------------------------------------------------------------------

async function getSlotIndex(slotId: string): Promise<SlotIndex> {
  const raw = await api().readFile(slotId, "index.json");
  if (!raw) return { nextAutoIndex: 0 };
  try {
    return JSON.parse(raw) as SlotIndex;
  } catch {
    return { nextAutoIndex: 0 };
  }
}

export async function autosave(slotId: string, state: GameState): Promise<boolean> {
  try {
    const idx = await getSlotIndex(slotId);
    const autoIndex = idx.nextAutoIndex % MAX_AUTOSAVES;

    const envelope: AutosaveEnvelope = {
      meta: {
        slotId,
        autoIndex,
        companyName: getPlayerCompany(state).name,
        year: state.year,
        quarter: state.quarter,
        savedAt: Date.now(),
      },
      state,
    };

    await api().writeFile(slotId, `auto-${autoIndex}.json`, JSON.stringify(envelope));

    // Advance ring buffer
    const newIdx: SlotIndex = { nextAutoIndex: (autoIndex + 1) % MAX_AUTOSAVES };
    await api().writeFile(slotId, "index.json", JSON.stringify(newIdx));

    return true;
  } catch {
    return false;
  }
}

export async function getAutosaveMetas(slotId: string): Promise<AutosaveMeta[]> {
  const files = await api().listFiles(slotId);
  const autoFiles = files.filter((f) => f.startsWith("auto-") && f.endsWith(".json"));
  const results = await Promise.all(
    autoFiles.map(async (file) => {
      const raw = await api().readFile(slotId, file);
      if (!raw) return null;
      try {
        return (JSON.parse(raw) as AutosaveEnvelope).meta;
      } catch {
        return null;
      }
    }),
  );
  const metas = results.filter((m): m is AutosaveMeta => m !== null);
  metas.sort((a, b) => b.savedAt - a.savedAt);
  return metas;
}

export async function loadAutosave(slotId: string, autoIndex: number): Promise<GameState | null> {
  try {
    const raw = await api().readFile(slotId, `auto-${autoIndex}.json`);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as AutosaveEnvelope;
    setActiveSlotId(slotId);
    return envelope.state;
  } catch {
    return null;
  }
}
