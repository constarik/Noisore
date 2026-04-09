# EROSION UNIVERSE — Project Document
*Last updated: 2026-04-09*

---

## NAMING

| Product | EN | RU | Tagline EN | Tagline RU |
|---|---|---|---|---|
| Single-player | EROSION | КАПЕЛЬКА | Water beats stone. Skill beats luck. | Вода камень точит. Мастерство не прольёшь. |
| Multiplayer PvP | NOISORE | РУССЛО | Water beats stone. Skill beats luck. | Вода камень точит. Мастерство не прольёшь. |
| Spectator betting | Bet&Wet | МОКРИЦА | Pick your fighter. Watch the race. | Выбери бойца. Смотри гонку. |

NOISORE = EROSION наоборот
РУССЛО = РУСЛО + СЛОТ + РУССКИЙ

---

## FOUR PRODUCTS — ONE ENGINE

### 1. EROSION / КАПЕЛЬКА
Single-player скоринг. Бесплатно. Тренировка, знакомство с механикой.

### 2. NOISORE / РУССЛО Free
PvP с ботами. Бесплатно. Обучение перед игрой на реальные.

### 3. NOISORE / РУССЛО Real
PvP живые игроки. Ставки USDT. Только живые — ботов нет. 5% рейк.

### 4. Bet&Wet / МОКРИЦА
Ставки зрителей на ботов-стратегов. 6 бойцов играют автоматически. Зритель выбирает на кого ставить. Бот-скачки. 5% overround.

---

## ARCHITECTURE (v5.8)

```
engine.js   — физика грида, стратегии, вращение (STRATEGY_PICK dict)
game.js     — лобби, анимация, Bet&Wet, все режимы (shared)
index.html  — десктоп CSS + HTML shell
mobile.html — мобильный CSS + HTML shell (touch, fullscreen)
```

Один `game.js` — две платформы. Изменил game.js → оба обновились.

---

## CORE MECHANIC

- Общий грид из камней. Каждая ячейка = прочность 1–10.
- Капля со случайной силой 1–10 (игрок видит силу ДО выбора колонки).
- Капля пробивает камни сверху вниз, теряя силу на каждом.
- При прохождении через пустые ячейки — диагональный поток к слабым соседям (вес 1/hardness).
- Пробил русло сверху донизу = победа.

---

## ROTATION (Rule E)

- Квадратный грид (6×6 или 8×8).
- После каждого цикла — поворот 90° CW (предсказуемый, не случайный).
- **Rule E**: если после поворота возникло русло — случайный ряд засыпается свежими камнями (1–10).
- Вращение УСИЛИВАЕТ скилл: 8×8 с вращением = 77% побед vs random.

---

## BOT STRATEGIES

6 стратегий, реализованы в engine.js (STRATEGY_PICK):

| Стратегия | Логика |
|---|---|
| DEEP | Симулирует каплю по каждой колонке, бьёт где глубже |
| LIGHT | Слабейшая колонка по сумме |
| SNIPER | Бьёт где больше нулей (ворует каньоны) |
| GREEDY | Минимум блокеров на пути |
| POWER | Сильная→глубоко, слабая→добивать |
| RANDOM | Случайная колонка |

---

## 500K SIMULATION DATA (% побед, сумма = 100%)

### 1v1 Duels (каждая стратегия vs RANDOM)

| Стратегия | Побед | RANDOM |
|---|---|---|
| DEEP | 75.8% | 24.2% |
| LIGHT | 72.9% | 27.1% |
| SNIPER | 72.7% | 27.3% |
| GREEDY | 72.1% | 27.9% |
| POWER | 64.8% | 35.2% |

### 6-Player Tournament (500K раундов)

Order: [DEEP, LIGHT, SNIPER, GREEDY, POWER, RANDOM]

