const WIDTH = 540;
const HEIGHT = 675;
const PADDING = 24;
const INNER_WIDTH = WIDTH - PADDING * 2;
const INNER_HEIGHT = HEIGHT - PADDING * 2;

const BG_COLOR = '#000000';
const GLYPH_COLOR = '#ffffff';
const FONT_PATH = '../17/assets/OutpostMono-Bold.otf';
const PALETTE_PATH = './assets/colors.json';

// const GLYPHS = ['@', 'E', 'S', 'A'];
const GLYPHS = ['@'];
const WALLPAPER_GROUPS = [
  'p1',
  'p2',
  'p3',
  'p4',
  'p6',
  'pm',
  'pg',
  'cm',
  'pmm',
  'pmg',
  'pgg',
  'cmm',
  'p4m',
  'p4g',
  'p3m1',
  'p31m',
  'p6m',
];
// const GLYPHS = ['@'];
// const SVG_SIZE_MULTIPLIER = 0.6;
const SVG_SIZE_MULTIPLIER = 0.42;

const MASK_TYPES = [
  'vertical',
  'horizontal',
  'quadrant',
  'corner',
  'window',
  'reveal',
];

let font = null;
let svgAsset = null;
let svgDimensions = null;
let paletteData = null;
let currentGlyph = '@';
let bgColor = BG_COLOR;
let glyphColor = GLYPH_COLOR;
let patternSeed = 0;
let currentGroupIndex = 0;
let showLattice = true;
let useSvgAsset = false;
let paletteMode = 'mono';
let paletteColors = [];
let paletteHistory = [];
let latticeMatchesBg = true;
let cachedGlyphBounds = null;
let cachedGlyphSize = null;
let lastSvgColor = null;

function preload() {
  font = loadFont(FONT_PATH);
  paletteData = loadJSON(PALETTE_PATH, () => {}, () => {
    paletteData = null;
  });
  svgAsset = loadSVG('./assets/eye.svg');
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  textFont(font);
  noLoop();
  reseed();
  setMonoPalette();
  svgDimensions = getSvgSize(svgAsset);
  logActiveGroup();
}

function draw() {
  renderScene({ target: this, scale: 1 });
}

function renderScene({ target, scale = 1 }) {
  const g = target || this;
  randomSeed(patternSeed);
  noiseSeed(patternSeed);

  g.push();
  if (scale !== 1) {
    g.scale(scale);
  }

  g.noStroke();
  g.fill(bgColor);
  g.rect(0, 0, WIDTH, HEIGHT);

  const ctx = g.drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(PADDING, PADDING, INNER_WIDTH, INNER_HEIGHT);
  ctx.clip();

  drawPattern(g);

  ctx.restore();
  g.pop();
}

function drawPattern(g) {
  g.noStroke();
  g.fill(glyphColor);

  // const glyphSize = INNER_HEIGHT * 0.22;
  const glyphSize = INNER_HEIGHT * 0.22;
  const glyphBounds = getGlyphBounds(glyphSize);
  // const spacing = glyphSize * 1.25;
  // const spacing = glyphSize * 0.38;
  const spacing = glyphSize * 0.58;
  const group = WALLPAPER_GROUPS[currentGroupIndex];
  const config = getWallpaperConfig(group);

  if (config.lattice === 'square') {
    const dx = spacing * 0.9;
    const dy = spacing * 0.9;
    drawSquarePattern(g, glyphSize, dx, dy, config, glyphBounds);
    return;
  }

  const dx = spacing;
  const dy = spacing * Math.sqrt(3) / 2;
  drawTriPattern(g, glyphSize, dx, dy, config, glyphBounds);
}

function drawSquarePattern(g, glyphSize, dx, dy, config, glyphBounds) {
  const offsetX = random(-dx, dx);
  const offsetY = random(-dy, dy);

  const originX = PADDING + INNER_WIDTH / 2 + offsetX;
  const originY = PADDING + INNER_HEIGHT / 2 + offsetY;

  const minX = PADDING - dx * 2;
  const maxX = PADDING + INNER_WIDTH + dx * 2;
  const minY = PADDING - dy * 2;
  const maxY = PADDING + INNER_HEIGHT + dy * 2;

  const rowStart = Math.floor((minY - originY) / dy) - 2;
  const rowEnd = Math.ceil((maxY - originY) / dy) + 2;

  const colStart = Math.floor((minX - originX) / dx) - 2;
  const colEnd = Math.ceil((maxX - originX) / dx) + 2;

  for (let row = rowStart; row <= rowEnd; row += 1) {
    const y = originY + row * dy;
    const rowOffset = config.centered ? (row % 2) * (dx / 2) : 0;
    for (let col = colStart; col <= colEnd; col += 1) {
      const x = originX + col * dx + rowOffset;
      drawGlyphGroup(g, x, y, glyphSize, config, row, col, glyphBounds);
    }
  }

  if (showLattice) {
    drawSquareLattice(g, originX, originY, dx, dy, rowStart, rowEnd, colStart, colEnd);
  }
}

