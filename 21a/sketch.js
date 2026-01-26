const CONFIG = {
  // USE_SEED: true | false (if false, always new seed)
  USE_SEED: false,
  // SEED: integer, used when USE_SEED is true
  SEED: 21021,
  // RENDER_ON_PRESS: true | false (if false, R always randomizes)
  RENDER_ON_PRESS: true,
  // SHOW_DEBUG: true | false
  SHOW_DEBUG: false,
  // SHOW_MARGIN_GUIDES: true | false
  SHOW_MARGIN_GUIDES: false,
  // SHOW_CONSTRUCTION_LINES: true | false
  SHOW_CONSTRUCTION_LINES: false,

  // CANVAS_W: 540 (portrait width)
  CANVAS_W: 540,
  // CANVAS_H: 675 (portrait height)
  CANVAS_H: 675,
  // MARGIN_TOP: 36–64 recommended
  MARGIN_TOP: 48,
  // MARGIN_RIGHT: 32–56 recommended
  MARGIN_RIGHT: 40,
  // MARGIN_BOTTOM: 36–64 recommended
  MARGIN_BOTTOM: 48,
  // MARGIN_LEFT: 32–56 recommended
  MARGIN_LEFT: 40,

  // BACKGROUND_MODE: 'warmWhite' | 'paperNoiseOptional'
  BACKGROUND_MODE: 'warmWhite',
  // BACKGROUND_NOISE: 0.08,
  // BACKGROUND_NOISE: 0–1 subtle grain (only used in paperNoiseOptional)
  BACKGROUND_NOISE: 1.0,

  // ANGLE_MODE: 'dominant' | 'multi'
  ANGLE_MODE: 'dominant',
  // DOMINANT_ANGLE_DEG: null or degrees (0/15/30/45/60/90)
  // DOMINANT_ANGLE_DEG: null uses random dominant angle per render
  DOMINANT_ANGLE_DEG: null,
  // ANGLE_QUANTIZE_DEG: 15 | 30 | 45 suggested
  ANGLE_QUANTIZE_DEG: 15,
  // ANGLE_QUANTIZE_DEG: 45,

  // PALETTE_SAT_MULT: 0.85–1.0
  PALETTE_SAT_MULT: 0.92,
  // PALETTE_BRIGHT_MULT: 0.9–1.05
  PALETTE_BRIGHT_MULT: 0.98,
  // PALETTE_WARM_SHIFT: -5–5 (degrees)
  PALETTE_WARM_SHIFT: 0,
  // MAX_ACCENT_COLORS: 1–3
  MAX_ACCENT_COLORS: 3,
  // ACCENT_COLOR_WEIGHTS: relative weights for red/blue/yellow accents
  ACCENT_COLOR_WEIGHTS: { red: 3, blue: 2, yellow: 2 },

  // LAYER_SHAPES_ENABLED: true | false
  LAYER_SHAPES_ENABLED: true,
  // LAYER_REPEAT_ENABLED: true | false
  LAYER_REPEAT_ENABLED: true,
  // LAYER_TYPE_ENABLED: true | false
  LAYER_TYPE_ENABLED: true,

  // SHAPES_COUNT_RANGE: [min, max] (1–4 recommended)
  // SHAPES_COUNT_RANGE: [min, max] inclusive
  SHAPES_COUNT_RANGE: [1, 3],
  // SHAPE_TYPES_ENABLED: ['rectBar' | 'circle' | 'triangle' | 'square']
  SHAPE_TYPES_ENABLED: ['rectBar', 'circle', 'triangle', 'square'],
  // SHAPE_TYPE_WEIGHTS: relative weights per shape type
  // SHAPE_TYPE_WEIGHTS: relative weights per shape type
  SHAPE_TYPE_WEIGHTS: { rectBar: 2, circle: 2, triangle: 1.5, square: 1.5 },
  // SHAPE_SCALE_RANGE: [0.2, 0.55],
  // SHAPE_SCALE_RANGE: 0.2–0.95 (relative to canvas min dimension)
  SHAPE_SCALE_RANGE: [0.4, 0.95],
  // SHAPE_OPACITY_RANGE: [0.78, 1.0],
  // SHAPE_OPACITY_RANGE: 0.4–1.0
  SHAPE_OPACITY_RANGE: [0.38, 0.8],
  // SHAPE_STROKE_MODE: 'none' | 'softBlack' | 'mixed'
  SHAPE_STROKE_MODE: 'mixed',
  // SHAPE_STROKE_WEIGHT_RANGE: 1–4 px
  // SHAPE_STROKE_WEIGHT_RANGE: [min, max] px (unused when no strokes)
  SHAPE_STROKE_WEIGHT_RANGE: [1, 3],
  // SHAPE_FILL_MODE: 'accentOnly' | 'accentOrBlack'
  SHAPE_FILL_MODE: 'accentOnly',
  // SHAPE_ALLOW_OFFCANVAS: true | false
  // SHAPE_ALLOW_OFFCANVAS: allow bleed outside margins
  SHAPE_ALLOW_OFFCANVAS: true,
  // SHAPE_BLEED_AMOUNT: 40,
  // SHAPE_BLEED_AMOUNT: 0–120 px
  SHAPE_BLEED_AMOUNT: 80,
  // SHAPE_ANGLE_SOURCE: 'dominant' | 'dominantPlusOrthogonal' | 'angleSetRandom'
  // SHAPE_ANGLE_SOURCE: selects angle set for shapes
  SHAPE_ANGLE_SOURCE: 'dominantPlusOrthogonal',
  // MIN_SHAPE_DISTANCE: 60–140 px
  MIN_SHAPE_DISTANCE: 90,
  // SHAPE_OVERLAP_CHANCE: 0–0.5
  // SHAPE_OVERLAP_CHANCE: 0 = never overlap, 1 = always allow overlap
  SHAPE_OVERLAP_CHANCE: 0.25,

  // LAYER_REPEAT_MODES: ['row' | 'column' | 'diagonal' | 'band']
  LAYER_REPEAT_MODES: ['row', 'column', 'diagonal', 'band'],
  // REPEAT_SHAPE_TYPES: ['circle' | 'triangle' | 'square' | 'bar']
  // REPEAT_SHAPE_TYPES: allowed primitives for repeat layer
  REPEAT_SHAPE_TYPES: ['circle', 'triangle', 'square', 'bar'],
  // REPEAT_PATTERN_STYLE: 'single' | 'trio'
  // REPEAT_PATTERN_STYLE: currently 'single' only (trio reserved)
  REPEAT_PATTERN_STYLE: 'single',
  // REPEAT_COUNT_RANGE: [min, max] (5–14 typical)
  REPEAT_COUNT_RANGE: [6, 24],
  // REPEAT_SPACING_RANGE: 22–72 px
  REPEAT_SPACING_RANGE: [32, 72],
  // REPEAT_SIZE_RANGE: 14–80 px
  REPEAT_SIZE_RANGE: [24, 80],
  // REPEAT_OPACITY_RANGE: 0.6–1.0
  REPEAT_OPACITY_RANGE: [0.65, 0.95],
  // REPEAT_STROKE_MODE: 'none' | 'softBlack'
  REPEAT_STROKE_MODE: 'none',
  // REPEAT_COLOR_MODE: 'singleAccent' | 'alternatingAccentBlack' | 'sequenceAccents'
  // REPEAT_COLOR_MODE: how repeat colors are assigned
  // REPEAT_COLOR_MODE: 'singleAccent',
  REPEAT_COLOR_MODE: 'sequenceAccents',
  // REPEAT_ANGLE_SOURCE: 'dominant' | 'orthogonalOnly' | 'angleSetRandom'
  // REPEAT_ANGLE_SOURCE: angle selection for repeat layer
  REPEAT_ANGLE_SOURCE: 'dominant',
  // REPEAT_POSITION_BIAS: 'edge' | 'center' | 'random'
  // REPEAT_POSITION_BIAS: preferred placement zone
  REPEAT_POSITION_BIAS: 'edge',
  // ONE_REPEAT_GROUP_ONLY: true | false
  // ONE_REPEAT_GROUP_ONLY: true,
  ONE_REPEAT_GROUP_ONLY: true,

  // TEXT_MODE_WEIGHTS keys: axiom | anti | process | temporal
  // TEXT_MODE_WEIGHTS: higher = more frequent mode selection
  TEXT_MODE_WEIGHTS: {
    axiom: 4,
    process: 3,
    anti: 2,
    temporal: 1,
  },
  // TEXT_MODES: axiom | anti | process | temporal
  // TEXT_MODES: content per mode (headline/subhead/body)
  TEXT_MODES: {
    axiom: {
      headlines: [
        'FORM FOLLOWS RULE',
        'STRUCTURE BEFORE STYLE',
        'SYSTEMS PRODUCE FORM',
        'FUNCTION IS THE DECISION',
        'ORDER IS CONSTRUCTED',
        'COLOR COMMANDS SPACE',
      ],
      subheads: [
        'A STUDY IN GEOMETRIC COMPOSITION',
        'TYPOGRAPHY UNDER CONSTRAINT',
        'SPATIAL LOGIC IN COLOR',
        'FORM GENERATED BY RULES',
      ],
      bodies: ['GRID / ANGLE / COLOR / TYPE', 'SESSION 21'],
    },
    anti: {
      headlines: [
        'THIS IS NOT DECORATION',
        'NO STYLE WITHOUT SYSTEM',
        'DESIGN IS NOT EXPRESSIVE',
        'FORM IS A CONSEQUENCE',
      ],
      subheads: [
        'A GENERATED POSTER',
        'A STUDY IN CONSTRAINT',
        'NON-ILLUSTRATIVE COMPOSITION',
      ],
      bodies: ['COLOR AS COMMAND', 'TYPE AS STRUCTURE'],
    },
    process: {
      headlines: [
        'GENERATED COMPOSITION',
        'CONSTRUCTED BY RULE',
        'SYSTEM OUTPUT',
        'ITERATION NO. 21',
      ],
      subheads: ['VARIABLE ANGLES', 'LIMITED COLOR SET', 'FIXED TYPE SYSTEM'],
      bodies: ['SEED ####', 'SVG / PAPER / INK'],
    },
    temporal: {
      headlines: ['MODERNISM REPEATED', 'CONTINUOUS SCHOOL', 'FUTURE STUDIES'],
      subheads: ['1923 / 2026', 'THEN AND NOW', 'STILL FUNCTIONAL'],
      bodies: ['BAUHAUS PRINCIPLES', 'CURRENTLY APPLIED'],
    },
  },
  // HEADLINE_SIZE_RANGE: [44, 64],
  // HEADLINE_SIZE_RANGE: 44–80
  // HEADLINE_SIZE_RANGE: [min, max] px
  HEADLINE_SIZE_RANGE: [64, 80],
  // SUBHEAD_SIZE_RANGE: 16–30
  // SUBHEAD_SIZE_RANGE: [min, max] px
  SUBHEAD_SIZE_RANGE: [16, 32],
  // BODY_SIZE_RANGE: 10–18
  // BODY_SIZE_RANGE: [min, max] px
  BODY_SIZE_RANGE: [10, 16],
  // TRACKING_RANGE: -4 to 2 (unused)
  TRACKING_RANGE: [-2, 0],
  // LEADING_MULT: 0.9–1.2 (unused)
  LEADING_MULT: 1.05,
  TYPE_CASE: 'upper',
  // TYPE_COLOR_MODE: 'mostlyBlack' (kept for future extension)
  TYPE_COLOR_MODE: 'mostlyBlack',
  // TYPE_BLOCKS_COUNT: 2 | 3
  TYPE_BLOCKS_COUNT: 3,
  // TYPE_ROTATION_PROB: probability headline rotates
  TYPE_ROTATION_PROB: 0.7,
  // TYPE_ANGLE_SOURCE: angle source for type
  TYPE_ANGLE_SOURCE: 'dominantPlusOrthogonal',
  // TYPE_MIN_MARGIN_CLEARANCE: 6–16 px
  TYPE_MIN_MARGIN_CLEARANCE: 10,
  // TYPE_OVERLAP_ALLOWED: true | false (currently unused)
  TYPE_OVERLAP_ALLOWED: true,
  // TYPE_CAN_ALIGN_TO_BAR: true | false (currently unused)
  TYPE_CAN_ALIGN_TO_BAR: true,
  // TYPE_BLOCK_PADDING: 6–20 px
  // TYPE_BLOCK_PADDING: breathing room between text blocks
  TYPE_BLOCK_PADDING: 8,

  // DEBUG_LABEL_SIZE: 8–12
  DEBUG_LABEL_SIZE: 9,
  // PNG_SCALE: 1 (540x675) | 2 (1080x1350)
  PNG_SCALE: 2,
};

