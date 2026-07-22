import data from "@/data/questions.json";
import type { Question, Section, SectionId } from "./types";

const sections = data.sections as Section[];
const questions = data.questions as Question[];

export function getSections(): Section[] {
  return sections;
}

export function getSection(id: string): Section | undefined {
  return sections.find((s) => s.id === id);
}

export function getQuestionsForSection(id: SectionId): Question[] {
  return questions.filter((q) => q.section === id);
}

export function countQuestions(id: SectionId): number {
  return getQuestionsForSection(id).length;
}

export type SectionStatus = "real" | "sample" | "empty";

export interface SectionMeta {
  count: number;
  realCount: number;
  status: SectionStatus;
}

export function getSectionMeta(id: SectionId): SectionMeta {
  const qs = getQuestionsForSection(id);
  const realCount = qs.filter((q) => q.source !== "sample").length;
  const status: SectionStatus =
    qs.length === 0 ? "empty" : realCount > 0 ? "real" : "sample";
  return { count: qs.length, realCount, status };
}

/** "2026-04-18" -> "VÅR 2026", "2025-10-19" -> "HÖST 2025". null för exempelfrågor. */
export function termLabel(source?: string): string | null {
  if (!source) return null;
  const m = source.match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  const year = m[1];
  const month = parseInt(m[2], 10);
  return `${month <= 6 ? "VÅR" : "HÖST"} ${year}`;
}

export interface LasPassage {
  passageId: string;
  title: string;
  term: string;
  passage: string;
  questions: Question[];
}

/** LÄS-frågor grupperade per text (för det grupperade LÄS-läget). */
export function getLasPassages(): LasPassage[] {
  const byId = new Map<string, LasPassage>();
  for (const q of getQuestionsForSection("LAS")) {
    const pid = q.passageId ?? q.id;
    if (!byId.has(pid)) {
      byId.set(pid, {
        passageId: pid,
        title: q.passageTitle ?? "",
        term: q.term ?? "",
        passage: q.passage ?? "",
        questions: [],
      });
    }
    byId.get(pid)!.questions.push(q);
  }
  const qnum = (id: string) => {
    const m = id.match(/LAS-(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };
  const passages = [...byId.values()];
  for (const p of passages) p.questions.sort((a, b) => qnum(a.id) - qnum(b.id));
  return passages;
}

/** Fisher–Yates-blandning, muterar inte originalet */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
