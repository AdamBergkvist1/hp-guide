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

- [x] LÄS grupperat läge (HPappen-likt): text i två spalter (en på mobil) +
      dess frågor med 1/N-bläddring. Frågorna delar passageId.
- [ ] LÄS: 5 av 60 frågor kunde inte extraheras (PDF-kolumner scramblades vid
      just de frågorna → medvetet uteslutna hellre än fel text). Kan tas för hand
      senare om vi vill ha exakt 60. Saknas: apr26 p4 q11–12, okt25 p3 q17,19,20.
- [ ] LÄS debatt-texter (INLÄGG): enstaka ord kan hamna i fel ordning från den
      tvåspaltiga läsordningen. Vanliga texter är rena. Kan finslipas eller tas
      för hand vid behov. Kosmetiska mellanslag ("SO-undervisningen") kan finnas kvar.
- [x] KaTeX-typsättning i appen (components/MathText.tsx renderar $...$).
- [x] XYZ April 2026: 11 frågor transkriberade till typsatt matte, verifierade
      mot facit + lösta. Ligger i data/quant_real.json.
- [x] KVA April 2026: 10 frågor typsatt matte, verifierade mot facit.
      Fråga 14 (triangelfigur) som bild (public/quant-img/) — bildstöd byggt (question.image).
- [x] XYZ fråga 9: grafer som svarsalternativ (optionImages) — bild-alternativ i
      2×2-rutnät. XYZ nu komplett (12 frågor).
- [x] NOG April 2026: 6 frågor transkriberade, verifierade mot facit + lösta.
      Provets riktiga 5-alternativsformat ("i (1) men ej i (2)" osv).
- [x] DTK April 2026: 11 frågor + 4 material (diagram/tabell/karta) som bild,
      grupperade som LÄS, med lightbox-zoom. Liggande diagram roterade rätt.
- [ ] DTK fråga 38: cirkeldiagram som svarsalternativ (optionImages) — litet steg kvar.
- [ ] April 2026 nu KOMPLETT förutom ELF (finns ej) + DTK 38.
- [ ] Övriga två prov (okt25, apr25): transkribera kvant på samma sätt (verbalt klart).
- [ ] Formel-/pluggflik för matten (Adams idé).
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

## Idéer (Adam)

- [x] Visa vilket prov varje fråga är från (termetikett VÅR/HÖST på alla frågor).
- [ ] Formel-/pluggflik: samla formler och saker man behöver kunna utantill för
      matten (à la HPappens "Formelsamling" / "Kurs"). Egen sida i appen.

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
