/**
 * NOISORE Multiplayer Client — SOIRON mode
 * WebSocket connection to registrar-server
 * UVS v2 Move Sync G=1
 */

var MP = {
  ws: null,
  connected: false,
  roomId: null,
  playerId: null,
  isHost: false,
  players: [],
  tick: 0,
  dropPower: 0,
  moveSent: false,
  SERVER: 'wss://registrar-server.onrender.com',
  active: false,
  countdown: 0,
  countdownTimer: null,
  processing: false,
  msgQueue: []
};

// --- WebSocket ---
function mpConnect(callback) {
  if (MP.ws && MP.ws.readyState === 1) { if (callback) callback(); return; }
  MP.ws = new WebSocket(MP.SERVER);
  MP.ws.onopen = function() {
    MP.connected = true;
    console.log('[MP] Connected to', MP.SERVER);
    if (callback) callback();
  };
  MP.ws.onclose = function() {
    MP.connected = false; MP.active = false;
    console.log('[MP] Disconnected');
  };
  MP.ws.onerror = function(e) { console.error('[MP] Error', e); };
  MP.ws.onmessage = function(e) {
    var msg; try { msg = JSON.parse(e.data); } catch { return; }
    mpHandleMessage(msg);
  };
}

function mpSend(msg) {
  if (MP.ws && MP.ws.readyState === 1) MP.ws.send(JSON.stringify(msg));
}

// --- Message Handler ---
function mpHandleMessage(msg) {
  // Queue tick and game_end messages during animation
  if (MP.processing && (msg.type === 'tick_start' || msg.type === 'tick_result' || msg.type === 'game_end')) {
    MP.msgQueue.push(msg);
    return;
  }
  mpProcessMessage(msg);
}

async function mpProcessQueue() {
  while (MP.msgQueue.length > 0) {
    var next = MP.msgQueue.shift();
    await mpProcessMessage(next);
  }
}

async function mpProcessMessage(msg) {
  console.log('[MP]', msg.type, msg);
  switch (msg.type) {
    case 'room_created':
      MP.roomId = msg.roomId; MP.playerId = msg.playerId; MP.isHost = true;
      mpShowWaiting();
      break;
    case 'room_joined':
      MP.roomId = msg.roomId; MP.playerId = msg.playerId;
      mpShowWaiting();
      break;
    case 'lobby':
      MP.players = msg.players;
      if (msg.roomId && !MP.roomId) MP.roomId = msg.roomId;
      MP.isHost = msg.players.some(function(p) { return p.id === MP.playerId && p.isHost; });
      mpUpdateLobby();
      break;
    case 'error':
      alert('Server: ' + msg.error);
      break;
    case 'game_start':
      mpGameStart(msg);
      break;
    case 'tick_start':
      mpTickStart(msg);
      break;
    case 'move_locked':
      mpMoveLocked(msg);
      break;
    case 'tick_result':
      MP.processing = true;
      await mpTickResult(msg);
      MP.processing = false;
      mpProcessQueue();
      break;
    case 'game_end':
      mpGameEnd(msg);
      break;
    case 'rematch_vote':
      mpRematchVote(msg);
      break;
    case 'player_left':
      console.log('[MP] Player left:', msg.playerId);
      break;
    case 'room_list':
      mpShowRoomList(msg.rooms);
      break;
  }
}

// --- Lobby UI ---
function mpShowMultiplayerLobby() {
  var el = document.getElementById('mp-lobby');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML =
    '<div style="text-align:center;margin:10px 0">' +
    '<div style="color:#f59e0b;font-family:Archivo Black,sans-serif;font-size:14px;margin-bottom:10px">MULTIPLAYER</div>' +
    '<input id="mp-name" placeholder="Your name" style="background:#0a0a14;border:1px solid #2a2a3a;color:#d4d4d8;padding:6px 10px;border-radius:6px;font-size:12px;width:120px;text-align:center;margin-bottom:8px"><br>' +
    '<button onclick="mpCreateRoom()" style="background:#f59e0b;color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:11px;padding:8px 20px;border:none;border-radius:6px;cursor:pointer;margin:4px">CREATE ROOM</button>' +
    '<button onclick="mpListRooms()" style="background:none;border:1px solid #f59e0b;color:#f59e0b;font-family:Archivo Black,sans-serif;font-size:11px;padding:8px 20px;border-radius:6px;cursor:pointer;margin:4px">FIND ROOMS</button><br>' +
    '<div style="margin-top:8px"><input id="mp-room-code" placeholder="Room code" style="background:#0a0a14;border:1px solid #2a2a3a;color:#d4d4d8;padding:6px 10px;border-radius:6px;font-size:12px;width:80px;text-align:center">' +
    '<button onclick="mpJoinRoom()" style="background:none;border:1px solid #38bdf8;color:#38bdf8;font-family:Archivo Black,sans-serif;font-size:11px;padding:6px 16px;border-radius:6px;cursor:pointer;margin-left:6px">JOIN</button></div>' +
    '</div>';
}

