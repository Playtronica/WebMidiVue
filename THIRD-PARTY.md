# Стороннее в этом репозитории

## chromatone/elements — эффекты для движка Elementary

- Источник: <https://github.com/chromatone/elements>, автор Денис Старов (Chromatone).
- Лицензия: MIT, Copyright (c) 2024 Chromatone. Полный текст:
  `src/audio/elementary/fx/LICENSE-chromatone.txt`.
- Перенесено 04.09.2026 с разрешения автора; синт сделан им в поддержку проекта Biotron.
- Файлы: `src/audio/elementary/fx/srvb.mjs` (ревербератор на сети обратных связей с матрицей
  Адамара 8×8), `src/audio/elementary/fx/pingpong.mjs` (задержка со сдвигом каналов по темпу).
- Изменения при переносе: только расширение файлов и шапка об авторстве; математика не тронута.
- Приёмы, перенятые оттуда же (не код, а подход): `core.createRef` вместо перестройки графа на
  каждую ноту, сглаживание внутри создания ссылки, параметры рядом со своим тембром.

## @elemaudio/core, @elemaudio/web-renderer

MIT, Elementary Audio. Используются как зависимости, код не копировался.
