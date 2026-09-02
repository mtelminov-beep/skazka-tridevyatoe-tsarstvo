import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";

/**
 * Запасные картинки плиток.
 *
 * Плитка выглядит законченной и без фотографии, но с ней главный экран
 * читается издалека — а панель в зале чаще всего видят именно издалека.
 * Если библиотека своей картинки не поставила, берём файл из `/home`.
 */
const tileImages: Record<string, string> = {
  tales: "/home/tales-photo.png",
  ages: "/home/ages-photo.png",
  heroes: "/home/heroes-photo.png",
  quiz: "/home/quiz-photo.png",
  games: "/home/games-photo.png",
  traditions: "/home/traditions-photo.png",
  dictionary: "/home/dictionary-photo.png",
  gallery: "/home/gallery-photo.png",
  library: "/home/library-photo.png"
};

/** Главный экран: плитки разделов и бегущая строка с фактами. */
export function HomePage() {
  const home = useCatalog("skazka-home-v1");

  return (
    <>
      <PageHead eyebrow={home.greeting} title={home.headline} lead={home.lead} />

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {/* Две одинаковые копии подряд — чтобы лента шла без разрыва */}
          {[...home.ticker, ...home.ticker].map((line, index) => (
            <span key={index}>{line}</span>
          ))}
        </div>
      </div>

      <div className="tiles stagger">
        {home.tiles.map((tile) => {
          const image = tile.image || tileImages[tile.id];
          const style = image ? ({ "--tile-image": `url(${image})` } as CSSProperties) : undefined;

          return (
            <Link
              key={tile.id}
              to={tile.path}
              style={style}
              className={`tile${image ? " tile--photo" : ""} tint--${tile.tint}${tile.wide ? " tile--wide" : ""}`}
            >
              <div className="tile__emoji" aria-hidden="true">
                {tile.emoji}
              </div>
              <div>
                <div className="tile__title">{tile.title}</div>
                <div className="tile__text">{tile.text}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
