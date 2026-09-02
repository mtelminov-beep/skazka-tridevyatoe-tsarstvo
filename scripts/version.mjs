#!/usr/bin/env node
/**
 * Журнал версий проекта «Тридевятое царство».
 *
 * Единая точка входа для ВСЕХ агентов (Claude Code, Codex, Cursor) и людей.
 * Задача — чтобы параллельно работающие агенты видели общую историю,
 * не затирали правки друг друга и не спорили о номерах версий.
 *
 *   node scripts/version.mjs current                       — текущая версия, дата и время
 *   node scripts/version.mjs log [--limit 20] [--agent X]  — история версий
 *   node scripts/version.mjs sync                          — подтянуть чужие версии с GitHub
 *   node scripts/version.mjs bump --agent <имя> -m "что сделано" [--type patch|minor|major]
 *   node scripts/version.mjs status                        — всё ли уехало на GitHub
 *
 * Хранилище:
 *   VERSION                  — текущий номер (одна строка, для машин)
 *   .versions/current.json   — номер + дата/время + агент + сводка
 *   .versions/log.jsonl      — append-only журнал, по одной записи в строке
 *   CHANGELOG.md             — человекочитаемая история
 *
 * Формат append-only и merge=union в .gitattributes выбраны специально:
 * две параллельные записи сливаются автоматически, без конфликта слияния.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, rmSync } from "node:fs";
import { hostname } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_FILE = join(ROOT, "VERSION");
const VERSIONS_DIR = join(ROOT, ".versions");
const CURRENT_FILE = join(VERSIONS_DIR, "current.json");
const LOG_FILE = join(VERSIONS_DIR, "log.jsonl");
const LOCK_FILE = join(VERSIONS_DIR, ".lock");
const CHANGELOG = join(ROOT, "CHANGELOG.md");

const TYPES = new Set(["patch", "minor", "major"]);
const LOCK_TTL_MS = 120_000;

/** package.json, в которых номер держим синхронным с журналом. */
const PACKAGE_FILES = [
  join(ROOT, "package.json"),
  join(ROOT, "backend", "package.json"),
  join(ROOT, "frontend", "package.json")
];

/* ------------------------------ утилиты ------------------------------ */

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (allowFail) return null;
    throw new Error(`git ${args.join(" ")}\n${error.stderr || error.message}`);
  }
}

function hasRemote() {
  return Boolean(git(["remote"], { allowFail: true }));
}

/**
 * Имя машины в записи версии обязательно: один и тот же агент (например, claude)
 * работает с нескольких компьютеров, и без host непонятно, чья копия отстала
 * и где искать незапушенный коммит. Переопределяется переменной AGENT_HOST.
 */
function machineName() {
  return (process.env.AGENT_HOST || hostname() || "unknown").trim();
}

function currentBranch() {
  return git(["rev-parse", "--abbrev-ref", "HEAD"], { allowFail: true }) || "main";
}

/** Сколько коммитов у нас есть сверх удалённой ветки и сколько мы недобрали. */
function aheadBehind() {
  const upstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { allowFail: true });
  if (!upstream) return null;
  const counts = git(["rev-list", "--left-right", "--count", `@{u}...HEAD`], { allowFail: true });
  if (!counts) return null;
  const [behind, ahead] = counts.split(/\s+/).map(Number);
  return { upstream, ahead, behind };
}

/**
 * Локальное время в читаемом виде — для CHANGELOG и вывода в консоль.
 * Секунды нужны: два агента вполне могут записать версии в одну минуту,
 * и без них порядок в журнале становится неразличимым.
 */
function humanTime(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function readLog() {
  if (!existsSync(LOG_FILE)) return [];
  return readFileSync(LOG_FILE, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null; // битая строка не должна ронять всю историю
      }
    })
    .filter(Boolean);
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(value).trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function formatVersion(v) {
  return `${v.major}.${v.minor}.${v.patch}`;
}

