import type { CatalogKey, CatalogMap } from "../types";
import { defaultAges } from "./ages";
import { defaultDictionary } from "./dictionary";
import { defaultGallery } from "./gallery";
import { defaultGames } from "./games";
import { defaultHeroes } from "./heroes";
import { defaultLibrary } from "./library";
import { defaultQuiz } from "./quiz";
import { defaultHome, defaultNavigation, defaultStartScreen } from "./shell";
import { defaultTales } from "./tales";
import { defaultTraditions } from "./traditions";

/**
 * Эталонный контент панели. Он же — резервная копия: если сервер недоступен
 * или раздел ещё ни разу не публиковали, панель показывает эти данные
 * и продолжает работать в зале как ни в чём не бывало.
 */
export const catalogDefaults: CatalogMap = {
  "skazka-navigation-v1": defaultNavigation,
  "skazka-start-screen-v1": defaultStartScreen,
  "skazka-home-v1": defaultHome,
  "skazka-ages-v1": defaultAges,
  "skazka-tales-v1": defaultTales,
  "skazka-heroes-v1": defaultHeroes,
  "skazka-dictionary-v1": defaultDictionary,
  "skazka-quiz-v1": defaultQuiz,
  "skazka-games-v1": defaultGames,
  "skazka-traditions-v1": defaultTraditions,
  "skazka-gallery-v1": defaultGallery,
  "skazka-library-v1": defaultLibrary
};

export const CATALOG_KEYS = Object.keys(catalogDefaults) as CatalogKey[];

/** Человекочитаемые названия разделов для админки. */
export const CATALOG_LABELS: Record<CatalogKey, string> = {
  "skazka-navigation-v1": "Навигация",
  "skazka-start-screen-v1": "Стартовый экран",
  "skazka-home-v1": "Главная",
  "skazka-ages-v1": "Возрастные полки",
  "skazka-tales-v1": "Сказки",
  "skazka-heroes-v1": "Герои сказок",
  "skazka-dictionary-v1": "Словарик",
  "skazka-quiz-v1": "Викторина",
  "skazka-games-v1": "Игры",
  "skazka-traditions-v1": "Как рождалась сказка",
  "skazka-gallery-v1": "Галерея и источники",
  "skazka-library-v1": "Библиотека и афиша"
};

/** Короткие пояснения — что именно правит библиотекарь в этом разделе. */
export const CATALOG_HINTS: Record<CatalogKey, string> = {
  "skazka-navigation-v1": "Порядок и видимость кнопок нижней панели, время возврата на заставку.",
  "skazka-start-screen-v1": "Заставка: заголовок, строки присказки, подпись под кнопкой.",
  "skazka-home-v1": "Главный экран: приветствие, плитки разделов, бегущая строка с фактами.",
  "skazka-ages-v1": "Шесть возрастных полок: название, описание и совет родителю.",
  "skazka-tales-v1": "Сказки: пересказ, присказки, факты, обложки и аудиозаписи.",
  "skazka-heroes-v1": "Картотека героев: описание, цитата, факты, портрет.",
  "skazka-dictionary-v1": "Словарик старинных слов: толкование, пример, сказка.",
  "skazka-quiz-v1": "Вопросы викторины по шести возрастам и число вопросов в раунде.",
  "skazka-games-v1": "Карточки, предметы и задания для шести игр.",
  "skazka-traditions-v1": "Типы сказок, части рассказа, сказители и собиратели.",
  "skazka-gallery-v1": "Изображения художников и ссылки на открытые источники.",
  "skazka-library-v1": "Контакты, афиша встреч и услуги библиотеки — заполните перед запуском."
};