const PALETTE_BASE = {
  warmWhite: '#f2eee2',
  softBlack: '#2a2a2a',
  red: '#c95b4a',
  blue: '#5b77a6',
  yellow: '#d9b15a',
};

let font;
let fontLoadError = null;
let seed = 1;
let shapeSeed = 1;
let palette = null;
let accents = [];
let director = null;
let shapes = [];
let repeatGroup = null;
let typeBlocks = [];
let layerEnabled = {
  shapes: CONFIG.LAYER_SHAPES_ENABLED,
  repeat: CONFIG.LAYER_REPEAT_ENABLED,
  type: CONFIG.LAYER_TYPE_ENABLED,
};

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

function setup() {
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(CONFIG.CANVAS_W, CONFIG.CANVAS_H, renderer);
  canvas.parent('sketch-holder');
  pixelDensity(1);
  noLoop();
  reseed(!CONFIG.USE_SEED);
}

function draw() {
  randomSeed(seed);
  renderScene(this, 1);
}

function renderScene(g, scale = 1) {
  g.push();
  if (scale !== 1) {
    g.scale(scale);
  }
  g.background(palette.warmWhite);
  if (CONFIG.BACKGROUND_MODE === 'paperNoiseOptional' && CONFIG.BACKGROUND_NOISE > 0) {
    drawPaperNoise(g, CONFIG.BACKGROUND_NOISE);
  }

  if (layerEnabled.shapes && shapes.length) {
    drawShapesLayer(g);
  }

  if (layerEnabled.repeat && repeatGroup) {
    drawRepeatLayer(g);
  }

  if (layerEnabled.type && typeBlocks.length) {
    drawTypeLayer(g);
  }

  if (CONFIG.SHOW_MARGIN_GUIDES) {
    drawMarginGuides(g);
  }

  if (CONFIG.SHOW_CONSTRUCTION_LINES) {
    drawConstructionLines(g);
  }

  if (CONFIG.SHOW_DEBUG) {
    drawDebugOverlay(g);
  }
  g.pop();
}

