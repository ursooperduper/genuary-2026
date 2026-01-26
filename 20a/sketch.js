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
const STROKE_W = 1;
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

// Layer 2 Configuration
const LAYER2_ENABLED = false;       // Toggle for second layer
const STROKE_W_L2 = 2;               // Layer 2 stroke weight; 0.5–3
const ROW_STEP_L2 = 12;              // Layer 2 horizontal spacing (original 12); 6–16
const H_STEP_L2 = 3;                 // Layer 2 horizontal step (original 3); 1–5
const ROW_STEP_V_L2 = 14;            // Layer 2 vertical spacing; 8–20
const H_STEP_V_L2 = 3;               // Layer 2 vertical step; 1–5
const OSC_AMP_L2 = 3;                // Layer 2 amplitude; 1–6
const OSC_FREQ_L2 = Math.PI * 2 / 14; // Layer 2 frequency; adjust denominator for slower/faster
const OSC_AMP_V_L2 = 5;              // Layer 2 vertical amplitude; 2–8
const OSC_FREQ_V_L2 = Math.PI * 2 / 14; // Layer 2 vertical frequency

let seed = 1;
let shapes = [];
let shapes2 = [];
let layer2Visible = LAYER2_ENABLED;
let verticalScan = false;       // Layer 1 scan mode
let verticalScan2 = false;      // Layer 2 scan mode (independent)
let goNutsMode = false;         // Weird composite mode flag
let goNutsKind = 0;             // Which weird recipe (1-4)
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
  disableSmoothing(this);
  noLoop();
  pickRandomPalette();
  reseed();
}

function draw() {
  randomSeed(seed);
  if (goNutsMode) {
    renderWeird(goNutsKind);
  } else {
    renderScene(this, 1);
  }
}

function renderScene(g, scale = 1) {
  const palette = getActivePalette();
  const bg = palette[0] || BG_COLOR;
  const line = palette[1] || LINE_COLOR;
  const line2 = palette[2] || palette[1] || LINE_COLOR; // Use 3rd color for layer 2, fallback to line color
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
    // Horizontal scanlines (left-right, step vertically)
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
  } else if (verticalScan) {
    // Vertical scanlines (top-bottom, step horizontally)
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

  // Layer 2 (optional second pass with different settings)
  if (layer2Visible) {
    g.endShape();
    g.beginShape();
    g.stroke(line2); // Use distinct color for layer 2
    g.strokeWeight(STROKE_W_L2);
    
    if (!verticalScan2) {
      let y = yMin;
      let dir = 1;

      while (y <= yMax) {
        const startX = dir === 1 ? xMin : xMax;
        const endX = dir === 1 ? xMax : xMin;
        const step = dir === 1 ? H_STEP_L2 : -H_STEP_L2;
        let x = startX;
        let traveled = 0;

        while ((dir === 1 && x <= endX) || (dir === -1 && x >= endX)) {
          const inside = pointInShapes2(x, y);
          const offset = inside ? sin(traveled * OSC_FREQ_L2) * OSC_AMP_L2 : 0;
          g.vertex(x, y + offset);
          x += step;
          traveled += abs(step);
        }

        g.vertex(endX, y);
        y += ROW_STEP_L2;
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
        const step = dir === 1 ? H_STEP_V_L2 : -H_STEP_V_L2;
        let y = startY;
        let traveled = 0;

        while ((dir === 1 && y <= endY) || (dir === -1 && y >= endY)) {
          const inside = pointInShapes2(x, y);
          const offset = inside ? sin(traveled * OSC_FREQ_V_L2) * OSC_AMP_V_L2 : 0;
          g.vertex(x + offset, y);
          y += step;
          traveled += abs(step);
        }

        g.vertex(x, endY);
        x += ROW_STEP_V_L2;
        if (x > xMax) {
          break;
        }
        g.vertex(x, endY);
        dir *= -1;
      }
    }
  }

  g.endShape();
  g.pop();
}

