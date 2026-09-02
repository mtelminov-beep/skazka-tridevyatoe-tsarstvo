import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ContentImage } from "../components/ContentImage";
import { Modal } from "../components/Modal";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";
import { trackEvent } from "../stores/cmsClient";
import type { AgeBand, DictionaryEntry, Hero, Tale, TaleKind } from "../types";

const FAVORITES_KEY = "skazka-favorites";

const KIND_LABEL: Record<TaleKind, string> = {
  animals: "О животных",
  magic: "Волшебная",
  everyday: "Бытовая",
  literary: "Литературная"
};

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Раздел «Сказки»: полка по возрасту, поиск и подробный разбор сказки.
 *
 * Возрастные полки берутся из каталога `ages`, а не зашиты в код: если
 * библиотека переименует полку или поменяет их порядок, фильтр поедет
 * следом. Кнопка «Моя полка» показывает отмеченные сердечком сказки —
 * это единственное состояние, которое панель помнит между посетителями,
 * и живёт оно только в браузере киоска.
 */
export function TalesPage() {
  const tales = useCatalog("skazka-tales-v1");
  const ages = useCatalog("skazka-ages-v1");
  const heroes = useCatalog("skazka-heroes-v1");
  const dictionary = useCatalog("skazka-dictionary-v1");

  // Полка может прийти из адреса: с раздела «Полки» сюда ведут ссылки
  // вида /tales?age=5-7, и открывать после них «Все сказки» было бы обманом.
  const [params, setParams] = useSearchParams();
  const requested = params.get("age");
  const initialAge: AgeBand | "all" | "favorites" =
    requested && ages.items.some((item) => item.id === requested) ? (requested as AgeBand) : "all";

  const [age, setAgeState] = useState<AgeBand | "all" | "favorites">(initialAge);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  /** Смена полки отражается в адресе — так возврат «назад» ведёт на прежнюю полку. */
  const setAge = useCallback(
    (next: AgeBand | "all" | "favorites") => {
      setAgeState(next);
      setParams(next === "all" || next === "favorites" ? {} : { age: next }, { replace: true });
    },
    [setParams]
  );

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      /* приватный режим — отметки живут до перезагрузки */
    }
  }, [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]));
  }, []);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tales.items.filter((tale) => {
      if (age === "favorites") {
        if (!favorites.includes(tale.id)) return false;
      } else if (age !== "all" && tale.ages !== age) {
        return false;
      }
      if (!needle) return true;
      return (
        tale.title.toLowerCase().includes(needle) ||
        tale.summary.toLowerCase().includes(needle) ||
        tale.epigraph.toLowerCase().includes(needle)
      );
    });
  }, [tales.items, age, query, favorites]);

  const active = tales.items.find((tale) => tale.id === openId) ?? null;

  const open = (tale: Tale) => {
    setOpenId(tale.id);
    trackEvent(`tale:${tale.id}`);
  };

  const shelf = ages.items.find((item) => item.id === age) ?? null;

  return (
    <>
      <PageHead eyebrow="Слушаем и читаем" title={tales.title} lead={tales.lead}>
        <label className="search-field" style={{ marginTop: "1.1rem" }}>
          <span aria-hidden="true">🔎</span>
          <input
            type="search"
            value={query}
            placeholder="Название сказки или о чём она"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Поиск по сказкам"
          />
          {query ? (
            <button type="button" className="search-field__clear" onClick={() => setQuery("")} aria-label="Очистить">
              ✕
            </button>
          ) : null}
        </label>

        <div className="segmented" style={{ marginTop: "0.9rem" }}>
          <button type="button" className={age === "all" ? "is-active" : ""} onClick={() => setAge("all")}>
            Все · {tales.items.length}
          </button>
          {ages.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={age === item.id ? "is-active" : ""}
              onClick={() => setAge(item.id)}
            >
              <span aria-hidden="true">{item.emoji}</span> {item.short}
            </button>
          ))}
          <button
            type="button"
            className={age === "favorites" ? "is-active" : ""}
            onClick={() => setAge("favorites")}
            disabled={favorites.length === 0}
          >
            ♥ Моя полка{favorites.length ? ` · ${favorites.length}` : ""}
          </button>
        </div>
      </PageHead>

      {shelf ? (
        <div className={`shelf-note tint--${shelf.tint} rise-in`}>
          <strong>{shelf.caption}</strong>
          <p>{shelf.lead}</p>
          <p className="shelf-note__advice">
            <span aria-hidden="true">💡</span> {shelf.advice}
          </p>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div className="empty-note">
          {age === "favorites"
            ? "На вашей полке пока пусто. Отметьте сказку сердечком на карточке."
            : "Ничего не нашлось. Попробуйте другую полку или другое слово в поиске."}
        </div>
      ) : (
        <div className="tale-grid stagger">
          {shown.map((tale) => (
            <div key={tale.id} className={`tale-card tint--${tale.tint}`}>
              <button
                type="button"
                className={`tale-card__fav${favorites.includes(tale.id) ? " is-on" : ""}`}
                onClick={() => toggleFavorite(tale.id)}
                aria-pressed={favorites.includes(tale.id)}
                aria-label={favorites.includes(tale.id) ? "Убрать с моей полки" : "Отметить на моей полке"}
              >
                {favorites.includes(tale.id) ? "♥" : "♡"}
              </button>
              <button type="button" className="tale-card__open" onClick={() => open(tale)}>
                <div className="tale-card__cover">
                  <ContentImage src={tale.image} alt={tale.shortTitle} fallback={tale.emoji} />
                  <span className="tale-card__year">{tale.ages.replace("-", "–")}</span>
                </div>
                <div className="tale-card__body">
                  <div className="tale-card__title">{tale.shortTitle}</div>
                  <div className="tale-card__meta">
                    {KIND_LABEL[tale.kind]} · {tale.minutes} мин
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={Boolean(active)} onClose={() => setOpenId(null)} label={active?.title}>
        {active ? (
          <TaleDetails
            tale={active}
            heroes={heroes.items}
            words={dictionary.items}
            favorite={favorites.includes(active.id)}
            onToggleFavorite={() => toggleFavorite(active.id)}
          />
        ) : null}
      </Modal>
    </>
  );
}

/**
 * Разбор одной сказки.
 *
 * Аудио стоит выше текста намеренно: народную сказку слушают, а не читают
 * глазами, и запись здесь — основной способ познакомиться. Текст на экране
 * нужен взрослому, который читает вслух, и подростку, который разбирает
 * сюжет, — поэтому он спрятан под кнопку и не мешает остальному.
 */
function TaleDetails({
  tale,
  heroes,
  words,
  favorite,
  onToggleFavorite
}: {
  tale: Tale;
  heroes: Hero[];
  words: DictionaryEntry[];
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [textOpen, setTextOpen] = useState(false);

  const taleHeroes = heroes.filter((hero) => tale.heroes.includes(hero.id));
  const taleWords = words.filter((word) => tale.words.includes(word.id));
  const hasAudio = Boolean(tale.audio) || Boolean(tale.audioParts?.length);

  return (
    <article className={`tint--${tale.tint}`}>
      <div className="tale-hero">
        <ContentImage src={tale.image} alt={tale.title} fallback={tale.emoji} />
        <div className="tale-hero__epigraph">«{tale.epigraph}»</div>
      </div>

      <div className="row" style={{ marginBottom: "0.9rem" }}>
        <span className="chip chip--gold">{tale.ages.replace("-", " — ")} лет</span>
        <span className="chip chip--tint">{KIND_LABEL[tale.kind]}</span>
        <span className="chip">{tale.minutes} мин</span>
        <button
          type="button"
          className={`chip chip--fav${favorite ? " is-on" : ""}`}
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          style={{ marginLeft: "auto" }}
        >
          {favorite ? "♥ На моей полке" : "♡ На мою полку"}
        </button>
      </div>

      <h2 style={{ marginBottom: "0.7rem" }}>{tale.title}</h2>
      <p className="lead" style={{ marginBottom: "1.6rem" }}>
        {tale.summary}
      </p>

      <div className="tale-audio">
        <div className="tale-audio__head">
          <span className="tale-audio__icon" aria-hidden="true" />
          <div>
            <strong>Послушать сказку</strong>
            <span>{tale.audioParts?.length ? "По частям" : "Аудиозапись"}</span>
          </div>
        </div>
        {hasAudio ? (
          <div className="tale-audio__list">
            {tale.audioParts?.length ? (
              tale.audioParts.map((part, index) => (
                <div className="tale-audio__part" key={part.src}>
                  <div className="tale-audio__part-title">
                    <span>{index + 1}</span>
                    {part.title}
                  </div>
                  <audio src={part.src} controls preload="none" />
                </div>
              ))
            ) : (
              <audio src={tale.audio} controls preload="none" />
            )}
          </div>
        ) : (
          <p className="tale-audio__empty">
            Запись этой сказки пока не загружена. Библиотекарь добавляет аудио в админке — файл появится здесь,
            и ничего в панели менять не нужно.
          </p>
        )}
      </div>

      {tale.text.length > 0 ? (
        <>
          <div className="section-title">
            <h2>Текст для чтения вслух</h2>
            <button type="button" className="btn btn--ghost" onClick={() => setTextOpen((value) => !value)}>
              {textOpen ? "Свернуть" : "Развернуть"}
            </button>
          </div>
          {textOpen ? (
            <div className="tale-text rise-in">
              {tale.text.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="tale-text__hint">
              {tale.text.length} {tale.text.length === 1 ? "абзац" : "абзацев"} — разверните, если читаете вслух.
            </p>
          )}
        </>
      ) : null}

      <div className="section-title">
        <h2>Что происходит</h2>
        <span>{tale.plot.length} шагов</span>
      </div>
      <div className="plot stagger">
        {tale.plot.map((step, index) => (
          <div className="plot__step" key={index}>
            <p style={{ margin: 0 }}>{step}</p>
          </div>
        ))}
      </div>

      {tale.sayings.length > 0 ? (
        <>
          <div className="section-title">
            <h2>Присказки и повторы</h2>
          </div>
          <div className="stack">
            {tale.sayings.map((saying, index) => (
              <div className="quote-card rise-in" key={index}>
                <div className="quote-card__text">{saying.text}</div>
                <div className="quote-card__note">{saying.note}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="section-title">
        <h2>Чему учит</h2>
      </div>
      <p style={{ fontSize: "1.05rem" }}>{tale.moral}</p>

      {tale.questions.length > 0 ? (
        <>
          <div className="section-title">
            <h2>О чём поговорить после</h2>
            <span>{tale.questions.length}</span>
          </div>
          <ul className="question-list">
            {tale.questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="section-title">
        <h2>Интересные факты</h2>
      </div>
      <ul className="fact-list">
        {tale.facts.map((fact, index) => (
          <li key={index}>{fact}</li>
        ))}
      </ul>

      {taleHeroes.length > 0 ? (
        <>
          <div className="section-title">
            <h2>Кто в ней живёт</h2>
            <span>{taleHeroes.length}</span>
          </div>
          <div className="hero-grid">
            {taleHeroes.map((hero) => (
              <div className={`hero-card tint--${hero.tint}`} key={hero.id}>
                <div className="hero-card__face" aria-hidden="true">
                  <ContentImage src={hero.image} alt={hero.name} fallback={hero.emoji} />
                </div>
                <div className="hero-card__name">{hero.name}</div>
                <div className="hero-card__tale">{hero.role}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {taleWords.length > 0 ? (
        <>
          <div className="section-title">
            <h2>Непонятные слова</h2>
            <span>{taleWords.length}</span>
          </div>
          <div className="stack" style={{ gap: "0.7rem" }}>
            {taleWords.map((word) => (
              <div className="dict-card" key={word.id}>
                <div className="dict-card__word">
                  {word.emoji} {word.word}
                </div>
                <div className="dict-card__meaning">{word.meaning}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {tale.video ? (
        <>
          <div className="section-title">
            <h2>Смотреть</h2>
          </div>
          <video src={tale.video} controls style={{ width: "100%", borderRadius: "var(--radius)" }} />
        </>
      ) : null}
    </article>
  );
}
