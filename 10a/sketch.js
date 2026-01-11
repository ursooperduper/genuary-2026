// Genuary 2026 — Day 10a: "Polar Cropped Glyph Cells"
// Polar grid of typographic fragments with systematic legibility variation

const CONFIG = {
  width: 540,
  height: 675,
  centerX: 270,
  centerYFactor: 0.52,
  // innerRadius: 55,
  innerRadius: 24,
  outerMargin: 30,
  // ringCount: 12,
  ringCount: 2,
  spokeCount: 24,
  // spokeCount: 42,
  emptyChance: 0.12,
  emptyBoostInner: 0.08,
  // arcSteps: 12,
  arcSteps: 6,
  glyphScaleMultiplier: 1.35,
  // glyphScaleMultiplier: 0.75,
  // glyphScaleMultiplier: 0.25,
  sizeInner: 280,
  // sizeInner: 400,
  sizeOuter: 100,
  // sizeOuter: 200,
  // nudgeAmount: 0.25,
  nudgeAmount: 0.05,
  nudgeSnap: 6,
  // nudgeSnap: 12,
  radiusJitter: 0.10,
  angleJitter: 0.08,
  ruleBreakChance: 0.05,
  // alphabet: 'GENUARY0123456789',
  alphabet: 'FUCKICE',
  background: '#000000',
  glyphColor: '#FFFFFF',
  showGrid: false,
  gridStroke: '#f93434',
  gridWeight: 0.4,
  // gridWeight: 2.4,
  angularZones: 6,
  // angularZones: 12,
};

let font = null;
let cells = [];
let currentSeed = Math.floor(Math.random() * 1_000_000_000);
let mainCanvas = null;
let isSvgRenderer = false;
let palettesData = null;
let availablePalettes = [];
let currentPalette = null; // null => use CONFIG.glyphColor (white/black depending)

function preload() {
  font = loadFont('./Cartridge-Bold.otf');
  // Load palettes relative to 10a/index.html
  palettesData = loadJSON('colors.json');
}

function setup() {
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(CONFIG.width, CONFIG.height, renderer);
  canvas.parent('sketch-holder');
  mainCanvas = canvas;
  isSvgRenderer = renderer === SVG;
  pixelDensity(2);
  noLoop();
  
  // Disable p5's automatic saveFrame to prevent toBlob errors
  window.saveFrame = () => {};
  
  regenerate(currentSeed);
}

function regenerate(seed = currentSeed) {
  currentSeed = seed;
  randomSeed(seed);
  noiseSeed(seed + 999);
  // Prepare palettes if available
  availablePalettes = extractPalettes(palettesData);
  cells = buildPolarGrid();
  redraw();
}

