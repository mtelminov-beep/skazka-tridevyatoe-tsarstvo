import { useMemo, useState } from "react";
import { Confetti } from "../Confetti";
import type { GamesCatalog } from "../../types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Сколько строк в одном коне — чтобы игра не превращалась в марафон. */
const TASKS_PER_ROUND = 8;

/** «Доскажи словечко»: в знаменитой строке пропущено слово. */
export function WordGame({ config }: { config: GamesCatalog["words"] }) {
  const [round, setRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const queue = useMemo(
    () => shuffle(config.tasks).slice(0, Math.min(TASKS_PER_ROUND, config.tasks.length)),
    [config.tasks, round]
  );

  const task = queue[position] ?? null;
  // Варианты тоже перемешиваем: иначе правильный всегда стоит первым.
  const options = useMemo(() => (task ? shuffle(task.options) : []), [task]);
  const finished = position >= queue.length;

  const choose = (option: string) => {
    if (picked || !task) return;
    setPicked(option);
    if (option === task.answer) setScore((previous) => previous + 1);
  };

  const next = () => {
    setPicked(null);
    setPosition((previous) => previous + 1);
  };

  const restart = () => {
    setPosition(0);
    setPicked(null);
    setScore(0);
    setRound((previous) => previous + 1);
  };

  if (finished) {
    const great = score >= Math.ceil(queue.length * 0.7);
    return (
      <>
        {great ? <Confetti /> : null}
        <div className="quote-card bounce-in" style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <div className="quote-card__text">
            {score} из {queue.length}
          </div>
          <div className="quote-card__note">
            {great ? "Отлично! Сказочные присказки вы знаете наизусть." : "Загляните в раздел «Сказки» — и попробуйте снова."}
          </div>
        </div>
        <div className="row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn--primary btn--lg" onClick={restart}>
            Играть ещё
          </button>
        </div>
      </>
    );
  }

  if (!task) return null;

  const right = picked === task.answer;

  return (
    <>
      <div className="game-bar">
        <div className="game-bar__stat">
          <b>
            {position + 1}/{queue.length}
          </b>
          <span>Строка</span>
        </div>
        <div className="game-bar__stat">
          <b>{score}</b>
          <span>Верно</span>
        </div>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={restart}>
          Заново
        </button>
      </div>

      <div className="word-line" key={task.id}>
        {task.before}{" "}
        <span className={`word-blank${picked && right ? " word-blank--filled" : ""}`}>
          {picked ? picked : "…"}
        </span>
        {task.after}
        <div style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginTop: "0.9rem", fontFamily: "Manrope" }}>
          {task.source}
        </div>
      </div>

      <div className="word-options">
        {options.map((option) => {
          let className = "answer";
          if (picked) {
            if (option === task.answer) className += " answer--right";
            else if (option === picked) className += " answer--wrong";
            else className += " answer--muted";
          }
          return (
            <button key={option} type="button" className={className} onClick={() => choose(option)}>
              <span className="answer__key" aria-hidden="true">
                ✎
              </span>
              <span>{option}</span>
              <span />
            </button>
          );
        })}
      </div>

      {picked ? (
        <div className="rise-in" style={{ marginTop: "1.2rem" }}>
          <div className="explain">
            {right ? "Верно! Именно так в сказке." : `Правильное слово — «${task.answer}».`}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <button type="button" className="btn btn--primary btn--lg" onClick={next}>
              {position + 1 >= queue.length ? "Итог" : "Дальше →"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