function renderLayer(g, layerIndex, includeBackground, scale = 1) {
  const palette = getActivePalette();
  const bg = palette[0] || BG_COLOR;
  const line1 = palette[1] || LINE_COLOR;
  const line2 = palette[2] || palette[1] || LINE_COLOR;
  const line = layerIndex === 1 ? line1 : line2;

  const isVertical = layerIndex === 1 ? verticalScan : verticalScan2;
  const strokeW = (layerIndex === 1 ? STROKE_W : STROKE_W_L2) * scale;
  const rowStep = (layerIndex === 1 ? ROW_STEP : ROW_STEP_L2) * scale;
  const hStep = (layerIndex === 1 ? H_STEP : H_STEP_L2) * scale;
  const rowStepV = (layerIndex === 1 ? ROW_STEP_V : ROW_STEP_V_L2) * scale;
  const hStepV = (layerIndex === 1 ? H_STEP_V : H_STEP_V_L2) * scale;
  const amp = (layerIndex === 1 ? OSC_AMP : OSC_AMP_L2) * scale;
  const freq = layerIndex === 1 ? OSC_FREQ : OSC_FREQ_L2;
  const ampV = (layerIndex === 1 ? OSC_AMP_V : OSC_AMP_V_L2) * scale;
  const freqV = layerIndex === 1 ? OSC_FREQ_V : OSC_FREQ_V_L2;
  const insideFn = layerIndex === 1 ? pointInShapes : pointInShapes2;

  if (includeBackground) {
    g.background(bg);
  } else {
    g.clear();
  }
  g.stroke(line);
  g.strokeWeight(strokeW);
  g.strokeJoin(ROUND);
  g.strokeCap(SQUARE);
  g.noFill();

  g.push();
  const xMin = MARGIN * scale;
  const xMax = (WIDTH - MARGIN) * scale;
  const yMin = MARGIN * scale;
  const yMax = (HEIGHT - MARGIN) * scale;

  g.beginShape();
  if (!isVertical) {
    let y = yMin;
    let dir = 1;

    while (y <= yMax) {
      const startX = dir === 1 ? xMin : xMax;
      const endX = dir === 1 ? xMax : xMin;
      const step = dir === 1 ? hStep : -hStep;
      let x = startX;
      let traveled = 0;

      while ((dir === 1 && x <= endX) || (dir === -1 && x >= endX)) {
        const inside = insideFn(x / scale, y / scale);
        const offset = inside ? sin(traveled * freq) * amp : 0;
        g.vertex(x, y + offset);
        x += step;
        traveled += abs(step);
      }

      g.vertex(endX, y);
      y += rowStep;
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
      const step = dir === 1 ? hStepV : -hStepV;
      let y = startY;
      let traveled = 0;

      while ((dir === 1 && y <= endY) || (dir === -1 && y >= endY)) {
        const inside = insideFn(x / scale, y / scale);
        const offset = inside ? sin(traveled * freqV) * ampV : 0;
        g.vertex(x + offset, y);
        y += step;
        traveled += abs(step);
      }

      g.vertex(x, endY);
      x += rowStepV;
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

function renderWeird(kind, g = null, scale = 1) {
  const palette = getActivePalette();
  const bg = palette[0] || BG_COLOR;
  const targetG = g || window;
  const w = WIDTH * scale;
  const h = HEIGHT * scale;

  // Prepare two stroke-only layers
  const layer1 = createGraphics(w, h);
  layer1.pixelDensity(1);
  disableSmoothing(layer1);
  const layer2 = createGraphics(w, h);
  layer2.pixelDensity(1);
  disableSmoothing(layer2);

  renderLayer(layer1, 1, false, scale);
  renderLayer(layer2, 2, false, scale);

  // Base output
  targetG.clear();
  targetG.background(bg);

  if (kind === 1) {
    // Clip layer 2 to shapes from layer 1 over layer 1 background
    const base = createGraphics(w, h);
    base.pixelDensity(1);
    disableSmoothing(base);
    renderLayer(base, 1, true, scale);

    targetG.image(base, 0, 0);
    const ctx = targetG.drawingContext;
    ctx.save();
    ctx.beginPath();
    addShapesPath(ctx, shapes, scale);
    ctx.clip();
    targetG.image(layer2, 0, 0);
    ctx.restore();
  } else if (kind === 2) {
    // Clip layer 1 to shapes from layer 2 over layer 2 background
    const base = createGraphics(w, h);
    base.pixelDensity(1);
    disableSmoothing(base);
    renderLayer(base, 2, true, scale);

    targetG.image(base, 0, 0);
    const ctx = targetG.drawingContext;
    ctx.save();
    ctx.beginPath();
    addShapesPath(ctx, shapes2, scale);
    ctx.clip();
    targetG.image(layer1, 0, 0);
    ctx.restore();
  } else if (kind === 3) {
    // Horizontal bars alternating between layer 1 and layer 2
    const bars = floor(random(3, 9));
    const barH = h / bars;
    for (let i = 0; i < bars; i += 1) {
      const y = i * barH;
      const useLayer1 = i % 2 === 0;
      const ctx = targetG.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, w, barH);
      ctx.clip();
      targetG.image(useLayer1 ? layer1 : layer2, 0, 0);
      ctx.restore();
    }
  } else if (kind === 4) {
    // Vertical bars alternating between layer 1 and layer 2
    const bars = floor(random(3, 7));
    const barW = w / bars;
    for (let i = 0; i < bars; i += 1) {
      const x = i * barW;
      const useLayer1 = i % 2 === 0;
      const ctx = targetG.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, barW, h);
      ctx.clip();
      targetG.image(useLayer1 ? layer1 : layer2, 0, 0);
      ctx.restore();
    }
  }
}

function addShapesPath(ctx, shapeList, scale = 1) {
  for (const shape of shapeList) {
    if (shape.type === 'circle') {
      const cx = shape.cx * scale;
      const cy = shape.cy * scale;
      const r = shape.r * scale;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, TWO_PI);
    } else if (shape.type === 'square') {
      ctx.save();
      ctx.translate(shape.cx * scale, shape.cy * scale);
      ctx.rotate(shape.rot || 0);
      const s = shape.s * scale;
      ctx.rect(-s / 2, -s / 2, s, s);
      ctx.restore();
    } else if (shape.type === 'triangle') {
      const [a, b, c] = shape.vertices;
      ctx.moveTo(a.x * scale, a.y * scale);
      ctx.lineTo(b.x * scale, b.y * scale);
      ctx.lineTo(c.x * scale, c.y * scale);
      ctx.closePath();
    }
  }
}

