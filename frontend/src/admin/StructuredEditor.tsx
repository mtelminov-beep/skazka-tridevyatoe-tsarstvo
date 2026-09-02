import { useRef, useState } from "react";
import { uploadMedia } from "../stores/cmsClient";

/**
 * Универсальный редактор JSON-структур.
 *
 * Форма строится по фактической форме данных, а не по отдельной схеме:
 * строка → поле ввода (длинная — textarea), число → number, булево → чекбокс,
 * массив → повторяемая группа с добавлением/удалением/перестановкой,
 * объект → вложенный блок полей.
 *
 * Благодаря этому новый раздел контента не требует писать новый редактор:
 * достаточно добавить ключ каталога и данные по умолчанию.
 */

type Json = unknown;

const LONG_TEXT_HINT = /text|lead|summary|about|rules|caption|explain|moral|note|meaning|example|hint|subtitle/i;
const MEDIA_KEY_HINT = /image|photo|poster|cover|portrait|thumbnail|video|audio|media|file|src/i;
const MEDIA_PATH_HINT = /^\/(?:covers|images|media\/uploads)\//i;
const MEDIA_EXT_HINT = /\.(?:avif|gif|jpe?g|png|svg|webp|mp4|webm|mp3|ogg|m4a)(?:[?#].*)?$/i;
const MEDIA_UPLOAD_ACCEPT = "image/*,video/mp4,video/webm,audio/mpeg,audio/ogg";

/** Человекочитаемые подписи для полей контента «Тридевятого царства». */
const LABELS: Record<string, string> = {
  id: "Идентификатор",
  title: "Заголовок",
  shortTitle: "Короткое название",
  subtitle: "Подзаголовок",
  label: "Подпись",
  name: "Имя / название",
  lead: "Вводный текст",
  text: "Текст",
  summary: "Краткое описание",
  description: "Описание",
  emoji: "Эмодзи",
  icon: "Иконка",
  path: "Ссылка (маршрут)",
  visible: "Показывать в навигации",
  tint: "Цвет карточки",
  wide: "Широкая плитка",
  year: "Год",
  years: "Годы",
  ages: "Возраст",
  minutes: "Время чтения, мин",
  epigraph: "Эпиграф",
  plot: "Сюжет по шагам",
  famousLines: "Знаменитые строки",
  moral: "Чему учит",
  facts: "Интересные факты",
  heroes: "Герои (идентификаторы)",
  words: "Слова словарика (идентификаторы)",
  audio: "Аудиофайл",
  video: "Видеофайл",
  image: "Изображение",
  portrait: "Портрет",
  note: "Пояснение",
  quote: "Цитата",
  role: "Кто это",
  tale: "Сказка",
  lines: "Строки",
  source: "Источник",
  word: "Слово",
  meaning: "Толкование",
  example: "Пример из сказки",
  question: "Вопрос",
  options: "Варианты ответа",
  correct: "Номер правильного (с нуля)",
  explain: "Пояснение к ответу",
  level: "Уровень (возраст)",
  levels: "Уровни викторины",
  questions: "Вопросы",
  questionsPerRound: "Вопросов в раунде",
  praise: "Похвала за верный ответ",
  rules: "Правила игры",
  cards: "Карточки",
  bins: "Корзины (сказки)",
  items: "Элементы",
  bin: "Правильная корзина",
  hint: "Подсказка",
  tasks: "Задания",
  before: "Текст до пропуска",
  answer: "Пропущенное слово",
  after: "Текст после пропуска",
  size: "Размер поля пазла",
  pictures: "Картинки пазла",
  caption: "Подпись",
  kind: "Тип (image / video)",
  url: "Ссылка",
  author: "Автор",
  sources: "Источники",
  events: "События",
  services: "Услуги",
  when: "Когда",
  place: "Место",
  about: "О библиотеке",
  project: "Национальный проект",
  contacts: "Контакты",
  address: "Адрес",
  phone: "Телефон",
  hours: "Часы работы",
  site: "Сайт",
  greeting: "Приветствие",
  headline: "Заголовок главной",
  tiles: "Плитки разделов",
  ticker: "Бегущая строка",
  eyebrow: "Надзаголовок",
  prologue: "Строки пролога",
  cta: "Надпись на кнопке",
  badges: "Значки на заставке",
  idleTimeoutMinutes: "Возврат на заставку, минут",
  footer: "Подпись внизу панели",
  nanny: "Блок о няне",
  forKids: "Простыми словами (3 — 7 лет)",
  memory: "Игра «Найди пару»",
  sorting: "Игра «Чей предмет?»",
  puzzle: "Игра «Собери картинку»"
};

const TINTS = [
  { value: "gold", label: "Золото" },
  { value: "sea", label: "Море" },
  { value: "forest", label: "Дуб зелёный" },
  { value: "rose", label: "Заря" },
  { value: "violet", label: "Сумерки" },
  { value: "sky", label: "Небо" },
  { value: "ember", label: "Уголь" }
];

const AGES = [
  { value: "3-6", label: "3 — 6 лет" },
  { value: "7-10", label: "7 — 10 лет" },
  { value: "11-14", label: "11 — 14 лет" },
  { value: "15-17", label: "15 — 17 лет" }
];

const KINDS = [
  { value: "image", label: "Изображение" },
  { value: "video", label: "Видео" }
];

function labelFor(key: string): string {
  return LABELS[key] ?? key;
}

/** Новый элемент массива лепим по образцу первого — так структура не разъезжается. */
function blankLike(sample: Json): Json {
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return sample.length > 0 ? [blankLike(sample[0])] : [];
  if (sample && typeof sample === "object") {
    const result: Record<string, Json> = {};
    for (const [key, value] of Object.entries(sample as Record<string, Json>)) {
      result[key] = key === "id" ? `new-${Math.random().toString(36).slice(2, 8)}` : blankLike(value);
    }
    return result;
  }
  return "";
}

function isLikelyMediaField(fieldKey: string, value: string): boolean {
  if (MEDIA_KEY_HINT.test(fieldKey)) return true;
  return MEDIA_PATH_HINT.test(value) || MEDIA_EXT_HINT.test(value);
}

function mediaKind(value: string): "image" | "video" | "audio" | null {
  if (/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(value)) return "image";
  if (/\.(?:mp4|webm)(?:[?#].*)?$/i.test(value)) return "video";
  if (/\.(?:mp3|ogg|m4a)(?:[?#].*)?$/i.test(value)) return "audio";
  return null;
}

function MediaStringEditor({
  path,
  fieldKey,
  value,
  onChange
}: {
  path: string;
  fieldKey: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kind = mediaKind(value);
  const accept = fieldKey === "audio" ? "audio/mpeg,audio/ogg,.mp3,.ogg,.m4a" : MEDIA_UPLOAD_ACCEPT;

  const send = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const item = await uploadMedia(file);
      onChange(item.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить файл");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`admin-media-field${over ? " admin-media-field--over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (event.dataTransfer.files.length > 0) void send(event.dataTransfer.files);
      }}
    >
      <div className="admin-media-field__input">
        <input id={path} className="admin-input" value={value} onChange={(event) => onChange(event.target.value)} />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(event) => {
            if (event.target.files) void send(event.target.files);
            event.target.value = "";
          }}
        />
        <button type="button" className="admin-btn" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Загрузка…" : "Выбрать файл"}
        </button>
        {value ? (
          <button type="button" className="admin-btn admin-btn--danger" onClick={() => onChange("")} title="Очистить">
            ✕
          </button>
        ) : null}
      </div>

      <div className="admin-media-field__hint">
        Перетащите файл прямо на это поле или нажмите «Выбрать файл». Можно и вписать путь вручную.
      </div>

      {error ? <div className="admin-alert admin-alert--error">{error}</div> : null}

      {kind ? (
        <div className="admin-media-field__preview">
          {kind === "image" ? <img src={value} alt={labelFor(fieldKey)} loading="lazy" /> : null}
          {kind === "video" ? <video src={value} controls preload="metadata" /> : null}
          {kind === "audio" ? <audio src={value} controls /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ValueEditor({
  path,
  fieldKey,
  value,
  onChange
}: {
  path: string;
  fieldKey: string;
  value: Json;
  onChange: (next: Json) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <label className="admin-check">
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        <span>{labelFor(fieldKey)}</span>
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="admin-field">
        <label htmlFor={path}>{labelFor(fieldKey)}</label>
        <input
          id={path}
          className="admin-input"
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    );
  }

  if (typeof value === "string") {
    const options =
      fieldKey === "tint"
        ? TINTS
        : fieldKey === "ages" || fieldKey === "level"
          ? AGES
          : fieldKey === "kind"
            ? KINDS
            : null;
    const media = !options && isLikelyMediaField(fieldKey, value);
    const long = !options && !media && (value.length > 90 || LONG_TEXT_HINT.test(fieldKey));

    return (
      <div className="admin-field">
        <label htmlFor={path}>{labelFor(fieldKey)}</label>
        {options ? (
          <select id={path} className="admin-input" value={value} onChange={(event) => onChange(event.target.value)}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : media ? (
          <MediaStringEditor path={path} fieldKey={fieldKey} value={value} onChange={onChange} />
        ) : long ? (
          <textarea
            id={path}
            className="admin-textarea"
            value={value}
            rows={Math.min(12, Math.max(3, Math.ceil(value.length / 90)))}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input id={path} className="admin-input" value={value} onChange={(event) => onChange(event.target.value)} />
        )}
      </div>
    );
  }

  if (Array.isArray(value)) {
    return <ArrayEditor path={path} fieldKey={fieldKey} items={value} onChange={onChange} />;
  }

  if (value && typeof value === "object") {
    return (
      <div className="admin-card">
        <h4>{labelFor(fieldKey)}</h4>
        <ObjectEditor path={path} value={value as Record<string, Json>} onChange={onChange} />
      </div>
    );
  }

  return null;
}

function ObjectEditor({
  path,
  value,
  onChange
}: {
  path: string;
  value: Record<string, Json>;
  onChange: (next: Json) => void;
}) {
  return (
    <div className="admin-editor">
      {Object.entries(value).map(([key, child]) => (
        <ValueEditor
          key={key}
          path={`${path}.${key}`}
          fieldKey={key}
          value={child}
          onChange={(next) => onChange({ ...value, [key]: next })}
        />
      ))}
    </div>
  );
}

function itemCaption(item: Json, index: number): string {
  if (typeof item === "string") return item.slice(0, 70) || `Пункт ${index + 1}`;
  if (item && typeof item === "object") {
    const record = item as Record<string, Json>;
    for (const key of ["title", "name", "word", "question", "label", "shortTitle", "before"]) {
      if (typeof record[key] === "string" && record[key]) return String(record[key]).slice(0, 70);
    }
  }
  return `Элемент ${index + 1}`;
}

function ArrayEditor({
  path,
  fieldKey,
  items,
  onChange
}: {
  path: string;
  fieldKey: string;
  items: Json[];
  onChange: (next: Json) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const simple = items.every((item) => typeof item === "string" || typeof item === "number");

  const replace = (index: number, next: Json) => onChange(items.map((item, i) => (i === index ? next : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const add = () => {
    const sample = items.length > 0 ? items[0] : "";
    setOpenIndex(items.length);
    onChange([...items, blankLike(sample)]);
  };

  return (
    <div className="admin-field">
      <label>
        {labelFor(fieldKey)} <span className="admin-count">· {items.length}</span>
      </label>

      {simple ? (
        <div className="admin-list">
          {items.map((item, index) => (
            <div className="admin-row admin-row--top" key={`${path}-${index}`}>
              <div className="admin-grow">
                {typeof item === "string" && isLikelyMediaField(fieldKey, item) ? (
                  <MediaStringEditor
                    path={`${path}[${index}]`}
                    fieldKey={fieldKey}
                    value={item}
                    onChange={(next) => replace(index, next)}
                  />
                ) : (
                  <input
                    className="admin-input"
                    value={String(item)}
                    onChange={(event) =>
                      replace(index, typeof item === "number" ? Number(event.target.value) : event.target.value)
                    }
                  />
                )}
              </div>
              <button type="button" className="admin-btn" onClick={() => move(index, -1)} title="Выше">
                ↑
              </button>
              <button type="button" className="admin-btn" onClick={() => move(index, 1)} title="Ниже">
                ↓
              </button>
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => remove(index)} title="Удалить">
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-list">
          {items.map((item, index) => {
            const open = openIndex === index;
            return (
              <div className="admin-repeat" key={`${path}-${index}`}>
                <div className="admin-row admin-row--split">
                  <button
                    type="button"
                    className="admin-btn admin-grow"
                    style={{ justifyContent: "space-between" }}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span style={{ textAlign: "left" }}>
                      {index + 1}. {itemCaption(item, index)}
                    </span>
                    <span>{open ? "▾" : "▸"}</span>
                  </button>
                  <button type="button" className="admin-btn" onClick={() => move(index, -1)} title="Выше">
                    ↑
                  </button>
                  <button type="button" className="admin-btn" onClick={() => move(index, 1)} title="Ниже">
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => {
                      remove(index);
                      setOpenIndex(null);
                    }}
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>

                {open ? (
                  <div style={{ marginTop: 8 }}>
                    {item && typeof item === "object" && !Array.isArray(item) ? (
                      <ObjectEditor
                        path={`${path}[${index}]`}
                        value={item as Record<string, Json>}
                        onChange={(next) => replace(index, next)}
                      />
                    ) : (
                      <ValueEditor
                        path={`${path}[${index}]`}
                        fieldKey={fieldKey}
                        value={item}
                        onChange={(next) => replace(index, next)}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <button type="button" className="admin-btn" onClick={add} style={{ alignSelf: "flex-start", marginTop: 4 }}>
        + Добавить
      </button>
    </div>
  );
}

export function StructuredEditor({ value, onChange }: { value: Json; onChange: (next: Json) => void }) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return <div className="admin-alert admin-alert--info">Этот раздел можно редактировать только в режиме JSON.</div>;
  }
  return <ObjectEditor path="root" value={value as Record<string, Json>} onChange={onChange} />;
}
