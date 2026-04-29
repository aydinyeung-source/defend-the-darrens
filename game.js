'use strict';

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://vpgwqzwalyozpckvrgkq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZ3dxendhbHlvenBja3ZyZ2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUyNDcsImV4cCI6MjA5MjczMTI0N30.93h-eC2uX7JlLGeq9n_2kt9r9ZXKn1NePfkErHnUA90';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Screen management ─────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ── Player state ──────────────────────────────────────────────────────────────
const player = {
  id:          null,
  username:    null,
  coins:       100,
  gems:        0,
  wins:        0,
  gender:       'prefer_not_to_say',
  ownedTowers:  new Set(),
  ownedEnemies: new Set(),
};

// ── Rarity styles (used by tower grid cards and drop lists) ──────────────────
const RARITY_STYLES = {
  common:    { bg: '#4a6572', border: '#78909c', text: '#b0bec5' },
  uncommon:  { bg: '#2d5a27', border: '#4caf50', text: '#a5d6a7' },
  rare:      { bg: '#1a3a6b', border: '#2196f3', text: '#90caf9' },
  epic:      { bg: '#4a1570', border: '#9c27b0', text: '#ce93d8' },
  legendary: { bg: '#7a2800', border: '#ff6d00', text: '#ffcc80' },
};

// ── Tower registry ────────────────────────────────────────────────────────────
const ALL_TOWERS = {
  basic:     { id: 'basic',     name: 'Basic',     icon: '🗼', rarity: 'common',    rarityLabel: 'Common'    },
  archer:    { id: 'archer',    name: 'Archer',    icon: '🏹', rarity: 'common',    rarityLabel: 'Common'    },
  cannon:    { id: 'cannon',    name: 'Cannon',    icon: '💣', rarity: 'uncommon',  rarityLabel: 'Uncommon'  },
  ice:       { id: 'ice',       name: 'Ice',       icon: '❄️', rarity: 'rare',      rarityLabel: 'Rare'      },
  lightning: { id: 'lightning', name: 'Lightning', icon: '⚡', rarity: 'epic',      rarityLabel: 'Epic'      },
  dragon:    { id: 'dragon',    name: 'Dragon',    icon: '🐉', rarity: 'legendary', rarityLabel: 'Legendary' },
};

// ── Enemy registry ────────────────────────────────────────────────────────────
const ALL_ENEMIES = {
  goblin:  { id: 'goblin',  name: 'Goblin',  icon: '👺', rarity: 'common',    rarityLabel: 'Common'    },
  knight:  { id: 'knight',  name: 'Knight',  icon: '⚔️', rarity: 'common',    rarityLabel: 'Common'    },
  witch:   { id: 'witch',   name: 'Witch',   icon: '🧙', rarity: 'uncommon',  rarityLabel: 'Uncommon'  },
  giant:   { id: 'giant',   name: 'Giant',   icon: '🦣', rarity: 'rare',      rarityLabel: 'Rare'      },
  wizard:  { id: 'wizard',  name: 'Wizard',  icon: '🔮', rarity: 'epic',      rarityLabel: 'Epic'      },
  wyvern:  { id: 'wyvern',  name: 'Wyvern',  icon: '🐲', rarity: 'legendary', rarityLabel: 'Legendary' },
};

// ── Starter cards (given to every new player) ─────────────────────────────────
const STARTER_TOWERS  = ['basic', 'archer'];
const STARTER_ENEMIES = ['goblin', 'knight'];

