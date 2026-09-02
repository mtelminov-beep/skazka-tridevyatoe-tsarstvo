import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";

/**
 * Главный экран: плитки разделов и бегущая строка с фактами.
 *
 * Картинка плитки берётся только из каталога. Подставлять сюда путь
 * «по умолчанию» нельзя: если файла нет, класс `.tile--photo` всё равно
 * положит поверх плитки затемняющий градиент, и вместо фотографии
 * получится грязный тёмный прямоугольник. Пока библиотека не загрузила
 * своё фото, плитка живёт цветом своего тинта — и выглядит законченной.
 *
 * Куда класть файлы: `frontend/public/home/<раздел>-photo.png`, после чего
 * прописать путь в поле «Изображение» соответствующей плитки в админке.
 */
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
          const image = tile.image;
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
