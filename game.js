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
  coins: 100,
  gems:  0,
  ownedTowers: new Set(),
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
// Add new towers here as they're designed.
const ALL_TOWERS = {
  basic: {
    id: 'basic', name: 'Basic', icon: '🗼',
    rarity: 'common', rarityLabel: 'Common',
  },
};

// ── Crate definitions ─────────────────────────────────────────────────────────
// drops: array of { towerId, weight }. Weight is relative — 100 total = percentages.
// Add new crates here; costs/contents defined by you later.
const CRATES = [
  {
    id: 'basic-crate',
    name: 'Basic Crate',
    icon: '📦',
    cost: 100,
    currency: 'coins',
    bg: 'linear-gradient(135deg, #fff9db 0%, #ffe8cc 100%)',
    border: '#ffd43b',
    drops: [
      { towerId: 'basic', weight: 100 },
    ],
  },
];

// ── Currency display ──────────────────────────────────────────────────────────
function updateCurrency() {
  document.getElementById('coin-count').textContent = player.coins.toLocaleString();
  document.getElementById('gem-count').textContent  = player.gems.toLocaleString();
  renderShopTab(); // refresh button affordability
}

// ── Towers tab — shows only undiscovered towers ───────────────────────────────
function renderTowersTab() {
  const list    = document.getElementById('towers-list');
  const unfound = Object.values(ALL_TOWERS).filter(t => !player.ownedTowers.has(t.id));

  if (unfound.length === 0) {
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.innerHTML = `
      <div class="all-found">
        <div class="all-found-icon">🌟</div>
        <p class="all-found-msg">All towers discovered!</p>
      </div>`;
    return;
  }

  list.style.display = '';
  list.style.flexDirection = '';
  list.innerHTML = unfound.map(t => {
    const rs = RARITY_STYLES[t.rarity] || RARITY_STYLES.common;
    return `
      <div class="tcg" style="--rarity-bg:${rs.bg}; --rarity-border:${rs.border}">
        <div class="tcg-face">
          <span class="tcg-icon">${t.icon}</span>
          <span class="tcg-lock">🔒</span>
          <div class="tcg-rarity-strip">${t.rarityLabel}</div>
        </div>
        <div class="tcg-footer">${t.name}</div>
      </div>`;
  }).join('');
}

// ── Shop tab ──────────────────────────────────────────────────────────────────
function renderShopTab() {
  const list = document.getElementById('shop-list');

  list.innerHTML = CRATES.map(crate => {
    const totalW    = crate.drops.reduce((s, d) => s + d.weight, 0);
    const dropsHtml = crate.drops.map(d => {
      const t   = ALL_TOWERS[d.towerId];
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
  let roll    = Math.random() * total;
  for (const drop of crate.drops) {
    roll -= drop.weight;
    if (roll <= 0) return drop.towerId;
  }
  return crate.drops[crate.drops.length - 1].towerId;
}

function openCrate(crateId) {
  const crate = CRATES.find(c => c.id === crateId);
  if (!crate) return;
  if (crate.currency === 'coins' && player.coins < crate.cost) return;
  if (crate.currency === 'gems'  && player.gems  < crate.cost) return;

  if (crate.currency === 'coins') player.coins -= crate.cost;
  else                             player.gems  -= crate.cost;

  const towerId = rollCrate(crate);
  player.ownedTowers.add(towerId);

  updateCurrency();
  renderTowersTab();
  showCrateResult(ALL_TOWERS[towerId]);
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

// ── Initial render ────────────────────────────────────────────────────────────
updateCurrency();
renderTowersTab();
renderShopTab();

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