// ── Crate definitions ─────────────────────────────────────────────────────────
// drops: array of { type: 'tower'|'enemy', id, weight }
const CRATES = [
  {
    id: 'goblin-hollow-chest',
    name: 'Goblin Hollow Chest',
    icon: '🌿',
    cost: 80,
    currency: 'coins',
    bg: 'linear-gradient(135deg, #0e1f00 0%, #091500 100%)',
    border: '#74b816',
    drops: [
      { type: 'tower', id: 'basic',  weight: 25 },
      { type: 'tower', id: 'archer', weight: 25 },
      { type: 'enemy', id: 'goblin', weight: 25 },
      { type: 'enemy', id: 'knight', weight: 25 },
    ],
  },
  {
    id: 'iron-rampart-chest',
    name: 'Iron Rampart Chest',
    icon: '🛡️',
    cost: 350,
    currency: 'coins',
    bg: 'linear-gradient(135deg, #0d1a2e 0%, #081428 100%)',
    border: '#4dabf7',
    drops: [
      { type: 'tower', id: 'cannon', weight: 28 },
      { type: 'enemy', id: 'witch',  weight: 28 },
      { type: 'tower', id: 'ice',    weight: 20 },
      { type: 'enemy', id: 'giant',  weight: 20 },
      { type: 'tower', id: 'archer', weight: 2  },
      { type: 'enemy', id: 'goblin', weight: 2  },
    ],
  },
  {
    id: 'dragons-peak-chest',
    name: "Dragon's Peak Chest",
    icon: '🐉',
    cost: 50,
    currency: 'gems',
    bg: 'linear-gradient(135deg, #1a0028 0%, #2a003a 100%)',
    border: '#cc5de8',
    drops: [
      { type: 'tower', id: 'lightning', weight: 25 },
      { type: 'enemy', id: 'wizard',    weight: 25 },
      { type: 'tower', id: 'dragon',    weight: 10 },
      { type: 'enemy', id: 'wyvern',    weight: 10 },
      { type: 'tower', id: 'ice',       weight: 15 },
      { type: 'enemy', id: 'giant',     weight: 15 },
    ],
  },
];

// ── Login / account ───────────────────────────────────────────────────────────
const PLAYER_ID_KEY = 'dtd_player_id';
const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generatePlayerId() {
  let id = '#';
  for (let i = 0; i < 10; i++) id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  return id;
}

async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let authMode       = 'login';
let selectedGender = 'prefer_not_to_say';

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === 'signup';
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.getElementById('auth-confirm-wrap').classList.toggle('hidden', !isSignup);
  document.getElementById('gender-select').classList.toggle('hidden', !isSignup);
  document.getElementById('auth-submit').textContent = isSignup ? 'Create Account' : 'Log In';
  document.getElementById('auth-error').classList.add('hidden');
}

document.querySelectorAll('.auth-tab').forEach(btn =>
  btn.addEventListener('click', () => setAuthMode(btn.dataset.mode))
);

document.querySelectorAll('.gender-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGender = btn.dataset.gender;
  })
);

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function createAccount() {
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const confirm  = document.getElementById('auth-confirm').value;

  if (!username)           { showAuthError('Enter a username.');                    return; }
  if (username.length < 3) { showAuthError('Username must be at least 3 characters.'); return; }
  if (!password)           { showAuthError('Enter a password.');                    return; }
  if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
  if (password !== confirm) { showAuthError("Passwords don't match.");               return; }

  const btn = document.getElementById('auth-submit');
  btn.disabled = true;
  btn.textContent = 'Creating…';

  const { data: existing } = await db.from('players').select('player_id').eq('username', username).maybeSingle();
  if (existing) {
    showAuthError('Username already taken.');
    btn.disabled = false;
    btn.textContent = 'Create Account';
    return;
  }

  let playerId, attempts = 0;
  while (attempts < 10) {
    playerId = generatePlayerId();
    const { data } = await db.from('players').select('player_id').eq('player_id', playerId).maybeSingle();
    if (!data) break;
    attempts++;
  }

  const { error } = await db.from('players').insert({
    player_id: playerId,
    username,
    password: await hashPassword(password),
    gender: selectedGender,
    coins: 100,
    gems: 0,
  });

  if (error) {
    showAuthError(error.message || 'Something went wrong. Try again.');
    btn.disabled = false;
    btn.textContent = 'Create Account';
    return;
  }

  await Promise.all([
    db.from('owned_towers').insert(STARTER_TOWERS.map(id  => ({ player_id: playerId, tower_id: id }))),
    db.from('owned_enemies').insert(STARTER_ENEMIES.map(id => ({ player_id: playerId, enemy_id: id }))),
  ]);

  localStorage.setItem(PLAYER_ID_KEY, playerId);
  await loadPlayer(playerId);
}

