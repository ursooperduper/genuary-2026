const WIDTH = 540;
const HEIGHT = 675;
const PNG_SCALE = 2;
const MARGIN = 24;
const CELL_SPACING = 0;
const GRID_COLS = 16;
const GRID_ROWS = 16;
// const GRID_COLS = 8;
// const GRID_ROWS = 8;
// const SCALE_MIN = 3.7;
// const SCALE_MAX = 3.7;
// const SCALE_MIN = 8.6;
// const SCALE_MAX = 8.6;
const SCALE_MIN = 3.6;
const SCALE_MAX = 3.6;
const BG_COLOR = '#f2efe6';
const GLYPH_COLOR = '#1c1c1c';
const ENABLE_ALTERNATING_COLORS = true;
const ENABLE_ROTATION = true;
const ROT_MIN = -30;
const ROT_MAX = 30;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MUTATION_AXES = ['col', 'row', 'diag', 'radial'];

let font;
let fontLoadError = null;
let paletteData = null;
let currentPalette = null;
let monochromeMode = false;
let seed = 1;
let letters = [];
let mutationAxis = 'col';

function preload() {
  font = loadFont(
    'assets/gotham.otf',
    () => {},
    (err) => {
      fontLoadError = err;
      font = null;
    },
  );
  paletteData = loadJSON(
    'assets/colors.json',
    () => {},
    () => {
      paletteData = null;
    },
  );
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  pixelDensity(1);
  noLoop();
  pickRandomPalette();
  reseed();
}

function draw() {
  randomSeed(seed);
  renderScene(this, 1);
}

function renderScene(g, scale = 1) {
  const innerW = WIDTH - MARGIN * 2;
  const innerH = HEIGHT - MARGIN * 2;
  const totalGapW = max(0, GRID_COLS - 1) * CELL_SPACING;
  const totalGapH = max(0, GRID_ROWS - 1) * CELL_SPACING;
  const cellW = (innerW - totalGapW) / GRID_COLS;
  const cellH = (innerH - totalGapH) / GRID_ROWS;
  const palette = getActivePalette();
  const baseBg = palette[0] || BG_COLOR;
  const baseGlyph = palette[1] || GLYPH_COLOR;

  g.background(baseBg);
  g.noStroke();
  g.textFont(font || 'sans-serif');
  g.textAlign(CENTER, CENTER);
  g.textSize(min(cellW, cellH) * 0.9);

  const ctx = g.drawingContext;
  const maxRad = dist(0, 0, innerW * 0.5, innerH * 0.5);

  g.push();
  if (scale !== 1) {
    g.scale(scale);
  }

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const x = MARGIN + col * (cellW + CELL_SPACING);
      const y = MARGIN + row * (cellH + CELL_SPACING);
      const letter = letters[row][col];
      const t = mutationValue(col, row, cellW, cellH, maxRad);
      const scaleFactor = lerp(SCALE_MIN, SCALE_MAX, t);
      const rotation = ENABLE_ROTATION ? radians(random(ROT_MIN, ROT_MAX)) : 0;
      const useAlt = ENABLE_ALTERNATING_COLORS && (row + col) % 2 === 1;
      const cellBg = useAlt ? baseGlyph : baseBg;
      const cellGlyph = useAlt ? baseBg : baseGlyph;

      g.fill(cellBg);
      g.rect(x, y, cellW, cellH);
      g.fill(cellGlyph);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cellW, cellH);
      ctx.clip();

      g.push();
      g.translate(x + cellW * 0.5, y + cellH * 0.5);
      g.scale(scaleFactor);
      if (rotation !== 0) {
        g.rotate(rotation);
      }
      g.text(letter, 0, 0);
      g.pop();

      ctx.restore();
    }
  }

  g.pop();
}

function mutationValue(col, row, cellW, cellH, maxRad) {
  if (mutationAxis === 'row') {
    return GRID_ROWS === 1 ? 0 : row / (GRID_ROWS - 1);
  }
  if (mutationAxis === 'diag') {
    const denom = GRID_COLS + GRID_ROWS - 2;
    return denom === 0 ? 0 : (col + row) / denom;
  }
  if (mutationAxis === 'radial') {
    const cx = MARGIN + col * cellW + cellW * 0.5;
    const cy = MARGIN + row * cellH + cellH * 0.5;
    return maxRad === 0 ? 0 : dist(cx, cy, MARGIN + (WIDTH - MARGIN * 2) * 0.5, MARGIN + (HEIGHT - MARGIN * 2) * 0.5) / maxRad;
  }
  return GRID_COLS === 1 ? 0 : col / (GRID_COLS - 1);
}

function reseed() {
  seed = floor(random(1_000_000_000));
  mutationAxis = random(MUTATION_AXES);
  letters = buildLetters();
  redraw();
}

function buildLetters() {
  randomSeed(seed);
  const grid = [];
  for (let row = 0; row < GRID_ROWS; row += 1) {
    const rowLetters = [];
    for (let col = 0; col < GRID_COLS; col += 1) {
      rowLetters.push(random(LETTERS.split('')));
    }
    grid.push(rowLetters);
  }
  return grid;
}

function getActivePalette() {
  if (monochromeMode) {
    return ['#000000', '#ffffff'];
  }
  if (currentPalette && currentPalette.length >= 2) {
    return currentPalette;
  }
  return [BG_COLOR, GLYPH_COLOR];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = [BG_COLOR, GLYPH_COLOR];
    return;
  }
  const choices = paletteData.palettes.filter(
    (palette) => palette.colors && palette.colors.length >= 2 && palette.colors.length <= 2,
  );
  if (!choices.length) {
    currentPalette = [BG_COLOR, GLYPH_COLOR];
    return;
  }
  const pick = choices[Math.floor(Math.random() * choices.length)];
  currentPalette = pick.colors.slice(0, 2);
}

function shufflePalette() {
  if (!currentPalette || currentPalette.length < 2) {
    return;
  }
  currentPalette = [currentPalette[1], currentPalette[0]];
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const pg = createGraphics(WIDTH * PNG_SCALE, HEIGHT * PNG_SCALE);
  pg.pixelDensity(1);
  randomSeed(seed);
  renderScene(pg, PNG_SCALE);
  saveCanvas(pg, `genuary-23-${timestamp}`, 'png');
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'r' || key === 'R') {
    reseed();
  } else if (key === 'c' || key === 'C') {
    monochromeMode = false;
    pickRandomPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    monochromeMode = false;
    shufflePalette();
    redraw();
  } else if (key === 'm' || key === 'M') {
    monochromeMode = !monochromeMode;
    redraw();
  }
}
