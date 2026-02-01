const WIDTH = 540;
const HEIGHT = 675;
const MONO_BG = '#000000';
const MONO_FG = '#ffffff';

const HOLD_ORIG = 70;
const HOLD_BUG = 70;
const TRANSITION = 110;
const HOLD_FINAL = 90;

let layout = null;
let cycleStart = 0;
let paletteData = null;
let currentPalette = null;
let monoMode = true;

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
  pixelDensity(2);
  frameRate(60);
  regenerate();
}

function draw() {
  if (!layout) return;

  const phase = frameCount - cycleStart;
  renderFrame(null, phase);

  if (phase >= HOLD_ORIG + HOLD_BUG + TRANSITION) {
    noLoop();
  }
}

function renderFrame(target, phase) {
  const g = target || window;
  g.background(getBGColor());
  g.noFill();

  const endOrig = HOLD_ORIG;
  const endBug = endOrig + HOLD_BUG;
  const endTransition = endBug + TRANSITION;

  if (phase < endOrig) {
    drawGuides(layout.initial, 1, getBaseColor(), g);
    drawCirclesStatic(layout.initial, 1, false, layout.faultyInitial, getBaseColor(), getBaseColor(), g);
  } else if (phase < endBug) {
    drawGuides(layout.initial, 1, getBaseColor(), g);
    drawCirclesStatic(layout.initial, 1, true, layout.faultyInitial, getBaseColor(), getAccentColor(), g);
  } else if (phase < endTransition) {
    const t = easeInOutCubic((phase - endBug) / TRANSITION);
    drawGuides(layout.initial, 1 - t, getBaseColor(), g);
    drawGuides(layout.corrected, t, getAccentColor(), g);
    drawCirclesMorph(layout.corrected, layout.initial, t, getAccentColor(), g);
  } else {
    drawGuides(layout.corrected, 1, getAccentColor(), g);
    drawCirclesMorph(layout.corrected, layout.initial, 1, getAccentColor(), g);
  }
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scale = 2;
  const exportWidth = WIDTH * scale;
  const exportHeight = HEIGHT * scale;
  const pg = createGraphics(exportWidth, exportHeight);
  pg.pixelDensity(1);
  pg.scale(scale);
  renderFrame(pg, HOLD_ORIG + HOLD_BUG + TRANSITION + 1);

  pg.canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genuary-30-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  setTimeout(() => {
    pg.remove();
  }, 0);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    regenerate();
  } else if (key === 'c' || key === 'C') {
    pickRandomPalette();
    monoMode = false;
    redraw();
  } else if (key === 'k' || key === 'K') {
    shufflePalette();
    monoMode = false;
    redraw();
  } else if (key === 'm' || key === 'M') {
    monoMode = true;
    redraw();
  } else if (key === 's' || key === 'S') {
    saveAsPng();
  } else if (key === 'v' || key === 'V') {
    saveAsSvg();
  }
}

function regenerate() {
  layout = buildLayout();
  cycleStart = frameCount;
  loop();
}

function buildLayout() {
  const seed = floor(random(1e9));
  randomSeed(seed);

  const margin = random(44, 92);
  const gap = random([0, 6, 10, 14]);
  // const gap = random([0]);
  const initCols = floor(random(4, 10));
  const initRows = floor(random(4, 12));

  const gridW = WIDTH - margin * 2;
  const gridH = HEIGHT - margin * 2;
  const cellW0 = (gridW - gap * (initCols - 1)) / initCols;
  const cellH0 = (gridH - gap * (initRows - 1)) / initRows;
  const baseRadius0 = 0.5 * min(cellW0, cellH0);

  const faultyCol0 = floor(random(initCols));
  const faultyRow0 = floor(random(initRows));
  const direction = random(['left', 'right', 'top', 'bottom']);

  const maxScale = min(gridW, gridH) / (min(cellW0, cellH0)) * 0.95;
  const scale = random(1.15, min(1.6, maxScale));
  const faultyRadius = baseRadius0 * scale;
  const required = faultyRadius * 2;

  const maxCount = (size) => max(1, floor((size + gap) / (required + gap)));

  let cols = initCols;
  let rows = initRows;

  if (direction === 'left' || direction === 'right') {
    cols = min(cols, maxCount(gridW));
    rows = min(rows, maxCount(gridH));
  } else {
    rows = min(rows, maxCount(gridH));
    cols = min(cols, maxCount(gridW));
  }

  let cellW = (gridW - gap * (cols - 1)) / cols;
  let cellH = (gridH - gap * (rows - 1)) / rows;

  if (min(cellW, cellH) < required) {
    cols = max(1, maxCount(gridW));
    rows = max(1, maxCount(gridH));
    cellW = (gridW - gap * (cols - 1)) / cols;
    cellH = (gridH - gap * (rows - 1)) / rows;
  }

  const u = initCols === 1 ? 0.5 : faultyCol0 / (initCols - 1);
  const v = initRows === 1 ? 0.5 : faultyRow0 / (initRows - 1);
  const faultyCol1 = cols === 1 ? 0 : round(u * (cols - 1));
  const faultyRow1 = rows === 1 ? 0 : round(v * (rows - 1));

  return {
    seed,
    faultyRadius,
    faultyInitial: { col: faultyCol0, row: faultyRow0 },
    faultyCorrected: { col: faultyCol1, row: faultyRow1 },
    initial: {
      gridX: margin,
      gridY: margin,
      gridW,
      gridH,
      cols: initCols,
      rows: initRows,
      cellW: cellW0,
      cellH: cellH0,
      gap,
    },
    corrected: {
      gridX: margin,
      gridY: margin,
      gridW,
      gridH,
      cols,
      rows,
      cellW,
      cellH,
      gap,
    },
  };
}

