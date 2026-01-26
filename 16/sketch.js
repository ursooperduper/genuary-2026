const WIDTH = 540;
const HEIGHT = 675;
const PADDING = 24;
const INNER_WIDTH = WIDTH - PADDING * 2;
const INNER_HEIGHT = HEIGHT - PADDING * 2;
const TOTAL_MODULES = 113;
const ENCODED_MODULES = 95;
const QUIET_MODULES = 9;

const BG_COLOR = '#000000';
const BAR_COLOR = '#ffffff';
const PALETTE_PATH = './assets/colors.json';

const USE_MOUSE_ENTROPY = true;

const L_PATTERNS = {
  0: '0001101',
  1: '0011001',
  2: '0010011',
  3: '0111101',
  4: '0100011',
  5: '0110001',
  6: '0101111',
  7: '0111011',
  8: '0110111',
  9: '0001011',
};

const R_PATTERNS = {
  0: '1110010',
  1: '1100110',
  2: '1101100',
  3: '1000010',
  4: '1011100',
  5: '1001110',
  6: '1010000',
  7: '1000100',
  8: '1001000',
  9: '1110100',
};

let barcodeData = null;
let font = null;
let entropySeed = 0;
let paletteData = null;
let paletteMode = 'mono';
let paletteColors = [];
let bgColor = BG_COLOR;
let barColors = [BAR_COLOR];
let showDigits = true;

function preload() {
  font = loadFont('./assets/OutpostMono-Regular.otf');
  paletteData = loadJSON(PALETTE_PATH);
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  textFont(font);
  noLoop();
  entropySeed = floor(random(100000));
  noiseSeed(entropySeed);
  barcodeData = buildBarcodeData();
  setMonoPalette();
}

function draw() {
  renderScene({ target: this, scale: 1 });
}

function renderScene({ target, entropyYOverride, scale = 1 }) {
  const g = target || this;
  noiseSeed(entropySeed);
  g.push();
  if (scale !== 1) {
    g.scale(scale);
  }
  g.noStroke();
  g.fill(bgColor);
  g.rect(0, 0, WIDTH, HEIGHT);

  const layout = computeLayout();
  renderBarcode(g, layout, entropyYOverride);
  if (showDigits) {
    renderDigits(g, layout);
  }
  g.pop();
}

function computeLayout() {
  const barcodeHeight = INNER_HEIGHT * 0.7;
  // const textSizeTarget = clamp(INNER_HEIGHT * 0.055, 28, 40);
  const textSizeTarget = clamp(INNER_HEIGHT * 0.015, 28, 40);
  const guardExtension = textSizeTarget * 0.45;
  const numberSpacing = textSizeTarget * 0.2;

  let barcodeTop = PADDING + (INNER_HEIGHT - barcodeHeight) / 2;
  const textY = barcodeTop + barcodeHeight + guardExtension + numberSpacing + textSizeTarget * 0.8;
  const overflow = textY - (PADDING + INNER_HEIGHT - textSizeTarget * 0.2);
  if (overflow > 0) {
    barcodeTop -= overflow;
  }

  return {
    barcodeLeft: PADDING,
    barcodeTop,
    barcodeWidth: INNER_WIDTH,
    barcodeHeight,
    guardExtension,
    textSize: textSizeTarget,
    textY: barcodeTop + barcodeHeight + guardExtension + numberSpacing + textSizeTarget * 0.8,
  };
}