function compareVersions(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

/**
 * Базовая версия берётся как максимум из VERSION, журнала и git-тегов.
 * Так номер не откатится назад, даже если другой агент уже успел записать свою.
 */
function highestKnownVersion() {
  const candidates = [];

  if (existsSync(VERSION_FILE)) {
    const parsed = parseVersion(readFileSync(VERSION_FILE, "utf8"));
    if (parsed) candidates.push(parsed);
  }

  for (const entry of readLog()) {
    const parsed = parseVersion(entry.version);
    if (parsed) candidates.push(parsed);
  }

  const tags = git(["tag", "--list", "v*"], { allowFail: true });
  if (tags) {
    for (const tag of tags.split("\n")) {
      const parsed = parseVersion(tag.replace(/^v/, ""));
      if (parsed) candidates.push(parsed);
    }
  }

  if (candidates.length === 0) return { major: 0, minor: 0, patch: 0 };
  return candidates.sort(compareVersions)[candidates.length - 1];
}

function nextVersion(base, type) {
  if (type === "major") return { major: base.major + 1, minor: 0, patch: 0 };
  if (type === "minor") return { major: base.major, minor: base.minor + 1, patch: 0 };
  return { major: base.major, minor: base.minor, patch: base.patch + 1 };
}

/** Простая файловая блокировка: два агента на одной машине не пишут одновременно. */
function withLock(callback) {
  mkdirSync(VERSIONS_DIR, { recursive: true });

  if (existsSync(LOCK_FILE)) {
    const raw = readFileSync(LOCK_FILE, "utf8");
    const age = Date.now() - Number(raw.split("|")[1] || 0);
    if (age < LOCK_TTL_MS) {
      throw new Error(`Журнал занят другим агентом (${raw.split("|")[0]}). Подождите или удалите .versions/.lock`);
    }
    rmSync(LOCK_FILE, { force: true }); // залежавшийся lock от упавшего процесса
  }

  writeFileSync(LOCK_FILE, `${process.env.AGENT_NAME || "unknown"}|${Date.now()}`, "utf8");
  try {
    return callback();
  } finally {
    rmSync(LOCK_FILE, { force: true });
  }
}

/**
 * Номер в package.json держим равным номеру журнала.
 * Иначе появляется второй источник правды, и рано или поздно они разъезжаются.
 * Правим только поле version — форматирование и порядок ключей не трогаем.
 */
function syncPackageVersions(version) {
  for (const file of PACKAGE_FILES) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, "utf8");
    const patched = raw.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);
    if (patched !== raw) writeFileSync(file, patched, "utf8");
  }
}

function parseArgs(argv) {
  const options = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "-m") {
      options.message = argv[++i];
    } else if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--") || next === "-m") options[key] = true;
      else options[key] = argv[++i];
    } else {
      options._.push(token);
    }
  }
  return options;
}

/* ------------------------------ команды ------------------------------ */

function commandCurrent() {
  if (!existsSync(CURRENT_FILE)) {
    console.log('Версий пока нет. Создайте первую: node scripts/version.mjs bump --agent <имя> -m "описание"');
    return;
  }
  const current = JSON.parse(readFileSync(CURRENT_FILE, "utf8"));
  const commit = git(["rev-list", "-n", "1", "--abbrev-commit", `v${current.version}`], { allowFail: true });

  console.log(`Версия:      v${current.version}`);
  console.log(`Дата и время: ${humanTime(current.updatedAt)}  (UTC ${current.updatedAt})`);
  console.log(`Агент:       ${current.agent}${current.host ? `  (машина ${current.host})` : ""}`);
  console.log(`Что сделано: ${current.summary}`);
  if (commit || current.commit) console.log(`Коммит:      ${commit || current.commit}`);

  // Предупреждаем, если чужие версии уже на сервере, а локально их ещё нет.
  const state = aheadBehind();
  if (state && state.behind > 0) {
    console.log(`\nВнимание: на GitHub есть ${state.behind} новых коммит(ов). Выполните: node scripts/version.mjs sync`);
  }
}

/**
 * Проверка, что работа этой машины видна остальным.
 * Ненулевой код выхода — сигнал агенту: сессию закрывать нельзя, пока не отправлено.
 */
function commandStatus() {
  const dirty = git(["-c", "core.quotepath=false", "status", "--porcelain"], { allowFail: true }) || "";
  const state = hasRemote() ? aheadBehind() : null;
  const localTags = (git(["tag", "--list", "v*"], { allowFail: true }) || "").split("\n").filter(Boolean);
  const remoteTags = hasRemote()
    ? (git(["ls-remote", "--tags", "origin"], { allowFail: true }) || "")
    : "";
  const unpushedTags = remoteTags ? localTags.filter((tag) => !remoteTags.includes(`refs/tags/${tag}`)) : [];

  console.log(`Машина:  ${machineName()}`);
  console.log(`Ветка:   ${currentBranch()}${state ? ` → ${state.upstream}` : " (без upstream)"}`);

  let clean = true;

  if (dirty) {
    clean = false;
    console.log(`\nНезакоммиченные правки (${dirty.split("\n").length}):`);
    console.log(dirty.split("\n").slice(0, 20).map((line) => `  ${line}`).join("\n"));
    console.log('Заверсионируйте их: node scripts/version.mjs bump --agent <имя> -m "что сделано"');
  }

  if (state && state.ahead > 0) {
    clean = false;
    console.log(`\nНе отправлено на GitHub: ${state.ahead} коммит(ов). Выполните: git push`);
  }

  if (unpushedTags.length > 0) {
    clean = false;
    console.log(`\nНе отправлены теги: ${unpushedTags.join(", ")}. Выполните: git push --tags`);
  }

  if (state && state.behind > 0) {
    clean = false;
    console.log(`\nНе забрано с GitHub: ${state.behind} коммит(ов). Выполните: node scripts/version.mjs sync`);
  }

  if (!hasRemote()) {
    clean = false;
    console.log("\nУдалённый репозиторий не подключён — работа не видна другим агентам.");
  }

  if (clean) {
    console.log("\nВсё синхронизировано: локальная копия и GitHub совпадают.");
    return;
  }
  process.exitCode = 1;
}