function mpCreateRoom() {
  var name = document.getElementById('mp-name').value || 'Player';
  mpConnect(function() {
    mpSend({
      type: 'create_room', name: name, color: '#f59e0b',
      gridSize: CFG.gridSize, rotate: CFG.rotate, maxPlayers: 4
    });
  });
}

function mpJoinRoom() {
  var code = document.getElementById('mp-room-code').value;
  var name = document.getElementById('mp-name').value || 'Player';
  if (!code) { alert('Enter room code'); return; }
  mpConnect(function() {
    mpSend({ type: 'join_room', roomId: code, name: name, color: '#38bdf8' });
  });
}

function mpListRooms() {
  mpConnect(function() { mpSend({ type: 'list_rooms' }); });
}

function mpShowRoomList(rooms) {
  var el = document.getElementById('mp-lobby');
  if (!rooms.length) {
    el.innerHTML += '<div style="color:#888;font-size:11px;margin-top:6px">No open rooms. Create one!</div>';
    return;
  }
  var html = '<div style="margin-top:8px">';
  rooms.forEach(function(r) {
    html += '<button onclick="mpJoinRoomDirect(\'' + r.id + '\')" style="background:#1e1e2e;border:1px solid #2a2a3a;color:#d4d4d8;padding:6px 12px;border-radius:6px;cursor:pointer;margin:2px;font-size:11px">' +
      'Room ' + r.id + ' (' + r.players + '/' + (r.config.maxPlayers || 4) + ') ' + r.config.gridSize + 'x' + r.config.gridSize + '</button>';
  });
  html += '</div>';
  el.innerHTML += html;
}

function mpJoinRoomDirect(roomId) {
  var name = document.getElementById('mp-name').value || 'Player';
  mpSend({ type: 'join_room', roomId: roomId, name: name, color: '#38bdf8' });
}

function mpShowWaiting() {
  var el = document.getElementById('mp-lobby');
  el.innerHTML =
    '<div style="text-align:center;margin:10px 0">' +
    '<div style="color:#f59e0b;font-family:Archivo Black,sans-serif;font-size:14px">ROOM ' + MP.roomId + '</div>' +
    '<div style="color:#888;font-size:11px;margin:4px 0">Share this code with friends</div>' +
    '<div id="mp-players" style="margin:8px 0"></div>' +
    '<div id="mp-start-wrap"></div>' +
    '</div>';
  mpUpdateLobby();
}

function mpUpdateLobby() {
  var plEl = document.getElementById('mp-players');
  if (!plEl) {
    if (MP.roomId) mpShowWaiting();
    return; // mpShowWaiting calls mpUpdateLobby itself
  }
  var html = '';
  MP.players.forEach(function(p) {
    html += '<div style="color:' + (p.color || '#d4d4d8') + ';font-size:12px;margin:2px 0">' +
      (p.isHost ? '\u2605 ' : '') + p.name + (p.id === MP.playerId ? ' (you)' : '') + '</div>';
  });
  plEl.innerHTML = html;
  var sw = document.getElementById('mp-start-wrap');
  if (sw) {
    if (MP.isHost && MP.players.length >= 2) {
      sw.innerHTML = '<button onclick="mpStartGame()" style="background:#22c55e;color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:14px;padding:10px 30px;border:none;border-radius:8px;cursor:pointer;margin-top:8px;animation:pulse 1.5s infinite">\u25B6 START</button>';
    } else if (MP.isHost) {
      sw.innerHTML = '<div style="color:#888;font-size:10px;margin-top:6px">Waiting for players...</div>';
    } else {
      sw.innerHTML = '<div style="color:#888;font-size:10px;margin-top:6px">Waiting for host to start...</div>';
    }
  }
}