function drawGuides(state, alpha = 1, color, target) {
  const { gridX, gridY, gridW, gridH, cols, rows, cellW, cellH, gap } = state;
  const g = target || window;

  setStroke(color, alpha, g);
  g.strokeWeight(1);
  g.noFill();

  // Grid lines hidden
}

function drawCirclesStatic(state, alpha = 1, includeFaulty = true, faultyIndex, baseColor, accentColor = baseColor, target) {
  const { gridX, gridY, cols, rows, cellW, cellH, gap } = state;
  const g = target || window;

  g.noStroke();
  setFill(baseColor, alpha, g);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = gridX + col * (cellW + gap);
      const y = gridY + row * (cellH + gap);
      const cx = x + cellW * 0.5;
      const cy = y + cellH * 0.5;
      const baseRadius = 0.5 * min(cellW, cellH);
      const isFaulty = includeFaulty && col === faultyIndex.col && row === faultyIndex.row;
      const radius = isFaulty ? layout.faultyRadius : baseRadius;
      if (isFaulty) {
        setFill(accentColor, alpha, g);
      } else {
        setFill(baseColor, alpha, g);
      }
      const segments = circleSegments(cx, cy, radius, cellW, cellH, col, row, layout.seed);
      drawSegments(segments, g);
    }
  }
}

function drawCirclesMorph(newState, oldState, t, fillColor, target) {
  const { cols, rows, cellW, cellH, gap, gridX, gridY } = newState;
  const { faultyCorrected, faultyRadius, seed } = layout;
  const g = target || window;

  g.noStroke();
  setFill(fillColor, 1, g);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const u = cols === 1 ? 0.5 : col / (cols - 1);
      const v = rows === 1 ? 0.5 : row / (rows - 1);

      const oldCell = cellAtUV(oldState, u, v);
      const newCell = {
        cx: gridX + col * (cellW + gap) + cellW * 0.5,
        cy: gridY + row * (cellH + gap) + cellH * 0.5,
        cellW,
        cellH,
        colF: col,
        rowF: row,
      };

      const oldBase = 0.5 * min(oldCell.cellW, oldCell.cellH);
      const newBase = 0.5 * min(newCell.cellW, newCell.cellH);
      const isFaulty = col === faultyCorrected.col && row === faultyCorrected.row;
      const r0 = isFaulty ? faultyRadius : oldBase;
      const r1 = isFaulty ? faultyRadius : newBase;

      const segA = circleSegments(
        oldCell.cx, oldCell.cy, r0,
        oldCell.cellW, oldCell.cellH,
        oldCell.colF, oldCell.rowF, seed
      );
      const segB = circleSegments(
        newCell.cx, newCell.cy, r1,
        newCell.cellW, newCell.cellH,
        newCell.colF, newCell.rowF, seed
      );

      if (isFaulty) {
        const dx = newCell.cx - oldCell.cx;
        const dy = newCell.cy - oldCell.cy;
        const moved = translateSegments(segA, dx, dy);
        drawSegments(moved, g);
      } else {
        const segLerp = lerpAnchorsOnly(segA, segB, t);
        drawSegments(segLerp, g);
      }
    }
  }
}

