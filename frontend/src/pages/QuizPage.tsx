import { useCallback, useMemo, useState } from "react";
import { Confetti } from "../components/Confetti";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";
import { trackEvent } from "../stores/cmsClient";
import type { AgeBand, QuizQuestion } from "../types";

const KEYS = ["А", "Б", "В", "Г", "Д"];

/** Перемешивание Фишера — Йетса: каждый раунд должен быть новым. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Stage = "levels" | "round" | "result";

/** Викторина: выбор возраста → раунд из случайных вопросов → результат. */
export function QuizPage() {
  const quiz = useCatalog("skazka-quiz-v1");
  const [stage, setStage] = useState<Stage>("levels");
  const [level, setLevel] = useState<AgeBand | null>(null);
  const [round, setRound] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);

  const start = useCallback(
    (id: AgeBand) => {
      const pool = quiz.questions.filter((question) => question.level === id);
      const size = Math.max(1, Math.min(quiz.questionsPerRound, pool.length));
      setLevel(id);
      setRound(shuffle(pool).slice(0, size));
      setIndex(0);
      setPicked(null);
      setResults([]);
      setStage("round");
      trackEvent(`quiz:${id}`);
    },
    [quiz.questions, quiz.questionsPerRound]
  );

  const question = round[index] ?? null;
  const correctCount = results.filter(Boolean).length;

  const answer = (option: number) => {
    if (picked !== null || !question) return;
    setPicked(option);
    setResults((previous) => [...previous, option === question.correct]);
  };

  const next = () => {
    if (index + 1 >= round.length) {
      setStage("result");
      trackEvent(`quiz-done:${level}`);
      return;
    }
    setIndex(index + 1);
    setPicked(null);
  };

  const praise = useMemo(
    () => quiz.praise[Math.floor(Math.random() * quiz.praise.length)] ?? "Верно!",
    // Новая похвала на каждый вопрос — иначе к третьему она приедается.
    [quiz.praise, index]
  );

  /* ------------------------------ Выбор уровня ----------------------------- */

  if (stage === "levels") {
    return (
      <>
        <PageHead eyebrow="Проверь себя" title={quiz.title} lead={quiz.lead} />
        <div className="level-grid stagger">
          {quiz.levels.map((item) => {
            const count = quiz.questions.filter((question) => question.level === item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                className={`level-card tint--${item.tint}`}
                onClick={() => start(item.id)}
                disabled={count === 0}
              >
                <em>{item.emoji}</em>
                <strong>{item.title}</strong>
                <span style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>{item.subtitle}</span>
                <span className="chip chip--tint" style={{ justifySelf: "center" }}>
                  {count} вопросов
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  /* -------------------------------- Результат ------------------------------- */

  if (stage === "result") {
    const percent = round.length > 0 ? Math.round((correctCount / round.length) * 100) : 0;
    const great = percent >= 70;
    return (
      <>
        {great ? <Confetti /> : null}
        <PageHead eyebrow="Результат" title={great ? "Отличный результат!" : "Хорошая попытка!"} />

        <div className="score-ring bounce-in" style={{ ["--p" as string]: percent }}>
          <span>
            {correctCount}/{round.length}
          </span>
        </div>

        <p className="lead" style={{ textAlign: "center", margin: "0 auto 1.6rem" }}>
          {great
            ? "Сказку вы знаете по-настоящему хорошо — хоть сейчас рассказывайте младшим."
            : "Загляните в раздел «Сказки» — и попробуйте ещё раз. С каждым разом получается лучше."}
        </p>

        <div className="stack" style={{ gap: "0.7rem", marginBottom: "1.6rem" }}>
          {round.map((item, position) => (
            <div className="dict-card" key={item.id}>
              <div className="dict-card__word">
                {results[position] ? "✅" : "❌"} {item.question}
              </div>
              <div className="dict-card__meaning">
                Правильный ответ: <strong>{item.options[item.correct]}</strong>
              </div>
              <div style={{ fontSize: "0.86rem", color: "var(--text-faint)" }}>{item.explain}</div>
            </div>
          ))}
        </div>

        <div className="row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => level && start(level)}>
            Ещё раз
          </button>
          <button type="button" className="btn btn--lg" onClick={() => setStage("levels")}>
            Другой уровень
          </button>
        </div>
      </>
    );
  }

  /* --------------------------------- Раунд --------------------------------- */

  if (!question) return null;

  return (
    <>
      <div className="quiz-progress" aria-hidden="true">
        {round.map((_, position) => (
          <i
            key={position}
            className={
              position < results.length
                ? results[position]
                  ? "is-done"
                  : "is-wrong"
                : position === index
                  ? "is-current"
                  : ""
            }
          />
        ))}
      </div>

      <div className="row" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
        <span className="chip chip--gold">
          Вопрос {index + 1} из {round.length}
        </span>
        <span className="chip">Верно: {correctCount}</span>
      </div>

      <div className="quiz-question rise-in" key={question.id}>
        <em aria-hidden="true">{question.emoji}</em>
        <h2>{question.question}</h2>
      </div>

      <div className="answers">
        {question.options.map((option, position) => {
          let className = "answer";
          if (picked !== null) {
            if (position === question.correct) className += " answer--right";
            else if (position === picked) className += " answer--wrong";
            else className += " answer--muted";
          }
          return (
            <button key={position} type="button" className={className} onClick={() => answer(position)}>
              <span className="answer__key">{KEYS[position]}</span>
              <span>{option}</span>
              <span aria-hidden="true">
                {picked !== null && position === question.correct ? "✅" : ""}
                {picked === position && position !== question.correct ? "❌" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {picked !== null ? (
        <div className="rise-in">
          <div className="explain">
            <strong style={{ color: picked === question.correct ? "#9ff0c6" : "#ffb0cb" }}>
              {picked === question.correct ? praise : "Не угадали."}
            </strong>{" "}
            {question.explain}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: "1.2rem" }}>
            <button type="button" className="btn btn--primary btn--lg" onClick={next}>
              {index + 1 >= round.length ? "Показать результат" : "Дальше →"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="row" style={{ justifyContent: "center", marginTop: "1.6rem" }}>
        <button type="button" className="btn btn--ghost" onClick={() => setStage("levels")}>
          Выйти из викторины
        </button>
      </div>
    </>
  );
}
