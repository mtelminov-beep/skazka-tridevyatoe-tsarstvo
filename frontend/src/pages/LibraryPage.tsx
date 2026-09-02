import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";

/** Раздел о библиотеке: афиша, услуги, контакты и рассказ о нацпроекте. */
export function LibraryPage() {
  const library = useCatalog("skazka-library-v1");

  return (
    <>
      <PageHead eyebrow="Приходите к нам" title={library.title} lead={library.lead} />

      <div className="glass" style={{ padding: "1.4rem", marginBottom: "1.4rem" }}>
        <p style={{ margin: 0 }}>{library.about}</p>
      </div>

      <div className="section-title">
        <h2>Афиша встреч</h2>
        <span>{library.events.length} событий</span>
      </div>

      <div className="stack stagger" style={{ gap: "0.8rem" }}>
        {library.events.map((event) => (
          <div className="event-card" key={event.id}>
            <div className="event-card__badge" aria-hidden="true">
              {event.emoji}
            </div>
            <div>
              <div className="event-card__when">{event.when}</div>
              <div style={{ fontWeight: 800, fontSize: "1.06rem", margin: "0.15rem 0" }}>{event.title}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginBottom: "0.5rem" }}>
                {event.ages} · {event.place}
              </div>
              <p style={{ margin: 0, color: "var(--text-dim)", fontSize: "0.94rem" }}>{event.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">
        <h2>Что у нас есть</h2>
      </div>

      <div className="grid grid--2">
        {library.services.map((service) => (
          <div className="card" key={service.id} style={{ padding: "1.1rem 1.2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }} aria-hidden="true">
              {service.emoji}
            </div>
            <strong style={{ display: "block", marginBottom: "0.35rem" }}>{service.title}</strong>
            <span style={{ color: "var(--text-dim)", fontSize: "0.92rem" }}>{service.text}</span>
          </div>
        ))}
      </div>

      <div className="section-title">
        <h2>Как нас найти</h2>
      </div>

      <div className="glass" style={{ padding: "0.6rem 1.3rem" }}>
        <div className="contact-row">
          <span style={{ fontSize: "1.5rem" }} aria-hidden="true">
            📍
          </span>
          <span>{library.contacts.address}</span>
        </div>
        <div className="contact-row">
          <span style={{ fontSize: "1.5rem" }} aria-hidden="true">
            ☎️
          </span>
          <span>{library.contacts.phone}</span>
        </div>
        <div className="contact-row">
          <span style={{ fontSize: "1.5rem" }} aria-hidden="true">
            🕘
          </span>
          <span>{library.contacts.hours}</span>
        </div>
        {library.contacts.site ? (
          <div className="contact-row">
            <span style={{ fontSize: "1.5rem" }} aria-hidden="true">
              🌐
            </span>
            <span>{library.contacts.site}</span>
          </div>
        ) : null}
      </div>

      <div className="section-title">
        <h2>{library.project.title}</h2>
      </div>

      <div
        className="card tint--gold"
        style={{
          padding: "1.4rem",
          background: "linear-gradient(150deg, rgba(240, 180, 41, 0.18), var(--surface) 62%)"
        }}
      >
        <p style={{ marginBottom: "0.9rem" }}>{library.project.text}</p>
        <span className="chip chip--gold">{library.project.url}</span>
      </div>
    </>
  );
}
