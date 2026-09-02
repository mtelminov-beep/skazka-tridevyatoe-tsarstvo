import { useState } from "react";
import { ContentImage } from "../components/ContentImage";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";
import type { TaleKind } from "../types";

/**
 * «Как рождалась сказка» — раздел о самой традиции.
 *
 * Место, которое на соседней панели занимает биография поэта: у народной
 * сказки автора нет, зато есть устройство и есть люди, донёсшие её до нас.
 *
 * Страница читается сверху вниз как экскурсия: сначала какие бывают сказки,
 * потом из каких частей они собраны, потом кто их сохранил.
 */
export function TraditionsPage() {
  const traditions = useCatalog("skazka-traditions-v1");
  const tales = useCatalog("skazka-tales-v1");
  const [openPart, setOpenPart] = useState<string | null>(traditions.structure[0]?.id ?? null);

  /** Сколько сказок каждого типа стоит на полках — цифра из самого каталога. */
  const countByKind = (kind: TaleKind) => tales.items.filter((tale) => tale.kind === kind).length;

  return (
    <>
      <PageHead eyebrow="Устная традиция" title={traditions.title} lead={traditions.lead} />

      <div className="section-title">
        <h2>Какие бывают сказки</h2>
        <span>{traditions.kinds.length} типа</span>
      </div>

      <div className="grid grid--2 stagger">
        {traditions.kinds.map((kind) => {
          const count = countByKind(kind.id);
          return (
            <article className={`card kind-card tint--${kind.tint}`} key={kind.id}>
              <div className="kind-card__emoji" aria-hidden="true">
                {kind.emoji}
              </div>
              <h3>{kind.title}</h3>
              <p>{kind.text}</p>
              <div className="row" style={{ gap: "0.4rem" }}>
                {kind.examples.map((example) => (
                  <span className="chip" key={example}>
                    {example}
                  </span>
                ))}
              </div>
              {count > 0 ? (
                <div className="kind-card__count">
                  На полках панели: {count}{" "}
                  {count === 1 ? "сказка" : count < 5 ? "сказки" : "сказок"}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="section-title">
        <h2>Из чего собрана сказка</h2>
        <span>нажмите на часть</span>
      </div>

      <div className="timeline">
        {traditions.structure.map((part) => {
          const open = openPart === part.id;
          return (
            <button
              key={part.id}
              type="button"
              className={`timeline__item${open ? " timeline__item--open" : ""}`}
              onClick={() => setOpenPart(open ? null : part.id)}
            >
              <span className="timeline__dot" aria-hidden="true">
                {part.emoji}
              </span>
              <div className="timeline__title">{part.title}</div>
              <div className="timeline__place">{open ? "свернуть" : "подробнее"}</div>
              {open ? (
                <div className="timeline__text rise-in">
                  {part.text}
                  <div className="quote-card" style={{ marginTop: "0.9rem" }}>
                    <div className="quote-card__text">{part.example}</div>
                  </div>
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="section-title">
        <h2>Кто сохранил сказку</h2>
        <span>{traditions.collectors.length}</span>
      </div>

      <div className="stack stagger" style={{ gap: "0.9rem" }}>
        {traditions.collectors.map((person) => (
          <article className="collector-card" key={person.id}>
            <div className="collector-card__face" aria-hidden="true">
              <ContentImage src={person.portrait} alt={person.name} fallback={person.emoji} />
            </div>
            <div>
              <div className="collector-card__years">{person.years}</div>
              <h3 style={{ margin: "0.1rem 0 0.5rem" }}>{person.name}</h3>
              <p style={{ color: "var(--text-dim)", marginBottom: "0.7rem" }}>{person.text}</p>
              {person.quote ? <div className="collector-card__quote">{person.quote}</div> : null}
            </div>
          </article>
        ))}
      </div>

      <div className="section-title">
        <h2>Что ещё стоит знать</h2>
      </div>

      <ul className="fact-list">
        {traditions.facts.map((fact, index) => (
          <li key={index}>{fact}</li>
        ))}
      </ul>
    </>
  );
}
