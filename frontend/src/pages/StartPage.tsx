import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DisplayControls } from "../components/DisplayControls";
import { Sky } from "../components/Sky";
import { useCatalog } from "../stores/catalogStore";

/** Заставка с быстрым входом в админку и контрастной версией для слабовидящих. */
export function StartPage() {
  const start = useCatalog("skazka-start-screen-v1");
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = () => navigate("/home");
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate]);

  return <div className="start" onClick={() => navigate("/home")} role="button" tabIndex={0}>
    <img className="start__hero-image" src="/covers/tridevyatoe-forest-background.png" alt="" aria-hidden="true" />
    <Sky stars={110} sparks={26} />
    <DisplayControls className="start__display-controls" />
    <div className="start__eyebrow rise-in">{start.eyebrow}</div>
    <div className="start__center"><h1 className="start__title shimmer-text">{start.title}</h1><div className="start__text-panel start__text-panel--main"><p className="start__subtitle">{start.subtitle}</p><div className="start__prologue">{start.prologue.map((line, index) => <span key={index} style={{ animationDelay: `${0.5 + index * 0.32}s` }}>{line}</span>)}</div></div></div>
    <div className="start__cta start__text-panel start__text-panel--cta"><div className="start__pulse" aria-hidden="true">👆</div><strong style={{ fontFamily: "Alegreya, Georgia, serif", fontSize: "1.35rem" }}>{start.cta}</strong></div>
    <div className="start__system-actions" onClick={(event) => event.stopPropagation()}><Link className="start__system-button" to="/admin">Админка</Link><button className="start__system-button" type="button" onClick={() => window.close()}>Выйти</button></div>
  </div>;
}
