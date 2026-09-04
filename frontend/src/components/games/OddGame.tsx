import { useMemo, useState } from "react";
import { Confetti } from "../Confetti";
import type { GamesCatalog } from "../../types";

const optionSheets: Record<string, string> = {
  "odd-repka": "/games/odd/repka.png",
  "odd-teremok": "/games/odd/teremok.png",
  "odd-gusi": "/games/odd/gusi.png",
  "odd-predmety": "/games/odd/predmety.png",
  "odd-yaga": "/games/odd/yaga.png",
  "odd-bogatyri": "/games/odd/bogatyri.png"
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * «Кто лишний»: среди четырёх героев или предметов один из другой сказки.
 *
 * Задания перемешиваются, а варианты внутри задания — нет: в `odd` лежит
 * номер лишнего, и перетасовка вариантов сделала бы его недействительным.
 * Вместо этого варианты в каталоге записаны в разном порядке от задания
 * к заданию — ребёнок не может выучить «лишний всегда справа».
 */
export function OddGame({ config }: { config: GamesCatalog["odd"] }) {
  const [round, setRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const queue = useMemo(() => shuffle(config.tasks), [config.tasks, round]);

  const task = queue[position] ?? null;
  const finished = position >= queue.length;

  const choose = (index: number) => {
    if (picked !== null || !task) return;
    setPicked(index);
    if (index === task.odd) setScore((previous) => previous + 1);
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
            {great
              ? "Отлично! Вы точно знаете, кто в какой сказке живёт."
              : "Загляните в раздел «Герои» — там про каждого рассказано отдельно."}
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

  const right = picked === task.odd;

  return (
    <>
      <div className="game-bar">
        <div className="game-bar__stat">
          <b>
            {position + 1}/{queue.length}
          </b>
          <span>Вопрос</span>
        </div>
        <div className="game-bar__stat">
          <b>{score}</b>
          <span>Верно</span>
        </div>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={restart}>
          Заново
        </button>
      </div>

      <div className="quiz-question" key={task.id}>
        {task.question}
      </div>

      <div className="odd-grid">
        {task.options.map((option, index) => {
          let className = "odd-card";
          if (picked !== null) {
            if (index === task.odd) className += " odd-card--right";
            else if (index === picked) className += " odd-card--wrong";
            else className += " odd-card--muted";
          }
          return (
            <button key={option.label} type="button" className={className} onClick={() => choose(index)}>
              <span
                className="odd-card__image"
                aria-hidden="true"
                style={{
                  backgroundImage: `url(${optionSheets[task.id]})`,
                  backgroundPosition: `${index % 2 ? "100%" : "0%"} ${index > 1 ? "100%" : "0%"}`
                }}
              />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {picked !== null ? (
        <div className="rise-in" style={{ marginTop: "1.2rem" }}>
          <div className="explain">
            <strong>{right ? "Верно. " : "Не он. "}</strong>
            {task.explain}
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