function reseed(forceRandom) {
  if (CONFIG.USE_SEED && !forceRandom) {
    seed = CONFIG.SEED;
  } else {
    seed = floor(random(1_000_000_000));
    CONFIG.SEED = seed;
  }
  randomSeed(seed);
  shapeSeed = seed;
  director = pickDirector();
  palette = buildPalette();
  accents = pickAccents();
  shapes = layerEnabled.shapes ? buildShapes() : [];
  repeatGroup = layerEnabled.repeat ? buildRepeatGroup() : null;
  typeBlocks = layerEnabled.type ? buildTypeBlocks() : [];
  redraw();
}

function pickDirector() {
  const dominantOptions = [0, 15, 30, 45, 60, 90];
  const dominant = random(dominantOptions);
  const densityModes = ['sparse', 'balanced', 'graphic'];
  const density = random(densityModes);
  return {
    dominantAngle: dominant,
    density,
  };
}

function buildPalette() {
  const adjusted = {};
  colorMode(HSB, 360, 100, 100, 1);
  for (const key of Object.keys(PALETTE_BASE)) {
    const base = color(PALETTE_BASE[key]);
    let h = (hue(base) + CONFIG.PALETTE_WARM_SHIFT + 360) % 360;
    let s = saturation(base) * CONFIG.PALETTE_SAT_MULT;
    let b = brightness(base) * CONFIG.PALETTE_BRIGHT_MULT;
    s = constrain(s, 0, 100);
    b = constrain(b, 0, 100);
    adjusted[key] = color(h, s, b).toString('#rrggbb');
  }
  colorMode(RGB, 255);
  return adjusted;
}

function pickAccents() {
  const weighted = [];
  for (const key of Object.keys(CONFIG.ACCENT_COLOR_WEIGHTS)) {
    for (let i = 0; i < CONFIG.ACCENT_COLOR_WEIGHTS[key]; i += 1) {
      weighted.push(key);
    }
  }
  const maxCount = floor(random(1, CONFIG.MAX_ACCENT_COLORS + 1));
  const picks = shuffle(weighted.slice(), true).filter((value, index, arr) => arr.indexOf(value) === index);
  return picks.slice(0, maxCount);
}

