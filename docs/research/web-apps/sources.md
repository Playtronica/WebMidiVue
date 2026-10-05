# Первичные источники

Проверено 2026-10-05. Ниже только спецификации и документация/bug trackers владельцев платформ. Это реестр утверждений для [корпуса](README.md), а не рейтинг того, что непременно сломано в WebMidiVue. При следующем аудите проверить дату обновления страницы и браузерную версию. Ссылки ведут к живым документам; конкретное состояние нашего кода зафиксировано отдельно в [аудите](audit-2026-10-05.md).

| ID | Первичный источник | Что он ограничивает в нашем решении |
|---|---|---|
| S01 | [W3C Web MIDI API](https://www.w3.org/TR/webmidi/) | Secure context, разрешение SysEx, карты портов, не обещанная стабильность ID, `send()` как очередь и `clear()`. Порядок input/output не является договором пары. |
| S02 | [Chrome: MIDI permission prompt](https://developer.chrome.com/blog/web-midi-permission-prompt) | Доступ к MIDI может требовать отдельного разрешения; SysEx запрашивать лишь для нужного сценария. |
| S03 | [MDN: Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) | Ограниченная поддержка браузерами; проверять runtime capability, не распознавать поддержку по виду телефона. |
| S04 | [MDN: Permissions-Policy `midi`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/midi) | Политика/встраивание могут отклонить разрешение; ошибка не означает неисправность USB. |
| S05 | [W3C Web Locks](https://www.w3.org/TR/web-locks/) | Lock ограничен storage bucket/origin и не блокирует native DAW либо другую beta ссылку. |
| S06 | [MIDIWeb Browser, App Store](https://apps.apple.com/us/app/midiweb-browser/id6757226617) | Отдельный iOS runtime со своей заявленной поддержкой и минимальной версией ОС; vendor statement не доказывает работу с Biotron. |
| S07 | [Web Audio API specification](https://webaudio.github.io/web-audio-api/) | `suspended/running/interrupted/closed`, user activation, latency, AudioWorklet, `running` как обработка графа, не слуховой результат. |
| S08 | [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay) | Аудиоконтекст может быть создан `suspended`; старт/Resume привязывать к действию пользователя. |
| S09 | [Chrome: AudioWorklet design pattern](https://developer.chrome.com/blog/audio-worklet-design-pattern) | Buffer underflow создаёт тишину/глитч; размер CPU/буфера измерять, а не угадывать. |
| S10 | [Chrome Page Lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) | Hidden/frozen/discarded могут задержать timers и оборвать сессию; фон не является надёжным cron. |
| S11 | [WebKit 273511](https://bugs.webkit.org/show_bug.cgi?id=273511) | Документированный класс `AudioContext` stuck interrupted на iOS; не доказательство дефекта нашего preview. |
| S12 | [WebKit 276016](https://bugs.webkit.org/show_bug.cgi?id=276016) | Документированный класс тишины после потери фокуса; слушать результат на физическом телефоне. |
| S13 | [Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle) | `skipWaiting` может смешать старую страницу с новым worker; install/update требуют отдельного сценария. |
| S14 | [Workbox: handling updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates) | Waiting worker и явное обновление по действию пользователя. |
| S15 | [Workbox precaching](https://developer.chrome.com/docs/workbox/modules/workbox-precaching/) | URL/revision precache, lazy chunks и инвалидация кеша. |
| S16 | [Cloudflare Pages `_headers`](https://developers.cloudflare.com/pages/configuration/headers/) | `_headers` не обязательно применяются к ответам Pages Functions; live response должен проверяться. |
| S17 | [Cloudflare Pages advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/) | `_worker.js` владеет входящими запросами и должен делегировать assets. |
| S18 | [WHATWG Storage Standard](https://storage.spec.whatwg.org/) | Origin/bucket, best-effort eviction, persistent mode; локальные presets не бессрочный серверный архив. |
| S19 | [W3C IndexedDB 3](https://www.w3.org/TR/IndexedDB/) | `complete/abort`, schema upgrade, `blocked` и `versionchange`; браузерная запись и запись в приборе различны. |
| S20 | [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/) | Quota/eviction для Safari/WebKit apps, отличие runtime и storage partition. Не переносить старые 7-day claims без проверки. |
| S21 | [MDN FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) | Чтение выбранного файла асинхронно, errors/abort нужны отдельно. |
| S22 | [MDN `Blob.size`](https://developer.mozilla.org/en-US/docs/Web/API/Blob/size) | Размер файла доступен **до** чтения в память. |
| S23 | [MDN `accept`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept) | MIME/расширение в picker — подсказка, не валидация содержимого. |
| S24 | [OpenTelemetry JS browser](https://opentelemetry.io/docs/languages/js/getting-started/browser/) | Browser auto-instrumentation пока experimental; весь console/MIDI поток не нужен по умолчанию. |
| S25 | [OpenTelemetry service conventions](https://opentelemetry.io/docs/specs/semconv/resource/service/) | Стабильные `service.name` и `service.version` для разделения инструментов/релизов. |
| S26 | [OpenTelemetry handling sensitive data](https://opentelemetry.io/docs/security/handling-sensitive-data/) | Отбор чувствительных атрибутов и минимизация — обязанность владельца приложения. |
| S27 | [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/) | Одна D1 обрабатывает queries последовательно; hot-path SQL и нагрузка нуждаются в измерении. |
| S28 | [Cloudflare D1 indexes](https://developers.cloudflare.com/d1/best-practices/use-indexes/) | Индексы ускоряют чтение, но добавляют writes; `EXPLAIN QUERY PLAN`/rows read подтверждают выбор. |
| S29 | [Cloudflare Worker rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) | Штатное ограничение потока к telemetry endpoint перед массовой экспозицией. |
| S30 | [Cloudflare D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/) | EU jurisdiction ограничивает БД, но не географию всех Worker-запросов. |
| S31 | [SQLite SELECT](https://www.sqlite.org/lang_select.html) | При равных значениях всех `ORDER BY` выражений порядок строк не определён. |
| S32 | [W3C CSP 3](https://www.w3.org/TR/CSP3/) | `frame-ancestors` регулирует embedding, `script-src`/`worker-src`/`connect-src` другие угрозы. |
| S33 | [Chrome: effective CSP against XSS](https://developer.chrome.com/docs/lighthouse/best-practices/csp-xss/) | Политика лишь с `frame-ancestors` не является защитой от script injection; rollout CSP начинать с совместимости/Report-Only. |
| S34 | [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use) | Pin full commit SHA, least privilege, оценка сторонних actions и секретов. |
| S35 | [npm `ci`](https://docs.npmjs.com/cli/v11/commands/npm-ci/) | Clean install по lockfile; несовпадение manifest/lock — отказ, файлы не переписываются. |
| S36 | [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/) | Advisory = известный диапазон зависимости, `--omit=dev` меняет область сканирования; audit count не доказывает эксплуатацию. |
| S37 | [Vue tooling](https://vuejs.org/guide/scaling-up/tooling) | Vue CLI maintenance mode; Vite рекомендован новым проектам, но перенос требует parity данного PWA. |
| S38 | [Vue lifecycle](https://vuejs.org/api/options-lifecycle.html) | В `beforeUnmount` освобождать timers, DOM listeners и внешние ресурсы. |
| S39 | [Vue Router guards](https://router.vuejs.org/guide/advanced/navigation-guards.html) | Async leave guard может остановить/отложить навигацию до освобождения ресурсов. |
| S40 | [Playwright emulation](https://playwright.dev/docs/emulation) | Emulation меняет UA/viewport/touch, но не подменяет физический USB, драйвер и WebKit runtime. |
| S41 | [Playwright best practices](https://playwright.dev/docs/best-practices) | Изолированные тесты, user-visible assertions, web-first waits. |
| S42 | [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing) | Автоматические правила ловят часть WCAG, но не весь смысл/клавиатуру/скринридер. |
| S43 | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Keyboard, focus, status messages, target size и альтернативы недоступной сенсорной информации. |
| S44 | [W3C WAI evaluation](https://www.w3.org/WAI/test-evaluate/) | Один автоматический инструмент не доказывает доступность; нужна человеческая оценка. |
| S45 | [Web Vitals field measurement](https://web.dev/articles/vitals-field-measurement-best-practices) | Field p75 и разрезы mobile/desktop; lab score не описывает телефон клиента. |
| S46 | [SLSA provenance 1.2](https://slsa.dev/spec/v1.2/provenance) | Артефакт должен связываться с источником и способом сборки; наш exact archive/commit guard покрывает часть этой идеи без заявления о SLSA level. |

**Использование:** при выборе изменения открыть соответствующий первичный источник и [карту failure modes](failure-modes.md), затем проверить текущее состояние проекта. Источник объясняет предел платформы, а не автоматически предписывает новую библиотеку или миграцию.
