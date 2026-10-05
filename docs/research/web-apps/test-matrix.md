# Матрица экспериментов и критерии доказательства

Эта матрица переводит [атлас отказов](failure-modes.md) в минимальные проверки. Она не заменяет build-specific `PHYSICAL-TEST.md`, который выпускает `candidate:biotron`; только тот файл задаёт короткий маршрут владельца для точной сборки. Исследовательские сценарии запускаются после базового PASS или для диагностики первого сбоя. Изменение кода → новый commit/candidate → прежний аппаратный PASS не переносится автоматически.

## Слои доказательства

| Слой | Что может доказать | Чего не может |
|---|---|---|
| Pure unit/fake MIDI | bytes, parsing, cancel/order, failure state, запрет ложного Saved. | Драйвер, USB, акустика и браузерные разрешения. |
| Browser Chromium с постоянным профилем | DOM/keyboard/ARIA, real SW lifecycle, IndexedDB, разрешение в браузерном слое, JS exceptions. | iPhone MIDIWeb/WebKit, Android USB host и физический прибор. |
| Физическая матрица | Реальные порты, firmware, DAW handoff, слышимость, фоновые состояния. | Общую частоту дефектов у пользователей по одному устройству. |
| Production telemetry + feedback | Где у экспонированных build происходят потери/отказы и что человек сообщил. | Причину без воспроизведения; «нет события» не означает «не было действия». |