function angleSet() {
  if (CONFIG.ANGLE_MODE === 'dominant') {
    const a = director ? director.dominantAngle : 30;
    return [a, -a, a + 90, -a + 90, 0, 90];
  }
  const set = [];
  for (let angle = -90; angle <= 90; angle += CONFIG.ANGLE_QUANTIZE_DEG) {
    set.push(angle);
  }
  return set;
}

function pickAngle(source) {
  const set = angleSet();
  if (source === 'dominantPlusOrthogonal') {
    const a = director ? director.dominantAngle : 30;
    return random([a, -a, 0, 90, a + 90, -a + 90]);
  }
  if (source === 'orthogonalOnly') {
    return random([0, 90]);
  }
  if (source === 'angleSetRandom') {
    return random(set);
  }
  return random([director ? director.dominantAngle : 30, 0, 90]);
}

function normalizeAngle(angle) {
  let normalized = angle;
  while (normalized > 90) {
    normalized -= 180;
  }
  while (normalized < -90) {
    normalized += 180;
  }
  return normalized;
}

function innerBounds() {
  return {
    x: CONFIG.MARGIN_LEFT,
    y: CONFIG.MARGIN_TOP,
    w: CONFIG.CANVAS_W - CONFIG.MARGIN_LEFT - CONFIG.MARGIN_RIGHT,
    h: CONFIG.CANVAS_H - CONFIG.MARGIN_TOP - CONFIG.MARGIN_BOTTOM,
  };
}

function buildShapes() {
  randomSeed(shapeSeed);
  const bounds = innerBounds();
  const count = floor(random(CONFIG.SHAPES_COUNT_RANGE[0], CONFIG.SHAPES_COUNT_RANGE[1] + 1));
  const list = [];
  const zones = pickZones();

  for (let i = 0; i < count; i += 1) {
    let placed = false;
    for (let attempt = 0; attempt < 40 && !placed; attempt += 1) {
      const type = pickWeighted(CONFIG.SHAPE_TYPE_WEIGHTS, CONFIG.SHAPE_TYPES_ENABLED);
      const zone = random(zones);
      const center = zonePoint(zone, bounds);
      const scale = random(CONFIG.SHAPE_SCALE_RANGE[0], CONFIG.SHAPE_SCALE_RANGE[1]);
      const size = min(bounds.w, bounds.h) * scale;
      const angle = pickAngle(CONFIG.SHAPE_ANGLE_SOURCE);
      const overlapAllowed = random() < CONFIG.SHAPE_OVERLAP_CHANCE;

      const shape = {
        type,
        x: center.x,
        y: center.y,
        size,
        angle,
        fill: pickShapeFill(),
        stroke: pickShapeStroke(),
        opacity: random(CONFIG.SHAPE_OPACITY_RANGE[0], CONFIG.SHAPE_OPACITY_RANGE[1]),
      };
      if (type === 'rectBar') {
        shape.barH = size * 0.22 + random(0, size * 0.1);
      }

      if (overlapAllowed || !tooClose(shape, list, CONFIG.MIN_SHAPE_DISTANCE)) {
        list.push(shape);
        placed = true;
      }
    }
  }

  return list;
}

function pickZones() {
  return ['top', 'mid', 'bottom'];
}

function zonePoint(zone, bounds) {
  const bleed = CONFIG.SHAPE_ALLOW_OFFCANVAS ? CONFIG.SHAPE_BLEED_AMOUNT : 0;
  let yMin = bounds.y;
  let yMax = bounds.y + bounds.h;
  if (zone === 'top') {
    yMax = bounds.y + bounds.h * 0.35;
  } else if (zone === 'bottom') {
    yMin = bounds.y + bounds.h * 0.6;
  } else {
    yMin = bounds.y + bounds.h * 0.3;
    yMax = bounds.y + bounds.h * 0.7;
  }
  return {
    x: random(bounds.x - bleed, bounds.x + bounds.w + bleed),
    y: random(yMin - bleed, yMax + bleed),
  };
}

function pickShapeFill() {
  if (CONFIG.SHAPE_FILL_MODE === 'accentOnly') {
    return palette[random(accents) || 'red'];
  }
  const useAccent = random() < 0.7 && accents.length > 0;
  return useAccent ? palette[random(accents)] : palette.softBlack;
}

function shuffleShapeColors() {
  if (!shapes.length) {
    return;
  }
  randomSeed(Math.floor(Math.random() * 1_000_000_000));
  for (const shape of shapes) {
    if (CONFIG.SHAPE_FILL_MODE === 'accentOnly') {
      shape.fill = palette[random(accents) || 'red'];
    } else {
      const useAccent = random() < 0.7 && accents.length > 0;
      shape.fill = useAccent ? palette[random(accents)] : palette.softBlack;
    }
  }
}

function pickShapeStroke() {
  if (CONFIG.SHAPE_STROKE_MODE === 'none') {
    return null;
  }
  if (CONFIG.SHAPE_STROKE_MODE === 'softBlack') {
    return palette.softBlack;
  }
  return random() < 0.5 ? palette.softBlack : null;
}

function tooClose(candidate, list, minDistance) {
  for (const shape of list) {
    const d = dist(candidate.x, candidate.y, shape.x, shape.y);
    if (d < minDistance) {
      return true;
    }
  }
  return false;
}