function commandLog(options) {
  const limit = Number(options.limit || 20);
  let entries = readLog();
  if (options.agent) entries = entries.filter((e) => e.agent === options.agent);

  if (entries.length === 0) {
    console.log("Журнал пуст.");
    return;
  }

  console.log(`История версий (последние ${Math.min(limit, entries.length)} из ${entries.length}):\n`);
  for (const entry of entries.slice(-limit).reverse()) {
    console.log(`  v${entry.version}  ${humanTime(entry.updatedAt)}  [${entry.agent}${entry.host ? `@${entry.host}` : ""}]`);
    console.log(`      ${entry.summary}`);
    if (entry.files?.length) {
      console.log(`      файлы: ${entry.files.slice(0, 6).join(", ")}${entry.files.length > 6 ? " …" : ""}`);
    }
    console.log("");
  }
}

function commandSync() {
  if (!hasRemote()) {
    console.log("Удалённый репозиторий не подключён — синхронизировать нечего.");
    return;
  }
  console.log("Забираю изменения других агентов…");
  const before = readLog().length;
  git(["fetch", "--all", "--tags", "--quiet"], { allowFail: true });
  const pull = git(["pull", "--rebase", "--autostash"], { allowFail: true });
  if (pull === null) {
    console.error("Не удалось выполнить pull --rebase. Разрешите конфликт вручную и повторите.");
    process.exitCode = 1;
    return;
  }
  const after = readLog();
  const added = after.length - before;
  console.log(added > 0 ? `Получено новых версий: ${added}` : "Новых версий нет.");
  for (const entry of added > 0 ? after.slice(-added) : []) {
    console.log(`  v${entry.version}  ${humanTime(entry.updatedAt)}  [${entry.agent}${entry.host ? `@${entry.host}` : ""}]  ${entry.summary}`);
  }

  // После sync полезно сразу знать, не осталось ли своего неотправленного.
  const state = aheadBehind();
  if (state && state.ahead > 0) {
    console.log(`\nВнимание: ${state.ahead} ваш(их) коммит(ов) ещё не на GitHub. Выполните: git push`);
  }
}

