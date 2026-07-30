# МояКарта — прототип AI-разбора натальной карты

Экспресс-инструмент по воронке: **данные → превью → оплата за полный отчёт**.

## Публичная ссылка

После деплоя: `https://katerinazaber.github.io/itman/astro-read/`

## Локально

Открой `index.html` или:

```bash
cd astro-read
python3 -m http.server 8080
```

## Что внутри

1. Hero + 3 шага  
2. Форма рождения (дата / время / город)  
3. Расчёт карты в браузере (**Astronomy Engine**, MIT)  
4. Превью: Солнце · Луна · Асцендент + короткий AI-текст (~20%)  
5. Paywall → полный демо-отчёт (PDF через печать браузера)

## Библиотеки и референсы

| Источник | Зачем |
|----------|--------|
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | Планеты в эклиптике, в `vendor/` |
| [CircularNatalHoroscopeJS](https://github.com/0xStarcat/CircularNatalHoroscopeJS) | Дома/аспекты — следующий шаг |
| [AstroChart](https://astrodraw.github.io/) | SVG-колесо |
| [Natal Charts UX](https://flat18.co.uk/case-studies/natal-charts) | Guided intake → progressive disclosure |

## Важно

- Часовой пояс городов — фиксированный offset (прототип, без DST-библиотеки).  
- «AI-текст» сейчас шаблонный по знакам; на проде — LLM + твоя рамка качества.  
- Оплата — демо-кнопка; ЮKassa подключается отдельно.