function drawShapesLayer(g) {
  for (const shape of shapes) {
    g.push();
    g.translate(shape.x, shape.y);
    g.rotate(radians(shape.angle));
    g.noStroke();
    if (shape.fill) {
      g.fill(withAlpha(shape.fill, shape.opacity));
    } else {
      g.noFill();
    }
    drawShapePrimitive(g, shape);
    g.pop();
  }
}

function drawShapePrimitive(g, shape) {
  const size = shape.size;
  if (shape.type === 'circle') {
    g.ellipse(0, 0, size, size);
  } else if (shape.type === 'square') {
    g.rectMode(CENTER);
    g.rect(0, 0, size, size);
    g.rectMode(CORNER);
  } else if (shape.type === 'triangle') {
    const h = size * 0.58;
    g.triangle(0, -h, size * 0.5, h, -size * 0.5, h);
  } else {
    const w = size * 1.4;
    const h = shape.barH || size * 0.25;
    g.rectMode(CENTER);
    g.rect(0, 0, w, h);
    g.rectMode(CORNER);
  }
}

function buildRepeatGroup() {
  const mode = random(CONFIG.LAYER_REPEAT_MODES);
  const shapeType = random(CONFIG.REPEAT_SHAPE_TYPES);
  const count = floor(random(CONFIG.REPEAT_COUNT_RANGE[0], CONFIG.REPEAT_COUNT_RANGE[1] + 1));
  const spacing = random(CONFIG.REPEAT_SPACING_RANGE[0], CONFIG.REPEAT_SPACING_RANGE[1]);
  const size = random(CONFIG.REPEAT_SIZE_RANGE[0], CONFIG.REPEAT_SIZE_RANGE[1]);
  const angle = pickAngle(CONFIG.REPEAT_ANGLE_SOURCE);
  const opacity = random(CONFIG.REPEAT_OPACITY_RANGE[0], CONFIG.REPEAT_OPACITY_RANGE[1]);
  const colorMode = CONFIG.REPEAT_COLOR_MODE;
  const positionBias = CONFIG.REPEAT_POSITION_BIAS;
  const bounds = innerBounds();

  return {
    mode,
    shapeType,
    count,
    spacing,
    size,
    angle,
    opacity,
    colorMode,
    positionBias,
    bounds,
  };
}

function drawRepeatLayer(g) {
  const group = repeatGroup;
  g.push();
  g.translate(group.bounds.x, group.bounds.y);
  g.rotate(radians(group.angle));
  g.noStroke();

  for (let i = 0; i < group.count; i += 1) {
    const pos = repeatPosition(group, i);
    const color = pickRepeatColor(i, group);
    g.fill(withAlpha(color, group.opacity));
    drawRepeatPrimitive(g, group.shapeType, pos.x, pos.y, group.size);
  }
  g.pop();
}

function repeatPosition(group, index) {
  const b = group.bounds;
  const bias = group.positionBias;
  if (group.mode === 'column') {
    const x = bias === 'edge' ? b.w * 0.15 : bias === 'center' ? b.w * 0.5 : random(0, b.w);
    return { x, y: b.h * 0.15 + index * group.spacing };
  }
  if (group.mode === 'diagonal') {
    return { x: b.w * 0.15 + index * group.spacing, y: b.h * 0.1 + index * group.spacing * 0.6 };
  }
  if (group.mode === 'band') {
    const y = b.h * 0.55;
    return { x: b.w * 0.1 + index * group.spacing, y };
  }
  const y = bias === 'edge' ? b.h * 0.2 : bias === 'center' ? b.h * 0.5 : random(0, b.h);
  return { x: b.w * 0.12 + index * group.spacing, y };
}

function drawRepeatPrimitive(g, shapeType, x, y, size) {
  g.push();
  g.translate(x, y);
  if (shapeType === 'triangle') {
    const h = size * 0.6;
    g.triangle(0, -h, size * 0.5, h, -size * 0.5, h);
  } else if (shapeType === 'square') {
    g.rectMode(CENTER);
    g.rect(0, 0, size, size);
    g.rectMode(CORNER);
  } else if (shapeType === 'bar') {
    g.rectMode(CENTER);
    g.rect(0, 0, size * 1.4, size * 0.3);
    g.rectMode(CORNER);
  } else {
    g.ellipse(0, 0, size, size);
  }
  g.pop();
}

function pickRepeatColor(index, group) {
  if (group.colorMode === 'alternatingAccentBlack') {
    return index % 2 === 0 ? palette.softBlack : palette[random(accents) || 'red'];
  }
  if (group.colorMode === 'sequenceAccents') {
    const paletteKeys = accents.length ? accents : ['red', 'blue', 'yellow'];
    return palette[paletteKeys[index % paletteKeys.length]];
  }
  return palette[random(accents) || 'red'];
}