function circleSegments(cx, cy, r, cellW, cellH, col, row, seed) {
  const ratio = (cellW - cellH) / max(cellW, cellH);
  const flatten = ratio * 0.18;
  const rx = r * (1 + flatten * 0.5);
  const ry = r * (1 - flatten * 0.5);

  const baseX = rx * 0.5522847;
  const baseY = ry * 0.5522847;

  const d1 = deform(col, row, seed, 11) * 0.12;
  const d2 = deform(col, row, seed, 23) * 0.12;
  const d3 = deform(col, row, seed, 37) * 0.12;
  const d4 = deform(col, row, seed, 51) * 0.12;

  return {
    start: { x: cx, y: cy - ry },
    segs: [
      {
        c1: { x: cx + baseX * (1 + d1), y: cy - ry },
        c2: { x: cx + rx, y: cy - baseY * (1 + d2) },
        p: { x: cx + rx, y: cy },
      },
      {
        c1: { x: cx + rx, y: cy + baseY * (1 + d2) },
        c2: { x: cx + baseX * (1 + d3), y: cy + ry },
        p: { x: cx, y: cy + ry },
      },
      {
        c1: { x: cx - baseX * (1 + d3), y: cy + ry },
        c2: { x: cx - rx, y: cy + baseY * (1 + d4) },
        p: { x: cx - rx, y: cy },
      },
      {
        c1: { x: cx - rx, y: cy - baseY * (1 + d4) },
        c2: { x: cx - baseX * (1 + d1), y: cy - ry },
        p: { x: cx, y: cy - ry },
      },
    ],
  };
}

function drawSegments(data, target) {
  const g = target || window;
  g.beginShape();
  g.vertex(data.start.x, data.start.y);
  for (const seg of data.segs) {
    g.bezierVertex(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.p.x, seg.p.y);
  }
  g.endShape(CLOSE);
}

function lerpSegments(a, b, t) {
  const lerpPoint = (p1, p2) => ({ x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) });
  return {
    start: lerpPoint(a.start, b.start),
    segs: a.segs.map((seg, i) => ({
      c1: lerpPoint(seg.c1, b.segs[i].c1),
      c2: lerpPoint(seg.c2, b.segs[i].c2),
      p: lerpPoint(seg.p, b.segs[i].p),
    })),
  };
}

function lerpAnchorsOnly(a, b, t) {
  const lerpPoint = (p1, p2) => ({ x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) });
  return {
    start: lerpPoint(a.start, b.start),
    segs: a.segs.map((seg, i) => ({
      c1: seg.c1,
      c2: seg.c2,
      p: lerpPoint(seg.p, b.segs[i].p),
    })),
  };
}

function translateSegments(data, dx, dy) {
  const move = (p) => ({ x: p.x + dx, y: p.y + dy });
  return {
    start: move(data.start),
    segs: data.segs.map((seg) => ({
      c1: move(seg.c1),
      c2: move(seg.c2),
      p: move(seg.p),
    })),
  };
}

function cellAtUV(state, u, v) {
  const colF = state.cols === 1 ? 0 : u * (state.cols - 1);
  const rowF = state.rows === 1 ? 0 : v * (state.rows - 1);
  return {
    cx: state.gridX + colF * (state.cellW + state.gap) + state.cellW * 0.5,
    cy: state.gridY + rowF * (state.cellH + state.gap) + state.cellH * 0.5,
    cellW: state.cellW,
    cellH: state.cellH,
    colF,
    rowF,
  };
}

function deform(col, row, seed, salt) {
  const value = sin((col + 1) * 12.9898 + (row + 1) * 78.233 + seed + salt) * 43758.5453;
  return (value - floor(value)) * 2 - 1;
}

function setStroke(color, alpha, target) {
  const g = target || window;
  g.stroke(red(color), green(color), blue(color), 255 * constrain(alpha, 0, 1));
}

function setFill(color, alpha, target) {
  const g = target || window;
  g.fill(red(color), green(color), blue(color), 255 * constrain(alpha, 0, 1));
}

function totalDuration() {
  return HOLD_ORIG + HOLD_BUG + TRANSITION + HOLD_FINAL;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function getActivePalette() {
  if (!monoMode && currentPalette && currentPalette.length >= 3) {
    return currentPalette;
  }
  return [MONO_BG, MONO_FG, MONO_FG];
}

function getBGColor() {
  return getActivePalette()[0];
}

function getBaseColor() {
  return getActivePalette()[1];
}

function getAccentColor() {
  return getActivePalette()[2];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = null;
    return;
  }

  const choices = paletteData.palettes.filter(
    (palette) => palette.colors && palette.colors.length === 3,
  );

  if (!choices.length) {
    currentPalette = null;
    return;
  }

  const pick = choices[Math.floor(Math.random() * choices.length)];
  currentPalette = pick.colors;
}

function shufflePalette() {
  if (!currentPalette || currentPalette.length < 3) return;
  const shuffled = [...currentPalette];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  currentPalette = shuffled;
}
