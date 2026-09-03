# История версий

Проект «Тридевятое царство». Записи ведутся автоматически: `node scripts/version.mjs bump`. Руками не править.

<!-- новые версии добавляются сюда -->

## v1.3.0 — 03.09.2026 13:27:24

**Агент:** claude  ·  **Машина:** DESKTOP-D0H2DER  ·  **Тип:** minor  ·  **UTC:** 2026-09-03T08:27:24.497Z

Панель подстраивается под любой экран: класс устройства и ориентация определяются сами, добавлено горизонтальное представление с боковой навигацией и переключатель режима киоска в шапке

Изменённые файлы:
- `CLAUDE.md`
- `README.md`
- `frontend/src/components/Layout.tsx`
- `frontend/src/main.tsx`
- `frontend/src/styles/components.css`
- `frontend/src/styles/theme.css`
- `frontend/src/stores/viewport.ts`
- `frontend/src/styles/adaptive.css`


## v1.2.1 — 03.09.2026 13:05:32

**Агент:** codex  ·  **Машина:** DESKTOP-D0H2DER  ·  **Тип:** patch  ·  **UTC:** 2026-09-03T08:05:32.894Z

Усилена проверка правок из ChatGPT-настройки перед каждой задачей

Изменённые файлы:
- `.claude/skills/version-log/SKILL.md`
- `.codex/skills/version-log/SKILL.md`
- `.cursor/rules/parallel-work.mdc`
- `.cursor/rules/versioning.mdc`
- `.cursor/skills/version-log/SKILL.md`
- `AGENTS.md`
- `CLAUDE.md`


## v1.2.0 — 03.09.2026 12:54:59

**Агент:** claude  ·  **Машина:** DESKTOP-D0H2DER  ·  **Тип:** minor  ·  **UTC:** 2026-09-03T07:54:59.982Z

Правило журнала версий прошито хуками: sync в начале сессии, проверка отправки после каждого ответа; журнал сливается union-стратегией

Изменённые файлы:
- `.claude/skills/version-log/SKILL.md`
- `.codex/skills/version-log/SKILL.md`
- `.cursor/rules/versioning.mdc`
- `.gitattributes`
- `AGENTS.md`
- `CLAUDE.md`
- `scripts/version.mjs`
- `.claude/settings.json`


## v1.1.1 — 03.09.2026 10:53:04

**Агент:** claude  ·  **Машина:** DESKTOP-D0H2DER  ·  **Тип:** patch  ·  **UTC:** 2026-09-03T05:53:04.308Z

Файл блокировки журнала версий занесён в .gitignore — после bump рабочее дерево остаётся чистым

Изменённые файлы:
- `.gitignore`


## v1.1.0 — 03.09.2026 10:52:22

**Агент:** claude  ·  **Машина:** DESKTOP-D0H2DER  ·  **Тип:** minor  ·  **UTC:** 2026-09-03T05:52:22.662Z

Панель поднята и проверена в браузере: сборка, замена неотображаемых эмодзи, исправлены переносы заголовка заставки и шапка при адресе со слэшем

Изменённые файлы:
- `README.md`
- `frontend/src/components/Layout.tsx`
- `frontend/src/components/games/SortingGame.tsx`
- `frontend/src/data/dictionary.ts`
- `frontend/src/data/games.ts`
- `frontend/src/data/heroes.ts`
- `frontend/src/data/quiz.ts`
- `frontend/src/data/shell.ts`
- `frontend/src/data/tales/age4.ts`
- `frontend/src/data/tales/age5.ts`
- `frontend/src/data/traditions.ts`
- `frontend/src/styles/folk.css`
- `backend/package-lock.json`
- `frontend/package-lock.json`

