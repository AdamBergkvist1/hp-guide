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

/** Fisher–Yates-blandning, muterar inte originalet */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
