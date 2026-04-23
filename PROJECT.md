# NOISORE — Project Document

**Version:** 11.7
**Updated:** April 2026
**Author:** Constantin Razinsky / Uncloned Math
**Repository:** [github.com/constarik/Noisore](https://github.com/constarik/Noisore)
**Live:** [noisore.uncloned.work](https://noisore.uncloned.work)

---

## 1. Product Universe

NOISORE is a water-erosion arcade game universe with three products sharing one engine:

| Product | EN Name | RU Name | Mode | UVS Granularity |
|---------|---------|---------|------|-----------------|
| EROSION | Erosion | КАПЕЛЬКА | Solo — player vs grid | Move Batch (G=ALL) |
| SOIRON | Soiron | РУССЛО | PvP — player vs bots | Move Batch (G=ALL) |
| BET&WET | Bet & Wet | МОКРИЦА | Bot racing — player bets | Stateless-like |

**Core mechanic:** Drop water on a grid of stones. Water erodes stones (reduces height). Create a continuous channel from top to bottom = win.

---

## 2. Architecture

```
engine.js  v1.1  — grid physics, strategies, rotation, channel detection, gameRng() pluggable
game.js    v11.7 — lobby, animation, UVS session, all 3 modes, noise model, sound
beach.js         — Canvas2D tropical beach background scene
tutorial.js      — onboarding tutorials for all 3 modes (seeded LCG RNG)
uvs.browser.js   — UVS v2 browser bundle (SHA-256/512, ChaCha20, seed protocol)
verify.html      — independent replay/verification page
index.html       — desktop CSS + HTML shell
mobile.html      — mobile CSS + HTML shell (Telegram Mini App ready)
```

### Engine (engine.js v1.1)

- `gameRng()` — pluggable RNG: `_uvsRng.nextFloat()` when UVS active, `Math.random()` fallback
- `chooseNext(row, col)` — water flow: weighted random by inverse stone height
- `rotateGridCW()` — 90° clockwise grid rotation (Rule E)
- `fillRowIfChannel()` — anti-premature-channel: fills random row if channel exists after rotation
- `hasChannel() / findChannelCells()` — DFS channel detection top→bottom
- `pickDeep/pickLight/pickSniper/pickGreedy/pickPower/pickRandom` — bot strategies

### Game Modes

**EROSION (solo):** Player picks column, drops water. No bots. Rotation after each drop (optional). Win = channel.

**SOIRON (PvP):** Player + N bots. Each round: all players drop simultaneously (shuffled order). Rotation after all drops. First to create channel wins pool.

**BET&WET (racing):** 6 bot fighters with strategies + noise. Player places bets on fighters. ▶ START RACE button shows grid before race begins. Fighters drop in shuffled order each cycle. Winner's bettor gets payout × odds.

---

## 3. UVS Integration (v11.0–v11.7)

**Protocol:** UVS v2 — Uncloned Verification Standard
**SDK:** [@constarik/uvs-sdk v2.0.0](https://github.com/constarik/uvs-sdk) (GitHub Packages)
**Spec:** [uvs.uncloned.work](https://uvs.uncloned.work)

### How it works

1. **`uvsStart()`** — on game/round start: generates serverSeed (32 bytes, crypto.getRandomValues), clientSeed (`noisore-{timestamp}`), derives combinedSeed via SHA-512, creates ChaCha20 PRNG
2. **`gameRng()`** — all game-logic randomness goes through ChaCha20 (grid init, drops, strategies, rotation fills, shuffles). Sound stays on Math.random()
3. **`uvsRecordMove()`** — EROSION: records `{tick, col, dp, rngPos}`. BET&WET: records `{tick, fighter, col, dp, rngPos}`. Rotations: records `{type:'rotate', rngPos}`
4. **`uvsEnd(winner)`** — logs serverSeed reveal + SHA-256 verification to console. Guard prevents duplicate calls
5. **🔒 Verify button** — appears in payout area after win. Shows: serverSeedHash, serverSeed (revealed), clientSeed, RNG calls, moves count, SHA-256 check (✓ VERIFIED)
6. **Replay → link** — opens verify.html with pre-filled URL params

### verify.html — Independent Replay

Standalone page at `noisore.uncloned.work/verify.html`. Input: serverSeed, clientSeed, nonce, gridSize, rotate, moves (JSON). Auto-fills from URL params. Auto-replays if all params present.

**Move formats:**
- Simple: `[2, 4, 0]` — column indices only (EROSION solo, no bots)
- Rich: `[[col, dp, rngPos], [-1, 0, rngPos], ...]` — col/dp/rngPos per drop, `col=-1` = rotation event

**Replay process:**
1. Derive combinedSeed → create ChaCha20
2. Generate initial grid (same RNG)
3. For each move: fast-forward RNG to rngPos → simDrop(col, dp) or rotateGridCW()
4. Check channel after each drop
5. Display: initial grid, step-by-step log (wash/flow/hit/rotate), final grid with channel highlighted

### Tutorial Safety

`TUT.active` → `uvsStart()` skips UVS. Tutorial uses its own seeded LCG RNG for deterministic demos.

### Info Badge

`info-right` shows: `"free play • 🔒 UVS"` or `"1.00 USDT/drop • 🔒 UVS"` depending on mode.

---

## 4. Lobby System (v3.x)

Configurable via UI:
- **Mode:** EROSION / SOIRON / BET&WET
- **Grid size:** 4–10 (square)
- **Rotation:** on/off
- **Stake:** 0 (free) / 0.5 / 1 / 2 / 5 USDT per drop
- **Bots:** 0–5 (SOIRON)
- **Hints:** strategy names shown

---

## 5. Tutorial System (v10.x)

Three tutorials, one per mode. Uses real engine with seeded LCG RNG for deterministic playthrough.

**EROSION tutorial** (seed 17, 3 turns): preset grid → col2 → rotate → col6 → rotate → col5 → channel!

**SOIRON tutorial** (seed 9, 4 players, 3 turns): YOU + 3 bots, real PvP round mechanics.

**BET&WET tutorial** (seed 42, 6 steps): hides all lobby controls, guides through bet placement (tap/right-click-remove), then PLAY with real race.

---

## 6. Fighter System (BET&WET)

6 fighters per session, randomly selected skin pack. Each fighter has:
- **Strategy:** DEEP, LIGHT, SNIPER, GREEDY, POWER, RANDOM
- **Noise:** 20–50% (strategy switch probability)
- **Odds:** calculated from strategy strength

Strategies ordered by strength: DEEP > LIGHT > SNIPER > GREEDY > POWER > RANDOM.

---

## 7. Files & Deployment

| Asset | URL |
|-------|-----|
| Demo desktop | noisore.uncloned.work |
| Demo mobile | noisore.uncloned.work/mobile.html |
| Verifier | noisore.uncloned.work/verify.html |
| UVS landing | uvs.uncloned.work |
| UVS SDK | github.com/constarik/uvs-sdk |
| GitHub | github.com/constarik/Noisore |

**Deployment:** GitHub Pages (auto-deploy on push). No server required for current version.

---

## 8. Version History

| Version | What |
|---------|------|
| v1–v8 | Core engine, lobby, modes, beach scene, mobile, sound |
| v9.2 | fitGrid viewport fix |
| v9.3–v10.9 | Tutorial system (3 modes), PLAY disabled without bets, player order in BET&WET |
| v11.0 | UVS integration: gameRng() → ChaCha20, uvs.browser.js |
| v11.1 | 🔒 Verify button with seed reveal + SHA-256 check |
| v11.2 | Badge in all modes, uvsEnd guard |
| v11.3 | BET&WET moves recording |
| v11.4 | verify.html — independent replay page |
| v11.5 | rngPos sync — fast-forward RNG for bot strategies |
| v11.6 | ▶ START RACE button in BET&WET |
| v11.7 | Rotation events in moves log — final grid matches |

---

## 9. Roadmap

- [ ] Multiplayer SOIRON — server on Render (Move Sync G=1)
- [ ] Audit Trail stateHash per move
- [ ] Medium article #7 — UVS 2.0
- [ ] npm publish @uncloned/uvs (pending 2FA)
- [ ] RU skin packs
- [ ] Ambient surf sound from beach.js
- [ ] Mobile testing
