"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getLasPassages, shuffle } from "@/lib/questions";
import { recordAttempt } from "@/lib/progress";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function LasMode() {
  const passages = useMemo(() => shuffle(getLasPassages()), []);
  const [pi, setPi] = useState(0); // passage-index
  const [qi, setQi] = useState(0); // fråge-index inom passagen
  const [chosen, setChosen] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  if (passages.length === 0) {
    return (
      <>
        <h1>Läsförståelse</h1>
        <p className="subtitle">
          Inga texter ännu. <Link href="/">Tillbaka</Link>
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
            Du har gått igenom alla {passages.length} texter.
          </p>
          <button
            className="btn"
            onClick={() => {
              setPi(0);
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

  const passage = passages[pi];
  const q = passage.questions[qi];
  const answered = chosen !== null;
  const lastQuestion = qi + 1 >= passage.questions.length;
  const lastPassage = pi + 1 >= passages.length;

  function choose(i: number) {
    if (answered) return;
    setChosen(i);
    recordAttempt({
      questionId: q.id,
      section: "LAS",
      correct: i === q.correct,
      ts: Date.now(),
    });
  }

  function next() {
    setChosen(null);
    if (!lastQuestion) {
      setQi(qi + 1);
    } else if (!lastPassage) {
      setPi(pi + 1);
      setQi(0);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="las-layout">
      <article className="las-passage">
        <div className="las-passage-head">
          {passage.term && <span className="las-term">{passage.term}</span>}
          {passage.title && <h2 className="las-title">{passage.title}</h2>}
        </div>
        <div className="las-passage-body">
          {passage.passage.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </article>

      <section className="las-quiz">
        <div className="las-quiz-head">
          <span className="las-count">
            Text {pi + 1}/{passages.length}
          </span>
          <div className="las-dots">
            {passage.questions.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === qi ? "active" : ""} ${
                  i < qi ? "past" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div className="las-question">{q.text}</div>

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
            <button className="btn" onClick={next}>
              {!lastQuestion
                ? "Nästa fråga"
                : !lastPassage
                  ? "Nästa text"
                  : "Se resultat"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
