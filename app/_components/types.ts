import type { ActionItem } from "@backend/types";
import type {
  CustomPersona,
  Persona,
  PresetPersona,
} from "@email/sources";

export type { ActionItem, CustomPersona, Persona, PresetPersona };

export type SyncStatus = "live" | "syncing" | "idle";
