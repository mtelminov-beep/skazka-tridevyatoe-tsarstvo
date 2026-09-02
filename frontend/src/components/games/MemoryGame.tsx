import { useEffect, useMemo, useState } from "react";
import { Confetti } from "../Confetti";
import type { GamesCatalog } from "../../types";

type Slot = { key: string; cardId: string };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Сколько пар берём в один кон: восемь — это 16 карточек, ровно четыре ряда. */
const PAIRS_PER_ROUND = 8;

/**
 * «Найди пару». Карточки удваиваются и перемешиваются, открытые не совпавшие
 * закрываются через паузу — ребёнок должен успеть их разглядеть.
 */
export function MemoryGame({ config }: { config: GamesCatalog["memory"] }) {
  const [round, setRound] = useState(0);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  const slots = useMemo<Slot[]>(() => {
    const picked = shuffle(config.cards).slice(0, Math.min(PAIRS_PER_ROUND, config.cards.length));
    const doubled = picked.flatMap((card) => [
      { key: `${card.id}-a`, cardId: card.id },
      { key: `${card.id}-b`, cardId: card.id }
    ]);
    return shuffle(doubled);
    // round в зависимостях — кнопка «Заново» пересобирает поле.
  }, [config.cards, round]);

  const byId = useMemo(() => new Map(config.cards.map((card) => [card.id, card])), [config.cards]);
  const won = done.length > 0 && done.length === slots.length / 2;

  useEffect(() => {
    if (open.length !== 2) return;
    const [first, second] = open;
    const same = slots[first].cardId === slots[second].cardId;
    const timer = window.setTimeout(
      () => {
        if (same) setDone((previous) => [...previous, slots[first].cardId]);
        setOpen([]);
      },
      same ? 420 : 900
    );
    return () => window.clearTimeout(timer);
  }, [open, slots]);

  const flip = (index: number) => {
    if (open.length === 2) return;
    if (open.includes(index)) return;
    if (done.includes(slots[index].cardId)) return;
    setOpen((previous) => [...previous, index]);
    if (open.length === 1) setMoves((previous) => previous + 1);
  };

  const restart = () => {
    setOpen([]);
    setDone([]);
    setMoves(0);
    setRound((previous) => previous + 1);
  };

  return (
    <>
      {won ? <Confetti /> : null}

      <div className="game-bar">
        <div className="game-bar__stat">
          <b>
            {done.length}/{slots.length / 2}
          </b>
          <span>Пары</span>
        </div>
        <div className="game-bar__stat">
          <b>{moves}</b>
          <span>Ходы</span>
        </div>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={restart}>
          Заново
        </button>
      </div>

      {won ? (
        <div className="quote-card bounce-in" style={{ marginBottom: "1.1rem", textAlign: "center" }}>
          <div className="quote-card__text">Все пары собраны за {moves} ходов!</div>
          <div className="quote-card__note">Кот учёный доволен. Попробуйте пройти ещё быстрее.</div>
        </div>
      ) : null}

      <div className="memory-board">
        {slots.map((slot, index) => {
          const card = byId.get(slot.cardId);
          const isDone = done.includes(slot.cardId);
          const isOpen = open.includes(index);
          return (
            <button
              key={slot.key}
              type="button"
              className={`memory-card${isOpen ? " memory-card--open" : ""}${isDone ? " memory-card--done" : ""}`}
              onClick={() => flip(index)}
              aria-label={isOpen || isDone ? card?.label : "Закрытая карточка"}
            >
              <span className="memory-card__side memory-card__back" aria-hidden="true">
                ✦
              </span>
              <span className="memory-card__side memory-card__front">
                {card?.image ? (
                  <img className="memory-card__image" src={card.image} alt="" aria-hidden="true" />
                ) : (
                  <span className="memory-card__emoji" aria-hidden="true">
                    {card?.emoji}
                  </span>
                )}
                <small>{card?.label}</small>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
