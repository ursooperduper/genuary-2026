const WIDTH = 540;
const HEIGHT = 675;

const ROW_COUNT = 3;
const COL_COUNT = 2;
const COL_SPLITS = [
  [0.7, 0.3],
  [0.5, 0.5],
  [0.3, 0.7],
];

const DITHER_STYLES = [
  'ordered',
  'threshold',
  'random',
  'floyd',
  'atkinson',
  'sierra',
  'sierra-lite',
  'jarvis',
  'blue-noise',
  'halftone',
  'hatch',
];
const BAYER_SIZES = [2, 4, 8];
const DOT_SHAPES = ['square', 'circle', 'triangle'];
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const BLUE_NOISE_8 = [
  [17, 49, 10, 58, 23, 45, 4, 63],
  [41, 1, 54, 14, 37, 8, 52, 27],
  [12, 34, 20, 46, 6, 60, 30, 56],
  [62, 26, 40, 2, 50, 18, 44, 16],
  [5, 57, 28, 35, 9, 61, 24, 38],
  [55, 15, 48, 3, 43, 21, 53, 11],
  [31, 47, 7, 59, 25, 36, 13, 51],
  [19, 39, 22, 42, 0, 32, 29, 33],
];
const DIFFUSION_KERNELS = {
  floyd: {
    divisor: 16,
    weights: [
      [1, 0, 7],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1],
    ],
  },
  atkinson: {
    divisor: 8,
    weights: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1],
    ],
  },
  sierra: {
    divisor: 32,
    weights: [
      [1, 0, 5],
      [2, 0, 3],
      [-2, 1, 2],
      [-1, 1, 4],
      [0, 1, 5],
      [1, 1, 4],
      [2, 1, 2],
      [-1, 2, 2],
      [0, 2, 3],
      [1, 2, 2],
    ],
  },
  'sierra-lite': {
    divisor: 4,
    weights: [
      [1, 0, 2],
      [-1, 1, 1],
      [0, 1, 1],
    ],
  },
  jarvis: {
    divisor: 48,
    weights: [
      [1, 0, 7],
      [2, 0, 5],
      [-2, 1, 3],
      [-1, 1, 5],
      [0, 1, 7],
      [1, 1, 5],
      [2, 1, 3],
      [-2, 2, 1],
      [-1, 2, 3],
      [0, 2, 5],
      [1, 2, 3],
      [2, 2, 1],
    ],
  },
};

let capture;
let cellSettings = [];
let activeCell = 0;
let gutter = 8;
let isFrozen = false;
let frozenFrame;

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  pixelDensity(1);
  if (!renderer && canvas.elt && canvas.elt.getContext) {
    canvas.elt.getContext('2d', { willReadFrequently: true });
  }

  capture = createCapture(VIDEO);
  capture.size(320, 240);
  capture.hide();

  const totalCells = ROW_COUNT * COL_COUNT;
  cellSettings = Array.from({ length: totalCells }, (_, index) => ({
    style: 'ordered',
    threshold: 128,
    pixelSize: 8 + (index % 3) * 2,
    invert: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    bayerSize: 4,
    dotShape: 'square',
  }));
}

function draw() {
  background('#000000');
  if (!isFrozen) {
    capture.loadPixels();
  } else if (frozenFrame) {
    frozenFrame.loadPixels();
  }
  const cells = computeCells();
  cells.forEach((cell, index) => {
    renderCell(cell, cellSettings[index], index === activeCell);
  });
}

function computeCells() {
  return computeCellsWithSize(WIDTH, HEIGHT, gutter);
}

function computeCellsWithSize(width, height, gutterSize) {
  const cells = [];
  const rowHeight = (height - gutterSize * (ROW_COUNT - 1)) / ROW_COUNT;
  let y = 0;
  for (let row = 0; row < ROW_COUNT; row += 1) {
    const [leftRatio, rightRatio] = COL_SPLITS[row];
    const rowWidth = width - gutterSize;
    const leftWidth = rowWidth * leftRatio;
    const rightWidth = rowWidth * rightRatio;
    const xLeft = 0;
    const xRight = leftWidth + gutterSize;
    const rowY = y;
    cells.push({
      x: xLeft,
      y: rowY,
      w: leftWidth,
      h: rowHeight,
      row,
      col: 0,
    });
    cells.push({
      x: xRight,
      y: rowY,
      w: rightWidth,
      h: rowHeight,
      row,
      col: 1,
    });
    y += rowHeight + gutterSize;
  }
  return cells;
}