function buildBarcodeData() {
  const digits = [];
  for (let i = 0; i < 11; i += 1) {
    digits.push(floor(random(10)));
  }
  digits.push(computeCheckDigit(digits));

  const bits = [];
  const guardMask = [];
  const groups = [];
  let moduleIndex = 0;

  const pushBits = (pattern, groupType, groupId, guard = false) => {
    for (let i = 0; i < pattern.length; i += 1) {
      const bit = pattern[i] === '1';
      bits.push(bit);
      guardMask.push(guard && bit);
      groups.push({ type: groupType, id: groupId });
      moduleIndex += 1;
    }
  };

  pushBits('0'.repeat(QUIET_MODULES), 'quiet', 0, false);
  pushBits('101', 'guard', 0, true);

  for (let i = 0; i < 6; i += 1) {
    const digit = digits[i];
    pushBits(L_PATTERNS[digit], 'digit', i, false);
  }

  pushBits('01010', 'guard', 1, true);

  for (let i = 0; i < 6; i += 1) {
    const digit = digits[i + 6];
    pushBits(R_PATTERNS[digit], 'digit', i + 6, false);
  }

  pushBits('101', 'guard', 2, true);
  pushBits('0'.repeat(QUIET_MODULES), 'quiet', 1, false);

  return {
    digits,
    bits,
    guardMask,
    groups,
  };
}

function computeCheckDigit(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const value = digits[i];
    if (i % 2 === 0) {
      sum += value * 3;
    } else {
      sum += value;
    }
  }
  return (10 - (sum % 10)) % 10;
}

function renderBarcode(g, layout, entropyYOverride) {
  if (!barcodeData) {
    return;
  }
  const { bits, guardMask, groups } = barcodeData;
  const baseModuleWidth = layout.barcodeWidth / TOTAL_MODULES;
  const sliceHeight = 1;
  const totalBarHeight = layout.barcodeHeight + layout.guardExtension;
  const bottomY = layout.barcodeTop + layout.barcodeHeight;

  for (let y = 0; y < totalBarHeight; y += sliceHeight) {
    const sliceY = layout.barcodeTop + y;
    const entropyStrength = getEntropyStrength(
      sliceY,
      layout.barcodeTop,
      bottomY,
      entropyYOverride
    );
    const widths = getSliceWidths(baseModuleWidth, entropyStrength, y, groups);
    const guardZone = y >= layout.barcodeHeight;
    drawSlice(
      g,
      sliceY,
      sliceHeight,
      widths,
      guardZone ? guardMask : bits,
      layout.barcodeLeft
    );
  }
}

function getEntropyStrength(sliceY, top, bottom, entropyYOverride) {
  if (USE_MOUSE_ENTROPY) {
    const refY = typeof entropyYOverride === 'number' ? entropyYOverride : mouseY;
    if (refY >= bottom) {
      return 0;
    }
    if (refY <= top) {
      return clamp((sliceY - top) / (bottom - top), 0, 1);
    }
    return clamp((sliceY - refY) / (bottom - refY), 0, 1);
  }
  return clamp((sliceY - top) / (bottom - top), 0, 1);
}

function getSliceWidths(baseModuleWidth, strength, sliceOffset, groups) {
  const widths = [];
  // const jitterAmount = strength * 0.35;
  const jitterAmount = strength * 0.35; // per-module width wobble
  // const groupAmount = strength * 0.22;
  const groupAmount = strength * 0.92; // grouo boundary drift
  let sum = 0;

  for (let i = 0; i < TOTAL_MODULES; i += 1) {
    const g = groups[i];
    const noiseValue = noise(i * 0.35, sliceOffset * 0.08, entropySeed);
    let jitter = (noiseValue - 0.5) * 2 * jitterAmount;
    let groupBias = 0;

    if (g.type === 'digit') {
      const gNoise = noise(g.id * 0.5, sliceOffset * 0.04, entropySeed + 10);
      groupBias = (gNoise - 0.5) * 2 * groupAmount;
    } else if (g.type === 'guard') {
      const gNoise = noise(g.id * 0.65, sliceOffset * 0.03, entropySeed + 33);
      groupBias = (gNoise - 0.5) * 2 * (groupAmount * 0.5);
    }

    const raw = clamp(1 + jitter + groupBias, 0.3, 1.7);
    widths.push(raw);
    sum += raw;
  }

  const scale = TOTAL_MODULES / sum;
  for (let i = 0; i < widths.length; i += 1) {
    widths[i] = widths[i] * baseModuleWidth * scale;
  }

  return widths;
}

