# Архитектурные решения из исследования

Это рекомендации на 2026-10-05, привязанные к [атласу отказов](failure-modes.md). Они не меняют утверждённый [проектный контракт упрощения](../../WEB-SIMPLIFICATION-REVIEW.md). Каждое решение должно уменьшать конкретный failure mode и иметь удаляемый/тестируемый срез; свободного source-file budget почти нет.

## D1. Одно понятное состояние устройства

Для каждого управляемого прибора различать `capability`, `permission`, `selected input/output`, `firmware protocol`, `live value`, `persisted value` и `release`. Наименование «connected» не должно означать «сохранено» или «слышу». За операцией владеет generation token; поздний async completion не меняет новое состояние. Текущие `MidiInputSession` и Settings уже используют этот приём. Добавлять отдельную state-machine библиотеку пока нет основания: таблица допустимых переходов и существующие pure tests дадут проверяемый контракт при меньшем bundle. Риск: M03/M07/M08/D04.

## D2. Подтверждать пару MIDI-портов ответом прибора

Имя и индекс нужны для предложения кандидатов, но не являются доказанной парой ([Web MIDI](https://www.w3.org/TR/webmidi/)). При одном однозначном порте текущий путь можно сохранить. При одинаковых именах не писать на непроверенный output. Сначала fake permutation и физическая карта USB; затем по возможности nonce handshake «этот output → выбранный input». Если firmware не даёт такую проверку, показать неоднозначность и попросить оставить один прибор/кабель. Это локальная правка на границе MIDI, не общий registry всех устройств. Риск: M04/M05/M10.

## D3. Устройство — источник истины для `Saved on Biotron`

Browser preset, текущая форма и persisted firmware state — три отдельно названных состояния. Валидный import сначала разбирается целиком, затем применяет значения с существующим firmware pacing и получает readback либо остаётся явно local-only до действия пользователя. Любой import/change инвалидирует старый `saved`. Не удалять локальный preset при firmware timeout; не обещать device save по IDB commit. Риск: D01/D04/D05/D09. Основа: [IndexedDB](https://www.w3.org/TR/IndexedDB/), [текущий readback](../../../src/biotron/settingsReadback.mjs:31).

## D4. Native file input и bounded parse

Общую загрузку пресета строить вокруг видимого `<input type=file>`/`<label>` или настоящей button с keyboard behavior. Проверить `File.size` до чтения, обрабатывать `error`/`abort`, ограничить число команд, версии/имена/типы/диапазоны до мутации. [WCAG keyboard](https://www.w3.org/TR/WCAG22/#keyboard), [FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader), [`Blob.size`](https://developer.mozilla.org/en-US/docs/Web/API/Blob/size) поддерживают этот малый срез. Не добавлять внешнюю библиотеку drag-drop для одной операции. Риск: D05–D08/U01.

## D5. Один AudioContext, bounded recovery, отдельный слуховой исход

Сохранять ленивую загрузку Elementary и один context на sound session. Обрабатывать `suspended`, `interrupted`, `closed`; давать явный Resume из пользовательского действия и ограниченное ожидание. Измерять реальное время первого звука/глитчи на устройстве, а не считать `running` слуховым PASS. Не добавлять скрытый цикл постоянного Resume: [Page Lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) может останавливать timers, а [Web Audio](https://webaudio.github.io/web-audio-api/) знает разные state/output latency. Риск: A01–A09.

## D6. Версионированный PWA без неожиданного переключения во время сессии

Сохранить `skipWaiting:false` и immutable preview origins. Для stable origin иметь сценарий A→B с открытым MIDI/audio и явным restart. Offline-ready должен означать текущий документ + нужные lazy chunks; regex существования без идентичности версии — только предварительная проверка. Не переносить WebMidiVue на Vite внутри этого же изменения: parity PWA/protocol/headers требуется отдельно. [Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle), [Vue tooling](https://vuejs.org/guide/scaling-up/tooling). Риск: O01–O08/R06.

## D7. Общая схема событий, словарь на каждый прибор

Для всех инструментов общими сделать envelope `service_name`, exact `service_version`, random session/event IDs, monotonic event sequence, timestamp, coarse environment. Event names/results описывать per-tool на основании пользовательского пути; `running`, `clicked`, `accepted` не равны «услышал», «отправил», «исправилось». Не включать сырые MIDI/аудио/портовые имена/полные UA/свободный текст в серверную схему. До расширения Worker проверить published-build allowlist, лимит, retention, D1 нагрузку и доступ к данным. [OTel service](https://opentelemetry.io/docs/specs/semconv/resource/service/), [sensitive data](https://opentelemetry.io/docs/security/handling-sensitive-data/). Риск: T01–T09.

## D8. Релиз — точный артефакт, четыре вида свидетельств

Source SHA, locked build inputs, archive checksum, remote response parity и точный hardware report хранить раздельно. Beta guard уже силён; production workflow привести к explicit Node/`npm ci`/SHA-pinned actions/test gate. Audit advisories разбирать по shipped path; `npm audit fix --force` может внести крупный несовместимый toolchain update. [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/), [SLSA provenance](https://slsa.dev/spec/v1.2/provenance). Риск: R01–R05/R07.

## D9. Доступность — часть функционального пути

У каждого действия на пути Connect→Retry→Import→Saved→Release должны быть клавиатура, видимый фокус, роль и понятный статус. Sound test обязан также сообщать видимое/читаемое «MIDI идёт / звук не слышен», поскольку звук может быть недоступен или отключён. Автоматические axe/структурные проверки полезны, но [W3C WAI](https://www.w3.org/WAI/test-evaluate/) требует human pass. Риск: U01–U07.

## D10. Риск-ориентированные эксперименты вместо массовой переписи

Сначала узкая фикстура, которая различает ошибку и корректное поведение; потом код и один необходимый browser/hardware gate. Комплексный билд только из точного commit перед выпуском. Green test, основанный на текущем алгоритме, не должен подтверждать его допущение: пример — «Android кабель 0 первый» нужно дополнить перестановкой. Физический тест не раздувать всеми карточками [матрицы](test-matrix.md). Это продолжает [проектную стратегию](../../WEB-TEST-STRATEGY.md), сокращает вероятность нового кода без доказанного выигрыша и оставляет время на проверку человека.
