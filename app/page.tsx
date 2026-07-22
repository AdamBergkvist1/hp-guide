"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSectionMeta, getSections } from "@/lib/questions";
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
                const meta = getSectionMeta(s.id);
                const st = stats[s.id];
                const pct =
                  st && st.attempts > 0
                    ? Math.round((100 * st.correct) / st.attempts)
                    : null;
                const empty = meta.status === "empty";

                const badge =
                  meta.status === "real" ? (
                    <span className="tag tag-real">Äkta prov</span>
                  ) : meta.status === "sample" ? (
                    <span className="tag tag-sample">Exempelfrågor</span>
                  ) : (
                    <span className="tag tag-soon">Kommer snart</span>
                  );

                const inner = (
                  <>
                    <div className="card-title">
                      {s.name} <span className="card-id">{s.id}</span>
                    </div>
                    <div className="card-desc">{s.description}</div>
                    <div className="card-meta">
                      {badge}
                      {!empty && (
                        <>
                          {" "}
                          {meta.count} frågor
                          {pct !== null && (
                            <>
                              {" · "}
                              <span className="good">{pct} % rätt</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </>
                );

                return empty ? (
                  <div key={s.id} className="card card-disabled">
                    {inner}
                  </div>
                ) : (
                  <Link key={s.id} href={`/ova/${s.id}`} className="card">
                    {inner}
                  </Link>
                );
              })}
          </div>
        </section>
      ))}

      <div className="info-note">
        <strong>Om innehållet:</strong> ORD, LÄS och MEK innehåller äkta uppgifter
        från tre högskoleprov (april 2025, oktober 2025 och april 2026). De
        kvantitativa delproven visar exempelfrågor så länge — de byggs ut härnäst.
        Engelsk läsförståelse (ELF) finns inte med, eftersom de engelska texterna
        är upphovsrättsskyddade och klipps bort ur de publicerade proven.
      </div>
    </>
  );
}