function drawTriPattern(g, glyphSize, dx, dy, config, glyphBounds) {
  const offsetX = random(-dx, dx);
  const offsetY = random(-dy, dy);

  const originX = PADDING + INNER_WIDTH / 2 + offsetX;
  const originY = PADDING + INNER_HEIGHT / 2 + offsetY;

  const minX = PADDING - dx * 2;
  const maxX = PADDING + INNER_WIDTH + dx * 2;
  const minY = PADDING - dy * 2;
  const maxY = PADDING + INNER_HEIGHT + dy * 2;

  const rowStart = Math.floor((minY - originY) / dy) - 2;
  const rowEnd = Math.ceil((maxY - originY) / dy) + 2;

  const colStart = Math.floor((minX - originX) / dx) - 2;
  const colEnd = Math.ceil((maxX - originX) / dx) + 2;

  for (let row = rowStart; row <= rowEnd; row += 1) {
    const y = originY + row * dy;
    const rowOffset = (row % 2) * (dx / 2);
    for (let col = colStart; col <= colEnd; col += 1) {
      const x = originX + col * dx + rowOffset;
      drawGlyphGroup(g, x, y, glyphSize, config, row, col, glyphBounds);
    }
  }

  if (showLattice) {
    drawTriangularLattice(g, originX, originY, dx, dy, rowStart, rowEnd, colStart, colEnd);
  }
}

function drawGlyphGroup(g, x, y, size, config, row, col, glyphBounds) {
  const transforms = getMirrorTransforms(config, row, col);
  const maskSpec = getMaskSpecForCell(row, col);
  for (const angle of config.rotations) {
    for (const transform of transforms) {
      drawGlyphMasked(g, currentGlyph, x, y, angle, size, transform.sx, transform.sy, maskSpec, glyphBounds);
    }
  }
}

function drawTriangularLattice(g, originX, originY, dx, dy, rowStart, rowEnd, colStart, colEnd) {
  g.push();
  g.noFill();
  g.stroke(latticeMatchesBg ? bgColor : '#ff0000');
  g.strokeWeight(10);

  for (let row = rowStart; row <= rowEnd; row += 1) {
    const y = originY + row * dy;
    const rowOffset = (row % 2) * (dx / 2);
    for (let col = colStart; col <= colEnd; col += 1) {
      const x = originX + col * dx + rowOffset;
      g.line(x, y, x + dx, y);
      g.line(x, y, x + dx / 2, y + dy);
      g.line(x, y, x - dx / 2, y + dy);
    }
  }

  g.pop();
}

function drawSquareLattice(g, originX, originY, dx, dy, rowStart, rowEnd, colStart, colEnd) {
  g.push();
  g.noFill();
  g.stroke(latticeMatchesBg ? bgColor : '#ff0000');
  g.strokeWeight(10);

  for (let row = rowStart; row <= rowEnd; row += 1) {
    const y = originY + row * dy;
    for (let col = colStart; col <= colEnd; col += 1) {
      const x = originX + col * dx;
      g.rect(x, y, dx, dy);
    }
  }

  g.pop();
}

function drawGlyphMasked(
  g,
  glyph,
  x,
  y,
  angle,
  size,
  scaleX = 1,
  scaleY = 1,
  maskSpec = null,
  glyphBounds = null
) {
  if (useSvgAsset && svgAsset) {
    drawSvgMasked(g, svgAsset, x, y, angle, size, scaleX, scaleY, maskSpec);
    return;
  }
  const bounds = glyphBounds || font.textBounds(glyph, 0, 0, size);
  const centeredBounds = {
    x: -bounds.w / 2,
    y: -bounds.h / 2,
    w: bounds.w,
    h: bounds.h,
  };

  const masks = buildMaskRects(centeredBounds, maskSpec);

  g.push();
  g.translate(x, y);
  g.rotate(angle);
  if (scaleX !== 1 || scaleY !== 1) {
    g.scale(scaleX, scaleY);
  }
  g.translate(-bounds.x - bounds.w / 2, -bounds.y - bounds.h / 2);

  const ctx = g.drawingContext;
  ctx.save();
  ctx.beginPath();
  masks.forEach((rect) => {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  });
  ctx.clip();

  g.textFont(font);
  g.textSize(size);
  g.textAlign(LEFT, BASELINE);
  g.fill(glyphColor);
  g.text(glyph, 0, 0);

  ctx.restore();
  g.pop();
}

