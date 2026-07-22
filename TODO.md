# TODO — HP-Guide

## Nu (MVP)

- [x] Projektstruktur, git, README
- [x] Testfrågeset per delprov (placeholder)
- [x] Träningsläge: välj delprov → frågor → rätt/fel-feedback
- [x] Statistik per delprov (localStorage)
- [x] Deploy till Vercel (live: hp-guide-xi.vercel.app)
- [x] Äkta ORD + MEK + LÄS via scripts/extract_verbal.py
- [x] Multi-prov: skriptet läser alla undermappar i material/, auto-detekterar
      verbala pass ur facit. Nu 3 prov: apr 2025, okt 2025, apr 2026.
- [x] Äkta frågor: ORD 60, MEK 60, LÄS 55 (175 totalt), 0 fel mot facit.

## Nästa

- [ ] LÄS: 5 av 60 frågor kunde inte extraheras (PDF-kolumner scramblades vid
      just de frågorna → medvetet uteslutna hellre än fel text). Kan tas för hand
      senare om vi vill ha exakt 60. Saknas: apr26 p4 q11–12, okt25 p3 q17,19,20.
- [ ] LÄS-passager har enstaka kosmetiska mellanslag ("vi sar", "gymnasies kolan")
      från PDF-extraktionen — läsbart men ej perfekt. Kan städas med ordlista senare.
- [ ] Kvant (XYZ/KVA/NOG/DTK): bildmetoden — klipp ut varje fråga som bild ur PDF,
      svar från facit. DTK KRÄVER bild. Ersätter exempelfrågorna (source: "sample").
- [ ] Provläge + normering (se visionen nedan)
- [ ] Designrunda: skärmdumpar från hpguiden.se/HPappen.se, animeringar/success states
- [ ] Egna ELF-frågor om vi vill träna engelska (låg prio) — äkta ELF finns ej (upphovsrätt)

## Datakälla

- Provmaterial (PDF) laddas ner från studera.nu/UHR, läggs i `material/` (gitignoreras, stort).
- `scripts/extract_verbal.py` läser proven + facit → `data/questions.json`.
- Prov just nu: 2026-04-18 (pass 2 + 4 verbala, pass 3 + 5 kvant, facit-26a, normeringstabeller).

## Vision: poäng & provläge (Adams idé 2026-07-22)

Målet: så många funktioner som möjligt för att maximera HP-poängen.
Allt nedan bygger på riktiga provfrågor + normeringstabeller — grunden görs först.

- **Normering:** provet = 160 frågor (80 verbala + 80 kvantitativa). Råpoäng →
  normerat resultat 0.00–2.00 via tabell som är UNIK per provomgång (medel = 1.0).
  Vi laddar ner tabellerna, inte en formel — ratiot varierar mellan prov.
  Källa: normeringstabeller finns publikt (hpguiden.se, mitthp.se, studera.nu/UHR).
- **Provläge ("testprov"):** kör ett helt gammalt prov → få ditt normerade
  resultat för den omgången (verbal 0–2.0, kvant 0–2.0, totalt). Med tidtagning som skarpt prov.
  OBS normering: normeringstabellen bygger på alla 80 verbala frågor inkl. ELF (20 st).
  Eftersom ELF saknas kan ett exakt verbalt normerat resultat inte återskapas för denna omgång
  — kvant kan normeras fullt ut. Ta hänsyn till detta (t.ex. visa "uppskattat" för verbal).
- **Snitt/analys:** sammanställ dina resultat över tid → snittat normerat resultat,
  utveckling per delprov, vilka delprov som drar ner mest (störst hävstång att träna).
- **Modes:** träningsläge (nuvarande), provläge, "svaga delar"-läge (fokusera där man är sämst),
  ev. tidspress-läge.

## Senare (efter att grunden bevisat sig)

- [ ] Konton + sparad progress i molnet: Clerk (auth) + Supabase (data, MED row level security från dag ett)
- [ ] Rate limiting innan inloggning/AI-endpoints släpps på
- [ ] AI-förklaringar av frågor via API (nyckel ENBART server-side)
- [ ] Provläge med tidtagning (som riktiga provet)

## Beslut & avvägningar (medvetet ej gjort)

- **Ingen databas/inloggning i MVP** — localStorage räcker för att bevisa värdet.
  Betyder: progress är per webbläsare och försvinner om man rensar webbdata. Känd begränsning.
- **Ingen Tailwind/UI-ramverk ännu** — ren CSS med variabler tills designrundan,
  färre rörliga delar. Kan bytas när designen sätts.
- **Handskrivna testfrågor** — riktiga provfrågor kräver nedladdning + extraktion,
  görs som eget steg. Testfrågorna är märkta med `"source": "sample"`.
- **ORD har 5 svarsalternativ, NOG har 5 fasta, KVA 4 fasta, övriga 4** — enligt provets format.
  Verifieras mot riktiga prov när materialet läggs in.