[Playwright](https://playwright.dev/docs/emulation) эмулирует устройство на уровне UA/screen/touch; [WAI](https://www.w3.org/WAI/test-evaluate/) требует человеческой оценки доступности. Поэтому свидетельства слоёв подписываются отдельно.

## Минимальные контрактные эксперименты для следующего изменённого кандидата

| Тест | Покрывает | Вход/инъекция | Наблюдаемое PASS | Триггер |
|---|---|---|---|---|
| T-M01 | M03–M07 | `input.open()` resolves после Stop; другой input выбран до resolve. | 0 поздних SysEx, порт закрыт; regression уже существует — сохранить. | Любой MIDI lifecycle edit. |
| T-M02 | M05 | Два одинаковых `name/manufacturer`, input order A,B, output order B,A. | Нельзя послать на неверный output; неоднозначность видима либо подтверждена nonce handshake. | Перед решением о Android support. |
| T-M03 | M06/M10 | Правильный `send()`, затем no ACK, wrong nonce, old firmware, corrupt response. | Статус `unconfirmed/error`, форма закрыта где нужно, Retry однократен. | Settings/protocol change. |
| T-M04 | M08/M09 | `close()` hang/reject, второй owner/tab. | Не заявлено «порт свободен» до завершения Release; повтор не плодит closes. | Release/DAW change. |
| T-A01 | A01/A02/A09 | Context suspended/interrupted; Resume hangs/rejects/runs late. | Ограниченный Retry, устаревший callback игнорируется, звук не запускается скрытым циклом. | Engine/Resume change. |
| T-A02 | A05/A06 | Burst notes, missing note-off, 100 lifecycle loops. | Voice count bounded, panic до Release; CPU event-loop budget остаётся измеренным. | Engine/voice pool change. |
| T-A03 | A08 | Hide/freeze-like delay в settling и калибровке, затем старый nonce response. | После return stage не прыгает в ложный ready; понятный Retry/diagnostic. | First-play calibration change. |
| T-O01 | O01/O02/O08 | Fresh offline, incomplete precache, controller timeout, затем online retry. | Не показывать offline-ready преждевременно; повтор даёт ready после полной установки. | PWA build/update change. |
| T-O02 | O03/O04 | Постоянный origin: A открыта с MIDI/audio; развёрнут B; B worker waiting; offline/restart. | A не обрывается; после явного перехода B shell+lazy chunks+видимый build согласованы. | Перед stable-origin production PWA. |
| T-D01 | D01–D03 | IDB request success, затем abort/quota/blocked/versionchange. | «Saved in browser» только после complete; error виден; старые записи не удалены. | Preset DB/schema change. |
| T-D02 | D04/D05/D08 | Битый JSON, неверный tool, unknown name, duplicate, out-of-range, old export. | До полного parse/validate 0 UI/DB/device mutations; понятный outcome. | Любой preset import change. |
| T-D03 | D04/D09 | Valid import другого вектора после старого `saved`; firmware ignores write/no ACK. | Старый `saved` инвалидирован; новый `saved` только после device readback; browser save отдельно. | Biotron import fix. |
| T-D04 | D06/D07/U01 | File > установленного лимита, reader error, empty selection; keyboard Enter/Space. | Ограничение до чтения; error сообщён; native keyboard access/focus. | Shared FileDropArea fix. |
| T-T01 | T02–T04 | Complete, timeout, offline, fetch failure, 80-event cap, user says «не слышу». | Данные не превращают missing/`running` в «услышал»; session sequence/gap виден. | Telemetry schema/analysis change. |
| T-T02 | T05–T07 | Fake build, forged Origin, rate burst, 90-day idle, D1 exception. | Reject/limit/retention наблюдаемы; музыкальный поток не ждёт POST. | Перед всеми инструментами/широкой бетой. |
| T-U01 | U01–U04/U07 | Keyboard-only, VoiceOver/NVDA, 200% zoom, 320px, iOS Safari без MIDI. | Полный Connect→Error→Retry→Save→Release достижим и понятен, fallback честный. | Перед внешней волной. |
| T-R01 | R01–R04 | Clean checkout/lockfile, exact candidate archive, remote bytes/headers. | Один build ID/commit/SHA; CI pin+test; никакого mutable deploy в beta. | Каждый кандидат / production hardening. |

## Физическая матрица — только обещанные конфигурации

| Конфигурация | Минимум первого прохода | Дополнительный сценарий после PASS | Измеримый исход |
|---|---|---|---|
| Desktop Chrome/Edge + Biotron | Стандартный `PHYSICAL-TEST.md`: первый звук, Settings readback, одно обратимое изменение с подтверждением, Release. | DAW до/после Release, unplug/reconnect, отдельный preset import test. | Звук слышен, правильный device response, DAW видит порт после Release. |
| Android Chrome + OTG/data cable | Capability, число входов/выходов, калибровка, Settings. | Два одинаковых кабеля и перестановка после reconnect. | Не отправить SysEx неидентифицированному выходу; один физический Biotron не выдаётся за два. |
| iPhone MIDIWeb + USB adapter | Первый звук на точном URL/build. | Lock/return, один Resume, аудиомаршрут наушники/динамик; отдельно во время калибровки. | Человек слышит звук и понимает recovery; `running` само по себе не PASS. |
| iOS Safari/Firefox без нужного Web MIDI | Открытие route. | Keyboard/VoiceOver и fallback wording. | Ясное сообщение о capability, без USB promise и без тупика. |

Записывать точный build, OS/browser/app version, USB setup, firmware version если сообщается прибором, stage первого отклонения и ответ «слышу/не слышу». Не собирать серийники/контакты/сырые MIDI в общую телеметрию. Для личного текущего preview использовать уже подготовленный отдельный физический чек-лист; эта матрица — инженерная база следующих срезов.

## Когда остановиться и когда расширять проверку

- **Остановиться** на первом расхождении базового flow; длинный прогон после FAIL часто меняет сразу несколько условий и теряет причину.
- **Расширить** только под конкретную гипотезу: например, после обнаруженной Android путаницы запускать T-M02 и физический cable case, после тишины — A03/аудиовыход, после неверного Saved — D03.
- **Признать PASS** только по нужному уровню гарантии: fake MIDI PASS для wire bytes, browser PASS для PWA, hardware PASS для USB/звука, user response для реального опыта. [Playwright best practices](https://playwright.dev/docs/best-practices) советуют user-visible assertions; они должны сосуществовать с протокольными golden bytes.
