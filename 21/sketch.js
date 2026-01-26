const WIDTH = 540;
const HEIGHT = 675;
// const GRID_COLS = 8;
const GRID_COLS = 2;
// const GRID_ROWS = 10;
const GRID_ROWS = 3;
const MARGIN_X = 36;
const MARGIN_Y = 40;

const SHOW_GRID = false;
const PNG_SCALE = 1;

const BG_COLOR = '#f2eee2';
const RED_COLOR = '#c95b4a';
const BLUE_COLOR = '#5979a6';
const YELLOW_COLOR = '#d7b25a';
const BLACK_COLOR = '#2a2a2a';
const WHITE_COLOR = '#f7f3e7';

const GLYPH_POOL = 'BAUHAUSMODERNSYSTEM';
const ROTATION_ANGLES = [-90, -30, 30, 90];
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.25;
// const SCALE_MAX = 4.25;
// const DISPLACE_MAX = 0.6;
// const GLYPH_SCALE = 1.6;
const DISPLACE_MAX = 5.8;
const GLYPH_SCALE = 2.6;
// const WHITE_STROKE_W = 1.5;
const WHITE_STROKE_W = 2.5;

const COLOR_WEIGHTS = [
  { key: 'red', weight: 2 },
  { key: 'blue', weight: 2 },
  { key: 'yellow', weight: 2 },
  { key: 'black', weight: 2 },
  { key: 'white', weight: 1.5 },
];

let font;
let fontLoadError = null;
let seed = 1;
let grid = [];
let showGrid = SHOW_GRID;

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  pixelDensity(1);
  noLoop();
  reseed();
}

function draw() {
  randomSeed(seed);
  renderScene(this);
}

function preload() {
  font = loadFont(
    'assets/montserrat-bold.otf',
    () => {},
    (err) => {
      fontLoadError = err;
      font = null;
    },
  );
}

function renderScene(g) {
  const innerW = WIDTH - MARGIN_X * 2;
  const innerH = HEIGHT - MARGIN_Y * 2;
  const cellW = innerW / GRID_COLS;
  const cellH = innerH / GRID_ROWS;

  g.background(BG_COLOR);
  g.textFont(font || 'sans-serif');
  g.textAlign(CENTER, CENTER);
  g.noStroke();

  drawLayer(g, 'white', cellW, cellH);
  drawLayer(g, 'black', cellW, cellH);
  drawLayer(g, 'red', cellW, cellH);
  drawLayer(g, 'yellow', cellW, cellH);
  drawLayer(g, 'blue', cellW, cellH);

  if (showGrid) {
    g.noFill();
    g.stroke(BLACK_COLOR);
    g.strokeWeight(1);
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const x = MARGIN_X + col * cellW;
        const y = MARGIN_Y + row * cellH;
        g.rect(x, y, cellW, cellH);
      }
    }
  }
}

function drawLayer(g, colorKey, cellW, cellH) {
  const ctx = g.drawingContext;
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const cell = grid[row][col];
      if (cell.color !== colorKey) {
        continue;
      }

      const x = MARGIN_X + col * cellW;
      const y = MARGIN_Y + row * cellH;
      // const cx = x + cellW * 0.5;
      const cx = x + cellW * 0.9;
      const cy = y + cellH * 0.5;
      // const cy = y + cellH * 0.3;
      const size = min(cellW, cellH) * GLYPH_SCALE;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, cellW, cellH);
      ctx.clip();

      g.push();
      g.translate(cx + cell.offsetX * cellW, cy + cell.offsetY * cellH);
      g.rotate(radians(cell.rotation));
      g.scale(cell.scale);

      if (colorKey === 'white') {
        g.noFill();
        g.stroke(BLACK_COLOR);
        g.strokeWeight(WHITE_STROKE_W);
      } else {
        g.noStroke();
        g.fill(colorFromKey(colorKey));
      }
      g.textSize(size);
      g.text(cell.letter, 0, 0);
      g.pop();

      ctx.restore();
    }
  }
}

function reseed() {
  seed = floor(random(1_000_000_000));
  randomSeed(seed);
  grid = buildGrid();
  redraw();
}

function buildGrid() {
  const rows = [];
  for (let row = 0; row < GRID_ROWS; row += 1) {
    const rowCells = [];
    for (let col = 0; col < GRID_COLS; col += 1) {
      const colorKey = pickWeightedColor();
      const cell = {
        letter: random(GLYPH_POOL.split('')),
        color: colorKey,
        rotation: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };

      if (colorKey === 'red') {
        cell.rotation = random(ROTATION_ANGLES);
      } else if (colorKey === 'yellow') {
        cell.scale = random(SCALE_MIN, SCALE_MAX);
      } else if (colorKey === 'blue') {
        cell.offsetX = random(-DISPLACE_MAX, DISPLACE_MAX);
        cell.offsetY = random(-DISPLACE_MAX, DISPLACE_MAX);
      }

      rowCells.push(cell);
    }
    rows.push(rowCells);
  }
  return rows;
}

function pickWeightedColor() {
  const total = COLOR_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let pick = random(total);
  for (const item of COLOR_WEIGHTS) {
    pick -= item.weight;
    if (pick <= 0) {
      return item.key;
    }
  }
  return COLOR_WEIGHTS[COLOR_WEIGHTS.length - 1].key;
}

function colorFromKey(key) {
  if (key === 'red') {
    return RED_COLOR;
  }
  if (key === 'blue') {
    return BLUE_COLOR;
  }
  if (key === 'yellow') {
    return YELLOW_COLOR;
  }
  if (key === 'white') {
    return WHITE_COLOR;
  }
  return BLACK_COLOR;
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
  renderScene(pg);
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
  } else if (key === 'g' || key === 'G') {
    showGrid = !showGrid;
    redraw();
  }
}
