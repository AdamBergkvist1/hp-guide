"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getDtkMaterials, shuffle } from "@/lib/questions";
import { recordAttempt } from "@/lib/progress";
import MathText from "@/components/MathText";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function DtkMode() {
  const materials = useMemo(() => shuffle(getDtkMaterials()), []);
  const [mi, setMi] = useState(0);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const [done, setDone] = useState(false);

  if (materials.length === 0) {
    return (
      <>
        <h1>Diagram, tabeller och kartor</h1>
        <p className="subtitle">
          Inga material ännu. <Link href="/">Tillbaka</Link>
        </p>
      </>
    );
  }

  if (done) {
    return (
      <div className="reading">
        <div className="result-card">
          <div className="result-score">Klart!</div>
          <p className="result-msg">
            Du har gått igenom alla {materials.length} material.
          </p>
          <button
            className="btn"
            onClick={() => {
              setMi(0);
              setQi(0);
              setChosen(null);
              setDone(false);
            }}
          >
            Börja om
          </button>{" "}
          <Link href="/statistik">
            <button className="btn secondary">Se statistik</button>
          </Link>
        </div>
      </div>
    );
  }

  const mat = materials[mi];
  const q = mat.questions[qi];
  const answered = chosen !== null;
  const lastQuestion = qi + 1 >= mat.questions.length;
  const lastMaterial = mi + 1 >= materials.length;

  function choose(i: number) {
    if (answered) return;
    setChosen(i);
    recordAttempt({
      questionId: q.id,
      section: "DTK",
      correct: i === q.correct,
      ts: Date.now(),
    });
  }

  function next() {
    setChosen(null);
    if (!lastQuestion) {
      setQi(qi + 1);
    } else if (!lastMaterial) {
      setMi(mi + 1);
      setQi(0);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="las-layout">
      <article className="las-passage">
        <div className="las-passage-head">
          {mat.term && <span className="las-term">{mat.term}</span>}
          {mat.title && <h2 className="las-title">{mat.title}</h2>}
        </div>
        {mat.image && (
          <button
            className="dtk-image-btn"
            onClick={() => setZoom(true)}
            title="Klicka för att förstora"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dtk-image" src={mat.image} alt={mat.title} />
            <span className="dtk-zoom-hint">Klicka för att förstora</span>
          </button>
        )}
      </article>

      <section className="las-quiz">
        <div className="las-quiz-head">
          <span className="las-count">
            Material {mi + 1}/{materials.length}
          </span>
          <div className="las-dots">
            {mat.questions.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === qi ? "active" : ""} ${
                  i < qi ? "past" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div className="las-question">
          <MathText>{q.text}</MathText>
        </div>

        <div className="options">
          {q.options.map((opt, i) => {
            let cls = "option";
            if (answered) {
              if (i === q.correct) cls += " correct";
              else if (i === chosen) cls += " incorrect";
              else cls += " dimmed";
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => choose(i)}
                disabled={answered}
              >
                <span className="letter">{LETTERS[i]}</span>
                <span>
                  <MathText>{opt}</MathText>
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`feedback ${chosen === q.correct ? "ok" : "fel"}`}>
            <div className="verdict">
              {chosen === q.correct
                ? "Rätt!"
                : `Fel — rätt svar är ${LETTERS[q.correct]}.`}
            </div>
            <div>
              <MathText>{q.explanation}</MathText>
            </div>
            <button className="btn" onClick={next}>
              {!lastQuestion
                ? "Nästa fråga"
                : !lastMaterial
                  ? "Nästa material"
                  : "Se resultat"}
            </button>
          </div>
        )}
      </section>

      {zoom && mat.image && (
        <div className="dtk-lightbox" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mat.image} alt={mat.title} />
          <span className="dtk-lightbox-close">Stäng ✕</span>
        </div>
      )}
    </div>
  );
}
