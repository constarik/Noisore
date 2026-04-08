// EROSION ENGINE v1.0 — shared core for Erosion/Noisore/WetBet
// Requires globals: ROWS, COLS, MAX_DROP, grid
var ENGINE_VERSION = 1;

function requireEngine(minVersion) {
    if (ENGINE_VERSION < minVersion) {
        throw new Error('Engine v' + ENGINE_VERSION + ' loaded, but v' + minVersion + '+ required. Update engine.js.');
    }
}

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

function pickSniper() {
    var best = 0, bestZ = -1;
    for (var c = 0; c < COLS; c++) {
        var z = 0;
        for (var r = 0; r < ROWS; r++) if (grid[r][c] === 0) z++;
        if (z > bestZ) { bestZ = z; best = c; }
    }
    return best;
}

function pickGreedy() {
    var best = 0, bestB = Infinity;
    for (var c = 0; c < COLS; c++) {
        var b = 0;
        for (var r = 0; r < ROWS; r++) if (grid[r][c] > 0) b++;
        if (b < bestB) { bestB = b; best = c; }
    }
    return best;
}

function pickDeep(dropPower) {
    var bestCol = 0, bestDepth = -1;
    for (var c = 0; c < COLS; c++) {
        var g2 = [];
        for (var rr = 0; rr < ROWS; rr++) g2[rr] = grid[rr].slice();
        var power = dropPower, col = c, depth = 0;
        for (var row = 0; row < ROWS && power > 0; row++) {
            if (g2[row][col] === 0) {
                depth = row;
                if (row < ROWS - 1) {
                    var cands = [];
                    for (var dc = -1; dc <= 1; dc++) { var nc = col + dc; if (nc >= 0 && nc < COLS) cands.push({c:nc, h:g2[row+1][nc]}); }
                    var nz = cands.filter(function(x){return x.h>0;});
                    if (nz.length === 0) col = cands[Math.floor(Math.random()*cands.length)].c;
                    else { var w=nz.map(function(x){return 1/x.h;}); var tw=w.reduce(function(a,b){return a+b;},0); var r2=Math.random()*tw; for(var i=0;i<nz.length;i++){r2-=w[i];if(r2<=0){col=nz[i].c;break;}} }
                }
                continue;
            }
            var h = g2[row][col];
            if (power >= h) { power -= h; g2[row][col] = 0; depth = row; }
            else { g2[row][col] -= power; power = 0; depth = row; }
            if (power > 0 && row < ROWS - 1) {
                var cands2 = [];
                for (var dc2 = -1; dc2 <= 1; dc2++) { var nc2 = col + dc2; if (nc2 >= 0 && nc2 < COLS) cands2.push({c:nc2, h:g2[row+1][nc2]}); }
                var nz2 = cands2.filter(function(x){return x.h>0;});
                if (nz2.length === 0) col = cands2[Math.floor(Math.random()*cands2.length)].c;
                else { var w2=nz2.map(function(x){return 1/x.h;}); var tw2=w2.reduce(function(a,b){return a+b;},0); var r3=Math.random()*tw2; for(var j=0;j<nz2.length;j++){r3-=w2[j];if(r3<=0){col=nz2[j].c;break;}} }
            }
        }
        if (depth > bestDepth) { bestDepth = depth; bestCol = c; }
    }
    return bestCol;
}

function pickPower(dropPower) {
    if (dropPower >= 7) return pickDeep(dropPower);
    return pickSniper();
}

function pickRandom() {
    return Math.floor(Math.random() * COLS);
}

var STRATEGY_PICK = {
    DEEP: function(dp) { return pickDeep(dp); },
    LIGHT: function(dp) { return pickLight(); },
    SNIPER: function(dp) { return pickSniper(); },
    GREEDY: function(dp) { return pickGreedy(); },
    POWER: function(dp) { return pickPower(dp); },
    RANDOM: function(dp) { return pickRandom(); }
};

// --- UTILITY ---
function sleep(ms) {
    return new Promise(function(r) { setTimeout(r, ms); });
}
