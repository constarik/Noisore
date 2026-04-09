"""
NOISORE Tournament Simulator
Usage:
  python noisore_sim.py                        # default: 6-player tournament, 50K rounds, 6x6
  python noisore_sim.py --rounds 200000        # more rounds
  python noisore_sim.py --grid 8 --rotate      # 8x8 with rotation
  python noisore_sim.py --mode duel            # 1v1 duels (each strategy vs RANDOM)
  python noisore_sim.py --mode all             # both duel and tournament
  python noisore_sim.py --grid 6 --grid 8 --rotate --no-rotate --mode all  # full matrix
"""

import random
import argparse
import time
import sys
from copy import deepcopy

# === GRID & PHYSICS ===

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

def pick_random(grid, drop_power, rows, cols):
    return random.randint(0, cols-1)

def pick_light(grid, drop_power, rows, cols):
    best, best_sum = 0, float('inf')
    for c in range(cols):
        s = sum(grid[r][c] for r in range(rows))
        if s < best_sum:
            best_sum = s
            best = c
    return best

def pick_sniper(grid, drop_power, rows, cols):
    best, best_zeros = 0, -1
    for c in range(cols):
        z = sum(1 for r in range(rows) if grid[r][c] == 0)
        if z > best_zeros:
            best_zeros = z
            best = c
    return best

def pick_greedy(grid, drop_power, rows, cols):
    best, best_blockers = 0, float('inf')
    for c in range(cols):
        b = sum(1 for r in range(rows) if grid[r][c] > 0)
        if b < best_blockers:
            best_blockers = b
            best = c
    return best

def pick_deep(grid, drop_power, rows, cols):
    best_col, best_depth = 0, -1
    for c in range(cols):
        g2 = deepcopy(grid)
        power = drop_power
        col = c
        depth = 0
        for row in range(rows):
            if power <= 0:
                break
            if g2[row][col] == 0:
                depth = row
                if row < rows - 1:
                    col = choose_next(g2, row, col, rows, cols)
                continue
            h = g2[row][col]
            if power >= h:
                power -= h
                g2[row][col] = 0
                depth = row
            else:
                g2[row][col] -= power
                power = 0
                depth = row
            if power > 0 and row < rows - 1:
                col = choose_next(g2, row, col, rows, cols)
        if depth > best_depth:
            best_depth = depth
            best_col = c
    return best_col

def pick_power(grid, drop_power, rows, cols):
    if drop_power >= 7:
        return pick_deep(grid, drop_power, rows, cols)
    else:
        return pick_sniper(grid, drop_power, rows, cols)

STRATEGIES = [
    ('DEEP',   pick_deep),
    ('LIGHT',  pick_light),
    ('SNIPER', pick_sniper),
    ('GREEDY', pick_greedy),
    ('POWER',  pick_power),
    ('RANDOM', pick_random),
]

def noise_pick(pick_fn, name, grid, drop_power, rows, cols, noise):
    if isinstance(noise, dict):
        n = noise.get(name, 0)
    else:
        n = noise
    if n <= 0:
        return pick_fn(grid, drop_power, rows, cols)
    if name == 'RANDOM':
        if random.random() < n:
            return pick_deep(grid, drop_power, rows, cols)
        return pick_random(grid, drop_power, rows, cols)
    if random.random() < n:
        return pick_random(grid, drop_power, rows, cols)
    return pick_fn(grid, drop_power, rows, cols)

BET_NOISE_PROFILE = {
    'DEEP': 0.10,
    'LIGHT': 0.20,
    'SNIPER': 0.25,
    'GREEDY': 0.25,
    'POWER': 0.15,
    'RANDOM': 0.40
}

# === SIMULATION ===

def run_tournament(rounds, rows, cols, rotate, noise=0, max_h=10, max_drop=10, max_cycles=200):
    wins = {name: 0 for name, _ in STRATEGIES}
    draws = 0
    t0 = time.time()
    
    for rnd in range(rounds):
        if rnd > 0 and rnd % 10000 == 0:
            elapsed = time.time() - t0
            rps = rnd / elapsed
            eta = (rounds - rnd) / rps
            sys.stdout.write(f"\r  {rnd}/{rounds} ({rps:.0f} rnd/s, ETA {eta:.0f}s)")
            sys.stdout.flush()
        
        grid = init_grid(rows, cols, max_h)
        winner = None
        
        for cycle in range(max_cycles):
            order = list(range(len(STRATEGIES)))
            random.shuffle(order)
            
            for idx in order:
                name, pick_fn = STRATEGIES[idx]
                dp = random.randint(1, max_drop)
                col = noise_pick(pick_fn, name, grid, dp, rows, cols, noise)
                simulate_drop(grid, col, dp, rows, cols)
                if has_channel(grid, rows, cols):
                    winner = name
                    break
            
            if winner:
                break
            
            if rotate:
                grid = rotate_cw(grid, rows)
                if has_channel(grid, rows, cols):
                    fill_if_channel(grid, rows, cols, max_h)
        
        if winner:
            wins[winner] += 1
        else:
            draws += 1
    
    elapsed = time.time() - t0
    sys.stdout.write(f"\r  {rounds}/{rounds} done in {elapsed:.1f}s\n")
    return wins, draws, elapsed

