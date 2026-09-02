/**
 * Ключи каталогов контента интерактивной панели «Тридевятое царство».
 * Каждый ключ — независимо редактируемый и публикуемый раздел CMS.
 *
 * Добавляете новый раздел контента? Ключ нужен и здесь, и в
 * frontend/src/data/defaults.ts — иначе публикация вернёт 404.
 */
export const CATALOG_KEYS = [
  "skazka-navigation-v1",
  "skazka-start-screen-v1",
  "skazka-home-v1",
  "skazka-ages-v1",
  "skazka-tales-v1",
  "skazka-heroes-v1",
  "skazka-dictionary-v1",
  "skazka-quiz-v1",
  "skazka-games-v1",
  "skazka-traditions-v1",
  "skazka-gallery-v1",
  "skazka-library-v1"
];

/** @param {string} key */
export function isCatalogKey(key) {
  return CATALOG_KEYS.includes(key);
}
