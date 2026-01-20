const PARAMS = {
  W: 540,
  H: 675,
  margin: 24,
  bg: '#000000',
  // containerTargetCount: 34,
  // containerTargetCount: 8,
  containerTargetCount: 20,
  containerMinR: 8,
  // containerMinR: 2800,
  // containerMaxR: 140,
  containerMaxR: 200,
  // containerMaxR: 14000,
  // containerPadding: 24,
  containerPadding: 40,
  containerPlacementAttempts: 75000,
  // containerShapeWeights: { tri: 0.7, hex: 0.3 },
  containerShapeWeights: { tri: 0.8, hex: 0.2, square: 0.0, circle: 0.0 },
  containerShapeMode: 'weighted',
  containerShapeSingle: 'tri',
  // containerStrokeRange: [2.0, 6.0],
  containerStrokeRange: [1.0, 1.0],
  containerRotMode: 'quantized-15',// 'random', 'quantized-15', 'quantized-30', 'quantized-60', 'upright', 'aligned', 'mirror'
  fillMinR: 3,
  fillMaxR: 14,
  // fillPadding: 1.6,
  fillPadding: 2.8,
  fillEdgePadding: 1.6,
  fillMaxAttemptsPerContainer: 5000,
  // fillStrokeRatio: 0.5,
  fillStrokeRatio: 1.0,
  fillSizeBands: [1.0, 0.6, 0.35],
  // freeFillTargetCount: 360,
  freeFillTargetCount: 7500,
  // freeFillMinR: 1.5,
  // freeFillMinR: 1.0,
  freeFillMinR: 1.0,
  // freeFillMaxR: 9,
  freeFillMaxR: 32,
  // freeFillAttempts: 32000,
  freeFillAttempts: 75000,
  // freeFillPadding: 0.8,
  freeFillPadding: 2.8,
  // freeFillEdgePadding: 0.8,
  freeFillEdgePadding: 2.8,
  freeFillShapeWeights: { circle: 0.7, square: 0.15, tri: 0.1, hex: 0.05 },
  freeFillShapeMode: 'weighted',
  freeFillShapeSingle: 'circle',
  seed: 32,
};

const CONTAINER_SHAPES = {
  tri: {
    makePoly: (x, y, r, rot) => makeTrianglePoly(x, y, r, rot),
    draw: (poly) => drawPoly(poly),
  },
  hex: {
    makePoly: (x, y, r, rot) => makeHexPoly(x, y, r, rot),
    draw: (poly) => drawPoly(poly),
  },
  square: {
    makePoly: (x, y, r, rot) => makeSquarePoly(x, y, r, rot),
    draw: (poly) => drawPoly(poly),
  },
  circle: {
    makePoly: (x, y, r) => makeCirclePoly(x, y, r, 32),
    draw: (poly) => drawPoly(poly),
  },
};

let containers = [];
let freeFillers = [];
let paletteData;
let activePalette = [];
let activePaletteName = '';
let backgroundColor = PARAMS.bg;
let containerFillColor = '#ffffff';
let circlePalette = ['#ffffff'];
let overlayOpacityEnabled = true;
let overlayFlipEnabled = true;

function preload() {
  paletteData = loadJSON('colors.json');
}

function setup() {
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(PARAMS.W, PARAMS.H, renderer);
  canvas.parent('sketch-holder');
  selectRandomPalette();
  generateComposition();
  noLoop();
}

function draw() {
  renderComposite(this, 1);
}

function generateComposition() {
  randomSeed(PARAMS.seed);
  noiseSeed(PARAMS.seed);
  containers = [];
  freeFillers = [];
  packContainers();
  containers.forEach((container) => packFillersInsideContainer(container));
  packFreeFillers();
  assignPaletteColors();
}

function packContainers() {
  let attempts = 0;
  while (
    containers.length < PARAMS.containerTargetCount &&
    attempts < PARAMS.containerPlacementAttempts
  ) {
    attempts += 1;
    const shapeType = pickContainerShape();
    const r = lerp(
      PARAMS.containerMaxR,
      PARAMS.containerMinR,
      pow(random(), 2.2)
    );
    const x = random(PARAMS.margin + r, width - PARAMS.margin - r);
    const y = random(PARAMS.margin + r, height - PARAMS.margin - r);
    const rot = resolveRotation(PARAMS.containerRotMode);

    const candidate = { x, y, r };
    if (containers.some((c) => circlesOverlap(candidate, c, PARAMS.containerPadding))) {
      continue;
    }

    const strokeW = random(PARAMS.containerStrokeRange[0], PARAMS.containerStrokeRange[1]);
    const poly = CONTAINER_SHAPES[shapeType].makePoly(x, y, r, rot);
    if (containers.some((c) => polysOverlap(poly, c.poly, PARAMS.containerPadding * 0.35))) {
      continue;
    }
    containers.push({
      id: containers.length,
      x,
      y,
      r,
      rot,
      shapeType,
      strokeW,
      colorIndex: 0,
      poly,
      fillers: [],
    });
  }
}

