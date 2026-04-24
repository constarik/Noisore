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
  active: false
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
      mpTickResult(msg);
      break;
    case 'game_end':
      mpGameEnd(msg);
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
    '<input id="mp-name" placeholder="Your name" value="Player" style="background:#0a0a14;border:1px solid #2a2a3a;color:#d4d4d8;padding:6px 10px;border-radius:6px;font-size:12px;width:120px;text-align:center;margin-bottom:8px"><br>' +
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
  // Set grid from server
  COLS = msg.config.gridSize; ROWS = msg.config.gridSize;
  MAX_H = 10; ROTATE = msg.config.rotate;
  grid = msg.grid;
  // Switch to game view
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.getElementById('game-title').textContent = 'SOIRON MP';
  document.getElementById('grid').style.gridTemplateColumns = 'repeat(' + COLS + ',1fr)';
  document.getElementById('col-btns').style.gridTemplateColumns = 'repeat(' + COLS + ',1fr)';
  balance = 100; pool = 0; dropNum = 0; roundNum = 1; animating = false;
  document.getElementById('info-left').textContent = COLS + '\u00d7' + ROWS + (ROTATE ? ' rotate' : '');
  document.getElementById('info-right').textContent = '\uD83D\uDD12 UVS 2.0 MP';
  updateUI(); renderGrid(); renderColBtns(); fitGrid();
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
  document.getElementById('payout-area').innerHTML =
    '<span style="color:#f59e0b">Tick ' + msg.tick + '</span> — <span style="color:#d4d4d8">pick your column!</span>' +
    '<div style="color:#555;font-size:10px;margin-top:4px">10s timeout</div>';
  // Override column button handlers for MP
  for (var c = 0; c < COLS; c++) {
    (function(col) {
      var btn = document.getElementById('col-btn-' + col);
      if (btn) {
        btn.onclick = function() { mpPickColumn(col); };
      }
    })(c);
  }
}

function mpPickColumn(col) {
  if (MP.moveSent) return;
  MP.moveSent = true;
  mpSend({ type: 'move', col: col });
  setColBtnsDisabled(true);
  document.getElementById('payout-area').innerHTML =
    '<span style="color:#22c55e">\u2713 Column ' + (col + 1) + ' locked</span>' +
    '<div style="color:#555;font-size:10px;margin-top:4px">waiting for others...</div>';
}

function mpMoveLocked(msg) {
  if (msg.playerId === MP.playerId) return;
  var name = MP.players.find(function(p) { return p.id === msg.playerId; });
  console.log('[MP]', (name ? name.name : msg.playerId), 'locked move');
}

async function mpTickResult(msg) {
  // Update grid from server (authoritative)
  grid = msg.grid;
  animating = true;
  setColBtnsDisabled(true);

  // Animate each player's drop
  for (var i = 0; i < msg.results.length; i++) {
    var r = msg.results[i];
    var label = r.name + (r.skip ? ' (skip)' : '');
    document.getElementById('payout-area').innerHTML =
      '<span style="color:' + r.color + '">' + label + '</span> \u2192 col ' + (r.col + 1) + ' dp=' + r.dp;
    // Brief pause to show each drop
    await sleep(600);
  }

  if (msg.rotated) {
    document.getElementById('payout-area').innerHTML = '<span style="color:#fb923c">\u21bb rotated</span>';
    await sleep(400);
  }

  // Render final grid state from server
  dropNum += msg.results.length;
  updateUI();
  renderGrid();

  if (msg.winner) {
    // Highlight channel
    var ch = msg.winner.channel;
    var cells = document.querySelectorAll('#grid .cell');
    cells.forEach(function(cell) {
      var r = cell.dataset.row, c = cell.dataset.col;
      if (ch[r + '-' + c]) {
        cell.style.background = '#22c55e';
        cell.style.color = '#000';
        cell.style.border = '2px solid #22c55e';
      }
    });
  }
  animating = false;
}

function mpGameEnd(msg) {
  MP.active = false;
  var isWinner = msg.winner.playerId === MP.playerId;
  var winColor = isWinner ? '#22c55e' : '#f66';
  var label = isWinner ? 'YOU WIN!' : msg.winner.name + ' WINS';

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
    '</div>' +
    '<button onclick="mpBackToLobby()" style="margin-top:10px;background:' + winColor + ';color:#0a0a0f;font-family:Archivo Black,sans-serif;font-size:13px;padding:8px 28px;border:none;border-radius:8px;cursor:pointer;letter-spacing:2px">LOBBY</button>' +
    '</div>';
}

function mpBackToLobby() {
  MP.active = false;
  if (MP.ws) { MP.ws.close(); MP.ws = null; }
  MP.roomId = null; MP.playerId = null; MP.isHost = false; MP.players = [];
  _uvsRng = null; UVS_SESSION = null;
  sndPlay('click'); unfitGrid();
  document.getElementById('game').style.display = 'none';
  document.getElementById('lobby').style.display = 'block';
  document.body.style.overflow = '';
  window.scrollTo(0, 0); animating = false;
  // Restore normal column button handlers
  renderColBtns();
}

function rollDropDisplay() {
  var el = document.getElementById('drop-display');
  if (el) {
    el.querySelector('.drop-val').textContent = currentDrop;
  }
}