function mpStartGame() {
  mpSend({ type: 'start_game' });
}

// --- Game Flow ---
function mpGameStart(msg) {
  MP.active = true; MP.tick = 0;
  MP.rematchVoted = false; MP.rematchReady = 0; MP.rematchAllReady = false;
  // Set grid from server
  COLS = msg.config.gridSize; ROWS = msg.config.gridSize;
  MAX_H = 10; ROTATE = msg.config.rotate;
  grid = msg.grid;
  // Switch to game view
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.getElementById('game-mode-label').textContent = 'SOIRON MP';
  document.getElementById('col-btns').style.display = 'grid';
  document.getElementById('pool-area-wrap').style.display = 'flex';
  // Fixed cell size for multiplayer (fitGrid skips on desktop)
  var cellSize = Math.min(Math.floor((window.innerWidth * 0.7) / COLS), 60);
  document.getElementById('grid').style.gridTemplateColumns = 'repeat(' + COLS + ',' + cellSize + 'px)';
  document.getElementById('col-btns').style.gridTemplateColumns = 'repeat(' + COLS + ',' + cellSize + 'px)';
  balance = 100; pool = 0; dropNum = 0; roundNum = 1; animating = false;
  document.getElementById('info-left').textContent = COLS + '\u00d7' + ROWS + (ROTATE ? ' rotate' : '');
  document.getElementById('info-right').textContent = '\uD83D\uDD12 UVS 2.0 MP';
  updateUI(); renderGrid(); renderColBtns();
  // Apply cell sizing
  var cells = document.querySelectorAll('.cell');
  for (var i = 0; i < cells.length; i++) { cells[i].style.width = cellSize + 'px'; cells[i].style.height = cellSize + 'px'; }
  var colBtns = document.querySelectorAll('.col-btn');
  for (var j = 0; j < colBtns.length; j++) { colBtns[j].style.width = cellSize + 'px'; }
  setTimeout(fitGrid, 100);
  setColBtnsDisabled(true);
  document.getElementById('payout-area').innerHTML = '<span style="color:#888">waiting for first tick...</span>';
  // Show players
  var pl = ''; MP.players.forEach(function(p) {
    pl += '<span style="color:' + (p.color || '#fff') + '">' + p.name + '</span> ';
  });
  document.getElementById('players-list').innerHTML = pl;
}

function mpTickStart(msg) {
  MP.tick = msg.tick; MP.dropPower = msg.dropPower; MP.moveSent = false;
  currentDrop = msg.dropPower;
  rollDropDisplay();
  setColBtnsDisabled(false);
  // Countdown timer
  MP.countdown = 10;
  if (MP.countdownTimer) clearInterval(MP.countdownTimer);
  mpUpdateCountdown();
  MP.countdownTimer = setInterval(function() {
    MP.countdown--;
    if (MP.countdown <= 0) { clearInterval(MP.countdownTimer); MP.countdownTimer = null; }
    mpUpdateCountdown();
  }, 1000);
}

function mpUpdateCountdown() {
  if (MP.moveSent) return;
  var color = MP.countdown <= 3 ? '#f66' : '#f59e0b';
  document.getElementById('payout-area').innerHTML =
    '<span style="color:' + color + ';font-family:Archivo Black,sans-serif;font-size:16px">Tick ' + MP.tick + '</span>' +
    '<span style="color:#d4d4d8;font-size:13px"> \u2014 pick your column!</span>' +
    '<div style="color:' + color + ';font-size:24px;font-family:Archivo Black,sans-serif;margin-top:4px">' + MP.countdown + '</div>';
}

function mpPickColumn(col) {
  if (MP.moveSent) return;
  MP.moveSent = true;
  if (MP.countdownTimer) { clearInterval(MP.countdownTimer); MP.countdownTimer = null; }
  mpSend({ type: 'move', col: col });
  setColBtnsDisabled(true);
  document.getElementById('payout-area').innerHTML =
    '<span style="color:#22c55e;font-family:Archivo Black,sans-serif;font-size:16px">\u2713 Column ' + (col + 1) + '</span>' +
    '<div style="color:#555;font-size:11px;margin-top:4px">waiting for others...</div>';
}

function mpMoveLocked(msg) {
  if (msg.playerId === MP.playerId) return;
  var name = MP.players.find(function(p) { return p.id === msg.playerId; });
  console.log('[MP]', (name ? name.name : msg.playerId), 'locked move');
}