function packFillersInsideContainer(container) {
  const fillers = [];
  let attempts = 0;
  let fails = 0;
  while (attempts < PARAMS.fillMaxAttemptsPerContainer) {
    attempts += 1;
    const px = random(container.x - container.r, container.x + container.r);
    const py = random(container.y - container.r, container.y + container.r);
    if (!pointInPoly(px, py, container.poly)) {
      fails += 1;
      if (fails > 600) break;
      continue;
    }

    const dEdge = distPointToPolyEdges(px, py, container.poly) - PARAMS.fillEdgePadding;
    if (dEdge <= PARAMS.fillMinR) {
      fails += 1;
      if (fails > 600) break;
      continue;
    }

    let dNear = Infinity;
    for (const filler of fillers) {
      const d = dist(px, py, filler.x, filler.y) - filler.r - PARAMS.fillPadding;
      if (d < dNear) dNear = d;
      if (dNear <= PARAMS.fillMinR) break;
    }

    const maxAllowed = min(dEdge, dNear, PARAMS.fillMaxR);
    if (maxAllowed < PARAMS.fillMinR) {
      fails += 1;
      if (fails > 600) break;
      continue;
    }

    const bandFactor = weightedChoice({ 1.0: 0.2, 0.6: 0.3, 0.35: 0.5 });
    const r = min(maxAllowed, PARAMS.fillMinR + (maxAllowed - PARAMS.fillMinR) * bandFactor);
    fillers.push({
      x: px,
      y: py,
      r,
      strokeW: container.strokeW * PARAMS.fillStrokeRatio,
      colorIndex: container.colorIndex,
      fillColor: container.fillColor,
    });
    fails = 0;
  }
  container.fillers = fillers;
}

function packFreeFillers() {
  let attempts = 0;
  const baseStroke = lerp(PARAMS.containerStrokeRange[0], PARAMS.containerStrokeRange[1], 0.35);
  while (freeFillers.length < PARAMS.freeFillTargetCount && attempts < PARAMS.freeFillAttempts) {
    attempts += 1;
    const r = lerp(PARAMS.freeFillMaxR, PARAMS.freeFillMinR, pow(random(), 2.0));
    const x = random(PARAMS.margin + r, width - PARAMS.margin - r);
    const y = random(PARAMS.margin + r, height - PARAMS.margin - r);

    if (circleTouchesAnyContainer(x, y, r)) {
      continue;
    }

    if (freeFillers.some((f) => circlesOverlap({ x, y, r }, f, PARAMS.freeFillPadding))) {
      continue;
    }

    freeFillers.push({
      x,
      y,
      r,
      strokeW: baseStroke * PARAMS.fillStrokeRatio,
      colorIndex: 0,
      fillColor: '#ffffff',
      shapeType: pickFreeFillShape(),
    });
  }
}

function pickContainerShape() {
  if (PARAMS.containerShapeMode === 'single') {
    return PARAMS.containerShapeSingle;
  }
  return weightedChoice(PARAMS.containerShapeWeights);
}

function pickFreeFillShape() {
  if (PARAMS.freeFillShapeMode === 'single') {
    return PARAMS.freeFillShapeSingle;
  }
  return weightedChoice(PARAMS.freeFillShapeWeights);
}

function resolveRotation(mode) {
  if (mode === 'random') {
    return random(TWO_PI);
  }
  if (mode === 'quantized-15') {
    return quantize(random(TWO_PI), PI / 12);
  }
  if (mode === 'quantized-30') {
    return quantize(random(TWO_PI), PI / 6);
  }
  if (mode === 'quantized-60') {
    return quantize(random(TWO_PI), PI / 3);
  }
  if (mode === 'upright') {
    return 0;
  }
  if (mode === 'aligned') {
    return quantize(random(TWO_PI), HALF_PI);
  }
  if (mode === 'mirror') {
    return random([0, PI / 2, PI, (3 * PI) / 2]);
  }
  return random(TWO_PI);
}

