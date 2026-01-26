const WIDTH = 540;
const HEIGHT = 675;
const MARGIN = 40;
const PNG_SCALE = 2;
// const ROW_STEP = 12; // original
const ROW_STEP = 8;
// const H_STEP = 3; // original
const H_STEP = 2;
const ROW_STEP_V = 10;
const H_STEP_V = 2;
// const STROKE_W = 2;
const STROKE_W = 2;
// const OSC_AMP = 10;
const OSC_AMP = 2;
// const OSC_FREQ = Math.PI * 2 / 18;
const OSC_FREQ = Math.PI * 2 / 18;
const OSC_AMP_V = 4;
const OSC_FREQ_V = Math.PI * 2 / 18;
// const BLEED = 140; // original
const BLEED = 20;

const BG_COLOR = '#f2efe6';
const LINE_COLOR = '#1c1c1c';

const SHAPE_COUNT_MIN = 1;
const SHAPE_COUNT_MAX = 3;
const ROTATE_SHAPES = true;

let seed = 1;
let shapes = [];
let verticalScan = false;
let invertColors = false;
let monochromeMode = false;
let paletteData = null;
let currentPalette = null;

function preload() {
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
  const palette = getActivePalette();
  const bg = palette[0] || BG_COLOR;
  const line = palette[1] || LINE_COLOR;
  g.background(bg);
  g.stroke(line);
  g.strokeWeight(STROKE_W);
  g.strokeJoin(ROUND);
  g.strokeCap(SQUARE);
  g.noFill();

  g.push();
  if (scale !== 1) {
    g.scale(scale);
  }

  const xMin = MARGIN;
  const xMax = WIDTH - MARGIN;
  const yMin = MARGIN;
  const yMax = HEIGHT - MARGIN;

  g.beginShape();
  if (!verticalScan) {
    let y = yMin;
    let dir = 1;

    while (y <= yMax) {
      const startX = dir === 1 ? xMin : xMax;
      const endX = dir === 1 ? xMax : xMin;
      const step = dir === 1 ? H_STEP : -H_STEP;
      let x = startX;
      let traveled = 0;

      while ((dir === 1 && x <= endX) || (dir === -1 && x >= endX)) {
        const inside = pointInShapes(x, y);
        const offset = inside ? sin(traveled * OSC_FREQ) * OSC_AMP : 0;
        g.vertex(x, y + offset);
        x += step;
        traveled += abs(step);
      }

      g.vertex(endX, y);
      y += ROW_STEP;
      if (y > yMax) {
        break;
      }
      g.vertex(endX, y);
      dir *= -1;
    }
  } else {
    let x = xMin;
    let dir = 1;

    while (x <= xMax) {
      const startY = dir === 1 ? yMin : yMax;
      const endY = dir === 1 ? yMax : yMin;
      const step = dir === 1 ? H_STEP_V : -H_STEP_V;
      let y = startY;
      let traveled = 0;

      while ((dir === 1 && y <= endY) || (dir === -1 && y >= endY)) {
        const inside = pointInShapes(x, y);
        const offset = inside ? sin(traveled * OSC_FREQ_V) * OSC_AMP_V : 0;
        g.vertex(x + offset, y);
        y += step;
        traveled += abs(step);
      }

      g.vertex(x, endY);
      x += ROW_STEP_V;
      if (x > xMax) {
        break;
      }
      g.vertex(x, endY);
      dir *= -1;
    }
  }

  g.endShape();
  g.pop();
}