def run_duels(rounds, rows, cols, rotate, noise=0, max_h=10, max_drop=10, max_cycles=200):
    results = {}
    
    for name, pick_fn in STRATEGIES:
        if name == 'RANDOM':
            continue
        
        strat_wins = 0
        rand_wins = 0
        t0 = time.time()
        
        for rnd in range(rounds):
            if rnd > 0 and rnd % 10000 == 0:
                elapsed = time.time() - t0
                rps = rnd / elapsed
                eta = (rounds - rnd) / rps
                sys.stdout.write(f"\r  {name} vs RANDOM: {rnd}/{rounds} ({rps:.0f} rnd/s, ETA {eta:.0f}s)")
                sys.stdout.flush()
            
            grid = init_grid(rows, cols, max_h)
            winner = None
            players = [(name, pick_fn), ('RANDOM', pick_random)]
            
            for cycle in range(max_cycles):
                order = [0, 1]
                random.shuffle(order)
                
                for idx in order:
                    pname, pfn = players[idx]
                    dp = random.randint(1, max_drop)
                    col = noise_pick(pfn, pname, grid, dp, rows, cols, noise)
                    simulate_drop(grid, col, dp, rows, cols)
                    if has_channel(grid, rows, cols):
                        winner = pname
                        break
                
                if winner:
                    break
                
                if rotate:
                    grid = rotate_cw(grid, rows)
                    if has_channel(grid, rows, cols):
                        fill_if_channel(grid, rows, cols, max_h)
            
            if winner == name:
                strat_wins += 1
            elif winner == 'RANDOM':
                rand_wins += 1
        
        elapsed = time.time() - t0
        results[name] = (strat_wins, rand_wins, rounds - strat_wins - rand_wins, elapsed)
        pct = strat_wins / rounds * 100
        sys.stdout.write(f"\r  {name} vs RANDOM: {pct:.1f}% - {100-pct:.1f}% ({elapsed:.1f}s)\n")
    
    return results

# === MAIN ===

def main():
    parser = argparse.ArgumentParser(description='NOISORE Tournament Simulator')
    parser.add_argument('--rounds', type=int, default=50000, help='Number of rounds (default: 50000)')
    parser.add_argument('--grid', type=int, nargs='+', default=[6], help='Grid sizes (default: 6)')
    parser.add_argument('--rotate', action='store_true', default=False, help='Enable rotation')
    parser.add_argument('--no-rotate', action='store_true', default=False, help='Disable rotation')
    parser.add_argument('--mode', choices=['tournament', 'duel', 'all'], default='all', help='Simulation mode')
    parser.add_argument('--noise', default='0', help='Noise: 0, float (uniform), or "bet" for per-strategy profile')
    parser.add_argument('--seed', type=int, default=None, help='Random seed')
    args = parser.parse_args()
    
    if args.seed is not None:
        random.seed(args.seed)
    else:
        seed = int(time.time())
        random.seed(seed)
        print(f"Seed: {seed}")
    
    if args.noise == 'bet':
        noise_val = BET_NOISE_PROFILE
        noise_label = 'bet-profile'
    else:
        noise_val = float(args.noise)
        noise_label = str(noise_val) if noise_val > 0 else None
    
    rotations = []
    if args.rotate and not args.no_rotate:
        rotations = [True]
    elif args.no_rotate and not args.rotate:
        rotations = [False]
    else:
        rotations = [False, True]
    
    print(f"\n{'='*60}")
    print(f"NOISORE SIMULATOR — {args.rounds} rounds" + (f", noise={noise_label}" if noise_label else ""))
    print(f"{'='*60}")
    
    for grid_size in args.grid:
        for rotate in rotations:
            rot_str = "rotation ON" if rotate else "rotation OFF"
            print(f"\n--- {grid_size}x{grid_size} {rot_str} ---")
            
            if args.mode in ('duel', 'all'):
                print(f"\n1v1 DUELS (each vs RANDOM):")
                results = run_duels(args.rounds, grid_size, grid_size, rotate, noise=noise_val)
                print(f"\n{'Strategy':<10} {'Wins':>8} {'%':>8} {'RANDOM':>8} {'%':>8}")
                print("-" * 50)
                for name in ['DEEP', 'LIGHT', 'SNIPER', 'GREEDY', 'POWER']:
                    sw, rw, dr, el = results[name]
                    sp = sw / args.rounds * 100
                    rp = rw / args.rounds * 100
                    print(f"{name:<10} {sw:>8} {sp:>7.1f}% {rw:>8} {rp:>7.1f}%")
            
            if args.mode in ('tournament', 'all'):
                print(f"\n6-PLAYER TOURNAMENT:")
                wins, draws, elapsed = run_tournament(args.rounds, grid_size, grid_size, rotate, noise=noise_val)
                print(f"\n{'Strategy':<10} {'Wins':>8} {'%':>8} {'vs Fair':>10}")
                print("-" * 40)
                fair = 100.0 / len(STRATEGIES)
                for name in ['DEEP', 'POWER', 'GREEDY', 'SNIPER', 'LIGHT', 'RANDOM']:
                    w = wins[name]
                    pct = w / args.rounds * 100
                    edge = pct / fair * 100 - 100
                    print(f"{name:<10} {w:>8} {pct:>7.1f}% {edge:>+9.0f}%")
                if draws > 0:
                    print(f"{'DRAWS':<10} {draws:>8}")
    
    print(f"\n{'='*60}")
    print("Done.")

if __name__ == '__main__':
    main()
