import type { Attempt, SectionId, SectionStats } from "./types";

const KEY = "hp-guide:attempts:v1";

/** Läser alla försök från localStorage. Returnerar [] på server eller vid trasig data. */
export function getAttempts(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Attempt[];
  } catch {
    // Trasig data ska inte krascha appen — men vi loggar så felet inte är tyst.
    console.error("hp-guide: kunde inte läsa sparad progress, börjar om.");
    return [];
  }
}

export function recordAttempt(attempt: Attempt): boolean {
  if (typeof window === "undefined") return false;
  try {
    const all = getAttempts();
    all.push(attempt);
    window.localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    console.error("hp-guide: kunde inte spara försöket.");
    return false;
  }
}

export function getStatsBySection(): Record<SectionId, SectionStats> {
  const stats = {} as Record<SectionId, SectionStats>;
  for (const a of getAttempts()) {
    if (!stats[a.section]) stats[a.section] = { attempts: 0, correct: 0 };
    stats[a.section].attempts++;
    if (a.correct) stats[a.section].correct++;
  }
  return stats;
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
