#!/usr/bin/env python3
"""
Extraherar äkta ORD- och MEK-frågor ur högskoleprovets verbala provpass
(pass 2 och pass 4) och kopplar rätt svar från facit. Skriver questions.json.

Körs från repo-roten:  python3 scripts/extract_verbal.py

LÄS och ELF hanteras INTE här:
- ELF är bortklippt ur källfilerna (upphovsrätt).
- LÄS har flersidiga texter med avstavning — görs som eget, noggrant steg.

Beroende: pypdf  (pip install pypdf)
"""
import json
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("pypdf saknas — kör: pip install pypdf")

ROOT = Path(__file__).resolve().parent.parent
MAT = ROOT / "material"
OUT = ROOT / "data" / "questions.json"

# Provomgång -> källfiler. Lätt att lägga till fler omgångar senare.
EXAMS = [
    {
        "code": "2026-04-18",
        "facit": "hogskoleprovet-facit-26a.pdf",
        # (fil, facit-kolumn) för de två verbala passen
        "verbal_passes": [
            ("provpass-2-verb-utan-elf.pdf", "pass2"),
            ("provpass-4-verb-utan-elf.pdf", "pass4"),
        ],
    }
]


def clean(s: str) -> str:
    s = s.replace("­", "")           # mjukt bindestreck
    s = re.sub(r"-\n(?=[a-zåäö])", "", s)   # avstavning vid radbrytning
    s = s.replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def parse_facit(path: Path):
    t = PdfReader(str(path)).pages[0].extract_text()
    rows = re.findall(
        r"(?m)^\s*(\d+)\s+([A-E])\s+(\d+)\s+([A-E])\s+(\d+)\s+([A-E])\s+(\d+)\s+([A-E])",
        t,
    )
    cols = {"pass2": {}, "pass3": {}, "pass4": {}, "pass5": {}}
    for n2, a2, n3, a3, n4, a4, n5, a5 in rows:
        cols["pass2"][int(n2)] = a2
        cols["pass3"][int(n3)] = a3
        cols["pass4"][int(n4)] = a4
        cols["pass5"][int(n5)] = a5
    return cols


LETTER = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}


def split_options(block: str):
    """Delar ett textblock på 'A ... B ... C ...' till en lista av alternativ."""
    parts = re.split(r"(?m)^\s*([A-E])\s+", block)
    # parts = [före, 'A', textA, 'B', textB, ...]
    opts = {}
    for i in range(1, len(parts) - 1, 2):
        letter = parts[i]
        text = clean(parts[i + 1])
        opts[letter] = text
    ordered = [opts[k] for k in "ABCDE" if k in opts]
    return ordered


def classify_page(text: str):
    """Vilket delprov hör sidan till? Bygger på sidhuvudet. None = hoppa över."""
    head = text[:80]
    if "Ordförståelse" in text or re.search(r"(?m)^\s*ORD\b", head):
        return "ORD"
    if "Meningskomplettering" in text or re.search(r"(?m)^\s*MEK\b", head):
        return "MEK"
    return None  # LÄS, försättsblad, blanksidor


def section_text(reader, section: str) -> str:
    """Slår ihop texten från ENBART de sidor som tillhör delprovet.
    Hoppar över försättsbladet (sid 1) så delproven inte blöder ihop."""
    parts = []
    for i, page in enumerate(reader.pages):
        if i == 0:
            continue
        t = page.extract_text()
        if classify_page(t) == section:
            parts.append(t)
    return "\n".join(parts)