function commandBump(options) {
  const agent = options.agent || process.env.AGENT_NAME;
  const summary = options.message;
  const type = options.type || "patch";

  if (!agent) throw new Error("Укажите автора: --agent claude|codex|cursor|<имя>");
  if (!summary) throw new Error('Укажите описание: -m "что изменилось"');
  if (!TYPES.has(type)) throw new Error(`--type должен быть одним из: ${[...TYPES].join(", ")}`);

  return withLock(() => {
    // Сначала подтягиваем чужие версии, иначе номер может продублироваться.
    if (hasRemote() && !options["no-pull"]) {
      const pulled = git(["pull", "--rebase", "--autostash"], { allowFail: true });
      if (pulled === null) {
        throw new Error("Не удалось подтянуть изменения с GitHub. Разрешите конфликт и повторите bump.");
      }
    }

    const version = formatVersion(nextVersion(highestKnownVersion(), type));
    const updatedAt = new Date().toISOString();

    // Файлы, попавшие в эту версию. Берём пути готовыми, двумя командами:
    // изменённые отслеживаемые и новые неотслеживаемые. Разбирать префиксы
    // `git status --porcelain` не стоит — ширина колонки статуса плавает
    // (переименования, кавычки при core.quotepath), и имя файла обрезается.
    const changed = git(["-c", "core.quotepath=false", "diff", "--name-only", "HEAD"], { allowFail: true }) || "";
    const untracked = git(["-c", "core.quotepath=false", "ls-files", "--others", "--exclude-standard"], { allowFail: true }) || "";

    const files = [...new Set([...changed.split("\n"), ...untracked.split("\n")])]
      .map((file) => file.trim())
      .filter(Boolean)
      .filter((file) => !file.startsWith(".versions/") && file !== "VERSION" && file !== "CHANGELOG.md");

    const record = { version, updatedAt, agent, host: machineName(), branch: currentBranch(), summary, type, files };

    mkdirSync(VERSIONS_DIR, { recursive: true });
    writeFileSync(VERSION_FILE, `${version}\n`, "utf8");
    writeFileSync(CURRENT_FILE, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    appendFileSync(LOG_FILE, `${JSON.stringify(record)}\n`, "utf8");
    syncPackageVersions(version);

    // CHANGELOG: новые записи сверху, под заголовком-маркером.
    const marker = "<!-- новые версии добавляются сюда -->";
    const header =
      `# История версий\n\nПроект «Тридевятое царство». Записи ведутся автоматически: ` +
      `\`node scripts/version.mjs bump\`. Руками не править.\n\n${marker}\n`;
    const existing = existsSync(CHANGELOG) ? readFileSync(CHANGELOG, "utf8") : header;
    const block =
      `\n## v${version} — ${humanTime(updatedAt)}\n\n` +
      `**Агент:** ${agent}  ·  **Машина:** ${record.host}  ·  **Тип:** ${type}  ·  **UTC:** ${updatedAt}\n\n` +
      `${summary}\n` +
      (files.length ? `\nИзменённые файлы:\n${files.map((f) => `- \`${f}\``).join("\n")}\n` : "");

    writeFileSync(
      CHANGELOG,
      existing.includes(marker) ? existing.replace(marker, `${marker}\n${block}`) : `${header}\n${block}\n${existing}`,
      "utf8"
    );

    console.log(`Версия v${version} записана (${humanTime(updatedAt)}, агент: ${agent}, машина: ${record.host}).`);

    // Коммит + тег + пуш — локальная и удалённая копии обновляются вместе.
    if (options["no-commit"]) {
      console.log("Коммит пропущен (--no-commit).");
      return;
    }

    git(["add", "-A"]);
    const staged = git(["diff", "--cached", "--name-only"], { allowFail: true });
    if (!staged) {
      console.log("Нечего коммитить.");
      return;
    }

    git(["commit", "-m", `v${version}: ${summary}`, "-m", `Агент: ${agent}\nМашина: ${record.host}\nВремя: ${updatedAt}`]);
    git(["tag", "-a", `v${version}`, "-m", `${summary} (${agent}, ${updatedAt})`], { allowFail: true });

    // Хеш коммита намеренно не пишем в current.json: файл входит в сам коммит,
    // и дозапись после него оставляла бы рабочее дерево грязным после каждого bump.
    // Команда `current` достаёт хеш из тега, это точнее и ничего не пачкает.
    const commit = git(["rev-parse", "--short", "HEAD"], { allowFail: true });
    console.log(`Коммит ${commit} и тег v${version} созданы.`);

    if (options["no-push"] || !hasRemote()) {
      console.log("ВНИМАНИЕ: версия осталась только на этой машине. Отправьте вручную:");
      console.log("  git push && git push --tags");
      return;
    }

    const branch = record.branch;
    let pushed = git(["push", "-u", "origin", branch], { allowFail: true });

    // Агент на другом компьютере мог запушить свою версию, пока мы коммитили.
    // Один автоматический повтор через rebase закрывает эту гонку без участия человека.
    if (pushed === null) {
      console.log("Пуш отклонён — на GitHub появились чужие коммиты. Пробую забрать их и повторить…");
      const rebased = git(["pull", "--rebase", "--autostash"], { allowFail: true });
      if (rebased !== null) pushed = git(["push", "-u", "origin", branch], { allowFail: true });
    }

    if (pushed === null) {
      console.error("НЕ ОТПРАВЛЕНО на GitHub. Версия записана только локально.");
      console.error("Разрешите конфликт и выполните: git pull --rebase && git push && git push --tags");
      process.exitCode = 1;
      return;
    }

    git(["push", "origin", `v${version}`], { allowFail: true });
    console.log(`Отправлено на GitHub (ветка ${branch}, тег v${version}).`);
  });
}

/* ------------------------------- запуск ------------------------------- */

const options = parseArgs(process.argv.slice(2));
const command = options._[0] || "current";

try {
  if (command === "current") commandCurrent();
  else if (command === "log") commandLog(options);
  else if (command === "sync") commandSync();
  else if (command === "bump") commandBump(options);
  else if (command === "status") commandStatus();
  else {
    console.error(`Неизвестная команда: ${command}`);
    console.error("Доступно: current, log, sync, bump, status");
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`Ошибка: ${error.message}`);
  process.exitCode = 1;
}
