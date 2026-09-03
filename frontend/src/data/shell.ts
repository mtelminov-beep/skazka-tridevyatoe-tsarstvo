import type { HomeCatalog, NavigationCatalog, StartScreenCatalog } from "../types";

/**
 * Оболочка панели: заставка, навигация и главный экран.
 * Порядок пунктов навигации = порядок кнопок в нижней панели.
 *
 * Разделов десять — столько же, сколько на соседней панели «Лукоморье»,
 * но набор свой: у народной сказки нет автора, зато есть возрастные полки
 * и живая традиция рассказывания, ради которой сказку и записывали.
 */

export const defaultNavigation: NavigationCatalog = {
  idleTimeoutMinutes: 3,
  footer: "Детская библиотека нового поколения · национальный проект «Семья»",
  items: [
    {
      id: "home",
      title: "Главная",
      subtitle: "Все разделы царства",
      path: "/home",
      emoji: "🏡",
      tint: "forest",
      visible: true
    },
    {
      id: "ages",
      title: "Полки",
      subtitle: "Шесть возрастов",
      path: "/ages",
      emoji: "📚",
      tint: "berry",
      visible: true
    },
    {
      id: "tales",
      title: "Сказки",
      subtitle: "Тридцать историй",
      path: "/tales",
      emoji: "📖",
      tint: "gold",
      visible: true
    },
    {
      id: "heroes",
      title: "Герои",
      subtitle: "Кто живёт в сказках",
      path: "/heroes",
      emoji: "👑",
      tint: "violet",
      visible: true
    },
    {
      id: "traditions",
      title: "Как рождалась",
      subtitle: "Сказители и собиратели",
      path: "/traditions",
      emoji: "🕯️",
      tint: "ember",
      visible: true
    },
    {
      id: "dictionary",
      title: "Словарик",
      subtitle: "Старинные слова",
      path: "/dictionary",
      emoji: "🔎",
      tint: "gzhel",
      visible: true
    },
    {
      id: "quiz",
      title: "Викторина",
      subtitle: "Шесть уровней",
      path: "/quiz",
      emoji: "🎯",
      tint: "rose",
      visible: true
    },
    {
      id: "games",
      title: "Игры",
      subtitle: "Шесть игр",
      path: "/games",
      emoji: "🎲",
      tint: "sky",
      visible: true
    },
    {
      id: "gallery",
      title: "Галерея",
      subtitle: "Художники сказок",
      path: "/gallery",
      emoji: "🖼️",
      tint: "violet",
      visible: true
    },
    {
      id: "library",
      title: "Библиотека",
      subtitle: "Афиша и запись",
      path: "/library",
      emoji: "🏛️",
      tint: "gold",
      visible: true
    }
  ]
};

export const defaultStartScreen: StartScreenCatalog = {
  eyebrow: "Детская библиотека нового поколения",
  title: "Тридевятое царство",
  subtitle: "Русские народные сказки — слушаем, читаем, играем",
  prologue: [
    "В некотором царстве, в некотором государстве…",
    "Не в каком-либо ином, а в том, в котором мы живём.",
    "Жили-были — и добра наживали.",
    "Скоро сказка сказывается, да не скоро дело делается.",
    "Начинается сказка, починается присказка…",
    "За тридевять земель, в тридесятом царстве…",
    "Там и я был, мёд-пиво пил,",
    "По усам текло, а в рот не попало."
  ],
  cta: "Коснитесь экрана",
  hint: "Тридцать сказок на шести возрастных полках — от двух лет до семнадцати",
  badges: ["30 сказок", "6 возрастных полок", "аудио и чтение", "викторина и игры"]
};

export const defaultHome: HomeCatalog = {
  greeting: "Здравствуйте!",
  headline: "В некотором царстве, в некотором государстве…",
  lead:
    "Выберите, куда отправиться: слушать сказки, знакомиться с героями, играть или проверить себя в викторине. " +
    "Каждая сказка стоит на своей возрастной полке — панель сама подскажет, что подойдёт вашему ребёнку.",
  ticker: [
    "«Сказка — ложь, да в ней намёк: добрым молодцам урок»",
    "Александр Афанасьев собрал около 600 народных сказок и издал их в 1855 — 1863 годах",
    "«Репка», «Теремок» и «Колобок» — кумулятивные сказки: каждый новый герой повторяет всю цепочку сначала",
    "Сказительница Мария Кривополенова знала наизусть десятки былин и сказок и выступала в Москве в 1915 году",
    "Иван Билибин рисовал сказки в технике, которую сам называл «графическим кружевом»",
    "«Тридевятое царство» — это 27: девять, помноженное на три, самое сказочное число"
  ],
  tiles: [
    {
      id: "tales",
      title: "Сказочная библиотека",
      text: "Тридцать историй: аудио, пересказ по шагам, знаменитые присказки и чему учит сказка.",
      path: "/tales",
      emoji: "📖",
      image: "",
      tint: "gold",
      wide: true
    },
    {
      id: "ages",
      title: "Полки по возрасту",
      text: "Шесть ступеней: от «Репки» в два года до «Марьи Моревны» в пятнадцать.",
      path: "/ages",
      emoji: "📚",
      image: "",
      tint: "berry",
      wide: false
    },
    {
      id: "heroes",
      title: "Герои сказок",
      text: "Баба-яга, Кощей, Серый Волк, Василиса Премудрая и лиса Патрикеевна.",
      path: "/heroes",
      emoji: "👑",
      image: "",
      tint: "violet",
      wide: false
    },
    {
      id: "games",
      title: "Игры",
      text: "Пары, «Чей предмет?», «Доскажи словечко», пазл, «Порядок сказки» и «Кто лишний».",
      path: "/games",
      emoji: "🎲",
      image: "",
      tint: "sky",
      wide: true
    },
    {
      id: "quiz",
      title: "Викторина",
      text: "Шесть уровней сложности — по одному на каждую возрастную полку.",
      path: "/quiz",
      emoji: "🎯",
      image: "",
      tint: "rose",
      wide: false
    },
    {
      id: "traditions",
      title: "Как рождалась сказка",
      text: "Зачин, присказка и концовка; сказители, собиратели и три типа сказок.",
      path: "/traditions",
      emoji: "🕯️",
      image: "",
      tint: "ember",
      wide: false
    },
    {
      id: "dictionary",
      title: "Словарик",
      text: "Что такое ухват, сусек, кудель, полати и калинов мост.",
      path: "/dictionary",
      emoji: "🔎",
      image: "",
      tint: "gzhel",
      wide: false
    },
    {
      id: "gallery",
      title: "Галерея",
      text: "Билибин, Васнецов, Рачёв, палехская лаковая миниатюра.",
      path: "/gallery",
      emoji: "🖼️",
      image: "",
      tint: "violet",
      wide: false
    },
    {
      id: "library",
      title: "Наша библиотека",
      text: "Афиша встреч, кружки и как записаться в читатели.",
      path: "/library",
      emoji: "🏛️",
      image: "",
      tint: "gold",
      wide: true
    }
  ]
};