async function signIn() {
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;

  if (!username || !password) { showAuthError('Fill in all fields.'); return; }

  const btn = document.getElementById('auth-submit');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const { data, error } = await db.from('players')
    .select('*')
    .eq('username', username)
    .eq('password', await hashPassword(password))
    .maybeSingle();

  btn.disabled = false;
  btn.textContent = 'Log In';

  if (error || !data) { showAuthError('Invalid username or password.'); return; }

  localStorage.setItem(PLAYER_ID_KEY, data.player_id);
  await loadPlayer(data.player_id);
}

document.getElementById('auth-submit').addEventListener('click', () => {
  if (authMode === 'login') signIn();
  else createAccount();
});

['auth-username', 'auth-password', 'auth-confirm'].forEach(id =>
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('auth-submit').click();
  })
);

document.getElementById('auth-card').addEventListener('click', e => {
  const eye = e.target.closest('.pw-eye');
  if (!eye) return;
  const input = document.getElementById(eye.dataset.target);
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  eye.classList.toggle('visible', show);
});

async function loadPlayer(id) {
  const { data: p, error } = await db.from('players').select('*').eq('player_id', id).maybeSingle();
  if (error) { showScreen('login-screen'); return; }
  if (!p)    { localStorage.removeItem(PLAYER_ID_KEY); showScreen('login-screen'); return; }

  player.id       = p.player_id;
  player.username = p.username;
  player.coins    = p.coins;
  player.gems     = p.gems;
  player.wins     = p.wins   || 0;
  player.gender   = p.gender || 'prefer_not_to_say';

  const { data: towers }  = await db.from('owned_towers').select('tower_id').eq('player_id', id);
  const { data: enemies } = await db.from('owned_enemies').select('enemy_id').eq('player_id', id);
  player.ownedTowers  = new Set((towers  || []).map(r => r.tower_id));
  player.ownedEnemies = new Set((enemies || []).map(r => r.enemy_id));

  document.getElementById('profile-btn').textContent = `😊 ${player.username}`;
  showScreen('selection-screen');
  updateCurrency();
  renderTowersTab();
  renderShopTab();
}

async function init() {
  const saved = localStorage.getItem(PLAYER_ID_KEY);
  if (saved) await loadPlayer(saved);
  else showScreen('login-screen');
}

// ── Currency display ──────────────────────────────────────────────────────────
function updateCurrency() {
  document.getElementById('coin-count').textContent = player.coins.toLocaleString();
  document.getElementById('gem-count').textContent  = player.gems.toLocaleString();
  renderShopTab(); // refresh button affordability
}

// ── Collection tab ────────────────────────────────────────────────────────────
let collectionMode = 'towers';

function renderTowersTab() {
  const grid    = document.getElementById('collection-grid');
  const allItems = collectionMode === 'towers' ? ALL_TOWERS : ALL_ENEMIES;
  const owned    = collectionMode === 'towers' ? player.ownedTowers : player.ownedEnemies;
  const items    = Object.values(allItems);
  const label    = collectionMode === 'towers' ? 'towers' : 'enemies';

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="col-empty">
        <div class="col-empty-icon">${collectionMode === 'towers' ? '🗼' : '👾'}</div>
        <p class="col-empty-msg">No ${label} available yet.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(t => {
    const rs      = RARITY_STYLES[t.rarity] || RARITY_STYLES.common;
    const isOwned = owned.has(t.id);
    return `
      <div class="tcg${isOwned ? ' tcg-owned' : ''}" style="--rarity-bg:${rs.bg}; --rarity-border:${rs.border}">
        <div class="tcg-face">
          <span class="tcg-icon">${t.icon}</span>
          ${!isOwned ? '<span class="tcg-lock">🔒</span>' : ''}
          <div class="tcg-rarity-strip">${t.rarityLabel}</div>
        </div>
        <div class="tcg-footer">${t.name}</div>
      </div>`;
  }).join('');
}