function buildPolarGrid() {
  const cx = CONFIG.centerX;
  const cy = CONFIG.height * CONFIG.centerYFactor;
  const outerRadius = min(CONFIG.width, CONFIG.height) / 2 - CONFIG.outerMargin;
  const ringStep = (outerRadius - CONFIG.innerRadius) / CONFIG.ringCount;
  const angleStep = TWO_PI / CONFIG.spokeCount;

  const cellData = [];
  for (let ring = 0; ring < CONFIG.ringCount; ring++) {
    for (let spoke = 0; spoke < CONFIG.spokeCount; spoke++) {
      const r1 = CONFIG.innerRadius + ring * ringStep;
      const r2 = r1 + ringStep;
      const a1 = spoke * angleStep;
      const a2 = a1 + angleStep;

      // Radius jitter
      const rJitter = random(-1, 1) * ringStep * CONFIG.radiusJitter;
      const rJitterSnapped = round(rJitter / 4) * 4;

      // Angle jitter
      const aJitter = random(-1, 1) * angleStep * CONFIG.angleJitter;
      const aJitterSnapped = round(aJitter / (angleStep / 8)) * (angleStep / 8);

      const r1Final = max(CONFIG.innerRadius, r1 + rJitterSnapped);
      const r2Final = r2 + rJitterSnapped;
      const a1Final = a1 + aJitterSnapped;
      const a2Final = a2 + aJitterSnapped;

      // Empty chance increases toward center
      const emptyBoost = map(ring, 0, CONFIG.ringCount - 1, CONFIG.emptyBoostInner, 0);
      const isEmpty = random() < CONFIG.emptyChance + emptyBoost;

      // Angular zone
      const zoneIndex = floor((spoke / CONFIG.spokeCount) * CONFIG.angularZones);

      // Cell centroid
      const rc = (r1Final + r2Final) / 2;
      const ac = (a1Final + a2Final) / 2;
      const x = cx + cos(ac) * rc;
      const y = cy + sin(ac) * rc;

      // Size by radius (inner = bigger, outer = smaller)
      const t = ring / (CONFIG.ringCount - 1);
      const baseSize = lerp(CONFIG.sizeInner, CONFIG.sizeOuter, t);
      const sizeSnapped = round(baseSize / 4) * 4;

      // Glyph choice (deterministic by ring + spoke for designed feel)
      const glyphIndex = (ring * 3 + spoke * 5) % CONFIG.alphabet.length;
      const glyph = CONFIG.alphabet[glyphIndex];

      // Nudge inside cell
      const nudgeAmt = ringStep * CONFIG.nudgeAmount;
      const nudgeX = round(random(-nudgeAmt, nudgeAmt) / CONFIG.nudgeSnap) * CONFIG.nudgeSnap;
      const nudgeY = round(random(-nudgeAmt, nudgeAmt) / CONFIG.nudgeSnap) * CONFIG.nudgeSnap;

      // Rotation rule break
      const breakRule = random() < CONFIG.ruleBreakChance;
      const rotation = breakRule ? random([0, HALF_PI, PI, -HALF_PI]) : 0;

      cellData.push({
        ring,
        spoke,
        r1: r1Final,
        r2: r2Final,
        a1: a1Final,
        a2: a2Final,
        cx,
        cy,
        x: x + nudgeX,
        y: y + nudgeY,
        isEmpty,
        glyph,
        size: sizeSnapped,
        rotation,
        zoneIndex,
        fillColor: null,
      });
    }
  }

  return cellData;
}

function draw() {
  if (!font || cells.length === 0) return;
  randomSeed(currentSeed);
  background(CONFIG.background);

  textFont(font);
  textAlign(CENTER, CENTER);
  noStroke();

  // Apply palette assignment if enabled
  applyPaletteToCells();

  // Draw inner to outer (radiating clarity)
  for (let ring = 0; ring < CONFIG.ringCount; ring++) {
    const ringCells = cells.filter((c) => c.ring === ring);
    ringCells.forEach((cell) => {
      if (cell.isEmpty) return;
      drawClippedGlyph(cell);
      if (CONFIG.showGrid) {
        drawCellOutline(cell);
      }
    });
  }
}

function drawClippedGlyph(cell) {
  push();
  const wedgePath = createWedgePath(cell);
  
  // Use p5's clip mechanism (drawingContext)
  drawingContext.save();
  drawingContext.beginPath();
  wedgePath.forEach((pt, i) => {
    if (i === 0) drawingContext.moveTo(pt.x, pt.y);
    else drawingContext.lineTo(pt.x, pt.y);
  });
  drawingContext.closePath();
  drawingContext.clip();

  // Draw oversized glyph
  translate(cell.x, cell.y);
  rotate(cell.rotation);
  fill(cell.fillColor || CONFIG.glyphColor);
  textSize(cell.size * CONFIG.glyphScaleMultiplier);
  text(cell.glyph, 0, 0);

  drawingContext.restore();
  pop();
}

function createWedgePath(cell) {
  const points = [];
  const { r1, r2, a1, a2, cx, cy } = cell;

  // Outer arc a1 → a2 at r2
  for (let i = 0; i <= CONFIG.arcSteps; i++) {
    const a = lerp(a1, a2, i / CONFIG.arcSteps);
    points.push({ x: cx + cos(a) * r2, y: cy + sin(a) * r2 });
  }

  // Inner arc a2 → a1 at r1 (reverse)
  for (let i = 0; i <= CONFIG.arcSteps; i++) {
    const a = lerp(a2, a1, i / CONFIG.arcSteps);
    points.push({ x: cx + cos(a) * r1, y: cy + sin(a) * r1 });
  }

  return points;
}

