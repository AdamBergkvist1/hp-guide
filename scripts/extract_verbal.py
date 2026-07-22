#!/usr/bin/env python3
"""
Extraherar äkta verbala frågor (ORD, MEK, LÄS) ur högskoleprovens provpass och
kopplar rätt svar från facit. Skriver data/questions.json.

Körs från repo-roten:  python3 scripts/extract_verbal.py

Hanterar flera provomgångar automatiskt: varje undermapp i material/ som
innehåller en facit-PDF behandlas som en omgång. Facit läses för att avgöra
vilka provpass som är verbala och vilken kolumn som hör till vilket pass.

Ej hanterat här:
- ELF (engelsk läsförståelse): bortklippt ur källfilerna (upphovsrätt).
- Kvant (XYZ/KVA/NOG/DTK): formler/diagram — görs med bildmetoden separat.

Beroenden: pypdf, pdfplumber
"""
import json
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
    import pdfplumber
except ImportError as e:
    sys.exit(f"Saknar beroende ({e}). Kör: pip install pypdf pdfplumber")

ROOT = Path(__file__).resolve().parent.parent
MAT = ROOT / "material"
OUT = ROOT / "data" / "questions.json"

LETTER = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}

SECTIONS = [
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


# ---------------------------------------------------------------- text-städning
def term_label(code: str) -> str:
    """'2026-04-18' -> 'VÅR 2026', '2025-10-19' -> 'HÖST 2025'."""
    m = re.match(r"(\d{4})-(\d{2})", code)
    if not m:
        return code
    year, month = m.group(1), int(m.group(2))
    return f"{'VÅR' if month <= 6 else 'HÖST'} {year}"


def clean(s: str) -> str:
    s = s.replace("\xad", "")
    s = re.sub(r"-\n(?=[a-zåäö])", "", s)
    s = s.replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def clean_passage(t: str) -> str:
    t = t.replace("\xad", "")
    t = re.sub(r"–\s*(MB|\d{1,3})\s*–", " ", t)          # sidmarkörer
    t = re.sub(r"(?m)^\s*Svensk läsförståelse\s*[–-]\s*LÄS\s*$", " ", t)
    t = re.sub(r"(?m)^\s*(LÄS|Uppgifter)\s*$", " ", t)
    t = re.sub(r"-\n(?=[a-zåäö])", "", t)
    t = t.replace("\n", " ")
    t = re.sub(r"\s+", " ", t)
    return t.strip()


# ------------------------------------------------------------------------ facit
def parse_facit(path: Path):
    """Returnerar {passnummer: {frågenr: bokstav}} + {passnummer: 'verbal'/'kvant'}."""
    t = PdfReader(str(path)).pages[0].extract_text()
    passnums = [int(n) for n in re.findall(r"Provpass\s+(\d+)", t)][:4]
    types = re.findall(r"(Verbal|Kvantitativ)\s+del", t)[:4]
    rows = re.findall(
        r"(?m)^\s*(\d+)\s+([A-E])\s+(\d+)\s+([A-E])\s+(\d+)\s+([A-E])\s+(\d+)\s+([A-E])",
        t,
    )
    cols = {p: {} for p in passnums}
    for r in rows:
        for c in range(4):
            n = int(r[c * 2]); letter = r[c * 2 + 1]
            cols[passnums[c]][n] = letter
    kind = {passnums[i]: ("verbal" if types[i] == "Verbal" else "kvant")
            for i in range(len(passnums))}
    return cols, kind


# ---------------------------------------------------------- ORD/MEK (ren text)
def classify_page(text: str):
    head = text[:120]
    if "Ordförståelse" in head or re.search(r"(?m)^\s*ORD\b", head):
        return "ORD"
    if "Meningskomplettering" in head or re.search(r"(?m)^\s*MEK\b", head):
        return "MEK"
    if "LÄS" in head or "läsförståelse" in head.lower():
        return "LAS"
    return None


# Sidmarkörer/rubriker som aldrig hör till en fråga eller ett alternativ.
# Används för att kapa bort passagetext som annars läcker in i sista alternativet.
_MARKER = re.compile(
    r"–\s*(?:MB|\d{1,3})\s*–"          # "– 6 –", "– MB –"
    r"|Svensk läsförståelse"
    r"|(?m:^\s*LÄS\s*$)"
    r"|\bUppgifter\b"
)


def trim_marker(t: str) -> str:
    """Kapar text vid första sidmarkör/rubrik (där passagen tar vid)."""
    m = _MARKER.search(t)
    return t[: m.start()].strip() if m else t.strip()


def split_options(block: str):
    parts = re.split(r"(?m)^\s*([A-E])\s+", block)
    opts = {}
    for i in range(1, len(parts) - 1, 2):
        opts[parts[i]] = trim_marker(clean(parts[i + 1]))
    return [opts[k] for k in "ABCDE" if k in opts]


def is_clean(qtext: str, options, expected=None) -> bool:
    """Slänger missformade frågor (t.ex. ihopblandade av trasig kolumnläsning)."""
    combo = qtext + " " + " ".join(options)
    if re.search(r"\b(1[1-9]|20)\.\s", combo):
        return False                      # inbäddat frågenummer = hopblandning
    if any(not o or len(o) > 200 for o in options):
        return False
    if len(qtext) < 2:                    # korta ledord i ORD är giltiga (t.ex. "slug")
        return False
    if expected is not None and len(options) != expected:
        return False
    return True


def extract_numbered(pages_text: str, num_range):
    """Frågor i ett numrerat intervall; varje avgränsas av nästa numrerade start."""
    lo, hi = num_range
    starts = [(int(m.group(1)), m.start())
              for m in re.finditer(r"(?m)^\s*(\d{1,2})\.\s", pages_text)]
    starts.sort(key=lambda x: x[1])
    positions = [p for _, p in starts]
    out = []
    for idx, (n, pos) in enumerate(starts):
        if not (lo <= n <= hi):
            continue
        end = positions[idx + 1] if idx + 1 < len(positions) else len(pages_text)
        chunk = re.sub(r"^\s*\d{1,2}\.\s*", "", pages_text[pos:end])
        m = re.search(r"(?m)^\s*A\s+", chunk)
        if not m:
            continue
        qtext = clean(chunk[: m.start()])
        opts = split_options(chunk[m.start():])
        if len(opts) >= 2 and qtext:
            out.append({"n": n, "text": qtext, "options": opts})
    return out


def section_text(reader, section: str) -> str:
    parts = []
    for i, page in enumerate(reader.pages):
        if i == 0:
            continue
        t = page.extract_text()
        if classify_page(t) == section:
            parts.append(t)
    return "\n".join(parts)


# ----------------------------------------------------- LÄS (kolumnmedveten)
def column_text(page) -> str:
    """Läser en sida kolumn för kolumn (vänster hela vägen ner, sedan höger).
    HP:s verbalsidor är tvåspaltiga; vi hittar spaltgränsen som största
    tomrummet i x-led i mittzonen."""
    words = page.extract_words(use_text_flow=False)
    if not words:
        return ""
    w = page.width
    centers = sorted((x["x0"] + x["x1"]) / 2 for x in words)
    boundary, best_gap = w / 2, 0.0
    for a, b in zip(centers, centers[1:]):
        mid = (a + b) / 2
        if 0.30 * w < mid < 0.70 * w and (b - a) > best_gap:
            best_gap, boundary = b - a, mid

    def render(ws):
        ws = sorted(ws, key=lambda x: (round(x["top"] / 4), x["x0"]))
        lines, cur, last = [], [], None
        for x in ws:
            if last is not None and abs(x["top"] - last) > 4:
                lines.append(cur); cur = []
            cur.append(x); last = x["top"]
        if cur:
            lines.append(cur)
        return "\n".join(
            " ".join(z["text"] for z in sorted(ln, key=lambda z: z["x0"]))
            for ln in lines
        )

    left = [x for x in words if (x["x0"] + x["x1"]) / 2 < boundary]
    right = [x for x in words if (x["x0"] + x["x1"]) / 2 >= boundary]
    return render(left) + "\n" + render(right)


def page_lines(page):
    """Returnerar (vänsterkolumn, högerkolumn) som listor av rader med metadata
    (text, x0, storlek). Radgruppering på y-position; spaltgräns via största
    tomrummet i x-led."""
    words = page.extract_words(extra_attrs=["size"])
    if not words:
        return [], []
    w = page.width
    centers = sorted((x["x0"] + x["x1"]) / 2 for x in words)
    boundary, best = w / 2, 0.0
    for a, b in zip(centers, centers[1:]):
        mid = (a + b) / 2
        if 0.30 * w < mid < 0.70 * w and (b - a) > best:
            best, boundary = b - a, mid

    def lines_of(ws):
        ws = sorted(ws, key=lambda x: (round(x["top"]), x["x0"]))
        groups, cur, last = [], [], None
        for x in ws:
            if last is not None and abs(x["top"] - last) > 4:
                groups.append(cur); cur = []
            cur.append(x); last = x["top"]
        if cur:
            groups.append(cur)
        res = []
        for g in groups:
            g = sorted(g, key=lambda z: z["x0"])
            res.append({
                "text": " ".join(z["text"] for z in g),
                "x0": min(z["x0"] for z in g),
                "size": max(z.get("size", 10) for z in g),
            })
        return res

    left = [x for x in words if (x["x0"] + x["x1"]) / 2 < boundary]
    right = [x for x in words if (x["x0"] + x["x1"]) / 2 >= boundary]
    return lines_of(left), lines_of(right)


_Q_LINE = re.compile(r"^\s*(Uppgifter|1[1-9]\.|20\.|[A-E]\s)")


def has_questions(lines):
    return any(_Q_LINE.match(l["text"]) for l in lines)


def _column_bases(xs):
    """Hittar spalternas vänstermarginaler (t.ex. 64 och 325) ur radernas x0.
    En marginal är ett x-värde utan något mindre x0 inom 40 px (= spaltens kant)."""
    bases = []
    for x in sorted(set(round(v) for v in xs)):
        if not any(0 < x - b <= 40 for b in bases):
            bases.append(x)
    return bases


def build_passage(lines):
    """Bygger ren passagetext ur rader: rubrik (stor font, ev. flera rader),
    stycken via indrag räknat PER SPALT, och lagad avstavning."""
    lines = [l for l in lines
             if not re.match(r"^\s*(LÄS|Uppgifter|Svensk läsförståelse)\s*$",
                             l["text"].strip())]
    if not lines:
        return "", ""
    # Rubrik = inledande rader med stor font (kan vara flera rader)
    title_parts = []
    while lines and lines[0]["size"] >= 14:
        title_parts.append(lines[0]["text"])
        lines = lines[1:]
    title = re.sub(r"\s+", " ", " ".join(title_parts)).strip()
    if not lines:
        return title, ""

    bases = _column_bases([l["x0"] for l in lines])

    def is_indent(x):
        base = max([b for b in bases if b <= x + 1], default=round(x))
        return x - base > 5

    paras, cur = [], ""
    for l in lines:
        t = re.sub(r"–\s*(MB|\d{1,3})\s*–", " ", l["text"]).strip()
        if not t:
            continue
        if is_indent(l["x0"]) and cur:        # indrag mot spaltens kant = nytt stycke
            paras.append(cur); cur = ""
        if cur.endswith("\xad"):
            cur = cur[:-1] + t
        elif cur.rstrip().endswith("-"):
            cur = cur.rstrip()[:-1] + t
        else:
            cur = (cur + " " + t) if cur else t
    if cur.strip():
        paras.append(cur)
    paras = [re.sub(r"\s+", " ", p.replace("\xad", "")).strip() for p in paras]
    return title, "\n\n".join(p for p in paras if p)


def extract_las(pdf_path: Path, answers, exam_code, passn):
    """LÄS: läser radvis och kolumnvis, samlar passagerader tills ett frågeblock
    dyker upp och kopplar då blockets frågor till den byggda texten."""
    plumb = pdfplumber.open(str(pdf_path))
    reader = PdfReader(str(pdf_path))
    out = []
    buf = []          # passagerader (med metadata) i väntan på sitt frågeblock
    block = 0         # räknare för att gruppera frågor per text (passageId)
    for i, page in enumerate(plumb.pages):
        if i == 0:
            continue
        raw = reader.pages[i].extract_text()
        if classify_page(raw) != "LAS":
            continue
        left, right = page_lines(page)
        combined = left + right                  # läsordning: vänster spalt, sedan höger
        qs = extract_numbered(column_text(page), (11, 20))
        if not qs:
            buf += combined                      # ren passagesida
            continue
        # Passagen är allt FÖRE frågeblocket ('Uppgifter' / första numret).
        cut = next((k for k, l in enumerate(combined)
                    if re.match(r"^\s*(Uppgifter|1[1-9]\.|20\.)", l["text"])),
                   len(combined))
        buf += combined[:cut]
        title, passage = build_passage(buf)
        block += 1
        passage_id = f"{exam_code}-p{passn}-b{block}"
        for q in qs:
            letter = answers.get(q["n"])
            if letter is None or letter not in LETTER:
                print(f"  ⚠ saknar facit LÄS {q['n']} (pass {passn})")
                continue
            correct = LETTER[letter]
            if correct >= len(q["options"]):
                print(f"  ⚠ facit {letter} utanför alt LÄS {q['n']} (pass {passn})")
                continue
            if not is_clean(q["text"], q["options"], 4):
                print(f"  ⚠ hoppar missformad LÄS {q['n']} (pass {passn}, {exam_code})")
                continue
            out.append({
                "id": f"{exam_code}-p{passn}-LAS-{q['n']}",
                "section": "LAS",
                "passageId": passage_id,
                "passageTitle": title,
                "passage": passage,
                "term": term_label(exam_code),
                "text": q["text"],
                "options": q["options"],
                "correct": correct,
                "explanation": f"Rätt svar enligt facit: {letter}.",
                "source": exam_code,
            })
        buf = []
    return out


# ------------------------------------------------------------------------- main
def find_verbal_passes(folder: Path, kind: dict):
    """Matchar filer provpass-N-verb*.pdf mot verbala passnummer i facit."""
    result = []
    for f in folder.glob("provpass-*verb*.pdf"):
        m = re.search(r"provpass-(\d+)", f.name)
        if not m:
            continue
        passn = int(m.group(1))
        if kind.get(passn) == "verbal":
            result.append((passn, f))
    return sorted(result)


def main():
    questions = []
    exams = []
    for folder in sorted(p for p in MAT.iterdir() if p.is_dir()):
        facit_files = [f for f in folder.glob("*.pdf")
                       if "facit" in f.name.lower() or re.match(r"hp-\d+", f.name)]
        if not facit_files:
            continue
        facit_path = facit_files[0]
        cols, kind = parse_facit(facit_path)
        # Provomgångskod = datum ur facit, annars mappnamn
        ft = PdfReader(str(facit_path)).pages[0].extract_text()
        dm = re.search(r"(\d{4}-\d{2}-\d{2})", ft)
        code = dm.group(1) if dm else folder.name
        exams.append(code)

        for passn, pdf in find_verbal_passes(folder, kind):
            answers = cols[passn]
            reader = PdfReader(str(pdf))
            # ORD (1–10) + MEK (21–30)
            for sec, rng, nopt in (("ORD", (1, 10), 5), ("MEK", (21, 30), 4)):
                for q in extract_numbered(section_text(reader, sec), rng):
                    letter = answers.get(q["n"])
                    if letter is None or letter not in LETTER:
                        continue
                    correct = LETTER[letter]
                    if correct >= len(q["options"]):
                        print(f"  ⚠ facit {letter} utanför alt {sec} {q['n']} ({code})")
                        continue
                    if not is_clean(q["text"], q["options"], nopt):
                        print(f"  ⚠ hoppar missformad {sec} {q['n']} ({code})")
                        continue
                    questions.append({
                        "id": f"{code}-p{passn}-{sec}-{q['n']}",
                        "section": sec, "text": q["text"], "options": q["options"],
                        "correct": correct,
                        "explanation": f"Rätt svar enligt facit: {letter}.",
                        "source": code,
                    })
            # LÄS (11–20)
            questions.extend(extract_las(pdf, answers, code, passn))

    # Riktiga transkriberade kvantfrågor (alla data/quant_*.json) + platshållare
    data_dir = ROOT / "data"
    for p in sorted(data_dir.glob("quant_*.json")):
        questions.extend(json.loads(p.read_text(encoding="utf-8"))["questions"])
    placeholder = data_dir / "placeholder_quant.json"
    if placeholder.exists():
        questions.extend(json.loads(placeholder.read_text(encoding="utf-8"))["questions"])

    OUT.write_text(
        json.dumps({"sections": SECTIONS, "questions": questions},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    from collections import Counter
    by_sec = Counter(q["section"] for q in questions)
    real = sum(1 for q in questions if q["source"] != "sample")
    print(f"Provomgångar: {', '.join(exams)}")
    print(f"Skrev {len(questions)} frågor ({real} äkta) till {OUT.relative_to(ROOT)}")
    for s in ("ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"):
        print(f"  {s}: {by_sec.get(s, 0)}")


if __name__ == "__main__":
    main()