document.querySelectorAll('.pane-tab').forEach(btn =>
  btn.addEventListener('click', () => {
    collectionMode = btn.dataset.col;
    document.querySelectorAll('.pane-tab').forEach(b => b.classList.toggle('active', b === btn));
    renderTowersTab();
  })
);

// ── Shop tab ──────────────────────────────────────────────────────────────────
function renderShopTab() {
  const list = document.getElementById('shop-list');

  list.innerHTML = CRATES.map(crate => {
    const totalW    = crate.drops.reduce((s, d) => s + d.weight, 0);
    const dropsHtml = crate.drops.map(d => {
      const t   = d.type === 'enemy' ? ALL_ENEMIES[d.id] : ALL_TOWERS[d.id];
      if (!t) return '';
      const rs  = RARITY_STYLES[t.rarity] || RARITY_STYLES.common;
      const pct = Math.round(d.weight / totalW * 100);
      return `<div class="drop-row">${t.icon} ${t.name} · <b style="color:${rs.border}">${pct}%</b></div>`;
    }).join('');

    const canAfford  = crate.currency === 'coins' ? player.coins >= crate.cost : player.gems >= crate.cost;
    const currIcon   = crate.currency === 'coins' ? '🪙' : '💎';

    return `
      <div class="crate-card" style="background:${crate.bg};border-color:${crate.border}">
        <div class="crate-row">
          <span class="crate-big-icon">${crate.icon}</span>
          <div class="crate-info">
            <div class="crate-name">${crate.name}</div>
            <div class="crate-drops">${dropsHtml}</div>
          </div>
        </div>
        <button class="crate-btn${canAfford ? '' : ' unaffordable'}" data-crate="${crate.id}">
          ${currIcon} ${crate.cost} · Open
        </button>
      </div>`;
  }).join('');
}

// ── Crate opening logic ───────────────────────────────────────────────────────
function rollCrate(crate) {
  const total = crate.drops.reduce((s, d) => s + d.weight, 0);
  let roll = Math.random() * total;
  for (const drop of crate.drops) {
    roll -= drop.weight;
    if (roll <= 0) return drop;
  }
  return crate.drops[crate.drops.length - 1];
}

async function openCrate(crateId) {
  const crate = CRATES.find(c => c.id === crateId);
  if (!crate) return;
  if (crate.currency === 'coins' && player.coins < crate.cost) return;
  if (crate.currency === 'gems'  && player.gems  < crate.cost) return;

  if (crate.currency === 'coins') player.coins -= crate.cost;
  else                             player.gems  -= crate.cost;

  const drop    = rollCrate(crate);
  const isEnemy = drop.type === 'enemy';
  const item    = isEnemy ? ALL_ENEMIES[drop.id] : ALL_TOWERS[drop.id];

  if (isEnemy) player.ownedEnemies.add(drop.id);
  else         player.ownedTowers.add(drop.id);

  if (player.id) {
    const currencyUpdate = crate.currency === 'coins' ? { coins: player.coins } : { gems: player.gems };
    const table = isEnemy ? 'owned_enemies' : 'owned_towers';
    const field = isEnemy ? 'enemy_id'      : 'tower_id';
    await Promise.all([
      db.from('players').update(currencyUpdate).eq('player_id', player.id),
      db.from(table).upsert({ player_id: player.id, [field]: drop.id }),
    ]);
  }

  updateCurrency();
  renderTowersTab();
  showCrateResult(item);
}

