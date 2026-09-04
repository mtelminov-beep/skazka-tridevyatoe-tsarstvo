import { useMemo, useState } from "react";
import { ContentImage } from "../components/ContentImage";
import { PageHead } from "../components/PageHead";
import { useCatalog } from "../stores/catalogStore";

const ALPHABET = "АБВГДЕЁЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ".split("");

/**
 * Словарик старинных слов: указатель по алфавиту и поиск.
 *
 * Поиск идёт и по слову, и по толкованию: ребёнок чаще помнит не само
 * слово, а то, что им называли, — «такая палка, которой горшки достают».
 */
export function DictionaryPage() {
  const dictionary = useCatalog("skazka-dictionary-v1");
  const [letter, setLetter] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...dictionary.items].sort((a, b) => a.word.localeCompare(b.word, "ru")),
    [dictionary.items]
  );

  // Буквы, на которые в словаре ничего нет, гасим — иначе ребёнок жмёт в пустоту.
  const available = useMemo(() => new Set(sorted.map((item) => item.word[0].toUpperCase())), [sorted]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sorted.filter((item) => {
      if (letter && item.word[0].toUpperCase() !== letter) return false;
      if (!needle) return true;
      return (
        item.word.toLowerCase().includes(needle) ||
        item.meaning.toLowerCase().includes(needle) ||
        item.tale.toLowerCase().includes(needle)
      );
    });
  }, [sorted, letter, query]);

  return (
    <>
      <PageHead eyebrow="Что это значит" title={dictionary.title} lead={dictionary.lead} />

      <label className="search-field">
        <span aria-hidden="true">🔎</span>
        <input
          type="search"
          value={query}
          placeholder="Слово, толкование или сказка"
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Поиск по словарю"
        />
        {query ? (
          <button type="button" className="search-field__clear" onClick={() => setQuery("")} aria-label="Очистить">
            ✕
          </button>
        ) : null}
      </label>

      <div className="alphabet">
        <button type="button" className={letter === null ? "is-active" : ""} onClick={() => setLetter(null)}>
          Все
        </button>
        {ALPHABET.map((char) => (
          <button
            key={char}
            type="button"
            disabled={!available.has(char)}
            className={letter === char ? "is-active" : ""}
            onClick={() => setLetter(char === letter ? null : char)}
          >
            {char}
          </button>
        ))}
      </div>

      <p className="result-note">
        {shown.length === 0
          ? "Ничего не нашлось — попробуйте другую букву или другое слово."
          : `Слов в списке: ${shown.length}`}
      </p>

      <div className="stack stagger" style={{ gap: "0.8rem" }}>
        {shown.map((item) => (
          <div className="dict-card" key={item.id}>
            <ContentImage
              className="dict-card__image"
              src={item.image ?? ""}
              alt={`Фотография к слову «${item.word}»`}
              fallback={item.emoji}
            />
            <div className="dict-card__body">
              <div className="dict-card__word">{item.word}</div>
              <div className="dict-card__meaning">{item.meaning}</div>
              <div className="dict-card__example">{item.example}</div>
              <div className="dict-card__tale">{item.tale}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
