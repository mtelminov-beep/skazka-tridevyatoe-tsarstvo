import type { CalendarCatalog } from "../types";

/** Универсальный шаблон: библиотека заполняет местные даты через CMS. */
export const defaultCalendar: CalendarCatalog = {
  eyebrow: "Для библиотек и культурных центров",
  title: "Календарь событий и памятных дат",
  lead: "Шаблон календаря для выставок, встреч и занятий. Замените примеры датами своего города и учреждения в админке.",
  year: "2027",
  intro: [
    { id: "reading-year", day: "Весь год", anniversary: "Идея", title: "Год чтения", description: "Соберите программу встреч, выставок и семейных мероприятий вокруг книг и чтения.", media: "" },
    { id: "local-history", day: "Весь год", anniversary: "Идея", title: "Краеведческий проект", description: "Добавьте важные для вашего города юбилеи, имена и места.", media: "" }
  ],
  months: [
    { id: "january", name: "Январь", events: [{ id: "winter-reading", day: "Весь месяц", anniversary: "Пример", title: "Зимние чтения", description: "Подборка сказок и семейных чтений на зимних каникулах.", media: "" }] },
    { id: "february", name: "Февраль", events: [{ id: "book-gift", day: "14", anniversary: "Пример", title: "Дарите книги с любовью", description: "Акция обмена книгами и чтение вслух для всей семьи.", media: "" }] },
    { id: "march", name: "Март", events: [{ id: "poetry-day", day: "21", anniversary: "Пример", title: "Всемирный день поэзии", description: "Открытый микрофон, поэтическая выставка или встреча с местными авторами.", media: "" }] },
    { id: "april", name: "Апрель", events: [{ id: "book-day", day: "23", anniversary: "Пример", title: "Всемирный день книги", description: "Праздник читателей, библиотек и новых книжных открытий.", media: "" }] },
    { id: "may", name: "Май", events: [{ id: "family-reading", day: "15", anniversary: "Пример", title: "Семейное чтение", description: "Книжная встреча для детей, родителей и старшего поколения.", media: "" }] },
    { id: "june", name: "Июнь", events: [{ id: "children-day", day: "1", anniversary: "Пример", title: "Лето с книгой", description: "Откройте летнюю программу чтения, игр и творческих занятий.", media: "" }] },
    { id: "july", name: "Июль", events: [{ id: "summer-workshop", day: "Весь месяц", anniversary: "Пример", title: "Летняя мастерская", description: "Добавьте расписание творческих занятий и книжных клубов.", media: "" }] },
    { id: "august", name: "Август", events: [{ id: "school-start", day: "Весь месяц", anniversary: "Пример", title: "Готовимся к школе", description: "Выставка познавательных книг и встреча для будущих первоклассников.", media: "" }] },
    { id: "september", name: "Сентябрь", events: [{ id: "library-day", day: "30", anniversary: "Пример", title: "День библиотек", description: "Расскажите об истории вашей библиотеки, её читателях и новых проектах.", media: "" }] },
    { id: "october", name: "Октябрь", events: [{ id: "elder-day", day: "1", anniversary: "Пример", title: "Диалог поколений", description: "Встреча семей, чтение воспоминаний и разговор об истории семьи.", media: "" }] },
    { id: "november", name: "Ноябрь", events: [{ id: "mother-day", day: "Последнее воскресенье", anniversary: "Пример", title: "Читаем вместе", description: "Тёплая семейная программа с книгами, играми и творчеством.", media: "" }] },
    { id: "december", name: "Декабрь", events: [{ id: "new-year-books", day: "Весь месяц", anniversary: "Пример", title: "Новогодняя книжная полка", description: "Подберите зимние истории, сказки и мастер-классы для читателей.", media: "" }] }
  ]
};