async function mpTickResult(msg) {
  if (MP.countdownTimer) { clearInterval(MP.countdownTimer); MP.countdownTimer = null; }
  animating = true;
  setColBtnsDisabled(true);

  // Show each player's drop sequentially
  for (var i = 0; i < msg.results.length; i++) {
    var r = msg.results[i];
    var label = r.name + (r.skip ? ' (skip)' : '');
    document.getElementById('payout-area').innerHTML =
      '<span style="color:' + r.color + ';font-family:Archivo Black,sans-serif;font-size:14px">' + label + '</span>' +
      '<span style="color:#d4d4d8;font-size:12px"> \u2192 col ' + (r.col + 1) + ' dp=' + r.dp + '</span>';

    // Animate the drop on the current grid
    if (!r.skip && r.path) {
      for (var p = 0; p < r.path.length; p++) {
        var step = r.path[p];
        var cellEl = document.getElementById('cell-' + step.row + '-' + step.col);
        if (cellEl) {
          if (step.action === 'wash') {
            cellEl.style.background = r.color || '#38bdf8';
            cellEl.style.color = '#fff';
            cellEl.style.filter = 'none';
            cellEl.style.clipPath = 'none';
            cellEl.textContent = '0';
          } else if (step.action === 'flow') {
            cellEl.style.boxShadow = '0 0 8px ' + (r.color || '#38bdf8');
          } else if (step.action === 'hit') {
            cellEl.style.border = '2px solid ' + (r.color || '#f66');
            cellEl.textContent = step.now;
          }
        }
        await sleep(150);
      }
    }
    await sleep(800);
  }

  // Update grid from server (authoritative state)
  grid = msg.grid;
  dropNum += msg.results.filter(function(r) { return !r.skip; }).length;

  if (msg.rotated) {
    document.getElementById('payout-area').innerHTML = '<span style="color:#fb923c;font-family:Archivo Black,sans-serif;font-size:14px">\u21bb Rotation</span>';
    await sleep(600);
  }

  // Render final grid state from server
  updateUI();
  renderGrid();

  if (msg.winner) {
    // Highlight channel cells
    var ch = msg.winner.channel;
    for (var key in ch) {
      var parts = key.split('-');
      var cellEl = document.getElementById('cell-' + parts[0] + '-' + parts[1]);
      if (cellEl) {
        cellEl.style.background = '#22c55e';
        cellEl.style.color = '#000';
        cellEl.style.border = '2px solid #22c55e';
        cellEl.style.filter = 'none';
        cellEl.style.clipPath = 'none';
      }
    }
    sndPlay('channel');
    await sleep(2000);
  }
  animating = false;
}

function mpGameEnd(msg) {
  MP.active = false;
  MP.rematchVoted = false; MP.rematchReady = 0; MP.rematchAllReady = false;
  var isWinner = msg.winner.playerId === MP.playerId;
  var winColor = isWinner ? '#22c55e' : '#f66';
  var label = isWinner ? 'YOU WIN!' : msg.winner.name + ' WINS';

  // Build verify.html link from UVS data
  var moveFull = msg.uvs.moves.map(function(m) {
    if (m.type === 'rotate') return [-1, 0, m.rngPos];
    return [m.col, m.dp, m.rngPos];
  });
  var verifyUrl = 'verify.html?ss=' + msg.uvs.serverSeed +
    '&cs=' + encodeURIComponent(msg.uvs.clientSeed) +
    '&n=' + msg.uvs.nonce +
    '&g=' + COLS +
    '&rot=' + (ROTATE ? 1 : 0) +
    '&m=' + encodeURIComponent(JSON.stringify(moveFull));

  document.getElementById('payout-area').innerHTML =
    '<div style="margin-top:4px">' +
    '<span style="font-family:Archivo Black,sans-serif;font-size:18px;color:' + winColor + '">' + label + '</span><br>' +
    '<div style="margin-top:8px;text-align:left;font-size:10px;line-height:1.6;padding:8px;background:#0a0a14;border:1px solid #1e1e2e;border-radius:8px;max-height:150px;overflow-y:auto">' +
    '<div style="color:#f59e0b;font-size:12px;font-weight:700;margin-bottom:4px">\uD83D\uDD12 UVS 2.0 — Provably Fair</div>' +
    '<div><span style="color:#888">Server Seed Hash:</span><br><span style="color:#d4d4d8;word-break:break-all;font-size:9px">' + msg.uvs.serverSeedHash + '</span></div>' +
    '<div style="margin-top:4px"><span style="color:#888">Server Seed:</span><br><span style="color:#d4d4d8;word-break:break-all;font-size:9px">' + msg.uvs.serverSeed + '</span></div>' +
    '<div style="margin-top:4px"><span style="color:#888">Client Seed:</span> <span style="color:#d4d4d8">' + msg.uvs.clientSeed + '</span></div>' +
    '<div style="margin-top:4px"><span style="color:#888">RNG calls:</span> <span style="color:#d4d4d8">' + msg.uvs.rngCalls + '</span></div>' +
    '<div style="margin-top:4px"><span style="color:#888">SHA-256:</span> <span style="color:' + (msg.uvs.verified ? '#22c55e' : '#f66') + '">' +
    (msg.uvs.verified ? '\u2713 VERIFIED' : '\u2717 MISMATCH') + '</span></div>' +
    '<div style="margin-top:6px;text-align:center"><a href="' + verifyUrl + '" target="_blank" style="color:#38bdf8;font-size:10px">Replay \u2192 verify.html</a></div>' +
    '</div>' +
    '<button onclick="mpBackToLobby()" style="margin-top:10px;background:' + winColor + ';color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:13px;padding:8px 28px;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px">LOBBY</button>' +
    mpRematchUI() +
    '</div>';
  setTimeout(mpUpdateRematchUI, 100);
}

