const WIDTH = 540;
const HEIGHT = 675;

// Geometry
let numSites = 520;
// const minSiteDist = 16;
const minSiteDist = 24;
const kNeighbors = 6;
let sites = [];
let neighbors = [];
let radii = [];

// CA
const NUM_STATES = 12;
let states = [];
let nextStates = [];
let stepCount = 0;
let tickEvery = 12;
let frameCounter = 0;
let paused = false;
let currentRule = 'B';

// Palette
const PAPER = '#F5F1E8';
const INK = '#0F0F0F';
const ACCENT = '#E94F37';

// Tiles
const numStyles = 9;

function setup() {
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  frameRate(24);
  initSystem();
}

function initSystem() {
  generateSites();
  buildNeighborGraph();
  seedStates();
  stepCount = 0;
  frameCounter = 0;
}

function generateSites() {
  sites = [];
  // const maxAttempts = numSites * 20;
  const maxAttempts = numSites * 2;
  let attempts = 0;
  while (sites.length < numSites && attempts < maxAttempts) {
    const x = random(10, WIDTH - 10);
    const y = random(10, HEIGHT - 10);
    let ok = true;
    for (let i = 0; i < sites.length; i++) {
      if (dist(x, y, sites[i].x, sites[i].y) < minSiteDist) {
        ok = false;
        break;
      }
    }
    if (ok) {
      sites.push({ x, y });
    }
    attempts++;
  }
  numSites = sites.length;
}

function buildNeighborGraph() {
  neighbors = new Array(numSites).fill(0).map(() => []);
  radii = new Array(numSites).fill(minSiteDist * 20.6);

  for (let i = 0; i < numSites; i++) {
    const dists = [];
    for (let j = 0; j < numSites; j++) {
      if (i === j) continue;
      const dx = sites[j].x - sites[i].x;
      const dy = sites[j].y - sites[i].y;
      const d = sqrt(dx * dx + dy * dy);
      dists.push({ j, d });
    }
    dists.sort((a, b) => a.d - b.d);
    const chosen = dists.slice(0, kNeighbors);
    neighbors[i] = chosen;
    const nearest = chosen[0] ? chosen[0].d : minSiteDist;
    radii[i] = nearest * 0.48;
  }
}

function seedStates() {
  states = new Array(numSites).fill(0);
  nextStates = new Array(numSites).fill(0);
  
  // Dominant base state
  for (let i = 0; i < numSites; i++) states[i] = 0;
  
  // Add bands
  const bandCount = 3;
  for (let b = 0; b < bandCount; b++) {
    const angle = random(TWO_PI);
    const offset = random(-WIDTH * 0.2, WIDTH * 0.2);
    const bandState = floor(random(1, NUM_STATES));
    for (let i = 0; i < numSites; i++) {
      const s = sites[i];
      const proj = s.x * cos(angle) + s.y * sin(angle);
      if (abs(proj + offset) < 50) {
        states[i] = bandState;
      }
    }
  }
  
  // Accent islands
  // const islandCount = 4;
  const islandCount = 3;
  for (let k = 0; k < islandCount; k++) {
    const cx = random(WIDTH);
    const cy = random(HEIGHT);
    // const rad = random(40, 90);
    const rad = random(20, 200);
    const st = floor(random(2, NUM_STATES));
    for (let i = 0; i < numSites; i++) {
      if (dist(sites[i].x, sites[i].y, cx, cy) < rad) {
        states[i] = st;
      }
    }
  }
}

function draw() {
  background(PAPER);
  
  if (!paused) {
    frameCounter++;
    if (frameCounter >= tickEvery) {
      stepAutomaton();
      frameCounter = 0;
      stepCount++;
    }
  }
  
  drawCells();
  drawOverlay();
}

function stepAutomaton() {
  if (currentRule === 'A') {
    ruleA();
  } else {
    ruleB();
  }
  const tmp = states;
  states = nextStates;
  nextStates = tmp;
}

// Rule A: distance-weighted sum with anti-majority
function ruleA() {
  const p = 1.25;
  for (let i = 0; i < numSites; i++) {
    const k = states[i];
    let weighted = 0;
    let totalW = 0;
    const counts = new Array(NUM_STATES).fill(0);
    for (const n of neighbors[i]) {
      const w = 1 / pow(max(n.d, 1e-3), p);
      weighted += w * states[n.j];
      totalW += w;
      counts[states[n.j]]++;
    }
    const dominant = counts.indexOf(Math.max(...counts));
    let next = (k + floor(weighted / max(totalW, 1e-6))) % NUM_STATES;
    if (counts[dominant] >= neighbors[i].length - 1) {
      next = (dominant + 2) % NUM_STATES;
    }
    nextStates[i] = next;
  }
}

// Rule B: edge-driven contrast
function ruleB() {
  for (let i = 0; i < numSites; i++) {
    const k = states[i];
    let contrast = 0;
    for (const n of neighbors[i]) {
      if (states[n.j] !== k) contrast++;
    }
    const ratio = contrast / neighbors[i].length;
    if (ratio > 0.65) {
      nextStates[i] = (k + 1) % NUM_STATES;
    } else if (ratio < 0.2) {
      nextStates[i] = (k + NUM_STATES - 1) % NUM_STATES;
    } else {
      nextStates[i] = k;
    }
  }
}