function drawSlice(g, y, h, widths, mask, startX) {
  let x = startX;
  if (barColors.length > 1) {
    for (let i = 0; i < widths.length; i += 1) {
      const bit = mask[i];
      const w = widths[i];
      if (bit) {
        g.fill(pickBarColor(i, y));
        g.rect(x, y, w, h);
      }
      x += w;
    }
    return;
  }

  let runStart = null;
  let runWidth = 0;
  g.fill(barColors[0]);

  for (let i = 0; i < widths.length; i += 1) {
    const bit = mask[i];
    const w = widths[i];

    if (bit) {
      if (runStart === null) {
        runStart = x;
        runWidth = w;
      } else {
        runWidth += w;
      }
    } else if (runStart !== null) {
      g.rect(runStart, y, runWidth, h);
      runStart = null;
      runWidth = 0;
    }

    x += w;
  }

  if (runStart !== null) {
    g.rect(runStart, y, runWidth, h);
  }
}

function renderDigits(g, layout) {
  if (!barcodeData) {
    return;
  }
  const { digits } = barcodeData;
  const baseModuleWidth = layout.barcodeWidth / TOTAL_MODULES;
  const startX = layout.barcodeLeft;
  const leftGuardStart = QUIET_MODULES;
  const leftDigitsStart = leftGuardStart + 3;
  const rightDigitsStart = leftDigitsStart + 42 + 5;
  const rightGuardStart = rightDigitsStart + 42;

  g.textFont(font);
  g.textSize(layout.textSize);
  g.textAlign(CENTER, BASELINE);

  const leftQuietCenter = startX + (QUIET_MODULES * baseModuleWidth) / 2;
  g.fill(pickDigitColor(0));
  g.text(digits[0], leftQuietCenter, layout.textY);

  for (let i = 1; i < 6; i += 1) {
    const moduleCenter = leftDigitsStart + i * 7 + 3.5;
    const x = startX + moduleCenter * baseModuleWidth;
    g.fill(pickDigitColor(i));
    g.text(digits[i], x, layout.textY);
  }

  for (let i = 0; i < 5; i += 1) {
    const moduleCenter = rightDigitsStart + i * 7 + 3.5;
    const x = startX + moduleCenter * baseModuleWidth;
    g.fill(pickDigitColor(i + 6));
    g.text(digits[i + 6], x, layout.textY);
  }

  const rightQuietCenter = startX + (rightGuardStart + 3 + QUIET_MODULES / 2) * baseModuleWidth;
  g.fill(pickDigitColor(11));
  g.text(digits[11], rightQuietCenter, layout.textY);
}

function pickBarColor(moduleIndex, sliceY) {
  if (barColors.length === 1) {
    return barColors[0];
  }
  const n = noise(moduleIndex * 0.23, sliceY * 0.03, entropySeed + 200);
  const idx = Math.min(Math.floor(n * barColors.length), barColors.length - 1);
  return barColors[idx];
}

function pickDigitColor(digitIndex) {
  if (barColors.length === 1) {
    return barColors[0];
  }
  const n = noise(digitIndex * 0.5, entropySeed + 420);
  const idx = Math.min(Math.floor(n * barColors.length), barColors.length - 1);
  return barColors[idx];
}

function clamp(value, minValue, maxValue) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function setMonoPalette() {
  paletteMode = 'mono';
  paletteColors = [BG_COLOR, BAR_COLOR];
  bgColor = BG_COLOR;
  barColors = [BAR_COLOR];
}

function setTwoColorPalette() {
  const palette = getRandomPalette(2, 2);
  if (!palette) {
    return;
  }
  paletteMode = 'duo';
  paletteColors = palette.colors.slice();
  if (random() < 0.5) {
    paletteColors.reverse();
  }
  bgColor = paletteColors[0];
  barColors = [paletteColors[1]];
}

