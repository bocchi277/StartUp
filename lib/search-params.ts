import { EMPLOYMENT_TYPES } from "@/lib/constants";
import { INDIAN_STATES } from "@/lib/india";
import type { Enums } from "@/types/database";

type SP = Record<string, string | string[] | undefined>;

export function str(sp: SP, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim().slice(0, 80) : undefined;
}

export function posInt(sp: SP, key: string): number | undefined {
  const n = Number(str(sp, key));
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function page(sp: SP) {
  return Math.min(posInt(sp, "page") ?? 1, 500);
}

export function parseJobFilters(sp: SP) {
  const state = str(sp, "state");
  const type = str(sp, "type");
  return {
    state: state && INDIAN_STATES.includes(state) ? state : undefined,
    city: str(sp, "city"),
    role: posInt(sp, "role"),
    cuisine: posInt(sp, "cuisine"),
    salary: posInt(sp, "salary"),
    type: type && (EMPLOYMENT_TYPES as readonly string[]).includes(type) ? (type as Enums<"employment_type">) : undefined,
    meals: str(sp, "meals") === "1",
    stay: str(sp, "stay") === "1",
  };
}

// Escape % and _ so user input is matched literally by ILIKE.
export function likeEscape(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function withPage(sp: SP, p: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || v == null) continue;
    params.set(k, Array.isArray(v) ? v[0] : v);
  }
  if (p > 1) params.set("page", String(p));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
