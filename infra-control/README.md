# Лид-магнит: Под контролем ли ваша ИТ-инфраструктура?

Превью: https://katerinazaber.github.io/itman/infra-control/

Стиль как у ROI-калькулятора.  
**На сайте — короткая версия: 4 вопроса** (по одной зоне из чек-листа), Да / Средне / Нет.

Полные 20 пунктов PDF остаются для подробного отчёта после заявки (и в `home-roi/report/`).

| Файл | Роль |
|------|------|
| `index.html` | UI + inline JS (вопросы всегда на месте в превью) |
| `checklist-short.js` | 4 вопроса + скоринг /8 (для Custom Code / Taptop) |
| `checklist-data.js` | полные 20 пунктов (для отчёта / запас) |
| `checklist-embed.js` | логика воронки |

## Taptop

1. Embed — разметка из `index.html` (блок `#infra-control`, без `<html>`/`<body>` и без скриптов внизу, если скрипты идут в Custom Code).
2. Custom Code перед `</body>` (после пуша подставьте актуальный коммит):

```html
<script src="https://cdn.jsdelivr.net/gh/katerinazaber/itman@COMMIT/infra-control/checklist-short.js"></script>
<script src="https://cdn.jsdelivr.net/gh/katerinazaber/itman@COMMIT/infra-control/checklist-embed.js"></script>
```

Относительные `./checklist-*.js` на Taptop **не работают** — база URL другая, хост вопросов остаётся пустым.
