"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countQuestions, getSections } from "@/lib/questions";
import { getStatsBySection } from "@/lib/progress";
import type { SectionStats, SectionId } from "@/lib/types";

export default function Home() {
  const sections = getSections();
  const [stats, setStats] = useState<Partial<Record<SectionId, SectionStats>>>(
    {}
  );

  // localStorage finns bara i webbläsaren — läs efter mount.
  useEffect(() => {
    setStats(getStatsBySection());
  }, []);

  const categories = [
    { key: "verbal" as const, label: "Verbal del" },
    { key: "kvantitativ" as const, label: "Kvantitativ del" },
  ];

  return (
    <>
      <h1>Träna på högskoleprovet</h1>
      <p className="subtitle">
        Välj ett delprov att öva på. Din statistik sparas i webbläsaren.
      </p>

      {categories.map((cat) => (
        <section key={cat.key}>
          <h2 className="category">{cat.label}</h2>
          <div className="grid">
            {sections
              .filter((s) => s.category === cat.key)
              .map((s) => {
                const st = stats[s.id];
                const pct =
                  st && st.attempts > 0
                    ? Math.round((100 * st.correct) / st.attempts)
                    : null;
                return (
                  <Link key={s.id} href={`/ova/${s.id}`} className="card">
                    <div className="card-title">
                      {s.name} <span className="card-id">{s.id}</span>
                    </div>
                    <div className="card-desc">{s.description}</div>
                    <div className="card-meta">
                      {countQuestions(s.id)} frågor
                      {pct !== null && (
                        <>
                          {" · "}
                          <span className="good">{pct} % rätt hittills</span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </>
  );
}