def extract_section(pages_text: str, section: str, num_range):
    """
    Plockar ut frågor i ett numrerat intervall ur delprovets egen text.
    Varje fråga avgränsas av NÄSTA numrerade frågestart (oavsett nummer),
    så sista frågan inte sveper in efterföljande sidor.
    """
    lo, hi = num_range
    # Alla numrerade frågestarter, sorterade på position (kolumnläsordning ok)
    all_starts = [
        (int(m.group(1)), m.start())
        for m in re.finditer(r"(?m)^\s*(\d{1,2})\.\s", pages_text)
    ]
    all_starts.sort(key=lambda x: x[1])
    positions = [p for _, p in all_starts]
    results = []
    for idx, (n, pos) in enumerate(all_starts):
        if not (lo <= n <= hi):
            continue
        end = positions[idx + 1] if idx + 1 < len(positions) else len(pages_text)
        chunk = pages_text[pos:end]
        # Ta bort själva numret
        chunk = re.sub(r"^\s*\d{1,2}\.\s*", "", chunk)
        # Dela i frågetext (före första 'A ') och alternativ
        m = re.search(r"(?m)^\s*A\s+", chunk)
        if not m:
            continue
        qtext = clean(chunk[: m.start()])
        opts = split_options(chunk[m.start():])
        if len(opts) < 2 or not qtext:
            continue
        results.append({"n": n, "text": qtext, "options": opts})
    return results


def main():
    all_sections = [
        {"id": "ORD", "name": "Ordförståelse", "category": "verbal",
         "description": "Välj det ord som bäst motsvarar det givna ordet."},
        {"id": "LAS", "name": "Läsförståelse", "category": "verbal",
         "description": "Läs en text och svara på frågor om innehållet."},
        {"id": "MEK", "name": "Meningskomplettering", "category": "verbal",
         "description": "Välj de ord som passar bäst i luckorna."},
        {"id": "ELF", "name": "Engelsk läsförståelse", "category": "verbal",
         "description": "Läs en engelsk text och svara på frågor."},
        {"id": "XYZ", "name": "Matematisk problemlösning", "category": "kvantitativ",
         "description": "Lös matematiska problem."},
        {"id": "KVA", "name": "Kvantitativa jämförelser", "category": "kvantitativ",
         "description": "Jämför två kvantiteter och avgör vilken som är störst."},
        {"id": "NOG", "name": "Kvantitativa resonemang", "category": "kvantitativ",
         "description": "Avgör vilken information som räcker för att besvara frågan."},
        {"id": "DTK", "name": "Diagram, tabeller och kartor", "category": "kvantitativ",
         "description": "Tolka diagram, tabeller och kartor."},
    ]

    questions = []
    # ORD = uppgift 1-10, MEK = uppgift 21-30 i varje verbalt pass
    RANGES = {"ORD": (1, 10), "MEK": (21, 30)}

    for exam in EXAMS:
        facit = parse_facit(MAT / exam["facit"])
        for fname, col in exam["verbal_passes"]:
            reader = PdfReader(str(MAT / fname))
            answers = facit[col]
            for sec, rng in RANGES.items():
                sec_text = section_text(reader, sec)
                found = extract_section(sec_text, sec, rng)
                for q in found:
                    letter = answers.get(q["n"])
                    if letter is None or letter not in LETTER:
                        print(f"  ⚠ saknar facit för {sec} {q['n']} ({fname})")
                        continue
                    correct = LETTER[letter]
                    if correct >= len(q["options"]):
                        print(f"  ⚠ facit {letter} utanför alternativen "
                              f"för {sec} {q['n']} ({fname}) — hoppar över")
                        continue
                    questions.append({
                        "id": f"{exam['code']}-{col}-{sec}-{q['n']}",
                        "section": sec,
                        "text": q["text"],
                        "options": q["options"],
                        "correct": correct,
                        "explanation": f"Rätt svar enligt facit: {letter}.",
                        "source": exam["code"],
                    })

    # Behåll kvant-platshållare tills äkta kvantfrågor byggs (bildmetoden).
    placeholder = ROOT / "data" / "placeholder_quant.json"
    if placeholder.exists():
        extra = json.loads(placeholder.read_text(encoding="utf-8"))["questions"]
        questions.extend(extra)

    data = {"sections": all_sections, "questions": questions}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    # Sammanfattning
    from collections import Counter
    by_sec = Counter(q["section"] for q in questions)
    real = sum(1 for q in questions if q["source"] != "sample")
    print(f"Skrev {len(questions)} frågor ({real} äkta) till {OUT.relative_to(ROOT)}")
    for s in ("ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"):
        print(f"  {s}: {by_sec.get(s, 0)}")


if __name__ == "__main__":
    main()