| Config | DEEP | LIGHT | SNIPER | GREEDY | POWER | RANDOM |
|---|---|---|---|---|---|---|
| 6×6 OFF | 19.9 | 17.0 | 18.7 | 18.8 | 19.8 | 5.9 |
| 6×6 ON | 18.8 | **19.2** | 17.9 | 17.8 | 18.1 | 8.2 |
| 8×8 OFF | 19.8 | 17.5 | 18.8 | 18.8 | 19.7 | 5.5 |
| 8×8 ON | 19.4 | 18.7 | 18.5 | 18.4 | 18.9 | 6.1 |

**Key finding:** С вращением LIGHT (Scout) становится лучшим на 6×6 (19.2% vs DEEP 18.8%). RANDOM улучшается с ~5.9% до ~8.2%.

---

## BET&WET — SPECTATOR BETTING

### Fighters (EN/RU)

| EN | RU | Strategy | Noise | Character |
|---|---|---|---|---|
| Professor | Профессор | DEEP | 10% | Всё просчитал |
| Scout | Разведчик | LIGHT | 20% | Ищет слабое место |
| Crow | Ворона | SNIPER | 25% | Ворует чужое |
| Mole | Крот | GREEDY | 25% | Роет где тоньше |
| Colonel | Полковник | POWER | 15% | Сильным — в глубь |
| Daisy | Фрося | RANDOM | 40% | Куда бог пошлёт |

### Noise Model

Каждый боец имеет индивидуальный noise (0–50):
- **Для всех кроме Daisy:** noise% ходов играет как RANDOM (Daisy)
- **Для Daisy:** noise% ходов играет как случайная умная стратегия (DEEP)
- Professor (10%) почти чистый гений. Daisy (40%) — 40% ходов играет как Professor.

### Odds Calculation

1. Из чистых 500K данных (BET_DATA) берём % побед для текущего грида/вращения
2. Вычисляем effective%: `eff = pure × (1 - noise/100) + daisyPure × (noise/100)` (для Daisy — наоборот: `avgOthers × noise`)
3. Нормируем до 100%
4. Odds = 100 / eff% / OVERROUND
5. OVERROUND = 1.05 (5% маржа)

Коэффициенты пересчитываются динамически при смене грида или вращения.

### Multi-Bet System

- Десктоп: click = +1 ставка, right-click = −1 ставка
- Мобиль: tap = +1 ставка, CLEAR BETS для сброса
- Ставки хранятся как абсолютные суммы в USDT (не количество кликов)
- Множественные ставки на одного/нескольких бойцов
- Выплата: ставка на победителя × odds

### Production Model: Пари-мутюэль (тотализатор)

Демо использует фиксированные коэффициенты из симуляций. В production:
- Все зрители ставят на бойцов
- Общий пул формируется из всех ставок
- Коэффициенты = пул / сумма ставок на победителя
- Коэффициенты меняются в реальном времени

### Totalizator Verification

`betwet_verify.py` — скрипт верификации прибыльности:
- 15 тестов: 6 стратегий ставок × разные noise × разные overround
- **Результат: ВСЕ PROFITABLE при 5% overround**
- House edge: 0.5–10% в зависимости от стратегии ставок
- Запуск: `verify_all.bat`

---

## PAYMENT MODEL

### Per Drop (покер):
- 1 drop = X USDT (0.10 / 0.50 / 1.00 / 5.00)
- 95% → в пул, 5% → рейк
- Баланс = депозит (пополняется заранее)

### Per Round (турнир):
- Buy-in фиксированный, капли бесплатные

### Bet&Wet:
- Bet size: 0.10 / 0.50 / 1.00 / 5.00 USDT
- 5% overround (маржа в коэффициентах)

---

## LOBBY SETTINGS

- **Mode:** EROSION / NOISORE / Bet&Wet
- **Grid:** 6×6 / 8×8
- **Rotation:** ON / OFF (Rule E)
- **Stake:** FREE / 0.10 / 0.50 / 1.00 / 5.00
- **Opponents:** 1–11 ботов (NOISORE)
- **Fighters:** Professor / Scout / Crow / Mole / Colonel / Daisy (Bet&Wet)

---

## LIVE ASSETS