function buildTypeBlocks() {
  const blocks = [];
  const bounds = innerBounds();
  const anchors = [
    { x: bounds.x + bounds.w * 0.15, y: bounds.y + bounds.h * 0.18, align: LEFT },
    { x: bounds.x + bounds.w * 0.85, y: bounds.y + bounds.h * 0.18, align: RIGHT },
    { x: bounds.x + bounds.w * 0.18, y: bounds.y + bounds.h * 0.55, align: LEFT },
    { x: bounds.x + bounds.w * 0.82, y: bounds.y + bounds.h * 0.55, align: RIGHT },
    { x: bounds.x + bounds.w * 0.2, y: bounds.y + bounds.h * 0.84, align: LEFT },
    { x: bounds.x + bounds.w * 0.8, y: bounds.y + bounds.h * 0.84, align: RIGHT },
  ];

  const textMode = pickTextMode();
  const modeContent = CONFIG.TEXT_MODES[textMode];
  const headline = random(modeContent.headlines);
  const subhead = random(modeContent.subheads);
  const bodyLine = random(modeContent.bodies);
  const body = [formatBodyLine(bodyLine)];

  const count = CONFIG.TYPE_BLOCKS_COUNT;
  const availableAnchors = shuffle(anchors.slice(), true);
  const breachRole = pickBreachRole(count);

  let lastAngled = null;
  const headlineBlock = placeTypeBlock(
    headline,
    'headline',
    availableAnchors,
    bounds,
    blocks,
    lastAngled,
    breachRole === 'headline',
  );
  if (headlineBlock) {
    blocks.push(headlineBlock);
    removeAnchor(availableAnchors, headlineBlock.anchorId);
    if (headlineBlock.angle !== 0) {
      lastAngled = headlineBlock.angle;
    }
  }
  if (count > 1) {
    const subheadBlock = placeTypeBlock(
      subhead,
      'subhead',
      availableAnchors,
      bounds,
      blocks,
      lastAngled,
      breachRole === 'subhead',
    );
    if (subheadBlock) {
      blocks.push(subheadBlock);
      removeAnchor(availableAnchors, subheadBlock.anchorId);
      if (subheadBlock.angle !== 0) {
        lastAngled = subheadBlock.angle;
      }
    }
  }
  if (count > 2) {
    const bodyBlock = placeTypeBlock(
      body.join(' '),
      'body',
      availableAnchors,
      bounds,
      blocks,
      lastAngled,
      breachRole === 'body',
    );
    if (bodyBlock) {
      blocks.push(bodyBlock);
      removeAnchor(availableAnchors, bodyBlock.anchorId);
      if (bodyBlock.angle !== 0) {
        lastAngled = bodyBlock.angle;
      }
    }
  }

  alignUnrotatedBlocks(blocks, bounds);
  return blocks;
}

function alignUnrotatedBlocks(blocks, bounds) {
  const leftEdge = bounds.x + CONFIG.TYPE_MIN_MARGIN_CLEARANCE;
  const rightEdge = bounds.x + bounds.w - CONFIG.TYPE_MIN_MARGIN_CLEARANCE;
  const centerX = CONFIG.CANVAS_W * 0.5;

  const leftBlocks = [];
  const rightBlocks = [];
  for (const block of blocks) {
    if (block.angle !== 0) {
      continue;
    }
    if (block.x <= centerX) {
      leftBlocks.push(block);
    } else {
      rightBlocks.push(block);
    }
  }

  for (const block of leftBlocks) {
    block.align = LEFT;
    block.x = leftEdge;
    clampTypeBlock(block, bounds, block.allowBreach);
  }

  for (const block of rightBlocks) {
    block.align = RIGHT;
    block.x = rightEdge;
    clampTypeBlock(block, bounds, block.allowBreach);
  }
}

function placeTypeBlock(text, role, anchors, bounds, existing, lastAngled, allowBreach) {
  const candidates = shuffle(anchors.slice(), true);
  for (const anchor of candidates) {
    const base = makeTypeBlock(text, role, anchor, bounds, lastAngled, allowBreach);
    const angleCandidates = base.angle === 0 ? [0] : [base.angle, 0];
    for (const angle of angleCandidates) {
      let block = { ...base, angle };
      block = clampTypeBlock(block, bounds, allowBreach);
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (!blockOverlaps(block, existing)) {
          return block;
        }
        block.size = max(6, block.size * 0.9);
        block = clampTypeBlock(block, bounds, allowBreach);
      }
    }
  }
  return null;
}

function makeTypeBlock(text, role, anchor, bounds, lastAngled, allowBreach) {
  const sizeRange = role === 'headline' ? CONFIG.HEADLINE_SIZE_RANGE
    : role === 'subhead' ? CONFIG.SUBHEAD_SIZE_RANGE
      : CONFIG.BODY_SIZE_RANGE;
  const size = random(sizeRange[0], sizeRange[1]);
  const rotate = random() < rotationProbability(role);
  const angle = rotate ? normalizeAngle(nextTypeAngle(lastAngled)) : 0;
  const block = {
    text,
    role,
    x: anchor.x,
    y: anchor.y,
    align: anchor.align,
    size,
    angle,
    anchorId: anchor,
    allowBreach,
    color: palette.softBlack,
  };
  return clampTypeBlock(block, bounds, allowBreach);
}

function pickTextMode() {
  const weights = CONFIG.TEXT_MODE_WEIGHTS;
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  let pick = random(total);
  for (const key of Object.keys(weights)) {
    pick -= weights[key];
    if (pick <= 0) {
      return key;
    }
  }
  return 'axiom';
}

function formatBodyLine(line) {
  if (line.includes('####')) {
    return line.replace('####', seed.toString().padStart(4, '0'));
  }
  return line;
}

function pickBreachRole(count) {
  if (count <= 1) {
    return random() < 0.5 ? 'headline' : null;
  }
  const roles = ['headline', 'subhead', 'body'].slice(0, count);
  return random(roles);
}

function rotationProbability(role) {
  if (role === 'headline') {
    return CONFIG.TYPE_ROTATION_PROB;
  }
  if (role === 'subhead') {
    return CONFIG.TYPE_ROTATION_PROB * 0.45;
  }
  return 0.2;
}

function nextTypeAngle(lastAngled) {
  if (lastAngled === null || lastAngled === undefined) {
    return pickAngle(CONFIG.TYPE_ANGLE_SOURCE);
  }
  return lastAngled + 90;
}

