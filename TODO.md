# TODO — HP-Guide

## Nu (MVP)

- [x] Projektstruktur, git, README
- [x] Testfrågeset per delprov (placeholder)
- [x] Träningsläge: välj delprov → frågor → rätt/fel-feedback
- [x] Statistik per delprov (localStorage)
- [ ] Adam testar lokalt / vi deployar till Vercel

## Nästa

- [ ] GitHub-repo skapas (Adam) + push
- [ ] Vercel-deploy kopplad till repot
- [ ] Ladda ner gamla HP + facit (Adam) → läggs i en mapp → extraktionsskript
- [ ] Designrunda: skärmdumpar från hpguiden.se/HPappen.se, designfil, animeringar/success states
- [ ] DTK behöver bildstöd (diagram/kartor) — dataformatet har fält för det men UI:t visar inte bilder ännu

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
