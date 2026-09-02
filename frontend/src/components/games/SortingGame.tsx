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
 * «Чей предмет?». Предметы показываются по одному, корзины — сказки.
 *
 * Перетаскивание намеренно не используется: на большой вертикальной панели
 * ребёнку трудно тащить палец через полэкрана, а промах читается как ошибка.
 * Вместо этого — обычное касание нужной корзины.
 */
export function SortingGame({ config }: { config: GamesCatalog["sorting"] }) {
  const [round, setRound] = useState(0);
  const [position, setPosition] = useState(0);
  const [feedback, setFeedback] = useState<{ bin: string; right: boolean } | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [counts, setCounts] = useState<Record<string, number>>({});

  const queue = useMemo(() => shuffle(config.items), [config.items, round]);
  const item = queue[position] ?? null;
  const finished = position >= queue.length;

  const choose = (binId: string) => {
    if (!item || feedback) return;
    const right = item.bin === binId;
    setFeedback({ bin: binId, right });
    if (right) {
      setScore((previous) => ({ ...previous, right: previous.right + 1 }));
      setCounts((previous) => ({ ...previous, [binId]: (previous[binId] ?? 0) + 1 }));
    } else {
      setScore((previous) => ({ ...previous, wrong: previous.wrong + 1 }));
    }

    // Пауза, чтобы подсветка успела сработать: верный ответ — короче, ошибка — дольше.
    window.setTimeout(
      () => {
        setFeedback(null);
        if (right) setPosition((previous) => previous + 1);
      },
      right ? 620 : 900
    );
  };

  const restart = () => {
    setPosition(0);
    setScore({ right: 0, wrong: 0 });
    setCounts({});
    setFeedback(null);
    setRound((previous) => previous + 1);
  };

  if (finished) {
    return (
      <>
        <Confetti />
        <div className="quote-card bounce-in" style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          <div className="quote-card__text">Все предметы нашли свою сказку!</div>
          <div className="quote-card__note">
            Верных ответов: {score.right}. Ошибок: {score.wrong}.
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

  return (
    <>
      <div className="game-bar">
        <div className="game-bar__stat">
          <b>
            {position + 1}/{queue.length}
          </b>
          <span>Предмет</span>
        </div>
        <div className="game-bar__stat">
          <b>{score.right}</b>
          <span>Верно</span>
        </div>
        <div className="game-bar__stat">
          <b>{score.wrong}</b>
          <span>Ошибок</span>
        </div>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={restart}>
          Заново
        </button>
      </div>

      {item ? (
        <div className="sorting-item" key={item.id}>
          <div className="sorting-item__picture" aria-hidden="true">
            {item.image ? <img src={item.image} alt="" /> : null}
            <em>{item.icon ?? item.emoji}</em>
          </div>
          <div className="sorting-item__body">
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </div>
        </div>
      ) : null}

      <div className="bins">
        {config.bins.map((bin) => {
          let className = "bin";
          if (feedback?.bin === bin.id) className += feedback.right ? " bin--right" : " bin--wrong";
          return (
            <button key={bin.id} type="button" className={className} onClick={() => choose(bin.id)}>
              <span className="bin__picture" aria-hidden="true">
                {bin.image ? <img src={bin.image} alt="" /> : null}
                <em>{bin.icon ?? bin.emoji}</em>
              </span>
              <span>{bin.label}</span>
              <b>{counts[bin.id] ?? 0}</b>
            </button>
          );
        })}
      </div>
    </>
  );
}