function drawCells() {
  noStroke();
  for (let i = 0; i < numSites; i++) {
    const s = sites[i];
    const r = radii[i];
    const state = states[i];
    const useAccent = shouldAccent(i, state);
    drawTile(state, s.x, s.y, r, useAccent, i);
  }
}

function shouldAccent(idx, state) {
  if (state === NUM_STATES - 1) return true;
  let diff = 0;
  for (const n of neighbors[idx]) {
    if (states[n.j] !== state) diff++;
  }
  return diff >= 5;
}

function drawTile(state, cx, cy, r, accent, idx) {
  push();
  translate(cx, cy);
  const styleIndex = state % numStyles;
  const lineW = r * 0.22;
  const ink = accent ? ACCENT : INK;
  const orient = atan2(cy - HEIGHT * 0.5, cx - WIDTH * 0.5);
  
  fill(PAPER);
  stroke(PAPER);
  strokeWeight(r * 0.08);
  circle(0, 0, r * 2.05);
  
  switch (styleIndex) {
    case 0: // solid
      noStroke();
      fill(ink);
      // circle(0, 0, r * 2);
      circle(0, 0, r * 8);
      break;
    case 1: // horizontal hatch
      fill(PAPER);
      stroke(ink);
      strokeWeight(lineW);
      // const hs = r * 0.8;
      const hs = r * 4;
      for (let y = -r; y <= r; y += hs) line(-r, y, r, y);
      break;
    case 2: // vertical hatch
      fill(PAPER);
      stroke(ink);
      strokeWeight(lineW);
      // const vs = r * 0.8;
      const vs = r * 4;
      for (let x = -r; x <= r; x += vs) line(x, -r, x, r);
      break;
    case 3: // diag /
      stroke(ink);
      strokeWeight(lineW);
      for (let t = -r * 2; t <= r * 2; t += r * 0.9) line(t - r, -r, t + r, r);
      break;
    case 4: // diag \
      stroke(ink);
      strokeWeight(lineW);
      for (let t = -r * 2; t <= r * 2; t += r * 0.9) line(t - r, r, t + r, -r);
      break;
    case 5: // dots
      noStroke();
      fill(ink);
      const dotR = r * 0.35;
      const spacing = r * 0.95;
      for (let y = -r; y <= r; y += spacing) {
        for (let x = -r; x <= r; x += spacing) {
          circle(x, y, dotR);
        }
      }
      break;
    case 6: // oriented band
      noStroke();
      fill(ink);
      const w = r * 2;
      // const h = r * 0.55;
      const h = r * 4.55;
      push();
      rotate(orient);
      rectMode(CENTER);
      // Avoid roundRect (not supported in SVG renderer); use crisp rectangle
      rect(0, 0, w, h);
      pop();
      break;
    case 7: // border inset
      noFill();
      stroke(ink);
      strokeWeight(lineW);
      circle(0, 0, r * 1.8);
      break;
    case 8: // knockout
      // already paper
      break;
  }
  pop();
}

function drawOverlay() {
  push();
  fill(INK);
  noStroke();
  // textAlign(LEFT, TOP);
  // textSize(10);
  // text(`Rule ${currentRule} | Step ${stepCount} | Sites ${numSites} | ${paused ? 'PAUSED' : 'RUN'}`, 10, 10);
  // text(`[Space] pause | [R] reseed | [1/2] rule | [S] PNG | [P] SVG | [+/-] speed`, 10, 25);
  pop();
}

function keyPressed() {
  if (key === ' ') {
    paused = !paused;
  } else if (key === 'r' || key === 'R') {
    initSystem();
  } else if (key === '1') {
    currentRule = 'A';
  } else if (key === '2') {
    currentRule = 'B';
  } else if (key === 's' || key === 'S') {
    saveFrame();
  } else if (key === 'p' || key === 'P') {
    saveAsSvg();
  } else if (key === '+' || key === '=') {
    tickEvery = max(1, tickEvery - 1);
  } else if (key === '-' || key === '_') {
    tickEvery = min(12, tickEvery + 1);
  }
}

function saveFrame() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `genuary-09a-${timestamp}`;
  
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const isSvgRenderer = renderer === SVG;
  
  if (!isSvgRenderer) {
    saveCanvas(base, 'png');
    return;
  }

  // SVG mode: rasterize to PNG
  let svgNode = document.querySelector('#sketch-holder svg') || document.querySelector('svg');
  if (!(svgNode instanceof Node)) {
    console.warn('PNG export failed: no SVG node found');
    return;
  }

  const serializer = new XMLSerializer();
  const rawSvg = serializer.serializeToString(svgNode);
  const parsed = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
  const root = parsed.documentElement;
  const targetW = WIDTH * 2;
  const targetH = HEIGHT * 2;
  root.setAttribute('width', `${targetW}`);
  root.setAttribute('height', `${targetH}`);
  if (!root.getAttribute('viewBox')) {
    root.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  }
  const svgData = serializer.serializeToString(root);

  const img = new Image();
  const buffer = document.createElement('canvas');
  buffer.width = targetW;
  buffer.height = targetH;
  const ctx = buffer.getContext('2d');

  img.onload = () => {
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const link = document.createElement('a');
    link.download = `${base}.png`;
    link.href = buffer.toDataURL('image/png');
    link.click();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-09a-${timestamp}.svg`);
}
