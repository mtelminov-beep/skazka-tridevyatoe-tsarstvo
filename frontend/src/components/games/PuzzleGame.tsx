import { useCallback, useEffect, useState } from "react";
import { Confetti } from "../Confetti";
import type { GamesCatalog } from "../../types";

/**
 * «Собери картинку». Кусочки меняются местами по двум касаниям.
 *
 * Пятнашки со свободной клеткой на панели неудобны: половина ходов уходит
 * на перегон дырки. Обмен местами понятнее и прощает случайное касание.
 */
export function PuzzleGame({ config }: { config: GamesCatalog["puzzle"] }) {
  const size = Math.max(2, Math.min(5, Number(config.size) || 3));
  const total = size * size;
  const [pictureIndex, setPictureIndex] = useState(0);
  const [board, setBoard] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i));
  const [picked, setPicked] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);

  const picture = config.pictures[pictureIndex];
  const solved = started && board.every((piece, position) => piece === position);

  const shuffleBoard = useCallback(() => {
    const next = Array.from({ length: total }, (_, i) => i);
    // Перемешиваем, пока не получится расстановка, отличная от собранной.
    do {
      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
    } while (next.every((piece, position) => piece === position));
    setBoard(next);
    setPicked(null);
    setMoves(0);
    setStarted(true);
  }, [total]);

  useEffect(() => {
    shuffleBoard();
  }, [shuffleBoard, pictureIndex]);

  const tap = (position: number) => {
    if (solved) return;
    if (picked === null) {
      setPicked(position);
      return;
    }
    if (picked === position) {
      setPicked(null);
      return;
    }
    setBoard((previous) => {
      const next = [...previous];
      [next[picked], next[position]] = [next[position], next[picked]];
      return next;
    });
    setPicked(null);
    setMoves((previous) => previous + 1);
  };

  return (
    <>
      {solved ? <Confetti /> : null}

      <div className="game-bar">
        <div className="game-bar__stat">
          <b>{moves}</b>
          <span>Ходы</span>
        </div>
        <div className="game-bar__stat">
          <b>
            {size}×{size}
          </b>
          <span>Кусочков</span>
        </div>
        <button type="button" className="btn" style={{ marginLeft: "auto" }} onClick={shuffleBoard}>
          Перемешать
        </button>
      </div>

      <div className="segmented" style={{ marginBottom: "1.1rem" }}>
        {config.pictures.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === pictureIndex ? "is-active" : ""}
            onClick={() => setPictureIndex(index)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {solved ? (
        <div className="quote-card bounce-in" style={{ textAlign: "center", marginBottom: "1.1rem" }}>
          <div className="quote-card__text">Картинка собрана за {moves} ходов!</div>
          <div className="quote-card__note">{picture?.caption}</div>
        </div>
      ) : null}

      <div
        className="puzzle-board"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}
      >
        {board.map((piece, position) => {
          const row = Math.floor(piece / size);
          const column = piece % size;
          let className = "puzzle-piece";
          if (picked === position) className += " puzzle-piece--picked";
          else if (piece === position && started) className += " puzzle-piece--right";
          return (
            <button
              key={position}
              type="button"
              className={className}
              aria-label={`Кусочек ${piece + 1}`}
              onClick={() => tap(position)}
              style={{
                ["--n" as string]: size,
                backgroundImage: `url(${picture?.image ?? ""})`,
                backgroundPosition: `${(column / (size - 1)) * 100}% ${(row / (size - 1)) * 100}%`
              }}
            />
          );
        })}
      </div>

      <p style={{ textAlign: "center", color: "var(--text-faint)", fontSize: "0.9rem" }}>
        Коснитесь двух кусочков — они поменяются местами.
      </p>
    </>
  );
}