function renderCell(cell, settings, isActive, target, scale = 1) {
  const g = target || window;
  g.push();
  g.noStroke();
  g.fill(0);
  g.rect(cell.x, cell.y, cell.w, cell.h);
  drawDitheredCapture(cell, settings, g, scale);
  g.pop();

  // if (isActive) {
  //   noFill();
  //   stroke(255, 180);
  //   strokeWeight(2);
  //   rect(cell.x + 1, cell.y + 1, cell.w - 2, cell.h - 2);
  // }
}

function drawDitheredCapture(cell, settings, target, scale = 1) {
  const g = target || window;
  const pixelSize = settings.pixelSize * scale;
  const cols = max(1, floor(cell.w / pixelSize));
  const rows = max(1, floor(cell.h / pixelSize));
  const stepX = cell.w / cols;
  const stepY = cell.h / rows;
  const source = isFrozen && frozenFrame ? frozenFrame : capture;
  const srcW = source.width;
  const srcH = source.height;
  const diffusionKernel = DIFFUSION_KERNELS[settings.style];

  if (settings.style === 'halftone') {
    g.noStroke();
    g.fill(255);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const luminance = sampleLuminance(
          x,
          y,
          cols,
          rows,
          settings,
          srcW,
          srcH,
          source
        );
        const dotScale = constrain(1 - luminance / 255, 0, 1);
        if (dotScale <= 0.01) continue;
        drawDot(
          g,
          cell.x + x * stepX,
          cell.y + y * stepY,
          stepX,
          stepY,
          settings.dotShape,
          dotScale
        );
      }
    }
    return;
  }

  if (settings.style === 'hatch') {
    const maxLines = 4;
    g.noFill();
    g.stroke(255);
    g.strokeWeight(max(1, min(stepX, stepY) * 0.12));
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const luminance = sampleLuminance(
          x,
          y,
          cols,
          rows,
          settings,
          srcW,
          srcH,
          source
        );
        const level = floor(
          map(1 - luminance / 255, 0, 1, 0, maxLines + 1)
        );
        if (level <= 0) continue;
        drawHatch(
          g,
          cell.x + x * stepX,
          cell.y + y * stepY,
          stepX,
          stepY,
          level
        );
      }
    }
    g.noStroke();
    return;
  }

  if (diffusionKernel) {
    const luminanceGrid = buildLuminanceGrid(
      cols,
      rows,
      settings,
      srcW,
      srcH,
      source
    );
    const output = errorDiffuse(
      luminanceGrid,
      cols,
      rows,
      settings.threshold,
      diffusionKernel
    );
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const on = output[y * cols + x] > 0;
        g.fill(on ? 255 : 0);
        drawDot(
          g,
          cell.x + x * stepX,
          cell.y + y * stepY,
          stepX,
          stepY,
          settings.dotShape
        );
      }
    }
    return;
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const luminance = sampleLuminance(
        x,
        y,
        cols,
        rows,
        settings,
        srcW,
        srcH,
        source
      );
      const on = applyDither(luminance, x, y, settings);
      g.fill(on ? 255 : 0);
      drawDot(
        g,
        cell.x + x * stepX,
        cell.y + y * stepY,
        stepX,
        stepY,
        settings.dotShape
      );
    }
  }
}

function applyDither(luminance, x, y, settings) {
  const threshold = settings.threshold;
  if (settings.style === 'ordered') {
    const matrix = getBayerMatrix(settings.bayerSize);
    const size = matrix.length;
    const value = matrix[y % size][x % size];
    const bayerThreshold = ((value + 0.5) / (size * size)) * 255;
    return luminance > bayerThreshold;
  }
  if (settings.style === 'blue-noise') {
    const size = BLUE_NOISE_8.length;
    const value = BLUE_NOISE_8[y % size][x % size];
    const thresholdValue = ((value + 0.5) / (size * size)) * 255;
    return luminance > thresholdValue;
  }
  if (settings.style === 'random') {
    const jitter = random(-32, 32);
    return luminance + jitter > threshold;
  }
  return luminance > threshold;
}

