import { useMemo } from "react";

/**
 * Живой фон панели: тёплые пятна света, звёзды над лесом, летящие искры
 * от лучины и узорная кайма понизу.
 *
 * Всё сидит в одном fixed-контейнере с z-index: -1 и pointer-events: none.
 * Внутри страниц такой слой ставить нельзя: `transform` анимации входа
 * и `backdrop-filter` стеклянных карточек создают containing block,
 * и fixed начинает считаться от карточки, а не от экрана.
 *
 * Класс `.sky` и его модификаторы общие с соседней панелью «Лукоморье» —
 * сменилась только начинка: вместо морской волны внизу идёт вышивка,
 * а искры поднимаются от печи, а не от золотой цепи.
 */

type Star = { left: number; top: number; size: number; dur: number; delay: number };
type Spark = { left: number; dur: number; delay: number; drift: number; size: number };

function buildStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let index = 0; index < count; index += 1) {
    stars.push({
      left: Math.random() * 100,
      top: Math.random() * 68,
      size: 1.5 + Math.random() * 2.5,
      dur: 2.6 + Math.random() * 5,
      delay: Math.random() * 6
    });
  }
  return stars;
}

function buildSparks(count: number): Spark[] {
  const sparks: Spark[] = [];
  for (let index = 0; index < count; index += 1) {
    sparks.push({
      left: Math.random() * 100,
      dur: 15 + Math.random() * 20,
      delay: Math.random() * 22,
      drift: -80 + Math.random() * 160,
      size: 4 + Math.random() * 9
    });
  }
  return sparks;
}

/**
 * Кайма понизу — не волна, а северная вышивка: ромбы с крючками.
 * Это самый частый узор на полотенцах и подолах, знак засеянного поля.
 */
const EMBROIDERY =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" preserveAspectRatio="none">
      <g fill="none" stroke="%23d8452f" stroke-width="3" stroke-linecap="square">
        <path d="M0 30 L30 6 L60 30 L30 54 Z M60 30 L90 6 L120 30 L90 54 Z M120 30 L150 6 L180 30 L150 54 Z M180 30 L210 6 L240 30 L210 54 Z"/>
        <path d="M30 6 V0 M30 54 V60 M90 6 V0 M90 54 V60 M150 6 V0 M150 54 V60 M210 6 V0 M210 54 V60"/>
        <path d="M14 18 h8 M38 18 h8 M74 18 h8 M98 18 h8 M134 18 h8 M158 18 h8 M194 18 h8 M218 18 h8"/>
      </g>
    </svg>`
  );

/**
 * Ёлки на горизонте: одна повторяющаяся плитка, растянутая по ширине.
 * Лес нужен не для красоты — он отделяет «своё» от «тридевятого»,
 * ровно как в самой сказке.
 */
const FOREST =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="none">
      <path fill="%230b3a29" d="M0 120 V78 l18-26 8 12 14-30 12 22 10-14 16 30 14-22 12 18 18-34 14 26 12-16 16 28 14-20 12 16 18-30 14 24 12-14 16 26 14-18 12 14 18-26 14 20 12-12 16 22 14-16 12 12 18-22 14 18 12-10 16 18 V120 Z"/>
    </svg>`
  );

export function Sky({ stars = 70, sparks = 18 }: { stars?: number; sparks?: number }) {
  const starList = useMemo(() => buildStars(stars), [stars]);
  const sparkList = useMemo(() => buildSparks(sparks), [sparks]);

  return (
    <div className="sky" aria-hidden="true">
      <div className="sky__blob sky__blob--a" />
      <div className="sky__blob sky__blob--b" />
      <div className="sky__blob sky__blob--c" />

      {starList.map((star, index) => (
        <span
          key={`star-${index}`}
          className="sky__star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            ["--dur" as string]: `${star.dur}s`,
            ["--delay" as string]: `${star.delay}s`
          }}
        />
      ))}

      {sparkList.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className="sky__spark"
          style={{
            left: `${spark.left}%`,
            width: spark.size,
            height: spark.size,
            ["--dur" as string]: `${spark.dur}s`,
            ["--delay" as string]: `${spark.delay}s`,
            ["--drift-x" as string]: `${spark.drift}px`
          }}
        />
      ))}

      <div className="sky__forest" style={{ backgroundImage: `url("${FOREST}")` }} />

      <div className="sky__sea">
        <div
          className="sky__wave sky__wave--embroidery"
          style={{ backgroundImage: `url("${EMBROIDERY}")`, ["--dur" as string]: "48s" }}
        />
      </div>
    </div>
  );
}
