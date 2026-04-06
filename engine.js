// EROSION ENGINE v1.0 — shared core for Erosion/Noisore/WetBet
// Requires globals: ROWS, COLS, MAX_DROP, grid

// --- WATER FLOW ---
function chooseNext(row, col) {
    var cands = [];
    for (var dc = -1; dc <= 1; dc++) {
        var nc = col + dc;
        if (nc >= 0 && nc < COLS) cands.push({ c: nc, h: grid[row + 1][nc] });
    }
    var nz = cands.filter(function(x) { return x.h > 0; });
    if (nz.length === 0) return cands[Math.floor(Math.random() * cands.length)].c;
    var w = nz.map(function(x) { return 1 / x.h; });
    var tw = w.reduce(function(a, b) { return a + b; }, 0);
    var r = Math.random() * tw;
    for (var i = 0; i < nz.length; i++) {
        r -= w[i];
        if (r <= 0) return nz[i].c;
    }
    return nz[nz.length - 1].c;
}

// --- CHANNEL DETECTION ---
function findChannelCells() {
    var ch = {};
    for (var c = 0; c < COLS; c++) {
        if (grid[0][c] === 0) {
            var path = [];
            if (dfsCollect(0, c, {}, path)) {
                for (var i = 0; i < path.length; i++) ch[path[i]] = true;
            }
        }
    }
    return ch;
}

function dfsCollect(row, col, vis, path) {
    var k = row + '-' + col;
    if (vis[k]) return false;
    vis[k] = true;
    if (grid[row][col] !== 0) return false;
    path.push(k);
    if (row === ROWS - 1) return true;
    var found = false;
    for (var dc = -1; dc <= 1; dc++) {
        var nc = col + dc;
        if (nc >= 0 && nc < COLS) {
            var before = path.length;
            if (dfsCollect(row + 1, nc, vis, path)) found = true;
            else path.length = before;
        }
    }
    if (!found) path.pop();
    return found;
}

function hasChannel() {
    for (var c = 0; c < COLS; c++) {
        if (grid[0][c] === 0) {
            var vis = {};
            if (_dfsCheck(0, c, vis)) return true;
        }
    }
    return false;
}

function _dfsCheck(row, col, vis) {
    var k = row + '-' + col;
    if (vis[k]) return false;
    vis[k] = true;
    if (grid[row][col] !== 0) return false;
    if (row === ROWS - 1) return true;
    for (var dc = -1; dc <= 1; dc++) {
        var nc = col + dc;
        if (nc >= 0 && nc < COLS) {
            if (_dfsCheck(row + 1, nc, vis)) return true;
        }
    }
    return false;
}

// --- RANDOM ---
function randDrop() {
    return 1 + Math.floor(Math.random() * MAX_DROP);
}

// --- STRATEGIES ---
function pickLight() {
    var b = 0, bs = Infinity;
    for (var c = 0; c < COLS; c++) {
        var s = 0;
        for (var r = 0; r < ROWS; r++) s += grid[r][c];
        if (s < bs) { bs = s; b = c; }
    }
    return b;
}

// --- ROTATION (Rule E) ---
// Requires square grid (ROWS === COLS)
function rotateGridCW() {
    var S = ROWS;
    var ng = [];
    for (var r = 0; r < S; r++) {
        ng[r] = [];
        for (var c = 0; c < S; c++) {
            ng[r][c] = grid[S - 1 - c][r];
        }
    }
    grid = ng;
}

function fillRowIfChannel() {
    var fills = 0;
    while (hasChannel()) {
        var row = Math.floor(Math.random() * ROWS);
        for (var c = 0; c < COLS; c++) grid[row][c] = 1 + Math.floor(Math.random() * MAX_H);
        fills++;
        if (fills > 10) break;
    }
    return fills;
}

// --- UTILITY ---
function sleep(ms) {
    return new Promise(function(r) { setTimeout(r, ms); });
}
