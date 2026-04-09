"""
Bet&Wet Totalizator Verifier
Simulates betting rounds and checks house edge.

Usage:
  python betwet_verify.py                          # default noise, 10K rounds, all configs
  python betwet_verify.py --rounds 50000           # more rounds
  python betwet_verify.py --noise 10,20,25,25,15,40  # custom noise per fighter
  python betwet_verify.py --overround 1.05         # 5% overround
  python betwet_verify.py --grid 6 --rotate        # single config
  python betwet_verify.py --bet-strategy uniform    # bet equally on all
  python betwet_verify.py --bet-strategy favorite   # always bet on best odds
  python betwet_verify.py --bet-strategy longshot   # always bet on Daisy
  python betwet_verify.py --bet-strategy random     # random single bet each round
"""

import random
import argparse
import time
import sys
from copy import deepcopy

# === GRID & PHYSICS (same as noisore_sim.py) ===

def rand_h(max_h=10):
    return random.randint(1, max_h)

def init_grid(rows, cols, max_h=10):
    return [[rand_h(max_h) for _ in range(cols)] for _ in range(rows)]

def choose_next(grid, row, col, rows, cols):
    cands = []
    for dc in [-1, 0, 1]:
        nc = col + dc
        if 0 <= nc < cols:
            cands.append((nc, grid[row+1][nc]))
    nz = [(c, h) for c, h in cands if h > 0]
    if not nz:
        return random.choice(cands)[0]
    weights = [1.0/h for c, h in nz]
    tw = sum(weights)
    r = random.random() * tw
    for i, (c, h) in enumerate(nz):
        r -= weights[i]
        if r <= 0:
            return c
    return nz[-1][0]

def simulate_drop(grid, col, drop_power, rows, cols):
    power = drop_power
    c = col
    for row in range(rows):
        if power <= 0:
            break
        if grid[row][c] == 0:
            if row < rows - 1:
                c = choose_next(grid, row, c, rows, cols)
            continue
        h = grid[row][c]
        if power >= h:
            power -= h
            grid[row][c] = 0
        else:
            grid[row][c] -= power
            power = 0
        if power > 0 and row < rows - 1:
            c = choose_next(grid, row, c, rows, cols)

def has_channel(grid, rows, cols):
    for c in range(cols):
        if grid[0][c] == 0 and _dfs(grid, 0, c, set(), rows, cols):
            return True
    return False

def _dfs(grid, row, col, vis, rows, cols):
    key = (row, col)
    if key in vis:
        return False
    vis.add(key)
    if grid[row][col] != 0:
        return False
    if row == rows - 1:
        return True
    for dc in [-1, 0, 1]:
        nc = col + dc
        if 0 <= nc < cols:
            if _dfs(grid, row+1, nc, vis, rows, cols):
                return True
    return False

def rotate_cw(grid, size):
    return [[grid[size-1-c][r] for c in range(size)] for r in range(size)]

def fill_if_channel(grid, rows, cols, max_h=10):
    fills = 0
    while has_channel(grid, rows, cols):
        row = random.randint(0, rows-1)
        for c in range(cols):
            grid[row][c] = rand_h(max_h)
        fills += 1
        if fills > 10:
            break

# === STRATEGIES ===

def pick_random(grid, dp, rows, cols):
    return random.randint(0, cols-1)

def pick_light(grid, dp, rows, cols):
    best, best_sum = 0, float('inf')
    for c in range(cols):
        s = sum(grid[r][c] for r in range(rows))
        if s < best_sum:
            best_sum = s; best = c
    return best

def pick_sniper(grid, dp, rows, cols):
    best, best_zeros = 0, -1
    for c in range(cols):
        z = sum(1 for r in range(rows) if grid[r][c] == 0)
        if z > best_zeros:
            best_zeros = z; best = c
    return best

def pick_greedy(grid, dp, rows, cols):
    best, best_b = 0, float('inf')
    for c in range(cols):
        b = sum(1 for r in range(rows) if grid[r][c] > 0)
        if b < best_b:
            best_b = b; best = c
    return best

def pick_deep(grid, dp, rows, cols):
    best_col, best_depth = 0, -1
    for c in range(cols):
        g2 = [row[:] for row in grid]
        power, col, depth = dp, c, 0
        for row in range(rows):
            if power <= 0: break
            if g2[row][col] == 0:
                depth = row
                if row < rows-1: col = choose_next(g2, row, col, rows, cols)
                continue
            h = g2[row][col]
            if power >= h:
                power -= h; g2[row][col] = 0; depth = row
            else:
                g2[row][col] -= power; power = 0; depth = row
            if power > 0 and row < rows-1:
                col = choose_next(g2, row, col, rows, cols)
        if depth > best_depth:
            best_depth = depth; best_col = c
    return best_col

