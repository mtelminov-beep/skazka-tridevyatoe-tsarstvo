/**
 * Контракт контента панели «Тридевятое царство».
 *
 * Формы данных здесь — единственный источник правды и для страниц панели,
 * и для универсального редактора админки: он строит форму по фактической
 * структуре объекта, поэтому новый раздел не требует писать новый редактор.
 */

/** Цветовая тема плитки/карточки. Значения совпадают с классами `.tint--*` в theme.css. */
export type Tint = "gold" | "berry" | "gzhel" | "forest" | "ember" | "violet" | "sky" | "rose";

/**
 * Возрастная полка. Шесть ступеней вместо привычных четырёх: между сказкой
 * для двухлетнего («Репка») и для шестилетнего («Царевна-лягушка») лежит
 * пропасть, и одна общая полка «3 — 6» сводит подбор на нет.
 */
export type AgeBand = "0-3" | "3-5" | "5-7" | "7-10" | "10-13" | "13-17";

/** Тип сказки по классификации собирателей. */
export type TaleKind = "animals" | "magic" | "everyday" | "literary";

/* ------------------------------- Навигация ------------------------------- */

export type NavItem = {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  emoji: string;
  tint: Tint;
  visible: boolean;
};

export type NavigationCatalog = {
  items: NavItem[];
  /** Через сколько минут без касаний панель возвращается на заставку. */
  idleTimeoutMinutes: number;
  footer: string;
};

/* ----------------------------- Стартовый экран ---------------------------- */

export type StartScreenCatalog = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Строки присказки — плывут по заставке одна за другой. */
  prologue: string[];
  cta: string;
  hint: string;
  badges: string[];
};

/* -------------------------------- Главная -------------------------------- */

export type HomeTile = {
  id: string;
  title: string;
  text: string;
  path: string;
  emoji: string;
  image?: string;
  tint: Tint;
  wide: boolean;
};

export type HomeCatalog = {
  greeting: string;
  headline: string;
  lead: string;
  tiles: HomeTile[];
  ticker: string[];
};

/* ------------------------------ Возрастные полки --------------------------- */

export type AgeGroup = {
  id: AgeBand;
  /** «0 — 3 года» — как написано на кнопке. */
  title: string;
  /** «0–3» — как написано на узком значке. */
  short: string;
  /** «Первые сказки» — название полки. */
  caption: string;
  lead: string;
  emoji: string;
  /** Фотография-навигация для возрастной полки. */
  image?: string;
  tint: Tint;
  /** Совет библиотекарю и родителю: как читать в этом возрасте. */
  advice: string;
};

export type AgesCatalog = {
  title: string;
  lead: string;
  items: AgeGroup[];
};

/* --------------------------------- Сказки -------------------------------- */

export type TaleQuote = {
  text: string;
  note: string;
};

export type Tale = {
  id: string;
  title: string;
  shortTitle: string;
  ages: AgeBand;
  kind: TaleKind;
  /** Сколько минут читать вслух — библиотекарь планирует занятие. */
  minutes: number;
  emoji: string;
  tint: Tint;
  image: string;
  epigraph: string;
  summary: string;
  /** Полный текст пересказа по абзацам — его показывает читалка. */
  text: string[];
  /** Сюжет по шагам: быстрый просмотр и материал для игры «Порядок сказки». */
  plot: string[];
  /** Присказки, повторы и знаменитые строки. */
  sayings: TaleQuote[];
  moral: string;
  facts: string[];
  /** Вопросы для обсуждения после чтения. */
  questions: string[];
  /** Идентификаторы героев из раздела «Герои» и слов из словаря. */
  heroes: string[];
  words: string[];
  audio: string;
  audioParts?: Array<{
    title: string;
    src: string;
  }>;
  video: string;
};

export type TalesCatalog = {
  title: string;
  lead: string;
  items: Tale[];
};

/* --------------------------------- Герои --------------------------------- */

export type Hero = {
  id: string;
  name: string;
  tale: string;
  role: string;
  emoji: string;
  image: string;
  tint: Tint;
  summary: string;
  quote: string;
  facts: string[];
};

export type HeroesCatalog = {
  title: string;
  lead: string;
  items: Hero[];
};

/* -------------------------------- Словарик -------------------------------- */

export type DictionaryEntry = {
  id: string;
  word: string;
  meaning: string;
  example: string;
  tale: string;
  emoji: string;
};

export type DictionaryCatalog = {
  title: string;
  lead: string;
  items: DictionaryEntry[];
};

/* -------------------------------- Викторина ------------------------------- */

export type QuizLevel = {
  id: AgeBand;
  title: string;
  subtitle: string;
  emoji: string;
  tint: Tint;
};