function getActivePalette() {
  if (monochromeMode) {
    return invertColors ? ['#ffffff', '#000000'] : ['#000000', '#ffffff'];
  }
  if (currentPalette && currentPalette.length >= 2) {
    return currentPalette;
  }
  return [BG_COLOR, LINE_COLOR];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = [BG_COLOR, LINE_COLOR];
    return;
  }
  const choices = paletteData.palettes.filter(
    (palette) => palette.colors && palette.colors.length >= 2 && palette.colors.length <= 2,
  );
  if (!choices.length) {
    currentPalette = [BG_COLOR, LINE_COLOR];
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

function reseed() {
  seed = floor(random(1_000_000_000));
  randomSeed(seed);
  shapes = buildShapes();
  redraw();
}

function buildShapes() {
  const options = ['circle', 'square', 'triangle'];
  const count = floor(random(SHAPE_COUNT_MIN, SHAPE_COUNT_MAX + 1));
  const picked = shuffle(options.slice(), true).slice(0, count);
  const sizeBase = min(WIDTH, HEIGHT);
  const list = [];

  for (const type of picked) {
    let placed = false;
    for (let attempt = 0; attempt < 80 && !placed; attempt += 1) {
      const cx = random(-BLEED, WIDTH + BLEED);
      const cy = random(-BLEED, HEIGHT + BLEED);
      const rot = ROTATE_SHAPES ? random(-PI, PI) : 0;
      let shape = null;

      if (type === 'circle') {
        const r = random(sizeBase * 0.18, sizeBase * 0.35);
        shape = { type, cx, cy, r };
      } else if (type === 'square') {
        const s = random(sizeBase * 0.25, sizeBase * 0.5);
        shape = { type, cx, cy, s, rot };
      } else if (type === 'triangle') {
        const t = random(sizeBase * 0.25, sizeBase * 0.5);
        const vertices = triangleVertices(cx, cy, t, rot);
        shape = { type, cx, cy, t, rot, vertices };
      }

      if (shape && !overlapsExisting(shape, list)) {
        list.push(shape);
        placed = true;
      }
    }
  }

  return list;
}

function overlapsExisting(candidate, list) {
  const radius = shapeRadius(candidate);
  for (const shape of list) {
    const otherRadius = shapeRadius(shape);
    if (dist(candidate.cx, candidate.cy, shape.cx, shape.cy) < radius + otherRadius) {
      return true;
    }
  }
  return false;
}

function shapeRadius(shape) {
  if (shape.type === 'circle') {
    return shape.r;
  }
  if (shape.type === 'square') {
    return shape.s * Math.SQRT2 * 0.5;
  }
  if (shape.type === 'triangle') {
    return shape.t;
  }
  return 0;
}

function pointInShapes(px, py) {
  for (const shape of shapes) {
    if (shape.type === 'circle' && pointInCircle(px, py, shape)) {
      return true;
    }
    if (shape.type === 'square' && pointInSquare(px, py, shape)) {
      return true;
    }
    if (shape.type === 'triangle' && pointInTriangle(px, py, shape.vertices)) {
      return true;
    }
  }
  return false;
}

function pointInCircle(px, py, shape) {
  return dist(px, py, shape.cx, shape.cy) <= shape.r;
}

function pointInSquare(px, py, shape) {
  const dx = px - shape.cx;
  const dy = py - shape.cy;
  const angle = -shape.rot;
  const rx = dx * cos(angle) - dy * sin(angle);
  const ry = dx * sin(angle) + dy * cos(angle);
  const half = shape.s / 2;
  return rx >= -half && rx <= half && ry >= -half && ry <= half;
}

function triangleVertices(cx, cy, size, rot) {
  const vertices = [];
  const angleOffset = -HALF_PI + rot;
  for (let i = 0; i < 3; i += 1) {
    const angle = angleOffset + i * TWO_PI / 3;
    vertices.push({
      x: cx + cos(angle) * size,
      y: cy + sin(angle) * size,
    });
  }
  return vertices;
}

function pointInTriangle(px, py, vertices) {
  const [a, b, c] = vertices;
  const v0x = c.x - a.x;
  const v0y = c.y - a.y;
  const v1x = b.x - a.x;
  const v1y = b.y - a.y;
  const v2x = px - a.x;
  const v2y = py - a.y;

  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;

  const denom = dot00 * dot11 - dot01 * dot01;
  if (denom === 0) {
    return false;
  }
  const inv = 1 / denom;
  const u = (dot11 * dot02 - dot01 * dot12) * inv;
  const v = (dot00 * dot12 - dot01 * dot02) * inv;
  return u >= 0 && v >= 0 && u + v <= 1;
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
  } else if (key === 'v' || key === 'V') {
    verticalScan = !verticalScan;
    redraw();
  } else if (key === 'm' || key === 'M') {
    monochromeMode = !monochromeMode;
    redraw();
  } else if (key === 'i' || key === 'I') {
    if (monochromeMode) {
      invertColors = !invertColors;
      redraw();
    }
  } else if (key === 'c' || key === 'C') {
    monochromeMode = false;
    pickRandomPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    monochromeMode = false;
    shufflePalette();
    redraw();
  }
}
