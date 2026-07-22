"use client";

import { useEffect, useState } from "react";
import { getSections } from "@/lib/questions";
import { clearProgress, getStatsBySection } from "@/lib/progress";
import type { SectionStats, SectionId } from "@/lib/types";

export default function StatsPage() {
  const sections = getSections();
  const [stats, setStats] = useState<Partial<Record<SectionId, SectionStats>>>(
    {}
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStats(getStatsBySection());
    setLoaded(true);
  }, []);

  const total = Object.values(stats).reduce(
    (acc, s) => ({
      attempts: acc.attempts + (s?.attempts ?? 0),
      correct: acc.correct + (s?.correct ?? 0),
    }),
    { attempts: 0, correct: 0 }
  );

  function handleReset() {
    if (
      window.confirm(
        "Vill du verkligen nollställa all statistik? Detta går inte att ångra."
      )
    ) {
      clearProgress();
      setStats({});
    }
  }

  return (
    <>
      <h1>Statistik</h1>
      <p className="subtitle">
        {total.attempts > 0
          ? `${total.attempts} besvarade frågor totalt, ${Math.round(
              (100 * total.correct) / total.attempts
            )} % rätt.`
          : loaded
            ? "Inga besvarade frågor ännu — välj ett delprov och kör igång!"
            : "Laddar…"}
      </p>

      {sections.map((s) => {
        const st = stats[s.id];
        const pct =
          st && st.attempts > 0
            ? Math.round((100 * st.correct) / st.attempts)
            : null;
        return (
          <div key={s.id} className="stat-row">
            <div className="stat-head">
              <span>
                <strong>{s.id}</strong> — {s.name}
              </span>
              <span className="pct">{pct !== null ? `${pct} %` : "–"}</span>
            </div>
            <div className="progress-track" style={{ marginBottom: 6 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${pct ?? 0}%`,
                  background:
                    pct === null
                      ? "transparent"
                      : pct >= 70
                        ? "var(--green)"
                        : pct >= 40
                          ? "var(--accent)"
                          : "var(--red)",
                }}
              />
            </div>
            <div className="stat-note">
              {st
                ? `${st.correct} rätt av ${st.attempts} besvarade`
                : "Inte tränat ännu"}
            </div>
          </div>
        );
      })}

      {total.attempts > 0 && (
        <button className="danger-link" onClick={handleReset}>
          Nollställ all statistik
        </button>
      )}
    </>
  );
}