function circleTouchesAnyContainer(x, y, r) {
  for (const container of containers) {
    if (dist2(x, y, container.x, container.y) > (container.r + r + PARAMS.containerPadding) ** 2) {
      continue;
    }
    if (pointInPoly(x, y, container.poly)) {
      return true;
    }
    const edgeDist = distPointToPolyEdges(x, y, container.poly);
    if (edgeDist <= r + PARAMS.freeFillEdgePadding) {
      return true;
    }
  }
  return false;
}

function drawPoly(poly) {
  beginShape();
  poly.forEach((p) => vertex(p.x, p.y));
  endShape(CLOSE);
}

function drawPolyScaled(poly, target, scale) {
  const g = target || window;
  g.beginShape();
  poly.forEach((p) => g.vertex(p.x * scale, p.y * scale));
  g.endShape(CLOSE);
}

function makeTrianglePoly(x, y, r, rot) {
  const poly = [];
  for (let i = 0; i < 3; i += 1) {
    const angle = rot + (TWO_PI * i) / 3;
    poly.push({ x: x + cos(angle) * r, y: y + sin(angle) * r });
  }
  return poly;
}

function makeHexPoly(x, y, r, rot) {
  const poly = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = rot + (TWO_PI * i) / 6;
    poly.push({ x: x + cos(angle) * r, y: y + sin(angle) * r });
  }
  return poly;
}

function makeSquarePoly(x, y, r, rot) {
  const poly = [];
  for (let i = 0; i < 4; i += 1) {
    const angle = rot + (TWO_PI * i) / 4 + PI / 4;
    poly.push({ x: x + cos(angle) * r, y: y + sin(angle) * r });
  }
  return poly;
}