function drawSvgMasked(
  g,
  asset,
  x,
  y,
  angle,
  size,
  scaleX = 1,
  scaleY = 1,
  maskSpec = null
) {
  const dims = svgDimensions || getSvgSize(asset);
  if (!dims) {
    return;
  }
  const scale = (size * SVG_SIZE_MULTIPLIER) / dims.h;
  const scaledW = dims.w * scale;
  const scaledH = dims.h * scale;
  const centeredBounds = {
    x: -scaledW / 2,
    y: -scaledH / 2,
    w: scaledW,
    h: scaledH,
  };

  const masks = buildMaskRects(centeredBounds, maskSpec);

  g.push();
  g.translate(x, y);
  g.rotate(angle);
  if (scaleX !== 1 || scaleY !== 1) {
    g.scale(scaleX, scaleY);
  }

  const ctx = g.drawingContext;
  ctx.save();
  ctx.beginPath();
  masks.forEach((rect) => {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  });
  ctx.clip();

  if (lastSvgColor !== glyphColor) {
    applySvgColor(asset, glyphColor);
    lastSvgColor = glyphColor;
  }
  g.imageMode(CENTER);
  g.image(asset, 0, 0, scaledW, scaledH);

  ctx.restore();
  g.pop();
}

function buildMaskRects(bounds, maskSpec) {
  const maskType = maskSpec ? maskSpec.type : random(MASK_TYPES);
  const { x, y, w, h } = bounds;
  if (maskType === 'vertical') {
    const width = w * getRange(maskSpec, 'width', 0.22, 0.55);
    const left = getRange(maskSpec, 'left', x, x + w - width);
    return [{ x: left, y, w: width, h }];
  }
  if (maskType === 'horizontal') {
    const height = h * getRange(maskSpec, 'height', 0.22, 0.55);
    const top = getRange(maskSpec, 'top', y, y + h - height);
    return [{ x, y: top, w, h: height }];
  }
  if (maskType === 'quadrant') {
    const halfW = w * getRange(maskSpec, 'halfW', 0.45, 0.55);
    const halfH = h * getRange(maskSpec, 'halfH', 0.45, 0.55);
    const left = pickFrom(maskSpec, 'leftPick', [x, x + w - halfW]);
    const top = pickFrom(maskSpec, 'topPick', [y, y + h - halfH]);
    return [{ x: left, y: top, w: halfW, h: halfH }];
  }
  if (maskType === 'corner') {
    const width = w * getRange(maskSpec, 'width', 0.25, 0.4);
    const height = h * getRange(maskSpec, 'height', 0.25, 0.4);
    const left = pickFrom(maskSpec, 'leftPick', [x, x + w - width]);
    const top = pickFrom(maskSpec, 'topPick', [y, y + h - height]);
    return [{ x: left, y: top, w: width, h: height }];
  }
  if (maskType === 'window') {
    const width = w * getRange(maskSpec, 'width', 0.15, 0.28);
    const height = h * getRange(maskSpec, 'height', 0.4, 0.7);
    const left = getRange(maskSpec, 'left', x, x + w - width);
    const top = getRange(maskSpec, 'top', y + h * 0.1, y + h - height);
    return [{ x: left, y: top, w: width, h: height }];
  }
  const width = w * getRange(maskSpec, 'width', 0.12, 0.2);
  const height = h * getRange(maskSpec, 'height', 0.12, 0.2);
  const left = getRange(maskSpec, 'left', x, x + w - width);
  const top = getRange(maskSpec, 'top', y, y + h - height);
  return [{ x: left, y: top, w: width, h: height }];
}

function getGlyphBounds(size) {
  if (cachedGlyphBounds && cachedGlyphSize === size) {
    return cachedGlyphBounds;
  }
  cachedGlyphBounds = font.textBounds(currentGlyph, 0, 0, size);
  cachedGlyphSize = size;
  return cachedGlyphBounds;
}

function getMaskSpecForCell(row, col) {
  const seed = hashToUnit(patternSeed, row, col, 0.11);
  const typeIndex = Math.floor(seed * MASK_TYPES.length);
  return {
    type: MASK_TYPES[typeIndex],
    left: hashToUnit(patternSeed, row, col, 0.21),
    top: hashToUnit(patternSeed, row, col, 0.31),
    width: hashToUnit(patternSeed, row, col, 0.41),
    height: hashToUnit(patternSeed, row, col, 0.51),
    halfW: hashToUnit(patternSeed, row, col, 0.61),
    halfH: hashToUnit(patternSeed, row, col, 0.71),
    leftPick: hashToUnit(patternSeed, row, col, 0.81),
    topPick: hashToUnit(patternSeed, row, col, 0.91),
  };
}

