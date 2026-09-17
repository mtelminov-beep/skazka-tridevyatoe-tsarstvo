import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";
import type { CalendarEvent } from "../types";

export function CalendarPage() {
  const calendar = useCatalog("skazka-calendar-v1");
  const [activeMonth, setActiveMonth] = useState(calendar.months[0]?.id ?? "");
  const month = useMemo(() => calendar.months.find((item) => item.id === activeMonth) ?? calendar.months[0], [activeMonth, calendar.months]);
  return <section className="calendar-page"><Link className="library-back" to="/library">← Все разделы библиотеки</Link><PageHead eyebrow={calendar.eyebrow} title={`${calendar.title} ${calendar.year} год`} lead={calendar.lead} /><div className="calendar-intro glass"><span className="calendar-intro__year">{calendar.year}</span><div><strong>Память о родном крае</strong><p>События собраны по месяцам: выберите дату для чтения.</p></div></div><div className="calendar-months" aria-label="Выбор месяца">{calendar.months.map((item) => <button key={item.id} type="button" onClick={() => setActiveMonth(item.id)} className={item.id === month?.id ? "calendar-month calendar-month--active" : "calendar-month"}>{item.name.slice(0, 3)}</button>)}</div>{calendar.intro.length > 0 ? <section className="calendar-all-year"><h2>В течение года</h2><CalendarCards events={calendar.intro} /></section> : null}{month ? <section className="calendar-current"><div className="section-title"><h2>{month.name}</h2><span>{month.events.length} событий</span></div><CalendarCards events={month.events} /></section> : null}</section>;
}

function CalendarCards({ events }: { events: CalendarEvent[] }) {
  return <div className="calendar-events">{events.map((event) => <article className="calendar-event glass" key={event.id}><div className="calendar-event__day">{event.day}</div><div className="calendar-event__body">{event.anniversary ? <span className="chip chip--gold">{event.anniversary}</span> : null}<h3>{event.title}</h3><p>{event.description}</p></div>{event.media ? <CalendarEventMedia src={event.media} title={event.title} /> : null}</article>)}</div>;
}

function CalendarEventMedia({ src, title }: { src: string; title: string }) {
  const isVideo = /\.(?:mp4|webm)(?:[?#].*)?$/i.test(src);
  return <div className="calendar-event__media">{isVideo ? <video src={src} controls preload="metadata" /> : <img src={src} alt={title} loading="lazy" />}</div>;
}