function setBonkersPalette() {
  const palette = getRandomPalette(3, 5);
  if (!palette) {
    return;
  }
  paletteMode = 'bonkers';
  const colors = palette.colors.slice();
  shuffleArray(colors);
  bgColor = colors[0];
  barColors = colors.slice(1);
  paletteColors = colors.slice();
}

function shufflePalette() {
  if (paletteMode === 'duo') {
    const nextBg = barColors[0];
    barColors = [bgColor];
    bgColor = nextBg;
    return;
  }
  if (paletteMode === 'bonkers') {
    const colors = paletteColors.slice();
    shuffleArray(colors);
    bgColor = colors[0];
    barColors = colors.slice(1);
    paletteColors = colors.slice();
  }
}

function getRandomPalette(minColors, maxColors) {
  if (!paletteData || !paletteData.palettes) {
    console.warn('Palette data unavailable; staying in mono mode.');
    setMonoPalette();
    return null;
  }
  const eligible = paletteData.palettes.filter(
    (palette) => palette.numColors >= minColors && palette.numColors <= maxColors
  );
  if (eligible.length === 0) {
    console.warn('No palettes matched the requested size.');
    return null;
  }
  return random(eligible);
}

function shuffleArray(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = floor(random(i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (typeof SVG === 'undefined') {
    save(`genuary-16-${timestamp}.svg`);
    return;
  }
  const pg = createGraphics(WIDTH, HEIGHT, SVG);
  pg.textFont(font);
  renderScene({ target: pg, entropyYOverride: mouseY, scale: 1 });
  save(pg, `genuary-16-${timestamp}.svg`);
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scale = 2;
  if (typeof SVG === 'undefined') {
    const pg = createGraphics(WIDTH * scale, HEIGHT * scale);
    pg.pixelDensity(1);
    pg.textFont(font);
    renderScene({ target: pg, entropyYOverride: mouseY, scale });
    saveCanvas(pg, `genuary-16-${timestamp}`, 'png');
    setTimeout(() => {
      pg.remove();
    }, 0);
    return;
  }
  const pg = createGraphics(WIDTH * scale, HEIGHT * scale, SVG);
  pg.textFont(font);
  renderScene({ target: pg, entropyYOverride: mouseY, scale });
  save(pg, `genuary-16-${timestamp}.png`);
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'n' || key === 'N') {
    showDigits = !showDigits;
    redraw();
  } else if (key === 'c' || key === 'C') {
    setTwoColorPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    shufflePalette();
    redraw();
  } else if (key === 'b' || key === 'B') {
    setMonoPalette();
    redraw();
  } else if (key === 'm' || key === 'M') {
    setBonkersPalette();
    redraw();
  } else if (key === 'r' || key === 'R') {
    entropySeed = floor(random(100000));
    noiseSeed(entropySeed);
    barcodeData = buildBarcodeData();
    redraw();
  }
}

function mouseMoved() {
  if (USE_MOUSE_ENTROPY) {
    redraw();
  }
}

function mouseDragged() {
  mouseMoved();
}




/* 
The “blocky camo” comes from how color is chosen when bonkers mode is on:

In drawSlice() we color each module independently when barColors.length > 1.
pickBarColor(moduleIndex, sliceY) uses noise(moduleIndex * 0.23, sliceY * 0.03, entropySeed + 200) to pick a palette index.
Because the noise changes slowly across both moduleIndex and sliceY, adjacent modules and adjacent slices often resolve to the same color for a while, then shift together. That creates chunky, rectangular patches of the same color rather than smooth gradients or fine speckle.
Also, each slice is only 1px tall, and each module spans multiple pixels wide, so those repeated per-slice colors stack into “block” regions.
So it’s not randomness per pixel; it’s coherent noise per module per scanline, which intentionally yields blocky patches.
*/