document.getElementById('shop-list').addEventListener('click', e => {
  const btn = e.target.closest('.crate-btn');
  if (btn && !btn.classList.contains('unaffordable')) openCrate(btn.dataset.crate);
});

// ── Crate result modal ────────────────────────────────────────────────────────
function showCrateResult(tower) {
  const rs = RARITY_STYLES[tower.rarity] || RARITY_STYLES.common;
  document.getElementById('result-icon').textContent = tower.icon;
  document.getElementById('result-name').textContent = tower.name;
  const rar = document.getElementById('result-rarity');
  rar.textContent      = tower.rarityLabel;
  rar.style.color      = rs.border;
  rar.style.background = rs.bg + '33';
  document.getElementById('crate-result').classList.remove('hidden');
}

document.getElementById('result-close').addEventListener('click', () => {
  document.getElementById('crate-result').classList.add('hidden');
});

// ── Selection screen nav tabs ─────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sel-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`pane-${btn.dataset.pane}`).classList.add('active');
    if (btn.dataset.pane === 'towers') renderTowersTab();
    if (btn.dataset.pane === 'shop')   renderShopTab();
  });
});

// ── Settings modal ────────────────────────────────────────────────────────────
document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.remove('hidden');
});

document.getElementById('settings-close').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('hidden');
});

document.getElementById('settings-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('settings-modal')) {
    document.getElementById('settings-modal').classList.add('hidden');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem(PLAYER_ID_KEY);
  player.id          = null;
  player.username    = null;
  player.coins       = 100;
  player.gems        = 0;
  player.wins        = 0;
  player.ownedTowers  = new Set();
  player.ownedEnemies = new Set();
  document.getElementById('settings-modal').classList.add('hidden');
  document.getElementById('profile-btn').textContent = '😊 Profile';
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-confirm').value  = '';
  document.querySelectorAll('.pw-eye').forEach(e => { e.classList.remove('visible'); });
  document.querySelectorAll('#auth-card input[type="text"]').forEach(i => { i.type = 'password'; });
  setAuthMode('login');
  showScreen('login-screen');
});

// ── Profile modal ─────────────────────────────────────────────────────────────
document.getElementById('profile-btn').addEventListener('click', () => {
  if (!player.id) return;
  const total = Object.keys(ALL_TOWERS).length + Object.keys(ALL_ENEMIES).length;
  const found = player.ownedTowers.size + player.ownedEnemies.size;
  document.getElementById('profile-username').textContent = player.username;
  document.getElementById('profile-playerid').textContent = player.id;
  document.getElementById('profile-wins').textContent     = player.wins;
  document.getElementById('profile-cards').textContent    = `${found}/${total}`;
  document.getElementById('profile-modal').classList.remove('hidden');
});

document.getElementById('profile-close').addEventListener('click', () => {
  document.getElementById('profile-modal').classList.add('hidden');
});

