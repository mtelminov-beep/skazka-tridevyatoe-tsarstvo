import { useState } from "react";
import { Modal } from "../components/Modal";
import { PageHead } from "../components/PageHead";
import { defaultGallery } from "../data/gallery";
import { useCatalog } from "../stores/catalogStore";
import type { GalleryItem } from "../types";

function withDefaultImage(item: GalleryItem): GalleryItem {
  if (item.url) return item;
  const fallback = defaultGallery.items.find((defaultItem) => defaultItem.id === item.id);
  return fallback?.url ? { ...item, url: fallback.url, kind: fallback.kind } : item;
}

/** Галерея иллюстраторов и список открытых источников. */
export function GalleryPage() {
  const gallery = useCatalog("skazka-gallery-v1");
  const [openId, setOpenId] = useState<string | null>(null);
  const items = gallery.items.map(withDefaultImage);
  const active = items.find((item) => item.id === openId) ?? null;

  return (
    <>
      <PageHead eyebrow="Художники сказок" title={gallery.title} lead={gallery.lead} />

      <div className="gallery-grid stagger">
        {items.map((item) => (
          <button key={item.id} type="button" className="gallery-card" onClick={() => setOpenId(item.id)}>
            <div className="gallery-card__frame">
              {item.url && item.kind === "image" ? (
                <img src={item.url} alt={item.title} loading="lazy" />
              ) : item.url && item.kind === "video" ? (
                <video src={item.url} preload="metadata" muted />
              ) : (
                <span aria-hidden="true">🖼️</span>
              )}
            </div>
            <div className="gallery-card__body">
              <div className="gallery-card__author">{item.author}</div>
              <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{item.title}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-faint)" }}>{item.year}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="section-title">
        <h2>Где посмотреть больше</h2>
        <span>открытые источники</span>
      </div>

      <div className="stack" style={{ gap: "0.7rem" }}>
        {gallery.sources.map((source) => (
          <a className="source-link" key={source.id} href={source.url} target="_blank" rel="noreferrer">
            <div>
              <strong>{source.label}</strong>
              <small>{source.note}</small>
              <small style={{ color: "var(--gzhel-300)" }}>{source.url}</small>
            </div>
            <span className="chip" aria-hidden="true">
              🔗
            </span>
          </a>
        ))}
      </div>

      <Modal open={Boolean(active)} onClose={() => setOpenId(null)} label={active?.title}>
        {active ? (
          <article>
            <div className="gallery-card__frame" style={{ borderRadius: "var(--radius-lg)", marginBottom: "1.2rem" }}>
              {active.url && active.kind === "image" ? (
                <img src={active.url} alt={active.title} />
              ) : active.url && active.kind === "video" ? (
                <video src={active.url} controls />
              ) : (
                <span style={{ fontSize: "5rem" }} aria-hidden="true">
                  🖼️
                </span>
              )}
            </div>
            <div className="gallery-card__author">
              {active.author}
              {active.year ? ` · ${active.year}` : ""}
            </div>
            <h2 style={{ margin: "0.4rem 0 1rem" }}>{active.title}</h2>
            <p className="lead">{active.caption}</p>
          </article>
        ) : null}
      </Modal>
    </>
  );
}
