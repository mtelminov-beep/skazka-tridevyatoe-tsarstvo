import { useMemo, useState } from "react";
import { CatalogProvider, useCatalog } from "./stores/catalogStore";
import type { AgeBand, Tale } from "./types";

const ages: Array<AgeBand | "all"> = ["all", "0-3", "3-5", "5-7", "7-10", "10-13", "13-17"];
const ageName = (age: AgeBand | "all") => age === "all" ? "Все возраста" : `${age.replace("-", "–")} лет`;

function Library() {
  const catalog = useCatalog("skazka-tales-v1");
  const shelves = useCatalog("skazka-ages-v1");
  const [age, setAge] = useState<AgeBand | "all">("all");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<Tale | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("skazka-favorites") || "[]"); } catch { return []; } });
  const shown = useMemo(() => catalog.items.filter(t => (age === "all" || t.ages === age) && t.title.toLowerCase().includes(query.toLowerCase())), [catalog.items, age, query]);
  const toggleFavorite = (id: string) => setFavorites(old => { const next = old.includes(id) ? old.filter(x => x !== id) : [...old, id]; localStorage.setItem("skazka-favorites", JSON.stringify(next)); return next; });
  return <main>
    <section className="hero"><div className="hero__shine" /><p className="eyebrow">Интерактивная библиотека</p><h1>Тридевятое<br />царство</h1><p>Русские народные сказки — от первых повторов до больших волшебных дорог.</p><div className="hero__stats"><span>30 сказок</span><span>6 возрастных полок</span><span>без рекламы</span></div></section>
    <section className="shell"><div className="section-head"><div><p className="eyebrow">Найти свою историю</p><h2>Сказочная библиотека</h2></div><label className="search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Название сказки" /></label></div>
    <div className="shelves">{shelves.items.map(s => <button key={s.id} className={`shelf shelf--${s.tint}${age === s.id ? " is-active" : ""}`} onClick={() => setAge(s.id)}><b>{s.short}</b><span>{s.caption}</span><i>{s.emoji}</i></button>)}</div>
    <div className="filters">{ages.map(a => <button key={a} className={age === a ? "active" : ""} onClick={() => setAge(a)}>{ageName(a)}</button>)}</div>
    <p className="result">{shown.length} {shown.length === 1 ? "сказка" : "сказок"} · нажмите на карточку, чтобы открыть</p>
    <div className="grid">{shown.map(t => <article className={`card tint-${t.tint}`} key={t.id}><button className="fav" aria-label="В избранное" onClick={() => toggleFavorite(t.id)}>{favorites.includes(t.id) ? "♥" : "♡"}</button><button className="card__open" onClick={() => setCurrent(t)}><div className="card__symbol">{t.emoji}</div><div className="card__meta">{t.ages.replace("-", "–")} лет · {t.minutes} мин</div><h3>{t.shortTitle}</h3><p>{t.summary}</p><span className="open">Открыть сказку <b>→</b></span></button></article>)}</div></section>
    {current && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCurrent(null)}><article className="reader" role="dialog" aria-modal="true" aria-label={current.title} onMouseDown={e => e.stopPropagation()}><button className="close" onClick={() => setCurrent(null)}>×</button><div className="reader__symbol">{current.emoji}</div><p className="eyebrow">{current.ages.replace("-", "–")} лет · читать {current.minutes} минут</p><h2>{current.title}</h2><blockquote>{current.epigraph}</blockquote><p className="lead">{current.summary}</p><div className="audio-placeholder"><span>🎧</span><div><b>Аудиосказка</b><small>Загрузите файл через админ-панель — он появится здесь.</small></div></div><h3>Читать сказку</h3><div className="tale-text">{current.text.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><h3>Сюжет по шагам</h3><ol>{current.plot.map((s, i) => <li key={i}>{s}</li>)}</ol><h3>Чему учит</h3><p>{current.moral}</p><h3>Что обсудить после чтения</h3><ul>{current.questions.map(q => <li key={q}>{q}</li>)}</ul><p className="source-note">Текст и пересказ подготовлены по мотивам открытых фольклорных публикаций; у народных сказок существуют варианты.</p></article></div>}
  </main>;
}

export function App() { return <CatalogProvider><Library /></CatalogProvider>; }
