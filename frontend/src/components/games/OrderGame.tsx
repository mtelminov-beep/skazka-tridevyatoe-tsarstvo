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

/**
 * «Порядок сказки»: шаги сюжета перемешаны, их нужно вернуть на место.
 *
 * Игра сделана на нажатие, а не на перетаскивание: ребёнок в четыре года
 * ещё не удерживает палец на движущемся элементе, а на панели 75"
 * перетащить карточку через полэкрана — работа для взрослого.
 * Нажали не тот шаг — карточка мигнёт и останется на месте; сбить
 * уже собранное начало нельзя, поэтому игра не наказывает за ошибку.
 */
export function OrderGame({ config }: { config: GamesCatalog["order"] }) {
  const [round, setRound] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const task = config.tasks[taskIndex] ?? null;

  // Перемешиваем один раз на задание: пересборка на каждый клик
  // заставляла бы карточки прыгать под пальцем.
  const shuffled = useMemo(
    () => (task ? shuffle(task.steps.map((step, index) => ({ step, index }))) : []),
    [task, round]
  );

  if (!task) return null;

  const done = placed.length === task.steps.length;
  const isLast = taskIndex + 1 >= config.tasks.length;

  const pick = (index: number) => {
    if (placed.includes(index)) return;
    if (index === placed.length) {
      setPlaced((previous) => [...previous, index]);
      setWrong(null);
    } else {
      setWrong(index);
      setMistakes((previous) => previous + 1);
      window.setTimeout(() => setWrong(null), 550);
    }
  };

  const nextTask = () => {
    setPlaced([]);
    setWrong(null);
    setTaskIndex((previous) => (previous + 1) % config.tasks.length);
    setRound((previous) => previous + 1);
  };

  const restart = () => {
    setPlaced([]);
    setWrong(null);
    setMistakes(0);
    setTaskIndex(0);
    setRound((previous) => previous + 1);
  };

  return (
    <>
      {done && mistakes === 0 ? <Confetti pieces={40} /> : null}

      <div className="game-bar">
        <div className="game-bar__stat">
          <b>
            {taskIndex + 1}/{config.tasks.length}
          </b>
          <span>Сказка</span>
        </div>
        <div className="game-bar__stat">
          <b>
            {placed.length}/{task.steps.length}
          </b>
          <span>Шагов</span>
        </div>
        <div className="game-bar__stat">
          <b>{mistakes}</b>
          <span>Ошибок</span>
        </div>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={restart}>
          Заново
        </button>
      </div>

      <div className="order-title">
        <span aria-hidden="true">{task.emoji}</span>
        <strong>{task.tale}</strong>
      </div>

      {/* Собранное начало сказки — растёт сверху вниз */}
      <ol className="order-done" aria-label="Собранный порядок">
        {placed.map((index, position) => (
          <li key={index} className="order-done__item bounce-in">
            <span className="order-done__num" aria-hidden="true">
              {position + 1}
            </span>
            {task.steps[index]}
          </li>
        ))}
        {!done ? (
          <li className="order-done__slot" aria-hidden="true">
            <span className="order-done__num">{placed.length + 1}</span>
            Какой шаг следующий?
          </li>
        ) : null}
      </ol>

      {!done ? (
        <div className="order-pool">
          {shuffled
            .filter((entry) => !placed.includes(entry.index))
            .map((entry) => (
              <button
                key={entry.index}
                type="button"
                className={`order-chip${wrong === entry.index ? " order-chip--wrong" : ""}`}
                onClick={() => pick(entry.index)}
              >
                {entry.step}
              </button>
            ))}
        </div>
      ) : (
        <div className="rise-in" style={{ marginTop: "1.2rem" }}>
          <div className="explain">
            {mistakes === 0
              ? "Безошибочно! Сказка сложилась ровно так, как её рассказывают."
              : `Сказка собрана. Промахов по пути: ${mistakes}.`}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <button type="button" className="btn btn--primary btn--lg" onClick={nextTask}>
              {isLast ? "Начать сначала" : "Следующая сказка →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
