const stage = document.querySelector('.rooftop-stage');
const canvas = stage.querySelector('canvas');
const ctx = canvas.getContext('2d');
const start = stage.querySelector('.rooftop-start');
const victoryArt = stage.querySelector('.rooftop-victory-art');
const result = stage.querySelector('.rooftop-result');
const heightLabel = document.querySelector('#rooftop-height');
const ringsLabel = document.querySelector('#rooftop-rings');
const mascot = new Image();
const width = 360;
const height = 560;
const yellow = '#ffe500';
const finishMeters = 10000;
const pixelsPerMeter = 8;
const finishHeight = finishMeters * pixelsPerMeter;
const normalJumpSpeed = 490;
const stickyJumpSpeed = 360;
const stickyHoldSeconds = .10;
const springJumpSpeed = 2 * 535;
const touchLayout = matchMedia('(pointer: coarse)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ink = '#141412';
const clouds = [
  { x: 60, y: 142, scale: .85 },
  { x: 278, y: 325, scale: 1 },
  { x: 110, y: 542, scale: 1.2 }
];
const leftKeys = ['ArrowLeft', 'KeyA'];
const rightKeys = ['ArrowRight', 'KeyD'];
const keys = new Set();
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const player = { x: 180, y: 490, vy: 0, facing: 1 };
let platforms, camera, top, points, best, previous, playing, pointer, target, flash;
let activeTouch = null;
try {
  best = clamp(Number(localStorage.getItem('dd-rooftop-best')) || 0, 0, finishMeters);
} catch { best = 0; }

function addPlatform() {
  const last = platforms.at(-1);
  const index = last.index + 1;
  const direction = last.x < 95 ? 1 : last.x > 180 ? -1 : Math.random() < .5 ? -1 : 1;
  const difficulty = clamp((490 - last.y) / (7000 * pixelsPerMeter), 0, 1);
  const x = clamp(last.x + direction * (65 + Math.random() * 47), 24, 252);
  let kind = 'solid';
  if (index % 9 === 0) kind = 'spring';
  else if (index % 8 === 6) kind = 'sticky';
  else if (index % 5 === 0) kind = 'moving';
  else if (index % 4 === 0) kind = 'cracked';
  platforms.push({
    index, x, kind, difficulty,
    y: last.y - 57 - Math.random() * 22 - 8 * difficulty,
    w: kind === 'spring' ? 76 : 76 - 12 * difficulty,
    ringValue: index % 11 === 0 ? 10 : Number(index % 3 !== 0),
    phase: Math.random() * Math.PI * 2
  });
}

function platformX(platform, time) {
  if (platform.kind !== 'moving') return platform.x;
  const amplitude = 20 + 5 * platform.difficulty;
  const speed = .002 + .0004 * platform.difficulty;
  return platform.x + amplitude * Math.sin(time * speed + platform.phase);
}

function prepare() {
  Object.assign(player, { x: 180, y: 490, vy: -normalJumpSpeed, facing: 1, stuck: 0 });
  platforms = [{ index: 0, x: 126, y: 490, w: 108, kind: 'solid' }];
  while (platforms.at(-1).y > -100) addPlatform();
  camera = top = points = 0;
  pointer = target = flash = null;
  keys.clear();
  updateScore();
  updateBackground();
}

function updateScore() {
  heightLabel.textContent = formatMeters(Math.floor(top / pixelsPerMeter));
  ringsLabel.textContent = String(points).padStart(2, '0');
}

function formatMeters(meters) {
  return meters.toLocaleString('ru-RU') + ' м';
}

function updateBackground() {
  const progress = reducedMotion.matches ? 0 : top / finishHeight;
  stage.style.setProperty('--city-position', `${100 * (1 - progress)}%`);
}

function drawClouds() {
  const offset = reducedMotion.matches ? 0 : top * .19;
  const cloudPeriod = 640;
  ctx.fillStyle = 'rgba(255, 253, 246, .55)';
  ctx.strokeStyle = 'rgba(88, 84, 72, .13)';
  ctx.lineWidth = 1;

  for (const cloud of clouds) {
    const y = (cloud.y + offset + 48) % cloudPeriod - 48;
    ctx.save();
    ctx.translate(cloud.x, y);
    ctx.scale(cloud.scale, cloud.scale);
    ctx.beginPath();
    ctx.moveTo(-43, 9);
    ctx.bezierCurveTo(-43, 2, -35, -2, -27, -1);
    ctx.bezierCurveTo(-22, -15, -3, -18, 7, -7);
    ctx.bezierCurveTo(20, -16, 34, -8, 35, 1);
    ctx.bezierCurveTo(47, 1, 52, 6, 52, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function endRound(won = false) {
  playing = false;
  delete stage.dataset.playing;
  const meters = Math.floor(top / pixelsPerMeter);
  best = Math.max(best, meters);
  try { localStorage.setItem('dd-rooftop-best', best); } catch {}
  const restoreFocus = document.activeElement === canvas;
  const stats = `Очки — ${points} · Рекорд — ${formatMeters(best)}`;
  if (won) {
    stage.dataset.victory = '';
    victoryArt.hidden = false;
    const title = document.createElement('span');
    title.className = 'rooftop-victory-title';
    title.textContent = 'Финиш!';
    const altitude = document.createElement('strong');
    altitude.className = 'rooftop-victory-height';
    altitude.textContent = formatMeters(meters);
    result.replaceChildren(title, altitude, document.createTextNode(stats));
  } else {
    result.textContent = `Высота — ${formatMeters(meters)} · ${stats}`;
  }
  start.hidden = false;
  start.textContent = 'Ещё прыжок';
  if (restoreFocus) start.focus({ preventScroll: true });
}

function step(dt, time) {
  if (player.stuck > 0) {
    player.stuck = Math.max(0, player.stuck - dt);
    return;
  }
  const direction = Number(rightKeys.some(key => keys.has(key))) - Number(leftKeys.some(key => keys.has(key)));
  const dx = target === null ? direction * 280 * dt : clamp(target - player.x, -340 * dt, 340 * dt);
  if (Math.abs(dx) > .1) player.facing = Math.sign(dx);
  player.x = clamp(player.x + dx, 13, width - 13);
  const oldY = player.y;
  player.vy += 645 * dt;
  player.y += player.vy * dt;

  for (const platform of platforms) {
    if (platform.broken) continue;
    const x = platformX(platform, time);
    if (platform.ringValue && Math.hypot(player.x - x - platform.w / 2, player.y - platform.y + 4) < 24) {
      points += platform.ringValue;
      platform.ringValue = 0;
    }
    if (player.vy > 0 && oldY <= platform.y && player.y >= platform.y &&
      player.x + 10 > x && player.x - 10 < x + platform.w) {
      player.y = platform.y;
      player.vy = platform.kind === 'spring' ? -springJumpSpeed : -normalJumpSpeed;
      if (platform.kind === 'sticky') {
        player.vy = -stickyJumpSpeed;
        player.stuck = stickyHoldSeconds;
      }
      if (platform.kind === 'cracked') platform.broken = true;
      flash = { x: player.x, y: player.y, time };
      break;
    }
  }

  top = Math.min(finishHeight, Math.max(top, 490 - player.y));
  camera = Math.min(camera, player.y - height * .55);
  while (platforms.at(-1).y > camera - 110) addPlatform();
  platforms = platforms.filter(platform => platform.y < camera + height + 85);
  updateScore();
  updateBackground();
  if (top === finishHeight) endRound(true);
  else if (player.y > camera + height + 50) endRound();
}

function rounded(x, y, w, h, radius, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRing(x, y, gold) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(.55);
  const metal = gold ? '#ffd95f' : '#f3f3f1';
  const shade = gold ? '#bb771a' : '#94969a';
  for (const [color, lineWidth] of [[ink, 5], [metal, 3], [shade, 1]]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlatform(platform, time) {
  const x = platformX(platform, time);
  const y = platform.y - camera;
  const { w, kind } = platform;
  if (platform.ringValue) drawRing(x + w / 2, y - 22, platform.ringValue === 10);
  if (kind === 'spring') {
    rounded(x + 9, y + 26, w - 18, 6, 2, '#a0a1a2');
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 10, y + 7);
    for (let turn = 0; turn < 5; turn++) {
      ctx.lineTo(x + w / 2 + (turn % 2 ? -10 : 10), y + 11 + turn * 3);
    }
    ctx.stroke();
    for (const side of [12, w - 12]) {
      for (let link = 0; link < 3; link++) {
        rounded(x + side - 2.5, y + 6 + link * 6, 5, 8, 2, '#c9c9c8');
      }
    }
  }
  rounded(x, y, w, kind === 'moving' ? 15 : 13, kind === 'moving' ? 7 : 3, '#a9aaac');
  if (kind === 'solid' || kind === 'spring') rounded(x, y, w, 5, 2, yellow);
  if (kind === 'sticky') {
    for (const [offset, drop] of [[.18, 9], [.46, 6], [.72, 10]]) {
      rounded(x + w * offset, y + 1, 8, drop, 4, '#d99a29');
    }
    rounded(x, y, w, 5, 2, '#d99a29');
  }
  if (kind === 'cracked') {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + w * .5, y);
    ctx.lineTo(x + w * .45, y + 5);
    ctx.lineTo(x + w * .52, y + 8);
    ctx.lineTo(x + w * .48, y + 13);
    ctx.stroke();
  }
  if (kind === 'moving') {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('›››', x + w / 2, y + 11);
  }
}

function paint(time = 0) {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawClouds();
  for (const platform of platforms) {
    if (!platform.broken) drawPlatform(platform, time);
  }
  if (flash && time - flash.time < 150) {
    const y = flash.y - camera;
    ctx.fillStyle = yellow;
    ctx.beginPath();
    ctx.moveTo(flash.x - 15, y);
    ctx.lineTo(flash.x - 6, y - 8);
    ctx.lineTo(flash.x, y - 18);
    ctx.lineTo(flash.x + 5, y - 7);
    ctx.lineTo(flash.x + 15, y);
    ctx.fill();
  }
  if (mascot.complete && mascot.naturalWidth) {
    ctx.save();
    ctx.translate(player.x, player.y - camera);
    ctx.scale(player.facing, 1);
    ctx.drawImage(mascot, -29.5, -68, 59, 68);
    ctx.restore();
  }
}

function frame(time) {
  if (!playing) return;
  const dt = previous === null ? 0 : Math.min((time - previous) / 1000, .033);
  previous = time;
  step(dt, time);
  paint(time);
  if (playing) requestAnimationFrame(frame);
}

start.addEventListener('click', () => {
  prepare();
  delete stage.dataset.victory;
  victoryArt.hidden = true;
  victoryArt.loading = 'eager';
  result.textContent = '';
  start.hidden = true;
  stage.dataset.playing = '';
  playing = true;
  previous = null;
  if (touchLayout.matches) {
    stage.scrollIntoView({ block: 'center', behavior: 'instant' });
  } else {
    canvas.focus({ preventScroll: true });
  }
  requestAnimationFrame(frame);
});

canvas.addEventListener('keydown', event => {
  if (!playing || ![...leftKeys, ...rightKeys].includes(event.code)) return;
  event.preventDefault();
  target = null;
  keys.add(event.code);
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => {
  keys.clear();
  pointer = target = activeTouch = null;
});

function aim(clientX) {
  const rect = canvas.getBoundingClientRect();
  target = (clientX - rect.left) * width / rect.width;
}
canvas.addEventListener('pointerdown', event => {
  if (!playing || pointer !== null || event.pointerType === 'touch') return;
  canvas.focus({ preventScroll: true });
  canvas.setPointerCapture(event.pointerId);
  pointer = event.pointerId;
  aim(event.clientX);
});
canvas.addEventListener('pointermove', event => {
  if (event.pointerId === pointer) aim(event.clientX);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(eventName, event => {
    if (event.pointerId === pointer) pointer = target = null;
  });
}
// Claim touch gestures on the playfield, including browsers that start native scrolling
// before pointer capture can take effect. Outside the playfield the page scrolls normally.
stage.addEventListener('touchstart', event => {
  if (!playing) return;
  event.preventDefault();
  if (activeTouch !== null) return;
  const touch = event.changedTouches[0];
  activeTouch = touch.identifier;
  aim(touch.clientX);
}, { passive: false });

stage.addEventListener('touchmove', event => {
  if (activeTouch === null) return;
  const touch = Array.from(event.changedTouches).find(item => item.identifier === activeTouch);
  if (!touch) return;
  event.preventDefault();
  if (playing) aim(touch.clientX);
}, { passive: false });

for (const eventName of ['touchend', 'touchcancel']) {
  stage.addEventListener(eventName, event => {
    if (Array.from(event.changedTouches).some(touch => touch.identifier === activeTouch)) {
      activeTouch = target = null;
    }
  });
}

mascot.addEventListener('load', () => { if (!playing) paint(); });
mascot.src = './assets/rooftop-mascot.webp';
prepare();
paint();
start.hidden = false;
