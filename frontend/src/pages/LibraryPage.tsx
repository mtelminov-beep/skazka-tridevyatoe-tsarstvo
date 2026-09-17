import { Link, useParams } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";

/** Библиотека — каталог редактируемых подразделов с отдельными страницами. */
export function LibraryPage() {
  const library = useCatalog("skazka-library-v1");
  const { sectionId } = useParams();
  const section = sectionId ? library.sections.find((item) => item.id === sectionId) : undefined;
  if (sectionId && !section) return <><PageHead eyebrow="Библиотека" title="Раздел не найден" lead="Вернитесь к списку разделов библиотеки." /><Link className="btn btn--primary" to="/library">К разделам библиотеки</Link></>;
  if (section) return <><Link className="library-back" to="/library">← Все разделы библиотеки</Link><PageHead eyebrow="Библиотека" title={section.title} lead={section.description} /><article className="library-article glass"><div className="library-article__icon" aria-hidden="true">{section.emoji}</div><div>{section.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article></>;
  return <><PageHead eyebrow="Библиотека" title={library.title} lead={library.lead} /><div className="library-section-grid">{library.sections.map((item) => <Link className={`library-section-card tint--${item.tint}`} key={item.id} to={item.id === "calendar-2027" ? "/library/calendar-2027" : `/library/${item.id}`}><span className="library-section-card__icon" aria-hidden="true">{item.emoji}</span><span className="library-section-card__body"><strong>{item.title}</strong><small>{item.description}</small></span><span aria-hidden="true">→</span></Link>)}</div><div className="section-title"><h2>Контакты</h2></div><div className="glass library-contacts"><p>📍 {library.contacts.address}</p><p>☎️ {library.contacts.phone}</p><p>🕘 {library.contacts.hours}</p><p>🌐 {library.contacts.site}</p></div></>;
}