function sampleLuminance(x, y, cols, rows, settings, srcW, srcH, source) {
  const nx = (x + 0.5) / cols;
  const ny = (y + 0.5) / rows;
  const zoom = max(0.5, settings.zoom);
  const uNorm = ((nx - 0.5) / zoom) + 0.5 + settings.panX;
  const vNorm = ((ny - 0.5) / zoom) + 0.5 + settings.panY;
  if (uNorm < 0 || uNorm > 1 || vNorm < 0 || vNorm > 1) {
    return settings.invert ? 255 : 0;
  }
  const u = floor(uNorm * (srcW - 1));
  const v = floor(vNorm * (srcH - 1));
  const idx = (v * srcW + u) * 4;
  const r = source.pixels[idx];
  const g = source.pixels[idx + 1];
  const b = source.pixels[idx + 2];
  let luminance = (r * 0.299 + g * 0.587 + b * 0.114);
  if (settings.invert) {
    luminance = 255 - luminance;
  }
  return luminance;
}

function buildLuminanceGrid(cols, rows, settings, srcW, srcH, source) {
  const grid = new Array(cols * rows);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      grid[y * cols + x] = sampleLuminance(
        x,
        y,
        cols,
        rows,
        settings,
        srcW,
        srcH,
        source
      );
    }
  }
  return grid;
}

function errorDiffuse(grid, cols, rows, threshold, kernel) {
  const data = grid.slice();
  const output = new Array(cols * rows).fill(0);
  const divisor = kernel.divisor;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const idx = y * cols + x;
      const oldVal = data[idx];
      const newVal = oldVal > threshold ? 255 : 0;
      output[idx] = newVal;
      const error = oldVal - newVal;
      for (const [dx, dy, weight] of kernel.weights) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        data[ny * cols + nx] += error * (weight / divisor);
      }
    }
  }
  return output;
}

function getBayerMatrix(size) {
  if (size === 4) return BAYER_4;
  if (size === 2) {
    return [
      [0, 2],
      [3, 1],
    ];
  }
  if (size === 8) {
    return buildBayerMatrix(8);
  }
  return BAYER_4;
}

function buildBayerMatrix(size) {
  if (size === 2) {
    return [
      [0, 2],
      [3, 1],
    ];
  }
  const half = size / 2;
  const prev = buildBayerMatrix(half);
  const result = Array.from({ length: size }, () => new Array(size));
  for (let y = 0; y < half; y += 1) {
    for (let x = 0; x < half; x += 1) {
      const value = prev[y][x] * 4;
      result[y][x] = value;
      result[y][x + half] = value + 2;
      result[y + half][x] = value + 3;
      result[y + half][x + half] = value + 1;
    }
  }
  return result;
}

function drawDot(target, x, y, w, h, shape, scale = 1) {
  const g = target || window;
  const drawW = w * scale;
  const drawH = h * scale;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;
  if (shape === 'circle') {
    const size = min(drawW, drawH);
    g.ellipse(drawX + drawW / 2, drawY + drawH / 2, size, size);
    return;
  }
  if (shape === 'triangle') {
    g.beginShape();
    g.vertex(drawX + drawW * 0.5, drawY);
    g.vertex(drawX + drawW, drawY + drawH);
    g.vertex(drawX, drawY + drawH);
    g.endShape(CLOSE);
    return;
  }
  g.rect(drawX, drawY, drawW, drawH);
}

function drawHatch(target, x, y, w, h, count) {
  const g = target || window;
  const spacing = h / (count + 1);
  for (let i = 0; i < count; i += 1) {
    const offset = (i + 1) * spacing;
    g.line(x, y + h - offset, x + offset, y);
  }
}


function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scale = 2;
  const pg = createGraphics(WIDTH * scale, HEIGHT * scale);
  pg.pixelDensity(1);
  pg.background('#000000');
  if (!isFrozen) {
    capture.loadPixels();
  } else if (frozenFrame) {
    frozenFrame.loadPixels();
  }
  const cells = computeCellsWithSize(WIDTH * scale, HEIGHT * scale, gutter * scale);
  cells.forEach((cell, index) => {
    renderCell(cell, cellSettings[index], false, pg, scale);
  });
  saveCanvas(pg, `genuary-23-${timestamp}`, 'png');
  pg.remove();
}