function getRange(maskSpec, key, minValue, maxValue) {
  if (!maskSpec) {
    return random(minValue, maxValue);
  }
  const t = maskSpec[key];
  return minValue + (maxValue - minValue) * t;
}

function pickFrom(maskSpec, key, options) {
  if (!maskSpec) {
    return random(options);
  }
  const t = maskSpec[key];
  const idx = Math.min(Math.floor(t * options.length), options.length - 1);
  return options[idx];
}

function hashToUnit(seed, row, col, offset) {
  const value = Math.sin((row * 12.9898 + col * 78.233 + seed * 0.17 + offset) * 43758.5453);
  return value - Math.floor(value);
}

function reseed() {
  patternSeed = floor(random(100000));
  currentGlyph = random(GLYPHS);
}

function setMonoPalette() {
  paletteMode = 'mono';
  paletteColors = [BG_COLOR, GLYPH_COLOR];
  bgColor = BG_COLOR;
  glyphColor = GLYPH_COLOR;
  lastSvgColor = null;
}

function setTwoColorPalette() {
  const palette = getRandomPalette(2, 2);
  if (!palette) {
    return;
  }
  let nextPalette = palette;
  if (paletteData && paletteData.palettes && paletteData.palettes.length > 1) {
    const recent = new Set(paletteHistory);
    const eligible = paletteData.palettes.filter(
      (candidate) =>
        candidate.numColors === 2 && !recent.has(getPaletteKey(candidate))
    );
    nextPalette = eligible.length > 0 ? pickRandom(eligible) : palette;
  }
  paletteMode = 'duo';
  const colors = nextPalette.colors.slice();
  if (Math.random() < 0.5) {
    colors.reverse();
  }
  paletteColors = colors.slice();
  bgColor = colors[0];
  glyphColor = colors[1];
  lastSvgColor = null;
  const paletteKey = getPaletteKey(nextPalette);
  if (paletteKey) {
    paletteHistory.unshift(paletteKey);
    if (paletteHistory.length > 6) {
      paletteHistory.pop();
    }
  }
}

function shufflePalette() {
  if (paletteMode === 'duo') {
    const nextBg = glyphColor;
    glyphColor = bgColor;
    bgColor = nextBg;
    lastSvgColor = null;
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
  return pickRandom(eligible);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getPaletteKey(palette) {
  if (!palette) {
    return '';
  }
  if (palette.name) {
    return palette.name;
  }
  if (Array.isArray(palette.colors)) {
    return palette.colors.join(',');
  }
  return '';
}

function getSvgSize(asset) {
  const element = asset && asset.elt ? asset.elt : asset;
  if (!element) {
    return null;
  }
  const widthAttr = element.getAttribute('width');
  const heightAttr = element.getAttribute('height');
  const viewBoxAttr = element.getAttribute('viewBox');

  const parseNumber = (value) => {
    if (!value) {
      return null;
    }
    const numeric = parseFloat(String(value).replace('px', ''));
    return Number.isFinite(numeric) ? numeric : null;
  };

  const w = parseNumber(widthAttr);
  const h = parseNumber(heightAttr);
  if (w && h) {
    return { w, h };
  }

  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+/).map((v) => parseFloat(v));
    if (parts.length === 4 && parts.every((v) => Number.isFinite(v))) {
      return { w: parts[2], h: parts[3] };
    }
  }

  return { w: 100, h: 100 };
}

function applySvgColor(asset, colorValue) {
  const element = asset && asset.elt ? asset.elt : asset;
  if (!element) {
    return;
  }
  const elements = element.querySelectorAll('*');
  elements.forEach((el) => {
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if (fill !== 'none') {
      el.setAttribute('fill', colorValue);
    }
    if (stroke && stroke !== 'none') {
      el.setAttribute('stroke', colorValue);
    }
    if (!fill && !stroke) {
      el.setAttribute('fill', colorValue);
    }
    el.style.fill = colorValue;
    if (stroke && stroke !== 'none') {
      el.style.stroke = colorValue;
    }
  });
}