def pick_power(grid, dp, rows, cols):
    return pick_deep(grid, dp, rows, cols) if dp >= 7 else pick_sniper(grid, dp, rows, cols)

FIGHTERS = [
    {'name': 'Professor', 'strat': 'DEEP',   'pick': pick_deep},
    {'name': 'Scout',     'strat': 'LIGHT',  'pick': pick_light},
    {'name': 'Crow',      'strat': 'SNIPER', 'pick': pick_sniper},
    {'name': 'Mole',      'strat': 'GREEDY', 'pick': pick_greedy},
    {'name': 'Colonel',   'strat': 'POWER',  'pick': pick_power},
    {'name': 'Daisy',     'strat': 'RANDOM', 'pick': pick_random},
]

PURE_DATA = {
    '6-off': [19.9, 17.0, 18.7, 18.8, 19.8, 5.9],
    '6-on':  [18.8, 19.2, 17.9, 17.8, 18.1, 8.2],
    '8-off': [19.8, 17.5, 18.8, 18.8, 19.7, 5.5],
    '8-on':  [19.4, 18.7, 18.5, 18.4, 18.9, 6.1],
}

# === NOISE-WEIGHTED ODDS ===

def calc_effective_pcts(pure, noise_list):
    daisy_idx = 5
    daisy_pure = pure[daisy_idx]
    avg_others = sum(pure[i] for i in range(len(pure)) if i != daisy_idx) / (len(pure) - 1)
    
    eff = []
    for i in range(len(pure)):
        n = noise_list[i] / 100.0
        if i == daisy_idx:
            eff.append(daisy_pure * (1 - n) + avg_others * n)
        else:
            eff.append(pure[i] * (1 - n) + daisy_pure * n)
    
    total = sum(eff)
    return [e / total * 100 for e in eff]

def calc_odds(eff_pcts, overround):
    return [round(100 / p / overround, 2) for p in eff_pcts]

# === NOISE PICK (same model as game.js) ===

def noise_pick(fighter_idx, grid, dp, rows, cols, noise_list):
    n = noise_list[fighter_idx] / 100.0
    if fighter_idx == 5:  # Daisy
        if random.random() < n:
            # pick random other strategy
            other = random.choice([0,1,2,3,4])
            return FIGHTERS[other]['pick'](grid, dp, rows, cols)
        return pick_random(grid, dp, rows, cols)
    else:
        if random.random() < n:
            return pick_random(grid, dp, rows, cols)
        return FIGHTERS[fighter_idx]['pick'](grid, dp, rows, cols)

# === SIMULATION ===

def run_betwet_verify(rounds, rows, cols, rotate, noise_list, overround,
                      bet_strategy='uniform', max_h=10, max_drop=10, max_cycles=200):
    
    key = f"{rows}-{'on' if rotate else 'off'}"
    pure = PURE_DATA[key]
    eff_pcts = calc_effective_pcts(pure, noise_list)
    odds = calc_odds(eff_pcts, overround)
    
    # Stats
    wins_count = [0] * 6
    total_wagered = 0.0
    total_paid = 0.0
    
    t0 = time.time()
    
    for rnd in range(rounds):
        if rnd > 0 and rnd % 2000 == 0:
            elapsed = time.time() - t0
            rps = rnd / elapsed
            eta = (rounds - rnd) / rps
            sys.stdout.write(f"\r  {rnd}/{rounds} ({rps:.0f} rnd/s, ETA {eta:.0f}s)")
            sys.stdout.flush()
        
        # --- Place bets ---
        bets = [0.0] * 6
        if bet_strategy == 'uniform':
            bets = [1.0] * 6
        elif bet_strategy == 'favorite':
            best_idx = min(range(6), key=lambda i: odds[i])
            bets[best_idx] = 1.0
        elif bet_strategy == 'longshot':
            bets[5] = 1.0  # Daisy
        elif bet_strategy == 'random':
            bets[random.randint(0, 5)] = 1.0
        elif bet_strategy == 'weighted':
            for i in range(6):
                bets[i] = odds[i] / sum(odds)
        elif bet_strategy == 'mix':
            # random mix each round: 1-3 random fighters, 1-3 bets each
            n_fighters = random.randint(1, 3)
            chosen = random.sample(range(6), n_fighters)
            for idx in chosen:
                bets[idx] = random.randint(1, 3) * 1.0
        
        wagered = sum(bets)
        total_wagered += wagered
        
        # --- Run round ---
        grid = init_grid(rows, cols, max_h)
        winner = None
        
        for cycle in range(max_cycles):
            order = list(range(6))
            random.shuffle(order)
            
            for idx in order:
                dp = random.randint(1, max_drop)
                col = noise_pick(idx, grid, dp, rows, cols, noise_list)
                simulate_drop(grid, col, dp, rows, cols)
                if has_channel(grid, rows, cols):
                    winner = idx
                    break
            
            if winner is not None:
                break
            
            if rotate:
                grid = rotate_cw(grid, rows)
                if has_channel(grid, rows, cols):
                    fill_if_channel(grid, rows, cols, max_h)
        
        if winner is not None:
            wins_count[winner] += 1
            payout = bets[winner] * odds[winner]
            total_paid += payout
    
    elapsed = time.time() - t0
    sys.stdout.write(f"\r  {rounds}/{rounds} done in {elapsed:.1f}s\n")
    
    return {
        'wins': wins_count,
        'total_wagered': total_wagered,
        'total_paid': total_paid,
        'eff_pcts': eff_pcts,
        'odds': odds,
        'pure': pure,
        'elapsed': elapsed,
    }