function drawCellOutline(cell) {
  const wedgePath = createWedgePath(cell);
  push();
  noFill();
  stroke(CONFIG.gridStroke);
  strokeWeight(CONFIG.gridWeight);
  beginShape();
  wedgePath.forEach((pt) => vertex(pt.x, pt.y));
  endShape(CLOSE);
  pop();
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-10a-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `genuary-10a-${timestamp}`;
  if (!isSvgRenderer) {
    saveCanvas(mainCanvas, base, 'png');
    return;
  }

  let svgNode = null;
  if (mainCanvas && mainCanvas.elt && mainCanvas.elt instanceof Node) {
    svgNode = mainCanvas.elt;
  } else {
    // Fallback: look for the svg created by p5.svg inside the holder
    svgNode = document.querySelector('#sketch-holder svg') || document.querySelector('svg');
  }

  if (!(svgNode instanceof Node)) {
    console.warn('PNG export failed: no SVG node found');
    return;
  }

  // Clone the SVG as a string and upscale to 2x dimensions for export.
  const serializer = new XMLSerializer();
  const rawSvg = serializer.serializeToString(svgNode);
  const parsed = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
  const root = parsed.documentElement;
  const targetW = CONFIG.width * 2;
  const targetH = CONFIG.height * 2;
  root.setAttribute('width', `${targetW}`);
  root.setAttribute('height', `${targetH}`);
  if (!root.getAttribute('viewBox')) {
    root.setAttribute('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`);
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

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'r' || key === 'R') {
    regenerate(Math.floor(Math.random() * 1_000_000_000));
  } else if (key === 'g' || key === 'G') {
    CONFIG.showGrid = !CONFIG.showGrid;
    redraw();
  } else if (key === 'c' || key === 'C') {
    // Activate a random palette and recolor
    currentPalette = pickRandomPalette();
    redraw();
  } else if (key === 'b' || key === 'B') {
    // Back to default monochrome letters
    currentPalette = null;
    redraw();
  }
}

// Palette utilities
function extractPalettes(data) {
  const palettes = [];
  if (!data) return palettes;

  const normalizePalette = (p) => {
    if (!p) return [];
    if (Array.isArray(p)) {
      return p.filter((c) => typeof c === 'string');
    }
    if (typeof p === 'object') {
      if (Array.isArray(p.colors)) return p.colors.filter((c) => typeof c === 'string');
      if (Array.isArray(p.palette)) return p.palette.filter((c) => typeof c === 'string');
      // Fallback: collect string values from the object
      return Object.values(p).filter((c) => typeof c === 'string');
    }
    return [];
  };

  if (Array.isArray(data)) {
    if (data.length === 0) return palettes;
    if (data.every((c) => typeof c === 'string')) {
      palettes.push(normalizePalette(data));
    } else {
      data.forEach((entry) => {
        const norm = normalizePalette(entry);
        if (norm.length > 0) palettes.push(norm);
      });
    }
  } else if (typeof data === 'object') {
    if (Array.isArray(data.palettes)) {
      data.palettes.forEach((p) => {
        const norm = normalizePalette(p);
        if (norm.length > 0) palettes.push(norm);
      });
    } else {
      Object.values(data).forEach((val) => {
        const norm = normalizePalette(val);
        if (norm.length > 0) palettes.push(norm);
      });
    }
  }

  return palettes;
}

function pickRandomPalette() {
  if (!availablePalettes || availablePalettes.length === 0) return null;
  const p = random(availablePalettes);
  // Return a shallow copy to avoid mutation surprises
  return [...p];
}

function applyPaletteToCells() {
  if (!currentPalette || currentPalette.length === 0) {
    cells.forEach((c) => (c.fillColor = null));
    return;
  }
  const n = currentPalette.length;
  cells.forEach((c) => {
    const idx = (c.spoke + c.ring * 3 + c.zoneIndex) % n;
    c.fillColor = currentPalette[idx];
  });
}