function keyPressed() {
  if (key >= '1' && key <= '6') {
    activeCell = int(key) - 1;
    console.log(`Active cell: ${activeCell + 1}`);
    return;
  }
  if (key === 'o' || key === 'O') {
    const settings = cellSettings[activeCell];
    const index = DITHER_STYLES.indexOf(settings.style);
    settings.style = DITHER_STYLES[(index + 1) % DITHER_STYLES.length];
    console.log(`Cell ${activeCell + 1} style: ${settings.style}`);
    return;
  }
  if (key === ' ') {
    isFrozen = !isFrozen;
    if (isFrozen) {
      frozenFrame = capture.get();
      console.log('Camera frozen');
    } else {
      frozenFrame = null;
      console.log('Camera live');
    }
    return;
  }
  if (key === 'b' || key === 'B') {
    const settings = cellSettings[activeCell];
    const index = BAYER_SIZES.indexOf(settings.bayerSize);
    settings.bayerSize = BAYER_SIZES[(index + 1) % BAYER_SIZES.length];
    console.log(`Cell ${activeCell + 1} Bayer: ${settings.bayerSize}x${settings.bayerSize}`);
    return;
  }
  if (key === 'm' || key === 'M') {
    const settings = cellSettings[activeCell];
    const index = DOT_SHAPES.indexOf(settings.dotShape);
    settings.dotShape = DOT_SHAPES[(index + 1) % DOT_SHAPES.length];
    console.log(`Cell ${activeCell + 1} dot shape: ${settings.dotShape}`);
    return;
  }
  if (key === '[') {
    cellSettings[activeCell].pixelSize = max(
      2,
      cellSettings[activeCell].pixelSize - 1
    );
    console.log(
      `Cell ${activeCell + 1} pixel size: ${cellSettings[activeCell].pixelSize}`
    );
    return;
  }
  if (key === ']') {
    cellSettings[activeCell].pixelSize = min(
      40,
      cellSettings[activeCell].pixelSize + 1
    );
    console.log(
      `Cell ${activeCell + 1} pixel size: ${cellSettings[activeCell].pixelSize}`
    );
    return;
  }
  if (key === 't') {
    cellSettings[activeCell].threshold = max(
      0,
      cellSettings[activeCell].threshold - 8
    );
    console.log(
      `Cell ${activeCell + 1} threshold: ${cellSettings[activeCell].threshold}`
    );
    return;
  }
  if (key === 'T') {
    cellSettings[activeCell].threshold = min(
      255,
      cellSettings[activeCell].threshold + 8
    );
    console.log(
      `Cell ${activeCell + 1} threshold: ${cellSettings[activeCell].threshold}`
    );
    return;
  }
  if (key === 'i' || key === 'I') {
    cellSettings[activeCell].invert = !cellSettings[activeCell].invert;
    console.log(
      `Cell ${activeCell + 1} invert: ${cellSettings[activeCell].invert}`
    );
    return;
  }
  if (key === 'r' || key === 'R') {
    cellSettings[activeCell].zoom = 1;
    cellSettings[activeCell].panX = 0;
    cellSettings[activeCell].panY = 0;
    console.log(`Cell ${activeCell + 1} framing reset`);
    return;
  }
  if (keyCode === LEFT_ARROW) {
    cellSettings[activeCell].panX -= 0.03;
    console.log(
      `Cell ${activeCell + 1} panX: ${cellSettings[activeCell].panX.toFixed(2)}`
    );
    return;
  }
  if (keyCode === RIGHT_ARROW) {
    cellSettings[activeCell].panX += 0.03;
    console.log(
      `Cell ${activeCell + 1} panX: ${cellSettings[activeCell].panX.toFixed(2)}`
    );
    return;
  }
  if (keyCode === UP_ARROW) {
    cellSettings[activeCell].panY -= 0.03;
    console.log(
      `Cell ${activeCell + 1} panY: ${cellSettings[activeCell].panY.toFixed(2)}`
    );
    return;
  }
  if (keyCode === DOWN_ARROW) {
    cellSettings[activeCell].panY += 0.03;
    console.log(
      `Cell ${activeCell + 1} panY: ${cellSettings[activeCell].panY.toFixed(2)}`
    );
    return;
  }
  if (key === 'z' || key === 'Z') {
    cellSettings[activeCell].zoom = min(
      4,
      cellSettings[activeCell].zoom + 0.1
    );
    console.log(
      `Cell ${activeCell + 1} zoom: ${cellSettings[activeCell].zoom.toFixed(2)}`
    );
    return;
  }
  if (key === 'x' || key === 'X') {
    cellSettings[activeCell].zoom = max(
      0.5,
      cellSettings[activeCell].zoom - 0.1
    );
    console.log(
      `Cell ${activeCell + 1} zoom: ${cellSettings[activeCell].zoom.toFixed(2)}`
    );
    return;
  }
  if (key === '-' || key === '_') {
    gutter = max(0, gutter - 2);
    console.log(`Gutter: ${gutter}`);
    return;
  }
  if (key === '=' || key === '+') {
    gutter = min(60, gutter + 2);
    console.log(`Gutter: ${gutter}`);
    return;
  }
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  }
}
