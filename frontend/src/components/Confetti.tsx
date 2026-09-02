import { useMemo } from "react";
import { createPortal } from "react-dom";

const COLORS = ["#ffc94d", "#ff6fae", "#62d9ff", "#34b47a", "#a78bfa", "#f0803c"];

/**
 * Конфетти для побед в викторине и играх.
 * Живёт в портале: иначе его обрежет overflow прокручиваемой области.
 */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const list = useMemo(
    () =>
      Array.from({ length: pieces }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.4 + Math.random() * 2.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        skew: -40 + Math.random() * 80
      })),
    [pieces]
  );

  return createPortal(
    <div className="confetti" aria-hidden="true">
      {list.map((piece, index) => (
        <i
          key={index}
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            transform: `skewY(${piece.skew}deg)`,
            ["--delay" as string]: `${piece.delay}s`,
            ["--dur" as string]: `${piece.dur}s`
          }}
        />
      ))}
    </div>,
    document.body
  );
}
