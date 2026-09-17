import { useNavigate } from "react-router-dom";
import { Sky } from "../components/Sky";
import { useCatalog } from "../stores/catalogStore";

/**
 * Заставка-приглашение. Панель возвращается сюда сама, если её оставили
 * без внимания, поэтому экран должен работать как афиша: издалека читается
 * название, вблизи — приглашение коснуться.
 *
 * Строки присказки выплывают одна за другой: пока ребёнок идёт к панели
 * через зал, присказка успевает прочитаться целиком — ровно так, как её
 * и говорили перед сказкой, чтобы все успели рассесться.
 */
export function StartPage() {
  const start = useCatalog("skazka-start-screen-v1");
  const navigate = useNavigate();

  return (
    <div className="start">
      <img className="start__hero-image" src="/covers/tridevyatoe-forest-background.png" alt="" aria-hidden="true" />
      <Sky stars={110} sparks={26} />

      <div className="start__eyebrow rise-in">{start.eyebrow}</div>

      <div className="start__center">
        <h1 className="start__title shimmer-text">{start.title}</h1>

        <div className="start__text-panel start__text-panel--main">
          <p className="start__subtitle">{start.subtitle}</p>

          <div className="start__prologue">
            {start.prologue.map((line, index) => (
              <span key={index} style={{ animationDelay: `${0.5 + index * 0.32}s` }}>
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button type="button" className="start__cta start__text-panel start__text-panel--cta" onClick={() => navigate("/home")}>
        <div className="start__pulse" aria-hidden="true">
          👆
        </div>
        <strong style={{ fontFamily: "Alegreya, Georgia, serif", fontSize: "1.35rem" }}>{start.cta}</strong>
      </button>
    </div>
  );
}
