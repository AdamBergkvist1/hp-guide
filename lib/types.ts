export type SectionId =
  | "ORD"
  | "LAS"
  | "MEK"
  | "ELF"
  | "XYZ"
  | "KVA"
  | "NOG"
  | "DTK";

export interface Section {
  id: SectionId;
  name: string;
  category: "verbal" | "kvantitativ";
  description: string;
}

export interface Question {
  id: string;
  section: SectionId;
  /** Längre textstycke (LÄS/ELF) som frågan hör till */
  passage?: string;
  text: string;
  options: string[];
  /** Index i options */
  correct: number;
  explanation: string;
  /** "sample" = handskriven testfråga, annars provkod t.ex. "2023-ht" */
  source: string;
  /** Framtida bildstöd (DTK) */
  image?: string;
}

export interface Attempt {
  questionId: string;
  section: SectionId;
  correct: boolean;
  ts: number;
}

export interface SectionStats {
  attempts: number;
  correct: number;
}