| Asset | URL |
|---|---|
| Demo desktop | https://noisore.uncloned.work |
| Demo mobile | https://noisore.uncloned.work/mobile.html |
| Erosion | https://noisore.uncloned.work/erosion.html |
| Pitch EN | https://noisore.uncloned.work/pitch.html |
| Pitch RU | https://noisore.uncloned.work/russlo_pitch.html |
| GitHub | https://github.com/constarik/Noisore |
| Medium | https://medium.com/@constr |
| LinkedIn | https://www.linkedin.com/in/constarik |
| Uncloned Math | https://uncloned.work |

---

## TOOLS

| File | Purpose |
|---|---|
| `engine.js` | Grid physics, strategies, rotation |
| `game.js` | All game logic (lobby, play, bet) |
| `noisore_sim.py` | Tournament/duel simulator, 500K+ rounds |
| `betwet_verify.py` | Totalizator profitability verifier |
| `verify_all.bat` | Full verification batch (15 tests) |

### Fighter Skins (alternative name packs)

| Strategy | Classic | Двор | Школа | Зона | Офис | Армия |
|---|---|---|---|---|---|---|
| DEEP | Professor / Профессор | Мозг | Отличник | Адвокат | Аналитик | Штабной |
| LIGHT | Scout / Разведчик | Шустрый | Подлиза | Шестёрка | Стажёр | Дозорный |
| SNIPER | Crow / Ворона | Щипач | Хулиган | Медвежатник | Аудитор | Снайпер |
| GREEDY | Mole / Крот | Крыса | Жадина | Крот | Бухгалтер | Сапёр |
| POWER | Colonel / Полковник | Бык | Физрук | Смотрящий | Директор | Полковник |
| RANDOM | Daisy / Фрося | Промокашка | Двоечник | Первоход | Новичок | Салага |

EN packs (future):

| Strategy | Classic | Street | Casino | Pirate |
|---|---|---|---|---|
| DEEP | Professor | Brains | Card Counter | Navigator |
| LIGHT | Scout | Quickie | Dealer | Lookout |
| SNIPER | Crow | Pickpocket | Hustler | Gunner |
| GREEDY | Mole | Rat | Loan Shark | Digger |
| POWER | Colonel | Bull | Bouncer | Captain |
| RANDOM | Daisy | Rookie | Lucky | Parrot |

---

## CURRENT VERSION: v5.8

- engine.js: all 6 strategies (STRATEGY_PICK dict)
- game.js: shared logic, all 3 modes, multi-bet, noise model, overround
- index.html v5.8: desktop, Bet&Wet with fighters and dynamic odds
- mobile.html v5.8m: touch, fullscreen, CLEAR BETS, two-column players
- 500K simulation data for all 4 grid configs confirmed
- 5% overround, per-fighter noise, weighted odds
- Totalizator verified profitable across all bet strategies

---

## COMPLETED

- [x] engine.js shared core with versioning + all 6 strategies
- [x] game.js extracted — zero JS duplication
- [x] Lobby v5.8 (mode/grid/rotation/stake/opponents/fighters)
- [x] Rotation (Rule E, 90° CW, 5s or click)
- [x] Bet&Wet: spectator mode, multi-bet, overround, fighter names, noise model
- [x] mobile.html: touch bets, fullscreen, CLEAR BETS, two-column players
- [x] 500K simulations for all 4 configs
- [x] Python simulator (noisore_sim.py) with noise support
- [x] Totalizator verifier (betwet_verify.py + verify_all.bat)
- [x] Both pitches updated (EN + RU)
- [x] All contrast fixes
- [x] Power tags: visible on channel (black+white glow)

## PENDING

- [ ] Telegram Mini App интеграция
- [ ] Pari-mutuel (тотализатор) production model — live odds from all bets
- [ ] Medium статья 7 (Erosion → Noisore story)
- [ ] Reddit r/WebGames, Itch.io
- [ ] DM Martin Zakovec (GAMEE CEO) — when demo is polished
- [ ] Wizard of Vegas registration
- [ ] Fighter skins (alternative name packs: Street, School, Prison)
- [ ] Update PROJECT.md with latest simulation data periodically

---

## CONTACT

constr@gmail.com · @constrik (Telegram) · Uncloned Math
