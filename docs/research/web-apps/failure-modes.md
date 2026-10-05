# Атлас частых отказов web-приложения с USB MIDI и звуком

**Снимок:** 2026-10-05. Это не список найденных дефектов. Каждый пункт имеет статус: **C** — подтверждённый кодовый путь/ограничение; **G** — закрыт указанной программной регрессией в текущем commit; **P** — предел платформы по первичному источнику; **H** — физический эффект ещё не измерен. Сочетание `C/H` означает, что допущение видно в коде, а последствия на железе неизвестны. Ссылки на все первичные источники есть в [реестре](sources.md); факты о checkout — в [аудите](audit-2026-10-05.md).

## M. Web MIDI, разрешения, порты и SysEx

Платформа: [Web MIDI](https://www.w3.org/TR/webmidi/), [Chrome permissions](https://developer.chrome.com/blog/web-midi-permission-prompt), [Web Locks](https://www.w3.org/TR/web-locks/).

| ID | Типичный отказ | У нас / предел доказательства | Проверка |
|---|---|---|---|
| M01 | Браузер вообще не предоставляет `requestMIDIAccess`. | `P/G`: capability gate есть; iOS Safari не обещан как USB host. | Unsupported route показывает понятный альтернативный путь, ничего не пишет. |
| M02 | Запрос MIDI отклонён политикой, пользователем или вторым SysEx prompt. | `P/G`: ошибки разделены и Retry есть; текст подсказывает два разрешения. | Deny первый и второй prompt, затем Retry без reload. |
| M03 | Порт удалён/переименован между перечислением и `open()`. | `P/G`: generation guard и statechange снимают старый input. | Unplug во время open; не отправить команду на старый объект. |
| M04 | Browser присвоил новые `id` после переподключения. | `P/H`: W3C обещает устойчивость лишь SHOULD. | Переподключить и выбрать заново; не восстанавливать порт по старому индексу. |
| M05 | Одинаковые имена двух кабелей/двух приборов. | `C/H`: Play и Settings полагаются на индекс, Settings отказывает при двух одинаковых физических устройствах. | Переставить порядок fake inputs/outputs; Android с одним/двумя приборами. |
| M06 | `output.send()` вернул управление, firmware не исполнила команду. | `P/G`: Web MIDI ставит сообщение в очередь; Settings readback есть. | Никаких «Saved» до nonce/vector ответа; lost ACK/old ACK fixture. |
| M07 | Stop во время pending `open()` отправил поздний SysEx. | `G`: TD-01 generation check и cleanup regression в `scripts/test-midi-output-lifecycle.mjs`. | Сохранять этот тест при любом рефакторинге. |
| M08 | `close()` завис/упал, DAW не получил устройство. | `G/H`: bounded Release сообщает pending/failed; поведение DAW физическое. | Закрытие с deferred/reject, затем Windows DAW после Release. |
| M09 | Другая вкладка или native DAW заняла порт. | `P/H`: Web Lock действует в том же origin/storage bucket; физическое владение у OS. | Две вкладки одного origin, затем разные preview origins, затем DAW. |
| M10 | Несовместимые firmware-команды/скорость/вектор. | `G/H`: version/readback parser fail closed; реальная матрица firmware ограничена. | Golden bytes + exact released firmware, не ускорять pacing без прибора. |
| M11 | Прерванный SysEx или очередь после смены output. | `P/H`: `clear()` существует, но уже отправленное нельзя «отозвать» с устройства. | Unplug/Stop в фазах до и после `send`, проверка ответа/повтора. |

## A. Web Audio и реальное восприятие

Платформа: [Web Audio](https://webaudio.github.io/web-audio-api/), [Chrome autoplay](https://developer.chrome.com/blog/autoplay), [Page Lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api), [WebKit reports](https://bugs.webkit.org/show_bug.cgi?id=276016).

| ID | Типичный отказ | У нас / предел доказательства | Проверка |
|---|---|---|---|
| A01 | `AudioContext` создан до user gesture и стартует suspended. | `G/P`: запуск из Hear, Resume path есть. | Fresh browser profile без media-engagement history. |
| A02 | Контекст стал `interrupted` после lock/call/app switch. | `G/H`: state и bounded Resume обрабатываются; MIDIWeb iPhone не принят. | Физический iPhone: Hear → lock → return → один Resume. |
| A03 | Контекст сообщает `running`, но динамик молчит. | `P/H`: engine state не измеряет system mute/output route. | Отдельный вопрос «слышно?» и проверка наушники/динамик без смены иных условий. |
| A04 | AudioWorklet/runtime chunk не загружен offline. | `G/H`: lazy sound/Elementary chunks precached по имени; exact-hash parity нуждается в update тесте. | Offline первый/повторный запуск и build A→B на постоянном origin. |
| A05 | DSP перегрузил render thread; треск/разрыв звука. | `G/H`: burst/soak программные тесты есть; реальные CPU/thermal не измерены. | Длительный физический сеанс на слабом телефоне, число активных голосов и слышимые глитчи. |
| A06 | Зависшая нота при отключении MIDI/смене страницы. | `G`: panic при release/disconnect, voice pool ограничен. | Note-on без note-off → Stop/unplug/navigation → тишина. |
| A07 | Устройство вывода/частота/аудиофокус меняются в середине сессии. | `P/H`: браузер может перестроить output; `running` недостаточен. | Подключить/отключить наушники после первого звука, отдельно от lock test. |
| A08 | Фоновый timer калибровки срабатывает поздно и сообщает устаревший stage. | `P/H`: Page Lifecycle может freeze; visibility Resume есть, пересчёт watchdog не доказан. | Lock во время settling/calibrating, затем ответ nonce/Retry. |
| A09 | Audio init или resume promise никогда не завершается. | `G`: Resume deadline есть; полный init deadline — отдельный backlog TD-08. | Deferred runtime import/render failure и видимый Retry. |

## O. PWA, кеш, обновление и origin

Платформа: [service worker lifecycle](https://web.dev/articles/service-worker-lifecycle), [Workbox updates](https://developer.chrome.com/docs/workbox/handling-service-worker-updates), [Storage Standard](https://storage.spec.whatwg.org/).

| ID | Типичный отказ | У нас / предел доказательства | Проверка |
|---|---|---|---|
| O01 | Первый визит offline принят за установленную PWA. | `G`: readiness возвращает first-install error, UI не обещает offline. | Fresh profile offline → явная ошибка → online install → offline. |
| O02 | SW зарегистрирован, но ещё не контролирует страницу или precache неполон. | `G`: controller + cache checks с deadline; synthetic timeout tests есть. | Pending controller, incomplete cache, retry. |
| O03 | Новая версия worker подхватила старую активную MIDI/audio страницу. | `G/H`: `skipWaiting:false`; physical long session/update не проверены. | Build A активен, B ожидает, после сознательного restart активен только B. |
| O04 | Старый документ требует lazy chunk, удалённый при смене версии. | `P/H`: текущий preview immutable host избегает этого; production origin требует parity. | A→B с навигацией к Sound/Settings до и после offline restart. |
| O05 | Browser удалил Cache/IndexedDB из-за quota/storage pressure. | `P/H`: best-effort storage; UI не может гарантировать вечный offline. | Симулировать quota/clear storage; показать восстановление, не потерять device state. |
| O06 | Новый preview URL «забыл» install/presets/permission. | `P`: разные hash hosts = разные origins; это ожидаемо. | Сравнить два URL и явно переносить preset через экспорт. |
| O07 | `_headers` настроены, но не применены к Function response. | `G/P`: Cloudflare предупреждает о Functions; preview guard проверяет live headers. | Remote guard для точного preview; не читать `_headers` как доказательство само по себе. |
| O08 | Offline режим трактуется как отсутствие MIDI. | `G`: PWA tests держат Settings write offline с fake MIDI. | Реальный компьютер offline после install; чтение/запись прибора отдельны от сети. |

## D. Настройки прибора, IndexedDB и импорт файлов

Платформа: [IndexedDB 3](https://www.w3.org/TR/IndexedDB/), [Storage](https://storage.spec.whatwg.org/), [WebKit policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader).

| ID | Типичный отказ | У нас / предел доказательства | Проверка |
|---|---|---|---|
| D01 | Request success ошибочно принят за успешный commit. | `G`: `PresetsIDB` ждёт transaction complete. | Abort после request success не показывает «Saved in browser». |
| D02 | Upgrade IndexedDB блокируется другой вкладкой. | `G`: blocked/versionchange явно обработаны. | Старое соединение держится, upgrade сообщает ошибку/закрывает. |
| D03 | Quota/private mode/eviction убирают локальный preset. | `G/P`: write error видим; долговечность не гарантирована. | Quota fail, повторный запуск после очистки, экспорт для важного пресета. |
| D04 | Browser preset ошибочно выдан за persisted settings устройства. | `C`: одиночный edit различает; импорт Biotron обходит readback. | После import отличающегося значения статус unconfirmed до device ACK. |
| D05 | Неправильный JSON или чужой тип инструмента частично меняет форму. | `C`: шесть страниц парсят после `patchChanged`, без полной проверки. | Invalid JSON/unknown name/duplicate/out-of-range → ноль мутаций. |
| D06 | Огромный файл зависает/съедает память на телефоне. | `C/H`: FileDropArea читает без `file.size` bound; freeze не измерен. | Файл выше разумного лимита отклоняется **до** FileReader. |
| D07 | Файл не прочитан или выбор отменён, пользователь не узнаёт причину. | `C`: FileReader error/abort и empty file case не обработаны. | Reader.onerror/onabort, пустой список → понятная ошибка. |
| D08 | Старый preset schema после обновления ломает команду. | `C/H`: preset JSON не версионирован; device readback версионирован. | Golden fixtures старых экспортов каждого инструмента. |
| D09 | Local saved после live SysEx error вводит в заблуждение. | `C`: с браузером и прибором работают разные операции; сообщение должно назвать цель. | DB success/device failure и обратный сценарий показываются раздельно. |

## T. Телеметрия, аналитика и доверие

Платформа: [OTel service](https://opentelemetry.io/docs/specs/semconv/resource/service/), [OTel sensitive data](https://opentelemetry.io/docs/security/handling-sensitive-data/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [SQLite ordering](https://www.sqlite.org/lang_select.html).

| ID | Типичный отказ | У нас / предел доказательства | Проверка |
|---|---|---|---|
| T01 | «Всё логируем» захватывает MIDI, имя/серийник, URL или текст ошибки. | `G`: allowlist client+server исключает это из D1; ручной diagnostic packet богаче и отправляется пользователем. | Schema negative fixtures и review новых event fields. |
| T02 | Нет события = не было действия. | `C`: offline, cap 80 и transport failure теряют события намеренно. | Censored sessions и отдельный пользовательский ответ в знаменателе. |
| T03 | У двух событий одинаковый `received_at`, порядок угадан. | `C`: секундный timestamp; нет sequence. | Session sequence + gap detection; не упорядочивать tie по случайному event ID. |
| T04 | `audio_state=running` принят за «пользователь услышал». | `C/H`: физический результат отдельно; feedback click не равен отправке. | Сравнить MIDI/audio/ответ tester; outcome unknown допустим. |
| T05 | Поддельные события/версии портят анализ. | `C`: Origin не серверная авторизация, любой hex build допустим. | Exact published build allowlist + rate limit + anomaly count. |
| T06 | Retention не выполняется при тишине в beta. | `C`: DELETE только перед insert. | Отдельная операционная проверка после >90 дней без POST. |
| T07 | D1 перегружена/дорого из-за SQL на каждый event. | `P/C`: single-threaded DB, delete+insert per request, индексы пишутся. | Load profile, rows read/written, explain plan, budget threshold. |
| T08 | Одна схема ошибочно навязана разным инструментам. | `C`: Worker пока только `biotron`; это намеренный ограничитель. | Per-tool event vocabulary + общий envelope, migration fixtures. |
| T09 | EU database location названа «вся обработка в EU». | `P`: Cloudflare ограничивает место DB, Worker может исполняться где угодно. | Уведомление и договоры описывают реальные границы. |

## U. Доступность, UX и пользовательские исследования

Платформа: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI evaluation](https://www.w3.org/WAI/test-evaluate/), [Playwright a11y](https://playwright.dev/docs/accessibility-testing).

| ID | Типичный отказ | У нас / предел доказательства | Проверка |
|---|---|---|---|
| U01 | Важное действие доступно мышью, но не клавиатурой. | `C`: FileDropArea — clickable `div`, hidden input; нет key handler. | Tab/Enter/Space открывают picker, visible focus и label. |
| U02 | Статус ошибки не объявлен скринридеру. | `G/H`: Settings имеет `role=status`/`aria-live`; полный screenreader flow не проходил. | VoiceOver/NVDA Connect→error→Retry→Saved→Release. |
| U03 | Sound-only feedback не даёт понять, что MIDI идёт. | `G/H`: UI показывает stage/notes; смысл доступности в реальном потоке не проверен. | При mute пользователь различает «нет MIDI» и «нет аудио». |
| U04 | Touch цель/zoom/focus перекрыты. | `G/H`: structural viewport gate есть, 200%/focus human pass открыт. | Компактный телефон, 200% zoom, keyboard focus. |
| U05 | Несколько задач в одном сообщении дают неполный ответ. | `C`: исторический feedback audit показывает такой сбой коммуникации. | Один URL/build и одна задача; outcome сохранять отдельно. |
| U06 | Ошибка советует менять firmware без доказанной причины. | `G`: текущий личный beta держит updater выключенным. | После timeout только безопасный Retry/diagnostics, без reflash. |
| U07 | Отсутствие Web MIDI скрывается пустым экраном. | `G`: compatibility card есть. | iOS Safari/Firefox получают честный fallback. |

## R. Security, supply chain и выпуск

Платформа: [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/), [CSP](https://www.w3.org/TR/CSP3/), [Vue tooling](https://vuejs.org/guide/scaling-up/tooling).

| ID | Типичный отказ | У нас / предел доказательства | Проверка |
|---|---|---|---|
| R01 | Beta артефакт собран из не того checkout. | `G`: exact commit/archive SHA/guard; immutable candidate. | Неизменный archive hash и remote byte/header parity. |
| R02 | Production CD опирается на подвижный action/lock drift. | `C`: `@develop`, `npm install`, нет test gate. | Pin SHA+Node, `npm ci`, quick/full gate до deploy. |
| R03 | Тесты скачивают `esbuild` вне lockfile. | `C`: два `npx --yes esbuild@0.24.0` в release gate. | Clean offline/cache-empty gate либо locked dependency. |
| R04 | `_headers` принято за полную CSP/XSS защиту. | `C`: только `frame-ancestors`; live headers проверены. | Report-Only script/object/base policy с Worklet/PWA parity перед enforcement. |
| R05 | Security audit count принят за эксплуатируемый production баг. | `P`: npm audit описывает advisory деревьев prod/dev, не exploit path. | Separate prod/dev report и путь уязвимости до shipped bytes. |
| R06 | Vue CLI → Vite совмещён с изменением протокола. | `P`: Vue CLI maintenance; перепись без parity опасна. | Isolated equivalence spike после hardware PASS, только затем решение. |
| R07 | UI/тесты PASS без физической приёмки названы stable. | `C/H`: тестовая стратегия отделяет четыре lanes и аппаратный gate. | Exact build + компьютер, Android/iPhone по обещанной поддержке. |
| R08 | Документация статуса релиза устарела. | `C`: telemetry doc всё ещё говорит «не публиковали». | Сверять docs с remote/exposure evidence, фиксировать датой без перепаковки. |

## Как использовать атлас

Выбирать не все тесты сразу, а 1) указанную платформу, 2) требуемую гарантию текущего релиза, 3) самый дешёвый эксперимент, который способен опровергнуть риск. Карточка переходит из `H` в `verified` только с точным build, setup и наблюдаемым исходом. Отсутствие жалоб и один green mock не меняют её статус. Порядок проверки — в [матрице](test-matrix.md); найденные реальные симптомы сопоставлять с владельцем продуктовых наблюдений, а не дублировать клиентские сообщения в этом репозитории.
