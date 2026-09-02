import type { Tale, TalesCatalog } from "../../types";
import { talesAge0 } from "./age0";
import { talesAge1 } from "./age1";
import { talesAge2 } from "./age2";
import { talesAge3 } from "./age3";
import { talesAge4 } from "./age4";
import { talesAge5 } from "./age5";

/**
 * Сказочная библиотека панели: тридцать сказок на шести возрастных полках.
 *
 * Сказки разложены по файлам-полкам, а не сложены в один список: полка —
 * это самостоятельная редакторская единица, её готовят и правят целиком,
 * и держать тридцать больших объектов в одном файле неудобно ни человеку,
 * ни редактору кода. Порядок здесь — порядок полок, и он же порядок
 * карточек на экране, пока читатель не включил фильтр.
 */
export const allTales: Tale[] = [
  ...talesAge0,
  ...talesAge1,
  ...talesAge2,
  ...talesAge3,
  ...talesAge4,
  ...talesAge5
];

export const defaultTales: TalesCatalog = {
  title: "Сказочная библиотека",
  lead:
    "Тридцать русских народных сказок — от «Курочки Рябы» до «Марьи Моревны». " +
    "Выберите возрастную полку, послушайте запись или прочитайте пересказ вслух: " +
    "у каждой сказки собраны присказки, сюжет по шагам и вопросы для разговора после чтения.",
  items: allTales
};

export { talesAge0, talesAge1, talesAge2, talesAge3, talesAge4, talesAge5 };