# === MAIN ===

def main():
    parser = argparse.ArgumentParser(description='Bet&Wet Totalizator Verifier')
    parser.add_argument('--rounds', type=int, default=10000)
    parser.add_argument('--grid', type=int, nargs='+', default=[6, 8])
    parser.add_argument('--rotate', action='store_true', default=False)
    parser.add_argument('--no-rotate', action='store_true', default=False)
    parser.add_argument('--noise', type=str, default='10,20,25,25,15,40',
                        help='Noise per fighter: Prof,Scout,Crow,Mole,Colonel,Daisy')
    parser.add_argument('--overround', type=float, default=1.05)
    parser.add_argument('--bet-strategy', choices=['uniform','favorite','longshot','random','weighted','mix'],
                        default='uniform')
    parser.add_argument('--seed', type=int, default=None)
    args = parser.parse_args()
    
    noise_list = [float(x) for x in args.noise.split(',')]
    assert len(noise_list) == 6, "Need exactly 6 noise values"
    
    if args.seed is not None:
        random.seed(args.seed)
    else:
        seed = int(time.time())
        random.seed(seed)
    
    rotations = []
    if args.rotate and not args.no_rotate:
        rotations = [True]
    elif args.no_rotate and not args.rotate:
        rotations = [False]
    else:
        rotations = [False, True]
    
    names = [f['name'] for f in FIGHTERS]
    
    print(f"\n{'='*70}")
    print(f"BET&WET TOTALIZATOR VERIFIER")
    print(f"Rounds: {args.rounds} | Overround: {args.overround} | Strategy: {args.bet_strategy}")
    print(f"Noise: {dict(zip(names, noise_list))}")
    print(f"{'='*70}")
    
    for grid_size in args.grid:
        for rotate in rotations:
            rot_str = "rotation ON" if rotate else "rotation OFF"
            key = f"{grid_size}-{'on' if rotate else 'off'}"
            pure = PURE_DATA[key]
            
            print(f"\n--- {grid_size}x{grid_size} {rot_str} ---")
            
            res = run_betwet_verify(
                args.rounds, grid_size, grid_size, rotate,
                noise_list, args.overround, args.bet_strategy
            )
            
            print(f"\n{'Fighter':<12} {'Pure%':>6} {'Eff%':>6} {'Odds':>6} {'SimWin%':>8} {'Wins':>7}")
            print("-" * 55)
            for i in range(6):
                sim_pct = res['wins'][i] / args.rounds * 100
                print(f"{names[i]:<12} {pure[i]:>5.1f}% {res['eff_pcts'][i]:>5.1f}% {res['odds'][i]:>5.1f}x {sim_pct:>7.1f}% {res['wins'][i]:>7}")
            
            house_edge = (1 - res['total_paid'] / res['total_wagered']) * 100 if res['total_wagered'] > 0 else 0
            print(f"\n  Wagered:  {res['total_wagered']:>10.2f} USDT")
            print(f"  Paid out: {res['total_paid']:>10.2f} USDT")
            print(f"  Profit:   {res['total_wagered'] - res['total_paid']:>10.2f} USDT")
            print(f"  House edge: {house_edge:>6.2f}%")
            profit_status = "PROFITABLE" if house_edge > 0 else "LOSS!"
            print(f"  Status: {profit_status}")
    
    print(f"\n{'='*70}")
    print("Done.")

if __name__ == '__main__':
    main()