function removeAnchor(list, anchorRef) {
  const index = list.indexOf(anchorRef);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

function blockOverlaps(block, existing) {
  const boundsA = blockBounds(block, CONFIG.TYPE_BLOCK_PADDING);
  for (const other of existing) {
    const boundsB = blockBounds(other, CONFIG.TYPE_BLOCK_PADDING);
    if (rectsOverlap(boundsA, boundsB)) {
      return true;
    }
  }
  return false;
}

function blockOverlapsScene(block) {
  const boundsA = blockBounds(block, CONFIG.TYPE_BLOCK_PADDING);
  if (layerEnabled.shapes) {
    for (const shape of shapes) {
      const shapeBoundsRect = shapeBounds(shape);
      if (rectsOverlap(boundsA, shapeBoundsRect)) {
        return true;
      }
    }
  }
  if (layerEnabled.repeat && repeatGroup) {
    const repeatRects = repeatBounds();
    for (const rect of repeatRects) {
      if (rectsOverlap(boundsA, rect)) {
        return true;
      }
    }
  }
  return false;
}

function shapeBounds(shape) {
  const angle = radians(shape.angle || 0);
  if (shape.type === 'circle') {
    return {
      x: shape.x - shape.size * 0.5,
      y: shape.y - shape.size * 0.5,
      w: shape.size,
      h: shape.size,
    };
  }
  const size = shape.size;
  let corners = [];
  if (shape.type === 'square') {
    const half = size * 0.5;
    corners = rotateCorners(-half, half, -half, half, angle);
  } else if (shape.type === 'triangle') {
    const h = size * 0.58;
    corners = [
      { x: 0, y: -h },
      { x: size * 0.5, y: h },
      { x: -size * 0.5, y: h },
    ].map((p) => ({
      x: p.x * cos(angle) - p.y * sin(angle),
      y: p.x * sin(angle) + p.y * cos(angle),
    }));
  } else {
    const w = size * 1.4;
    const h = shape.barH || size * 0.25;
    corners = rotateCorners(-w * 0.5, w * 0.5, -h * 0.5, h * 0.5, angle);
  }

  const minX = min(...corners.map((p) => p.x));
  const maxX = max(...corners.map((p) => p.x));
  const minY = min(...corners.map((p) => p.y));
  const maxY = max(...corners.map((p) => p.y));
  return {
    x: shape.x + minX,
    y: shape.y + minY,
    w: maxX - minX,
    h: maxY - minY,
  };
}

function repeatBounds() {
  const group = repeatGroup;
  if (!group) {
    return [];
  }
  const rects = [];
  const angle = radians(group.angle);
  const cosA = cos(angle);
  const sinA = sin(angle);
  for (let i = 0; i < group.count; i += 1) {
    const pos = repeatPosition(group, i);
    const size = group.size;
    let w = size;
    let h = size;
    if (group.shapeType === 'bar') {
      w = size * 1.4;
      h = size * 0.3;
    }
    const localCorners = rotateCorners(-w * 0.5, w * 0.5, -h * 0.5, h * 0.5, 0);
    const worldCorners = localCorners.map((p) => {
      const rx = pos.x + p.x;
      const ry = pos.y + p.y;
      return {
        x: group.bounds.x + rx * cosA - ry * sinA,
        y: group.bounds.y + rx * sinA + ry * cosA,
      };
    });
    const minX = min(...worldCorners.map((p) => p.x));
    const maxX = max(...worldCorners.map((p) => p.x));
    const minY = min(...worldCorners.map((p) => p.y));
    const maxY = max(...worldCorners.map((p) => p.y));
    const rect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    rects.push(rect);
  }
  return rects;
}

function blockBounds(block, padding = 0) {
  const metrics = measureTypeBlock(block.text, block.size, block.angle, block.align);
  return {
    x: block.x + metrics.minX - padding,
    y: block.y + metrics.minY - padding,
    w: metrics.maxX - metrics.minX + padding * 2,
    h: metrics.maxY - metrics.minY + padding * 2,
  };
}

function rectsOverlap(a, b) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

function clampTypeBlock(block, bounds, allowBreach = false) {
  const clearance = allowBreach ? -CONFIG.TYPE_MIN_MARGIN_CLEARANCE : CONFIG.TYPE_MIN_MARGIN_CLEARANCE;
  const maxW = bounds.w - clearance * 2;
  const maxH = bounds.h - clearance * 2;
  const fitted = fitTypeBlock(block, maxW, maxH);
  const minX = bounds.x + clearance;
  const maxX = bounds.x + bounds.w - clearance;
  const minY = bounds.y + clearance;
  const maxY = bounds.y + bounds.h - clearance;

  const clampedX = constrain(block.x, minX - fitted.minX, maxX - fitted.maxX);
  const clampedY = constrain(block.y, minY - fitted.minY, maxY - fitted.maxY);

  block.x = clampedX;
  block.y = clampedY;
  return block;
}

function fitTypeBlock(block, maxW, maxH) {
  let size = block.size;
  let metrics = measureTypeBlock(block.text, size, block.angle, block.align);
  let guard = 0;

  while ((metrics.bboxW > maxW || metrics.bboxH > maxH) && guard < 10) {
    const scale = min(maxW / metrics.bboxW, maxH / metrics.bboxH, 1);
    size = max(6, size * scale);
    metrics = measureTypeBlock(block.text, size, block.angle, block.align);
    guard += 1;
  }

  block.size = size;
  return metrics;
}

function measureTypeBlock(text, size, angleDeg, align) {
  textFont(font || 'sans-serif');
  textSize(size);
  const w = textWidth(text);
  const h = textAscent() + textDescent();
  const x0 = align === RIGHT ? -w : align === CENTER ? -w * 0.5 : 0;
  const x1 = align === RIGHT ? 0 : align === CENTER ? w * 0.5 : w;
  const y0 = -h * 0.5;
  const y1 = h * 0.5;
  const angle = radians(angleDeg);
  const corners = rotateCorners(x0, x1, y0, y1, angle);
  const minX = min(...corners.map((p) => p.x));
  const maxX = max(...corners.map((p) => p.x));
  const minY = min(...corners.map((p) => p.y));
  const maxY = max(...corners.map((p) => p.y));
  return {
    w,
    h,
    bboxW: maxX - minX,
    bboxH: maxY - minY,
    minX,
    maxX,
    minY,
    maxY,
  };
}

function rotateCorners(x0, x1, y0, y1, angle) {
  const cosA = cos(angle);
  const sinA = sin(angle);
  const points = [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
  return points.map((p) => ({
    x: p.x * cosA - p.y * sinA,
    y: p.x * sinA + p.y * cosA,
  }));
}

function drawTypeLayer(g) {
  g.textFont(font || 'sans-serif');
  g.textStyle(BOLD);

  for (const block of typeBlocks) {
    g.push();
    g.translate(block.x, block.y);
    g.rotate(radians(block.angle));
    g.textAlign(block.align, CENTER);
    g.fill(block.color);
    g.noStroke();
    g.textSize(block.size);
    g.text(block.text, 0, 0);
    g.pop();
  }
}

function drawMarginGuides(g) {
  const bounds = innerBounds();
  g.push();
  g.noFill();
  g.stroke(palette.softBlack);
  g.strokeWeight(1);
  g.rect(bounds.x, bounds.y, bounds.w, bounds.h);
  g.pop();
}

function drawConstructionLines(g) {
  const bounds = innerBounds();
  g.push();
  g.stroke(withAlpha(palette.softBlack, 0.3));
  g.strokeWeight(1);
  g.line(bounds.x, bounds.y + bounds.h / 3, bounds.x + bounds.w, bounds.y + bounds.h / 3);
  g.line(bounds.x, bounds.y + (bounds.h * 2) / 3, bounds.x + bounds.w, bounds.y + (bounds.h * 2) / 3);
  g.line(bounds.x + bounds.w / 3, bounds.y, bounds.x + bounds.w / 3, bounds.y + bounds.h);
  g.line(bounds.x + (bounds.w * 2) / 3, bounds.y, bounds.x + (bounds.w * 2) / 3, bounds.y + bounds.h);
  g.pop();
}

function drawDebugOverlay(g) {
  const bounds = innerBounds();
  g.push();
  g.noStroke();
  g.fill(palette.softBlack);
  g.textFont(font || 'sans-serif');
  g.textSize(CONFIG.DEBUG_LABEL_SIZE);
  g.textAlign(LEFT, TOP);
  const lines = [
    `SEED ${seed}`,
    `ANGLE ${director.dominantAngle}`,
    `DENSITY ${director.density}`,
    `ACCENTS ${accents.join(',')}`,
  ];
  g.text(lines.join('\n'), bounds.x, bounds.y - CONFIG.DEBUG_LABEL_SIZE * 3);
  g.pop();
}

function drawPaperNoise(g, amount) {
  const density = floor(map(amount, 0, 1, 0, 2000));
  g.push();
  g.stroke(withAlpha(palette.softBlack, 0.06));
  for (let i = 0; i < density; i += 1) {
    const x = random(CONFIG.CANVAS_W);
    const y = random(CONFIG.CANVAS_H);
    g.point(x, y);
  }
  g.pop();
}

function pickWeighted(weights, allowed) {
  const entries = Object.keys(weights).filter((key) => !allowed || allowed.includes(key));
  const total = entries.reduce((sum, key) => sum + weights[key], 0);
  let pick = random(total);
  for (const key of entries) {
    pick -= weights[key];
    if (pick <= 0) {
      return key;
    }
  }
  return entries[entries.length - 1];
}

function withAlpha(hexColor, alpha) {
  const c = color(hexColor);
  return color(red(c), green(c), blue(c), alpha * 255);
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const pg = createGraphics(CONFIG.CANVAS_W * CONFIG.PNG_SCALE, CONFIG.CANVAS_H * CONFIG.PNG_SCALE);
  pg.pixelDensity(1);
  randomSeed(seed);
  renderScene(pg, CONFIG.PNG_SCALE);
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
    reseed(CONFIG.RENDER_ON_PRESS);
  } else if (key === 'd' || key === 'D') {
    CONFIG.SHOW_DEBUG = !CONFIG.SHOW_DEBUG;
    redraw();
  } else if (key === 'g' || key === 'G') {
    CONFIG.SHOW_MARGIN_GUIDES = !CONFIG.SHOW_MARGIN_GUIDES;
    redraw();
  } else if (key === 'c' || key === 'C') {
    CONFIG.SHOW_CONSTRUCTION_LINES = !CONFIG.SHOW_CONSTRUCTION_LINES;
    redraw();
  } else if (key === '1') {
    layerEnabled.shapes = !layerEnabled.shapes;
    shapes = layerEnabled.shapes ? buildShapes() : [];
    redraw();
  } else if (key === '2') {
    layerEnabled.repeat = !layerEnabled.repeat;
    repeatGroup = layerEnabled.repeat ? buildRepeatGroup() : null;
    redraw();
  } else if (key === '3') {
    layerEnabled.type = !layerEnabled.type;
    typeBlocks = layerEnabled.type ? buildTypeBlocks() : [];
    redraw();
  } else if (key === 'h' || key === 'H') {
    if (layerEnabled.shapes) {
      shapeSeed = floor(Math.random() * 1_000_000_000);
      shapes = buildShapes();
      redraw();
    }
  } else if (key === 'u' || key === 'U') {
    shuffleShapeColors();
    redraw();
  }
}
