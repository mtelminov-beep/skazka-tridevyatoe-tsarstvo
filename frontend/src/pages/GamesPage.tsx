import { useState } from "react";
import { MemoryGame } from "../components/games/MemoryGame";
import { OddGame } from "../components/games/OddGame";
import { OrderGame } from "../components/games/OrderGame";
import { PuzzleGame } from "../components/games/PuzzleGame";
import { SortingGame } from "../components/games/SortingGame";
import { WordGame } from "../components/games/WordGame";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";
import { trackEvent } from "../stores/cmsClient";

type GameId = "memory" | "sorting" | "words" | "puzzle" | "order" | "odd";

type GameMenuItem = {
  id: GameId;
  config: { title: string; subtitle: string; rules: string; ages: string; emoji: string; tint: string };
};

const menuImages: Record<GameId, string> = {
  order: "/games/menu/story-order.png",
  memory: "/games/menu/find-a-pair.png",
  sorting: "/games/menu/whose-object.png",
  words: "/games/menu/finish-the-phrase.png",
  odd: "/games/menu/who-does-not-belong.png",
  puzzle: "/games/menu/assemble-the-picture.png"
};

/** Раздел «Игры»: меню из шести игр и экран выбранной игры. */
export function GamesPage() {
  const games = useCatalog("skazka-games-v1");
  const [active, setActive] = useState<GameId | null>(null);

  const menu: GameMenuItem[] = [
    { id: "order", config: games.order },
    { id: "memory", config: games.memory },
    { id: "sorting", config: games.sorting },
    { id: "words", config: games.words },
    { id: "odd", config: games.odd },
    { id: "puzzle", config: games.puzzle }
  ];

  if (!active) {
    return (
      <>
        <PageHead eyebrow="Играем" title={games.title} lead={games.lead} />
        <div className="game-menu stagger">
          {menu.map((game) => (
            <button
              key={game.id}
              type="button"
              className={`game-card tint--${game.config.tint}`}
              onClick={() => {
                setActive(game.id);
                trackEvent(`game:${game.id}`);
              }}
            >
              <span className="game-card__image" aria-hidden="true">
                <img src={menuImages[game.id]} alt="" />
              </span>
              <em aria-hidden="true">{game.config.emoji}</em>
              <strong>{game.config.title}</strong>
              <span style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>{game.config.subtitle}</span>
              <span className="chip chip--tint" style={{ justifySelf: "start" }}>
                {game.config.ages} лет
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  const current = menu.find((game) => game.id === active)!.config;

  return (
    <>
      <div className="row" style={{ marginBottom: "1rem" }}>
        <button type="button" className="btn btn--ghost" onClick={() => setActive(null)}>
          ← Все игры
        </button>
      </div>

      <header className="page-head rise-in" style={{ paddingTop: 0 }}>
        <div className="page-head__eyebrow">
          <span aria-hidden="true">{current.emoji}</span>
          {current.subtitle} · {current.ages} лет
        </div>
        <h1 style={{ fontSize: "clamp(1.8rem, 4.4vw, 2.8rem)" }}>{current.title}</h1>
        <p className="lead">{current.rules}</p>
      </header>

      {active === "memory" ? <MemoryGame config={games.memory} /> : null}
      {active === "sorting" ? <SortingGame config={games.sorting} /> : null}
      {active === "words" ? <WordGame config={games.words} /> : null}
      {active === "puzzle" ? <PuzzleGame config={games.puzzle} /> : null}
      {active === "order" ? <OrderGame config={games.order} /> : null}
      {active === "odd" ? <OddGame config={games.odd} /> : null}
    </>
  );
}