function makeCirclePoly(x, y, r, steps) {
  const poly = [];
  const count = steps || 24;
  for (let i = 0; i < count; i += 1) {
    const angle = (TWO_PI * i) / count;
    poly.push({ x: x + cos(angle) * r, y: y + sin(angle) * r });
  }
  return poly;
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 0.000001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distPointToPolyEdges(px, py, poly) {
  let minDist = Infinity;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const d = distPointToSegment(px, py, a.x, a.y, b.x, b.y);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

function distPointToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 === 0) return dist(px, py, ax, ay);
  const t = constrain((apx * abx + apy * aby) / abLen2, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return dist(px, py, cx, cy);
}

function polysOverlap(polyA, polyB, pad) {
  const padded = pad || 0;
  for (let i = 0; i < polyA.length; i += 1) {
    const a1 = polyA[i];
    const a2 = polyA[(i + 1) % polyA.length];
    for (let j = 0; j < polyB.length; j += 1) {
      const b1 = polyB[j];
      const b2 = polyB[(j + 1) % polyB.length];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
      if (padded > 0 && distSegmentToSegment(a1, a2, b1, b2) < padded) return true;
    }
  }
  if (pointInPoly(polyA[0].x, polyA[0].y, polyB)) return true;
  if (pointInPoly(polyB[0].x, polyB[0].y, polyA)) return true;
  return false;
}

function segmentsIntersect(a1, a2, b1, b2) {
  const d1 = direction(b1, b2, a1);
  const d2 = direction(b1, b2, a2);
  const d3 = direction(a1, a2, b1);
  const d4 = direction(a1, a2, b2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  if (d1 === 0 && onSegment(b1, b2, a1)) return true;
  if (d2 === 0 && onSegment(b1, b2, a2)) return true;
  if (d3 === 0 && onSegment(a1, a2, b1)) return true;
  if (d4 === 0 && onSegment(a1, a2, b2)) return true;
  return false;
}

function direction(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a, b, c) {
  return (
    min(a.x, b.x) <= c.x &&
    c.x <= max(a.x, b.x) &&
    min(a.y, b.y) <= c.y &&
    c.y <= max(a.y, b.y)
  );
}

function distSegmentToSegment(a1, a2, b1, b2) {
  const d1 = distPointToSegment(a1.x, a1.y, b1.x, b1.y, b2.x, b2.y);
  const d2 = distPointToSegment(a2.x, a2.y, b1.x, b1.y, b2.x, b2.y);
  const d3 = distPointToSegment(b1.x, b1.y, a1.x, a1.y, a2.x, a2.y);
  const d4 = distPointToSegment(b2.x, b2.y, a1.x, a1.y, a2.x, a2.y);
  return min(d1, d2, d3, d4);
}

function randRange(a, b) {
  return random(a, b);
}

function weightedChoice(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = random(total);
  for (const [key, weight] of entries) {
    if (r < weight) {
      return isNaN(Number(key)) ? key : Number(key);
    }
    r -= weight;
  }
  return entries[entries.length - 1][0];
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function dist2(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

function circlesOverlap(c1, c2, pad) {
  const minDist = c1.r + c2.r + pad;
  return dist2(c1.x, c1.y, c2.x, c2.y) < minDist * minDist;
}

function quantize(value, step) {
  return round(value / step) * step;
}

function renderScene(target, scale, options = {}) {
  const g = target || window;
  const drawBackground = options.drawBackground !== false;
  const mode = options.mode || 'fill';
  if (drawBackground) {
    g.background(backgroundColor || PARAMS.bg);
  }

  containers.forEach((container) => {
    if (mode === 'stroke') {
      g.noFill();
      g.stroke(container.fillColor || '#ffffff');
    } else {
      g.noStroke();
      g.fill(container.fillColor || '#ffffff');
    }
    g.strokeWeight(container.strokeW * scale);
    drawPolyScaled(container.poly, g, scale);
    container.fillers.forEach((filler) => {
      if (mode === 'stroke') {
        g.noFill();
        g.stroke(filler.fillColor || '#ffffff');
      } else {
        g.noStroke();
        g.fill(filler.fillColor || '#ffffff');
      }
      g.strokeWeight(filler.strokeW * scale);
      g.circle(filler.x * scale, filler.y * scale, filler.r * 2 * scale);
    });
  });

  freeFillers.forEach((filler) => {
    if (mode === 'stroke') {
      g.noFill();
      g.stroke(filler.fillColor || '#ffffff');
    } else {
      g.noStroke();
      g.fill(filler.fillColor || '#ffffff');
    }
    g.strokeWeight(filler.strokeW * scale);
    drawFreeFillShape(filler, g, scale);
  });
}

function renderComposite(target, scale, options = {}) {
  const g = target || window;
  const w = PARAMS.W * scale;
  const h = PARAMS.H * scale;
  renderScene(g, scale, { drawBackground: options.drawBackground !== false });

  const colW = 60 * scale;
  const colCount = ceil(w / colW);
  const ctx = g.drawingContext || drawingContext;
  for (let i = 0; i < colCount; i += 1) {
    const x = i * colW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, colW, h);
    ctx.clip();
    ctx.globalAlpha = overlayOpacityEnabled ? 0.5 : 1;
    g.push();
    if (overlayFlipEnabled && i % 2 === 1) {
      g.translate(0, h);
      g.scale(1, -1);
    }
    renderScene(g, scale, { drawBackground: false });
    g.pop();
    ctx.restore();
  }
}

function drawFreeFillShape(filler, target, scale) {
  const g = target || window;
  const x = filler.x * scale;
  const y = filler.y * scale;
  const r = filler.r * scale;
  if (filler.shapeType === 'square') {
    g.rectMode(CENTER);
    g.rect(x, y, r * 2, r * 2);
    g.rectMode(CORNER);
    return;
  }
  if (filler.shapeType === 'tri') {
    const poly = makeTrianglePoly(x, y, r, -HALF_PI);
    drawPolyScaled(poly, g, 1);
    return;
  }
  if (filler.shapeType === 'hex') {
    const poly = makeHexPoly(x, y, r, 0);
    drawPolyScaled(poly, g, 1);
    return;
  }
  g.circle(x, y, r * 2);
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (typeof SVG === 'undefined') {
    save(`genuary-${timestamp}.svg`);
    return;
  }
  const pg = createGraphics(PARAMS.W, PARAMS.H, SVG);
  renderComposite(pg, 1);
  save(pg, `genuary-${timestamp}.svg`);
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scale = 2;
  if (typeof SVG === 'undefined') {
    const pg = createGraphics(PARAMS.W * scale, PARAMS.H * scale);
    pg.pixelDensity(1);
    renderComposite(pg, scale);
    saveCanvas(pg, `genuary-23-${timestamp}`, 'png');
    setTimeout(() => {
      pg.remove();
    }, 0);
    return;
  }
  const pg = createGraphics(PARAMS.W * scale, PARAMS.H * scale, SVG);
  renderComposite(pg, scale);
  save(pg, `genuary-23-${timestamp}.png`);
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function selectRandomPalette() {
  if (!paletteData || !paletteData.palettes || paletteData.palettes.length === 0) {
    activePalette = ['#ffffff', '#000000'];
    activePaletteName = 'fallback';
    backgroundColor = PARAMS.bg;
    containerFillColor = '#ffffff';
    circlePalette = ['#ffffff'];
    console.warn('Palette load failed; using fallback colors.');
    return;
  }
  const eligible = paletteData.palettes.filter((palette) => palette.numColors > 4);
  const pick = eligible.length > 0 ? random(eligible) : random(paletteData.palettes);
  activePalette = pick.colors.slice();
  activePaletteName = pick.name || 'unnamed';
  backgroundColor = random(activePalette);
  const remaining = activePalette.filter(
    (color) => String(color).toLowerCase() !== String(backgroundColor).toLowerCase()
  );
  containerFillColor = remaining.length > 0 ? random(remaining) : backgroundColor;
  circlePalette = remaining.filter(
    (color) => String(color).toLowerCase() !== String(containerFillColor).toLowerCase()
  );
  if (circlePalette.length === 0) {
    circlePalette = remaining.length > 0 ? remaining : activePalette;
  }
  console.log(
    `Palette: ${activePaletteName}`,
    activePalette,
    'bg:',
    backgroundColor,
    'container:',
    containerFillColor,
    'circles:',
    circlePalette
  );
}

function assignPaletteColors() {
  if (!activePalette || activePalette.length === 0) {
    return;
  }
  containers.forEach((container) => {
    container.colorIndex = activePalette.indexOf(containerFillColor);
    container.fillColor = containerFillColor;
    container.fillers.forEach((filler) => {
      filler.colorIndex = floor(random(circlePalette.length));
      filler.fillColor = circlePalette[filler.colorIndex];
    });
  });
  freeFillers.forEach((filler) => {
    filler.colorIndex = floor(random(circlePalette.length));
    filler.fillColor = circlePalette[filler.colorIndex];
  });
}

function shufflePaletteColors() {
  if (!activePalette || activePalette.length <= 1) {
    return;
  }
  activePalette = shuffle(activePalette);
  backgroundColor = activePalette[0];
  containerFillColor =
    activePalette.length > 1 ? activePalette[1] : activePalette[0];
  circlePalette = activePalette.slice(2);
  if (circlePalette.length === 0) {
    circlePalette = activePalette.slice(1);
  }
  console.log(
    `Palette shuffled: ${activePaletteName}`,
    activePalette,
    'bg:',
    backgroundColor,
    'container:',
    containerFillColor,
    'circles:',
    circlePalette
  );
  assignPaletteColors();
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    PARAMS.seed += 1;
    generateComposition();
    redraw();
    return;
  }
  if (key === 'm' || key === 'M') {
    PARAMS.containerShapeMode =
      PARAMS.containerShapeMode === 'single' ? 'weighted' : 'single';
    console.log(`Container mode: ${PARAMS.containerShapeMode}`);
    generateComposition();
    redraw();
    return;
  }
  if (key === 'n' || key === 'N') {
    const types = Object.keys(CONTAINER_SHAPES);
    const currentIndex = types.indexOf(PARAMS.containerShapeSingle);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % types.length;
    PARAMS.containerShapeSingle = types[nextIndex];
    PARAMS.containerShapeMode = 'single';
    console.log(`Container mode: ${PARAMS.containerShapeMode}`);
    console.log(`Container single shape: ${PARAMS.containerShapeSingle}`);
    generateComposition();
    redraw();
    return;
  }
  if (key === 'f' || key === 'F') {
    PARAMS.freeFillShapeMode =
      PARAMS.freeFillShapeMode === 'single' ? 'weighted' : 'single';
    console.log(`Free fill mode: ${PARAMS.freeFillShapeMode}`);
    generateComposition();
    redraw();
    return;
  }
  if (key === 'g' || key === 'G') {
    const types = Object.keys(CONTAINER_SHAPES);
    const currentIndex = types.indexOf(PARAMS.freeFillShapeSingle);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % types.length;
    PARAMS.freeFillShapeSingle = types[nextIndex];
    PARAMS.freeFillShapeMode = 'single';
    console.log(`Free fill mode: ${PARAMS.freeFillShapeMode}`);
    console.log(`Free fill single shape: ${PARAMS.freeFillShapeSingle}`);
    generateComposition();
    redraw();
    return;
  }
  if (key === 'c' || key === 'C') {
    selectRandomPalette();
    assignPaletteColors();
    redraw();
    return;
  }
  if (key === 'k' || key === 'K') {
    shufflePaletteColors();
    redraw();
    return;
  }
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'o' || key === 'O') {
    overlayOpacityEnabled = !overlayOpacityEnabled;
    redraw();
  } else if (key === 'v' || key === 'V') {
    overlayFlipEnabled = !overlayFlipEnabled;
    redraw();
  }
}
