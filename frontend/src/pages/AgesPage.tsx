import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";

/**
 * Возрастные полки — витрина всей библиотеки сразу.
 *
 * Раздел отвечает на вопрос, который в зале задают чаще всех: «а что взять
 * моему?». Поэтому на карточке полки видно и совет родителю, и список
 * сказок, которые на ней стоят: выбор делается здесь, а не в общем списке
 * из тридцати обложек.
 */
export function AgesPage() {
  const ages = useCatalog("skazka-ages-v1");
  const tales = useCatalog("skazka-tales-v1");

  // Считаем сказки по полкам один раз: карточек шесть, список — тридцать,
  // и перебирать его в каждой карточке незачем.
  const byAge = useMemo(() => {
    const map = new Map<string, typeof tales.items>();
    for (const tale of tales.items) {
      const list = map.get(tale.ages) ?? [];
      list.push(tale);
      map.set(tale.ages, list);
    }
    return map;
  }, [tales.items]);

  return (
    <>
      <PageHead eyebrow="Выбираем по возрасту" title={ages.title} lead={ages.lead} />

      <div className="stack stagger" style={{ gap: "1.1rem" }}>
        {ages.items.map((shelf) => {
          const list = byAge.get(shelf.id) ?? [];
          return (
            <section className={`age-shelf tint--${shelf.tint}`} key={shelf.id}>
              <header className="age-shelf__head">
                <span className="age-shelf__emoji" aria-hidden="true">
                  {shelf.emoji}
                </span>
                <div>
                  <div className="age-shelf__title">{shelf.title}</div>
                  <div className="age-shelf__caption">{shelf.caption}</div>
                </div>
                <span className="chip chip--tint">{list.length} сказок</span>
              </header>

              <p className="age-shelf__lead">{shelf.lead}</p>

              <p className="age-shelf__advice">
                <span aria-hidden="true">💡</span> {shelf.advice}
              </p>

              {list.length > 0 ? (
                <ul className="age-shelf__list">
                  {list.map((tale) => (
                    <li key={tale.id}>
                      <span aria-hidden="true">{tale.emoji}</span>
                      {tale.shortTitle}
                      <em>{tale.minutes} мин</em>
                    </li>
                  ))}
                </ul>
              ) : null}

              <Link className="btn btn--primary" to={`/tales?age=${shelf.id}`}>
                Открыть полку →
              </Link>
            </section>
          );
        })}
      </div>
    </>
  );
}