export type QuizQuestion = {
  id: string;
  level: AgeBand;
  question: string;
  options: string[];
  /** Номер правильного варианта, считая с нуля. */
  correct: number;
  explain: string;
  emoji: string;
};

export type QuizCatalog = {
  title: string;
  lead: string;
  questionsPerRound: number;
  levels: QuizLevel[];
  questions: QuizQuestion[];
  praise: string[];
};

/* ---------------------------------- Игры --------------------------------- */

/** Общая шапка любой игры — по ней строится меню раздела. */
export type GameMeta = {
  title: string;
  subtitle: string;
  rules: string;
  ages: AgeBand;
  emoji: string;
  tint: Tint;
};

export type MemoryCard = {
  id: string;
  label: string;
  emoji: string;
  image?: string;
  tale: string;
};

export type SortingBin = {
  id: string;
  label: string;
  emoji: string;
  /** Старое поле совместимости для импортированных игровых каталогов. */
  icon?: string;
  image?: string;
};

export type SortingItem = {
  id: string;
  label: string;
  emoji: string;
  bin: string;
  hint: string;
  image?: string;
};

export type WordTask = {
  id: string;
  before: string;
  answer: string;
  after: string;
  options: string[];
  source: string;
};

export type PuzzlePicture = {
  id: string;
  title: string;
  image: string;
  caption: string;
};

/** «Порядок сказки»: шаги перечислены правильно, игра их перемешивает. */
export type OrderTask = {
  id: string;
  tale: string;
  emoji: string;
  steps: string[];
};

/** «Кто лишний»: среди четырёх предметов один не из этой сказки. */
export type OddTask = {
  id: string;
  question: string;
  options: Array<{ label: string; emoji: string }>;
  odd: number;
  explain: string;
};

export type GamesCatalog = {
  title: string;
  lead: string;
  memory: GameMeta & { cards: MemoryCard[] };
  sorting: GameMeta & { bins: SortingBin[]; items: SortingItem[] };
  words: GameMeta & { tasks: WordTask[] };
  puzzle: GameMeta & {
    /** Сторона квадрата: 3 — девять кусочков, 4 — шестнадцать. */
    size: number;
    pictures: PuzzlePicture[];
  };
  order: GameMeta & { tasks: OrderTask[] };
  odd: GameMeta & { tasks: OddTask[] };
};

/* ------------------------- Как рождалась сказка --------------------------- */

export type TaleKindCard = {
  id: TaleKind;
  title: string;
  text: string;
  emoji: string;
  tint: Tint;
  examples: string[];
};

export type StructurePart = {
  id: string;
  title: string;
  text: string;
  example: string;
  emoji: string;
};

export type Collector = {
  id: string;
  name: string;
  years: string;
  text: string;
  quote: string;
  portrait: string;
  emoji: string;
};

export type TraditionsCatalog = {
  title: string;
  lead: string;
  kinds: TaleKindCard[];
  structure: StructurePart[];
  collectors: Collector[];
  facts: string[];
};

/* -------------------------------- Галерея -------------------------------- */

export type GalleryItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  title: string;
  author: string;
  year: string;
  caption: string;
};

export type SourceLink = {
  id: string;
  label: string;
  url: string;
  note: string;
};

export type GalleryCatalog = {
  title: string;
  lead: string;
  items: GalleryItem[];
  sources: SourceLink[];
};

/* ------------------------------- Библиотека ------------------------------- */

export type LibraryEvent = {
  id: string;
  title: string;
  when: string;
  ages: string;
  place: string;
  text: string;
  emoji: string;
};

export type LibraryService = {
  id: string;
  title: string;
  text: string;
  emoji: string;
};

export type LibraryCatalog = {
  title: string;
  lead: string;
  about: string;
  project: {
    title: string;
    text: string;
    url: string;
  };
  contacts: {
    address: string;
    phone: string;
    hours: string;
    site: string;
  };
  events: LibraryEvent[];
  services: LibraryService[];
};

/* ------------------------------ Карта каталогов --------------------------- */

export type CatalogMap = {
  "skazka-navigation-v1": NavigationCatalog;
  "skazka-start-screen-v1": StartScreenCatalog;
  "skazka-home-v1": HomeCatalog;
  "skazka-ages-v1": AgesCatalog;
  "skazka-tales-v1": TalesCatalog;
  "skazka-heroes-v1": HeroesCatalog;
  "skazka-dictionary-v1": DictionaryCatalog;
  "skazka-quiz-v1": QuizCatalog;
  "skazka-games-v1": GamesCatalog;
  "skazka-traditions-v1": TraditionsCatalog;
  "skazka-gallery-v1": GalleryCatalog;
  "skazka-library-v1": LibraryCatalog;
};

export type CatalogKey = keyof CatalogMap;
