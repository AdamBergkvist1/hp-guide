"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getQuestionsForSection, getSection, shuffle } from "@/lib/questions";
import { recordAttempt } from "@/lib/progress";
import type { Question, SectionId } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E"];

/** Renderar **fetstil** i frågetext. React escapar allt annat automatiskt. */
function renderText(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

export default function PracticePage() {
  const params = useParams<{ section: string }>();
  const sectionId = (params.section ?? "").toUpperCase() as SectionId;
  const section = getSection(sectionId);

  // Blanda frågorna en gång per runda
  const [round, setRound] = useState(0);
  const questions = useMemo<Question[]>(
    () => (section ? shuffle(getQuestionsForSection(sectionId)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionId, round]
  );

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [numCorrect, setNumCorrect] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);

  if (!section) {
    return (
      <>
        <h1>Okänt delprov</h1>
        <p className="subtitle">
          Delprovet finns inte. <Link href="/">Tillbaka till start</Link>
        </p>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <h1>{section.name}</h1>
        <p className="subtitle">
          Inga frågor för det här delprovet ännu — de kommer när riktigt
          provmaterial lagts in. <Link href="/">Tillbaka</Link>
        </p>
      </>
    );
  }

  // Rundan klar — summering (success state!)
  if (index >= questions.length) {
    const pct = Math.round((100 * numCorrect) / questions.length);
    return (
      <div className="reading">
      <div className="result-card">
        <div className="card-id" style={{ display: "inline-block" }}>
          {section.id}
        </div>
        <div className="result-score">
          {numCorrect} / {questions.length}
        </div>
        <p className="result-msg">
          {pct === 100
            ? "Alla rätt — perfekt runda! 🎉"
            : pct >= 70
              ? "Starkt jobbat!"
              : pct >= 40
                ? "Bra kämpat — kolla förklaringarna och kör igen."
                : "Tuff runda — men det är så här man lär sig. Kör en till!"}
        </p>
        {saveFailed && (
          <p className="result-msg" style={{ color: "var(--red)" }}>
            Obs: statistiken kunde inte sparas i den här webbläsaren.
          </p>
        )}
        <button
          className="btn"
          onClick={() => {
            setRound((r) => r + 1);
            setIndex(0);
            setChosen(null);
            setNumCorrect(0);
          }}
        >
          Kör en runda till
        </button>{" "}
        <Link href="/statistik">
          <button className="btn secondary">Se statistik</button>
        </Link>
      </div>
      </div>
    );
  }

  const q = questions[index];
  const answered = chosen !== null;

  function choose(i: number) {
    if (answered) return;
    setChosen(i);
    const correct = i === q.correct;
    if (correct) setNumCorrect((n) => n + 1);
    const ok = recordAttempt({
      questionId: q.id,
      section: q.section,
      correct,
      ts: Date.now(),
    });
    if (!ok) setSaveFailed(true);
  }

  return (
    <div className="reading">
      <div className="quiz-progress">
        <span>
          <strong>{section.id}</strong> — {section.name}
        </span>
        <span>
          Fråga {index + 1} av {questions.length}
        </span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(100 * index) / questions.length}%` }}
        />
      </div>

      {q.passage && <div className="passage">{q.passage}</div>}
      <div className="question-text">{renderText(q.text)}</div>

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
              <span>{opt}</span>
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
          <div>{q.explanation}</div>
          <button
            className="btn"
            onClick={() => {
              setIndex((i) => i + 1);
              setChosen(null);
            }}
          >
            {index + 1 < questions.length ? "Nästa fråga" : "Se resultat"}
          </button>
        </div>
      )}
    </div>
  );
}
