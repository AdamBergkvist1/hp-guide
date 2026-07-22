# HP-Guide

Träningsapp för högskoleprovet — träna på delproven och se din utveckling.

## Vad den gör (MVP)

- Välj delprov (ORD, MEK, LÄS, ELF, XYZ, KVA, NOG, DTK)
- Svara på frågor, få direkt rätt/fel-feedback med förklaring
- Statistik per delprov, sparad lokalt i webbläsaren (localStorage)

Ingen inloggning eller databas ännu — det läggs till när grunden bevisat sig
(Supabase + Clerk är planen, se TODO.md).

## Teknik

- Next.js 15 (App Router) + React 19 + TypeScript
- Ingen backend i MVP:n — frågorna ligger i `data/questions.json`, progress i localStorage
- Deploy: Vercel (kopplas till GitHub-repot)

## Köra lokalt

```bash
npm install
npm run dev
# öppna http://localhost:3000
```

## Struktur

```
app/            sidor (App Router)
  page.tsx      startsida: välj delprov + översikt
  ova/[section] träningsläge
  statistik/    statistiksida
components/     UI-komponenter
lib/            typer, frågeladdning, progress (localStorage)
data/           questions.json — frågebanken
```

## Frågematerial

Just nu ett litet handskrivet testset per delprov. Riktiga gamla högskoleprov
(PDF:er från studera.nu) extraheras in senare — se TODO.md.
