import { useMemo, useState } from "react";
import { ContentImage } from "../components/ContentImage";
import { Modal } from "../components/Modal";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";
import { trackEvent } from "../stores/cmsClient";

/**
 * Картотека героев с поиском и фильтром по сказкам.
 *
 * У героя народной сказки поле `tale` часто содержит несколько названий:
 * лиса живёт сразу в «Колобке», «Лисе и журавле» и «Заюшкиной избушке».
 * Поэтому список сказок для фильтра разбирается по запятым — иначе
 * в фильтре появились бы кнопки-простыни с тремя названиями сразу.
 */
export function HeroesPage() {
  const heroes = useCatalog("skazka-heroes-v1");
  const [tale, setTale] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const taleNames = useMemo(() => {
    const names = new Set<string>();
    for (const hero of heroes.items) {
      for (const name of hero.tale.split(",")) {
        const trimmed = name.trim();
        if (trimmed) names.add(trimmed);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "ru"));
  }, [heroes.items]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return heroes.items.filter((hero) => {
      if (tale !== "all" && !hero.tale.split(",").some((name) => name.trim() === tale)) return false;
      if (!needle) return true;
      return (
        hero.name.toLowerCase().includes(needle) ||
        hero.role.toLowerCase().includes(needle) ||
        hero.summary.toLowerCase().includes(needle)
      );
    });
  }, [heroes.items, tale, query]);

  const active = heroes.items.find((hero) => hero.id === openId) ?? null;

  return (
    <>
      <PageHead eyebrow="Кто живёт в сказках" title={heroes.title} lead={heroes.lead}>
        <label className="search-field" style={{ marginTop: "1.1rem" }}>
          <span aria-hidden="true">🔎</span>
          <input
            type="search"
            value={query}
            placeholder="Имя героя или его роль"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Поиск по героям"
          />
          {query ? (
            <button type="button" className="search-field__clear" onClick={() => setQuery("")} aria-label="Очистить">
              ✕
            </button>
          ) : null}
        </label>

        <div className="segmented" style={{ marginTop: "0.9rem" }}>
          <button type="button" className={tale === "all" ? "is-active" : ""} onClick={() => setTale("all")}>
            Все герои · {heroes.items.length}
          </button>
          {taleNames.map((name) => (
            <button key={name} type="button" className={tale === name ? "is-active" : ""} onClick={() => setTale(name)}>
              {name}
            </button>
          ))}
        </div>
      </PageHead>

      {shown.length === 0 ? (
        <div className="empty-note">Никого не нашлось. Попробуйте другое имя или выберите «Все герои».</div>
      ) : (
        <div className="hero-grid stagger">
          {shown.map((hero) => (
            <button
              key={hero.id}
              type="button"
              className={`hero-card tint--${hero.tint}`}
              onClick={() => {
                setOpenId(hero.id);
                trackEvent(`hero:${hero.id}`);
              }}
            >
              <div className="hero-card__face">
                <ContentImage src={hero.image} alt={hero.name} fallback={hero.emoji} />
              </div>
              <div className="hero-card__name">{hero.name}</div>
              <div className="hero-card__tale">{hero.tale}</div>
            </button>
          ))}
        </div>
      )}

      <Modal open={Boolean(active)} onClose={() => setOpenId(null)} label={active?.name}>
        {active ? (
          <article className={`tint--${active.tint}`}>
            <div
              className="hero-card__face bounce-in"
              style={{ width: "9rem", height: "9rem", fontSize: "4.6rem", margin: "0 auto 1.2rem" }}
            >
              <ContentImage src={active.image} alt={active.name} fallback={active.emoji} />
            </div>

            <div className="row" style={{ justifyContent: "center", marginBottom: "0.9rem" }}>
              <span className="chip chip--tint">{active.role}</span>
              <span className="chip">{active.tale}</span>
            </div>

            <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>{active.name}</h2>
            <p className="lead" style={{ margin: "0 auto 1.5rem", textAlign: "center" }}>
              {active.summary}
            </p>

            {active.quote ? (
              <div className="quote-card" style={{ marginBottom: "1.5rem" }}>
                <div className="quote-card__text">{active.quote}</div>
              </div>
            ) : null}

            <div className="section-title">
              <h2>Что о нём известно</h2>
            </div>
            <ul className="fact-list">
              {active.facts.map((fact, index) => (
                <li key={index}>{fact}</li>
              ))}
            </ul>
          </article>
        ) : null}
      </Modal>
    </>
  );
}
