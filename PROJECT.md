# EROSION UNIVERSE — Project Document
*Last updated: 2026-04-06*

---

## NAMING

| Product | EN | RU | Tagline EN | Tagline RU |
|---|---|---|---|---|
| Single-player | EROSION | КАПЕЛЬКА | Water beats stone. Skill beats luck. | Вода камень точит. Мастерство не прольёшь. |
| Multiplayer PvP | NOISORE | РУССЛО | Water beats stone. Skill beats luck. | Вода камень точит. Мастерство не прольёшь. |
| Bot Racing | WET BET | МОКРИЦА | — | — |

NOISORE = EROSION наоборот
РУССЛО = РУСЛО + СЛОТ + РУССКИЙ

---

## FOUR PRODUCTS — ONE ENGINE

### 1. EROSION / КАПЕЛЬКА
Single-player скоринг. Бесплатно. Тренировка, знакомство с механикой. Демо: erosion.uncloned.work

### 2. NOISORE / РУССЛО Free
PvP с ботами. Бесплатно. Обучение перед игрой на реальные. Демо: noisore.uncloned.work

### 3. NOISORE / РУССЛО Real
PvP живые игроки. Ставки USDT. Только живые — ботов нет (бот не отобьёт рейк). Стол не стартует без минимум 2 человек.

### 4. WET BET / МОКРИЦА
Ставки на ботов-стратегов. Зритель ставит, боты играют. Платформа = букмекер. Рейк с каждой ставки. Бот Racing — как скачки.

---

## CORE MECHANIC

- Общий грид из камней. Каждая ячейка = прочность 1–10.
- Капля со случайной силой 1–10 (игрок видит силу ДО выбора колонки).
- Капля пробивает камни сверху вниз, теряя силу на каждом.
- При прохождении через пустые ячейки — диагональный поток к слабым соседям (вес 1/hardness).
- Пробил русло сверху донизу = забираешь весь банк.
- Два пути к победе: пробить русло ИЛИ пересидеть всех (last man standing).

---

## TERMINOLOGY

| EN | RU | Значение |
|---|---|---|
| Round | Раунд | От свежего грида до выплаты |
| Move / Turn | Ход | Одна капля одного игрока |
| Cycle | Цикл | Все игроки сделали по одному ходу |
| Channel | Русло | Путь сверху донизу через пустые ячейки |
| Fold | Фолд | Уйти, ставка остаётся в пуле |
| Pool | Банк / Пул | Призовой фонд раунда |

---

## GRID TIERS (без вращения, 50K Monte Carlo)

| Грид | Игроки | Медиана капель | Smart win% | Fair | Edge |
|---|---|---|---|---|---|
| 6×5 | 1–4 | 16 | 52% | 33.3% | +55% |
| 6×6 | 5–8 | 24 | 30% | 20% | +50% |
| 6×8 | 9–12 | 37 | 11% | 8.3% | +31% |

1v1 (6×5): smart wins up to 73% vs random.

---

## ROTATION (Rule E)

- Квадратный грид обязателен (6×6 или 8×8).
- После каждого цикла — поворот 90° CW (предсказуемый, не случайный).
- Игрок знает что будет поворот — это информация, не хаос.
- **Rule E**: если после поворота возникло русло — случайный ряд засыпается свежими камнями (1–10). Халявных русел нет, камни надо пробивать.

### Результаты с вращением (30K Monte Carlo)

**6×6:**

| | Без вращения | С вращением |
|---|---|---|
| 1v1 LIGHT | 70.4% (20 капель) | 72.0% (13 капель) |
| 3-player | 49.0% | 52.6% |

**8×8:**

| | Без вращения | С вращением |
|---|---|---|
| 1v1 LIGHT | 70.9% (37 капель) | 77.2% (23 капли) |
| 3-player | 50.2% | 59.1% |

Вывод: вращение УСИЛИВАЕТ скилл, не ослабляет. 8×8 с вращением = максимальный skill edge (77%).

---

## BOT STRATEGIES (6×5, 20K Monte Carlo)

| Стратегия | vs RANDOM | Логика |
|---|---|---|
| DEEP | 75.8% | Симулирует каплю по каждой колонке, бьёт где глубже |
| LIGHT | 72.9% | Слабейшая колонка по сумме |
| SNIPER | 72.7% | Бьёт где больше нулей (ворует каньоны) |
| GREEDY | 72.1% | Минимум блокеров на пути |
| POWER | 64.8% | Сильная→глубоко, слабая→добивать |

Head-to-head: DEEP > LIGHT ≈ SNIPER ≈ GREEDY > POWER > RANDOM

---

## PAYMENT MODEL

### Два варианта (опционально):
1. **Per Drop (покер):** каждая капля = ставка. Фолд когда хочешь. Last man standing работает.
2. **Per Round (турнир):** buy-in фиксированный, капли бесплатные. Пул известен заранее.

### Экономика per drop:
- 1 drop = X USDT (настраивается: 0.10 / 0.50 / 1.00 / 5.00)
- 95% → в пул, 5% → рейк
- Баланс = депозит (пополняется заранее, не за каждый ход)
- Low balance warning за 3 капли до нуля
- Баланс 0 посреди раунда = автофолд
- Вывод в любой момент: `/withdraw` → USDT на кошелёк

### Telegram интеграция:
- TON Connect: пополнение за 5–10 секунд
- Внутренний баланс: off-chain, блокчейн только на вход/выход
- Telegram Stars: опционально (Apple берёт 30%)

---

## LOBBY SETTINGS

Игрок настраивает стол:
- **Грид:** 6×6 / 8×8
- **Вращение:** вкл / выкл (Rule E при вкл)
- **Ставка за каплю:** 0.10 / 0.50 / 1.00 / 5.00 USDT
- **Мин. игроков:** 2–12
- **Боты:** только для Free режима

---

## LIVE ASSETS

| Asset | URL |
|---|---|
| Demo (multiplayer) | https://noisore.uncloned.work |
| Pitch EN | https://noisore.uncloned.work/pitch.html |
| Pitch RU | https://noisore.uncloned.work/russlo_pitch.html |
| Demo (single-player) | https://erosion.uncloned.work |
| GitHub Noisore | https://github.com/constarik/Noisore |
| GitHub Erosion | https://github.com/constarik/Erosion |
| Medium | https://medium.com/@constr |
| LinkedIn | https://www.linkedin.com/in/constarik |
| Uncloned Math | https://uncloned.work |

---

## CURRENT VERSION

Noisore v1.5:
- Pool-based gameplay, 3 players (YOU + Axel random + Kira smart)
- Balance system, per-drop payment
- Channel detection, colored trajectories
- Power tags (12-position), fold mechanics
- Pitch pages EN + RU deployed

---

## PENDING

- [ ] Прототип с вращением (6×6 или 8×8, Rule E)
- [ ] Улучшение Kira: path simulation вместо column sum (DEEP strategy)
- [ ] WET BET / МОКРИЦА: прототип ставок на ботов
- [ ] Telegram Mini App интеграция
- [ ] Medium статья 7 (Erosion → Noisore story)
- [ ] Reddit r/WebGames, Twitter/X, Itch.io
- [ ] Найти промоутера/партнёра

---

## CONTACT

constr@gmail.com · @constrik (Telegram) · Uncloned Math