document.getElementById('profile-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('profile-modal')) {
    document.getElementById('profile-modal').classList.add('hidden');
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
init();

// ── Play button → game screen ─────────────────────────────────────────────────
let gameLoopStarted = false;

document.getElementById('play-btn').addEventListener('click', () => {
  showScreen('game-screen');
  if (!gameLoopStarted) {
    gameLoopStarted = true;
    requestAnimationFrame(loop);
  }
});

// ── Back button → selection screen ───────────────────────────────────────────
document.getElementById('back-btn').addEventListener('click', () => {
  showScreen('selection-screen');
});

// ── Game screen tab bar ───────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`gtab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ── Canvas & layout constants ─────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

const TILE    = 40;
const COLS    = 8;
const ROWS    = 11;
const DIVIDER = 8;

const L_OFF = 0;
const R_OFF = COLS * TILE + DIVIDER;

// ── Path ─────────────────────────────────────────────────────────────────────
const LEFT_PATH = [
  {x:4,y:0},{x:4,y:1},{x:4,y:2},
  {x:3,y:2},{x:2,y:2},{x:1,y:2},
  {x:1,y:3},{x:1,y:4},
  {x:2,y:4},{x:3,y:4},{x:4,y:4},{x:5,y:4},{x:6,y:4},
  {x:6,y:5},{x:6,y:6},
  {x:5,y:6},{x:4,y:6},{x:3,y:6},{x:2,y:6},{x:1,y:6},
  {x:1,y:7},{x:1,y:8},
  {x:2,y:8},{x:3,y:8},{x:4,y:8},{x:5,y:8},{x:6,y:8},
  {x:6,y:9},{x:6,y:10},
];
const RIGHT_PATH = LEFT_PATH;

// ── Input state (left field only) ─────────────────────────────────────────────
let hoverCell = null;
const LEFT_FIELD_WIDTH = COLS * TILE;

function getLeftCell(canvasX, canvasY) {
  if (canvasX < 0 || canvasX >= LEFT_FIELD_WIDTH) return null;
  if (canvasY < 0 || canvasY >= ROWS * TILE)      return null;
  return { x: Math.floor(canvasX / TILE), y: Math.floor(canvasY / TILE) };
}

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  hoverCell = getLeftCell(e.clientX - r.left, e.clientY - r.top);
  canvas.style.cursor = hoverCell ? 'crosshair' : 'not-allowed';
});
canvas.addEventListener('mouseleave', () => { hoverCell = null; canvas.style.cursor = ''; });
canvas.addEventListener('click', e => {
  const r    = canvas.getBoundingClientRect();
  const cell = getLeftCell(e.clientX - r.left, e.clientY - r.top);
  if (cell) onLeftFieldClick(cell);
});

function onLeftFieldClick(cell) {
  // Wire up placement logic here as we add towers/enemies
  console.log('player clicked', cell);
}

// ── Draw ─────────────────────────────────────────────────────────────────────
function drawField(path, offsetX, isPlayer) {
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(offsetX, 0, COLS * TILE, ROWS * TILE);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(offsetX + x*TILE, 0);
    ctx.lineTo(offsetX + x*TILE, ROWS*TILE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(offsetX, y*TILE);
    ctx.lineTo(offsetX + COLS*TILE, y*TILE);
    ctx.stroke();
  }

  // Path tiles
  for (const p of path) {
    ctx.fillStyle = '#162030';
    ctx.fillRect(offsetX + p.x*TILE + 1, p.y*TILE + 1, TILE - 2, TILE - 2);
  }

  // Dashed centre line
  ctx.strokeStyle = 'rgba(70,110,160,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  path.forEach((p, i) => {
    const px = offsetX + p.x*TILE + TILE/2, py = p.y*TILE + TILE/2;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Entry (red bar, top) and base (teal/grey bar, bottom)
  const entry = path[0], exit = path[path.length - 1];
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(offsetX + entry.x*TILE, entry.y*TILE, TILE, 4);
  ctx.fillStyle = isPlayer ? '#4ecdc4' : '#8b949e';
  ctx.fillRect(offsetX + exit.x*TILE, (exit.y + 1)*TILE - 4, TILE, 4);

  // Field border tint
  ctx.strokeStyle = isPlayer ? '#4ecdc422' : '#ffffff0e';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX + 1, 1, COLS*TILE - 2, ROWS*TILE - 2);
}

function drawHoverTile() {
  if (!hoverCell) return;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(hoverCell.x*TILE + 1, hoverCell.y*TILE + 1, TILE - 2, TILE - 2);
}

function drawDivider() {
  ctx.fillStyle = '#21262d';
  ctx.fillRect(COLS*TILE, 0, DIVIDER, ROWS*TILE);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawField(LEFT_PATH,  L_OFF, true);
  drawField(RIGHT_PATH, R_OFF, false);
  drawHoverTile();
  drawDivider();
}

// ── Game loop (starts only when game screen is first shown) ───────────────────
function loop() {
  render();
  requestAnimationFrame(loop);
}