function mpRematch() {
  mpSend({ type: 'rematch_vote' });
  MP.rematchVoted = true;
  mpUpdateRematchUI();
}

function mpRematchVote(msg) {
  MP.rematchReady = msg.ready;
  MP.rematchTotal = msg.total;
  MP.rematchAllReady = msg.allReady;
  mpUpdateRematchUI();
}

function mpRematchUI() {
  return '<div id="mp-rematch" style="margin-top:8px;text-align:center"></div>';
}

function mpUpdateRematchUI() {
  var el = document.getElementById('mp-rematch');
  if (!el) return;
  var r = MP.rematchReady || 0, t = MP.rematchTotal || 2;
  if (MP.rematchAllReady && MP.isHost) {
    el.innerHTML = '<button onclick="mpRematchStart()" style="background:#22c55e;color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:14px;padding:10px 30px;border:none;border-radius:8px;cursor:pointer;animation:pulse 1.5s infinite">\u25B6 START REMATCH</button>';
  } else if (MP.rematchAllReady) {
    el.innerHTML = '<span style="color:#22c55e">All ready! Waiting for host...</span>';
  } else if (MP.rematchVoted) {
    el.innerHTML = '<span style="color:#f59e0b">\u2713 Ready (' + r + '/' + t + ')</span>';
  } else {
    el.innerHTML = '<button onclick="mpRematch()" style="background:none;border:1px solid #f59e0b;color:#f59e0b;font-family:Archivo Black,sans-serif;font-size:13px;padding:8px 28px;border-radius:8px;cursor:pointer;letter-spacing:2px">REMATCH</button>' +
      '<div style="color:#555;font-size:10px;margin-top:4px">' + r + '/' + t + ' ready</div>';
  }
}

function mpRematchStart() {
  mpSend({ type: 'rematch_start' });
}

function mpBackToLobby() {
  MP.active = false;
  if (MP.ws) { MP.ws.close(); MP.ws = null; }
  MP.connected = false;
  MP.roomId = null; MP.playerId = null; MP.isHost = false; MP.players = [];
  _uvsRng = null; UVS_SESSION = null;
  sndPlay('click'); unfitGrid();
  document.getElementById('game').style.display = 'none';
  document.getElementById('lobby').style.display = 'block';
  document.body.style.overflow = '';
  window.scrollTo(0, 0); animating = false;
  // Reset MP lobby UI
  var mpEl = document.getElementById('mp-lobby');
  if (mpEl) mpShowMultiplayerLobby();
  // Restore normal column button handlers
  renderColBtns();
}

function rollDropDisplay() {
  var el = document.getElementById('drop-power');
  if (el) {
    el.textContent = currentDrop;
    el.className = 'drop-power-value dp' + currentDrop;
  }
  var who = document.getElementById('drop-who');
  if (who) { who.innerHTML = 'YOUR<br>DROP'; who.style.color = '#d4d4d8'; }
}