function getWallpaperConfig(group) {
  const configs = {
    p1: { lattice: 'square', rotations: [0], mirror: '', glide: '', centered: false },
    p2: { lattice: 'square', rotations: [0, PI], mirror: '', glide: '', centered: false },
    p3: { lattice: 'tri', rotations: [0, TWO_PI / 3, (2 * TWO_PI) / 3], mirror: '', glide: '' },
    p4: {
      lattice: 'square',
      rotations: [0, HALF_PI, PI, (3 * HALF_PI)],
      mirror: '',
      glide: '',
      centered: false,
    },
    p6: {
      lattice: 'tri',
      rotations: [
        0,
        PI / 3,
        (2 * PI) / 3,
        PI,
        (4 * PI) / 3,
        (5 * PI) / 3,
      ],
      mirror: '',
      glide: '',
    },
    pm: { lattice: 'square', rotations: [0], mirror: 'x', glide: '', centered: false },
    pg: { lattice: 'square', rotations: [0], mirror: '', glide: 'x', centered: false },
    cm: { lattice: 'square', rotations: [0], mirror: 'x', glide: '', centered: true },
    pmm: { lattice: 'square', rotations: [0], mirror: 'xy', glide: '', centered: false },
    pmg: { lattice: 'square', rotations: [0], mirror: 'x', glide: 'y', centered: false },
    pgg: { lattice: 'square', rotations: [0], mirror: '', glide: 'xy', centered: false },
    cmm: { lattice: 'square', rotations: [0], mirror: 'xy', glide: '', centered: true },
    p4m: {
      lattice: 'square',
      rotations: [0, HALF_PI, PI, (3 * HALF_PI)],
      mirror: 'xy',
      glide: '',
      centered: false,
    },
    p4g: {
      lattice: 'square',
      rotations: [0, HALF_PI, PI, (3 * HALF_PI)],
      mirror: '',
      glide: 'xy',
      centered: false,
    },
    p3m1: { lattice: 'tri', rotations: [0, TWO_PI / 3, (2 * TWO_PI) / 3], mirror: 'x', glide: '' },
    p31m: { lattice: 'tri', rotations: [0, TWO_PI / 3, (2 * TWO_PI) / 3], mirror: 'x', glide: 'y' },
    p6m: {
      lattice: 'tri',
      rotations: [
        0,
        PI / 3,
        (2 * PI) / 3,
        PI,
        (4 * PI) / 3,
        (5 * PI) / 3,
      ],
      mirror: 'x',
      glide: '',
    },
  };

  return configs[group] || configs.p1;
}

function getMirrorTransforms(config, row, col) {
  const transforms = [{ sx: 1, sy: 1 }];
  const mirrorX = config.mirror.includes('x');
  const mirrorY = config.mirror.includes('y');

  if (mirrorX) {
    transforms.push({ sx: -1, sy: 1 });
  }
  if (mirrorY) {
    transforms.push({ sx: 1, sy: -1 });
  }
  if (mirrorX && mirrorY) {
    transforms.push({ sx: -1, sy: -1 });
  }

  if (!config.glide) {
    return transforms;
  }

  const glideX = config.glide.includes('x') && (row + col) % 2 !== 0 ? -1 : 1;
  const glideY = config.glide.includes('y') && row % 2 !== 0 ? -1 : 1;

  return transforms.map((t) => ({ sx: t.sx * glideX, sy: t.sy * glideY }));
}

function logActiveGroup() {
  const group = WALLPAPER_GROUPS[currentGroupIndex];
  console.log(`Wallpaper group: ${group}`);
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (typeof SVG === 'undefined') {
    save(`genuary-17-${timestamp}.svg`);
    return;
  }
  const pg = createGraphics(WIDTH, HEIGHT, SVG);
  pg.textFont(font);
  renderScene({ target: pg, scale: 1 });
  save(pg, `genuary-17-${timestamp}.svg`);
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
    renderScene({ target: pg, scale });
    saveCanvas(pg, `genuary-17-${timestamp}`, 'png');
    setTimeout(() => {
      pg.remove();
    }, 0);
    return;
  }
  const pg = createGraphics(WIDTH * scale, HEIGHT * scale, SVG);
  pg.textFont(font);
  renderScene({ target: pg, scale });
  save(pg, `genuary-17-${timestamp}.png`);
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'g' || key === 'G') {
    currentGroupIndex = (currentGroupIndex + 1) % WALLPAPER_GROUPS.length;
    logActiveGroup();
    redraw();
  } else if (key === 'a' || key === 'A') {
    useSvgAsset = !useSvgAsset;
    redraw();
  } else if (key === 'o' || key === 'O') {
    latticeMatchesBg = !latticeMatchesBg;
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
  } else if (key === 'l' || key === 'L') {
    showLattice = !showLattice;
    redraw();
  } else if (key === 'r' || key === 'R') {
    reseed();
    redraw();
  }
}