function disableSmoothing(g) {
  if (!g || !g.drawingContext) return;
  const ctx = g.drawingContext;
  if (ctx.imageSmoothingEnabled !== undefined) ctx.imageSmoothingEnabled = false;
  if (ctx.mozImageSmoothingEnabled !== undefined) ctx.mozImageSmoothingEnabled = false;
  if (ctx.webkitImageSmoothingEnabled !== undefined) ctx.webkitImageSmoothingEnabled = false;
  if (ctx.msImageSmoothingEnabled !== undefined) ctx.msImageSmoothingEnabled = false;
}

function getActivePalette() {
  if (monochromeMode) {
    if (layer2Visible) {
      return invertColors ? ['#ffffff', '#000000', '#666666'] : ['#000000', '#ffffff', '#999999'];
    }
    return invertColors ? ['#ffffff', '#000000'] : ['#000000', '#ffffff'];
  }
  if (currentPalette && currentPalette.length >= 3 && layer2Visible) {
    return currentPalette;
  }
  if (currentPalette && currentPalette.length >= 2) {
    return currentPalette;
  }
  if (layer2Visible) {
    return [BG_COLOR, LINE_COLOR, '#888888'];
  }
  return [BG_COLOR, LINE_COLOR];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = layer2Visible ? [BG_COLOR, LINE_COLOR, '#888888'] : [BG_COLOR, LINE_COLOR];
    return;
  }
  
  // When layer 2 is visible, prefer 3-color palettes; otherwise use 2-color
  const minColors = layer2Visible ? 3 : 2;
  const maxColors = layer2Visible ? 3 : 2;
  const choices = paletteData.palettes.filter(
    (palette) => palette.colors && palette.colors.length >= minColors && palette.colors.length <= maxColors,
  );
  
  if (!choices.length) {
    currentPalette = layer2Visible ? [BG_COLOR, LINE_COLOR, '#888888'] : [BG_COLOR, LINE_COLOR];
    return;
  }
  
  const pick = choices[Math.floor(Math.random() * choices.length)];
  currentPalette = pick.colors.slice(0, layer2Visible ? 3 : 2);
}

function shufflePalette() {
  if (!currentPalette || currentPalette.length < 2) {
    return;
  }
  // Rotate colors: [a, b] -> [b, a] or [a, b, c] -> [b, c, a]
  if (currentPalette.length === 3) {
    currentPalette = [currentPalette[1], currentPalette[2], currentPalette[0]];
  } else {
    currentPalette = [currentPalette[1], currentPalette[0]];
  }
}

function reseed() {
  seed = floor(random(1_000_000_000));
  randomSeed(seed);
  shapes = buildShapes();
  shapes2 = buildShapes();  // Generate independent second set
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

function pointInShapes2(px, py) {
  for (const shape of shapes2) {
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
  if (goNutsMode) {
    renderWeird(goNutsKind, pg, PNG_SCALE);
  } else {
    renderScene(pg, PNG_SCALE);
  }
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
    console.log(`Layer 1: ${verticalScan ? 'VERTICAL' : 'HORIZONTAL'}`);
    redraw();
  } else if (key === 'b' || key === 'B') {
    verticalScan2 = !verticalScan2;
    console.log(`Layer 2: ${verticalScan2 ? 'VERTICAL' : 'HORIZONTAL'}`);
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
  } else if (key === 'w' || key === 'W') {
    goNutsMode = !goNutsMode;
    if (goNutsMode) {
      goNutsKind = floor(random(1, 5));
      console.log(`Go Nuts mode ${goNutsKind}`);
    } else {
      console.log('Go Nuts mode OFF');
    }
    redraw();
  } else if (key === 'l' || key === 'L') {
    layer2Visible = !layer2Visible;
    console.log(`Layer 2: ${layer2Visible ? 'ON' : 'OFF'}`);
    redraw();
  }
}
