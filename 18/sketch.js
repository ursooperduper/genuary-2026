const WIDTH = 540;
const HEIGHT = 675;
const PNG_SCALE = 2;

const MARGIN_L = 90;
const MARGIN_R = 90;
const MARGIN_T = 90;
const MARGIN_B = 90;

const STEP_LEN = 2;
// const STEP_LEN = 100;
const NUM_STEPS = 1000;
const STROKE_W = 8;
// const STROKE_W = 200;
const TURN_ANGLE = 90;
// const TURN_ANGLE = 45;
const TURN_DIR = 1;
// const TURN_DIR = 2;
const TURN_DIR_MODE = 'random';
const EARLY_TURN_PROB = 0.08;
// const EARLY_TURN_PROB = 0.8;
const EARLY_TURN_MIN = 16;
// const EARLY_TURN_MAX = 120;
const EARLY_TURN_MAX = 400;

const BG_COLOR = '#111111';
const ROUTE_COLOR = '#f5f5f2';

const START_MODE = 'random';
const START_HEADING_MODE = 'orthogonal';
const ALLOW_MULTIPLE_TURNS_PER_STEP = false;
const MAX_CONSECUTIVE_TURNS = 20;
// const MAX_CONSECUTIVE_TURNS = 2;
const END_ON_EXIT = false;
const EDGE_BUFFER = 8;

const START_POINTS = [
  { x: 0.33, y: 0.5 },
  { x: 0.5, y: 0.85 },
  { x: 0.82, y: 0.2 },
  { x: 0.2, y: 0.2 },
  { x: 0.7, y: 0.6 },
];

let seed = 1;
let paletteData = null;
let currentPalette = null;
let monochromeMode = false;

function preload() {
  paletteData = loadJSON('assets/colors.json');
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
  noiseSeed(seed);
  renderScene();
}

function renderScene(target = null, scale = 1) {
  const g = target || window;
  const palette = getActivePalette();
  const strokeColors = palette.length > 1 ? palette.slice(1) : [ROUTE_COLOR];
  const points = buildRoute();

  g.background(palette[0] || BG_COLOR);
  g.push();
  g.scale(scale);
  g.strokeWeight(STROKE_W);
  g.strokeJoin(BEVEL);
  g.strokeCap(SQUARE);
  g.noFill();

  for (let i = 1; i < points.length; i += 1) {
    g.stroke(random(strokeColors) || ROUTE_COLOR);
    g.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
  g.pop();
}

function buildRoute() {
  const points = [];
  const bounds = {
    xMin: MARGIN_L,
    xMax: WIDTH - MARGIN_R,
    yMin: MARGIN_T,
    yMax: HEIGHT - MARGIN_B,
  };
  const startPos = pickStart(bounds);
  let heading = pickHeading();
  let current = startPos.copy();
  points.push(current.copy());

  let consecutiveTurns = 0;
  for (let i = 0; i < NUM_STEPS; i += 1) {
    let next = stepFrom(current, heading, STEP_LEN);
    const crossing = segmentCrossesBounds(current, next, bounds);

    if (crossing) {
      const turnDir = pickTurnDir();
      const uturn = performUTurn(current, heading, turnDir, bounds);
      if (!uturn) {
        break;
      }
      consecutiveTurns += 1;
      if (consecutiveTurns >= MAX_CONSECUTIVE_TURNS) {
        break;
      }
      points.push(uturn.mid.copy());
      current = uturn.mid.copy();
      heading = uturn.heading;
      next = uturn.next.copy();
    } else {
      const earlyTurn = maybeEarlyTurn(current, heading, bounds);
      if (earlyTurn) {
        points.push(earlyTurn.mid.copy());
        current = earlyTurn.mid.copy();
        heading = earlyTurn.heading;
        next = earlyTurn.next.copy();
      }
      consecutiveTurns = 0;
    }

    if (END_ON_EXIT && !pointInCanvas(next, EDGE_BUFFER)) {
      break;
    }

    points.push(next.copy());
    current = next;
  }

  return points;
}

function pickStart(bounds) {
  if (START_MODE === 'curated') {
    const pick = random(START_POINTS);
    return createVector(
      lerp(bounds.xMin, bounds.xMax, pick.x),
      lerp(bounds.yMin, bounds.yMax, pick.y),
    );
  }
  return createVector(
    random(bounds.xMin, bounds.xMax),
    random(bounds.yMin, bounds.yMax),
  );
}

function pickHeading() {
  const options = {
    orthogonal: [0, 90, 180, 270],
    diagonal: [45, 135, 225, 315],
    eight: [0, 45, 90, 135, 180, 225, 270, 315],
  };
  const angles = options[START_HEADING_MODE] || options.orthogonal;
  return random(angles);
}

function stepFrom(origin, heading, distance) {
  const radiansHeading = radians(heading);
  return createVector(
    origin.x + cos(radiansHeading) * distance,
    origin.y + sin(radiansHeading) * distance,
  );
}

function performUTurn(origin, heading, turnDir, bounds) {
  const headingAfterTurn = heading + turnDir * TURN_ANGLE;
  const distanceToMargin = distanceToBounds(origin, headingAfterTurn, bounds);
  if (distanceToMargin <= 0) {
    return null;
  }
  const travel = chooseTurnTravel(distanceToMargin);
  const mid = stepFrom(origin, headingAfterTurn, travel);
  const headingAfterUTurn = headingAfterTurn + turnDir * TURN_ANGLE;
  const next = stepFrom(mid, headingAfterUTurn, STEP_LEN);
  return { mid, next, heading: headingAfterUTurn };
}

function maybeEarlyTurn(origin, heading, bounds) {
  if (random() >= EARLY_TURN_PROB) {
    return null;
  }
  const distanceToMargin = distanceToBounds(origin, heading, bounds);
  if (distanceToMargin <= STEP_LEN * 2) {
    return null;
  }
  const travelMax = min(EARLY_TURN_MAX, distanceToMargin - STEP_LEN);
  const travel = random(EARLY_TURN_MIN, max(EARLY_TURN_MIN, travelMax));
  const mid = stepFrom(origin, heading, travel);
  const turnDir = pickTurnDir();
  const headingAfterTurn = heading + turnDir * TURN_ANGLE;
  const next = stepFrom(mid, headingAfterTurn, STEP_LEN);
  return { mid, next, heading: headingAfterTurn };
}

function chooseTurnTravel(distanceToMargin) {
  if (distanceToMargin <= STEP_LEN * 1.5) {
    return distanceToMargin * 0.5;
  }
  const minTravel = STEP_LEN;
  const maxTravel = max(minTravel, distanceToMargin - STEP_LEN);
  return random(minTravel, maxTravel);
}

function distanceToBounds(origin, heading, bounds) {
  const radiansHeading = radians(heading);
  const dx = cos(radiansHeading);
  const dy = sin(radiansHeading);
  const candidates = [];

  if (dx > 0) {
    candidates.push((bounds.xMax - origin.x) / dx);
  } else if (dx < 0) {
    candidates.push((bounds.xMin - origin.x) / dx);
  }

  if (dy > 0) {
    candidates.push((bounds.yMax - origin.y) / dy);
  } else if (dy < 0) {
    candidates.push((bounds.yMin - origin.y) / dy);
  }

  const positive = candidates.filter((value) => value > 0);
  if (positive.length === 0) {
    return 0;
  }
  return min(positive);
}

function segmentCrossesBounds(p0, p1, bounds) {
  const p0Inside = pointInBounds(p0, bounds);
  const p1Inside = pointInBounds(p1, bounds);
  return p0Inside && !p1Inside;
}

function pointInBounds(p, bounds) {
  return p.x >= bounds.xMin && p.x <= bounds.xMax && p.y >= bounds.yMin && p.y <= bounds.yMax;
}

function pointInCanvas(p, buffer = 0) {
  return (
    p.x >= buffer &&
    p.x <= WIDTH - buffer &&
    p.y >= buffer &&
    p.y <= HEIGHT - buffer
  );
}

function pickTurnDir() {
  if (TURN_DIR_MODE === 'random') {
    return random([1, -1]);
  }
  return TURN_DIR;
}

function reseed() {
  seed = floor(random(1_000_000_000));
  if (!monochromeMode) {
    pickRandomPalette();
  }
  redraw();
}

function getActivePalette() {
  if (monochromeMode) {
    return ['#000000', '#ffffff'];
  }
  if (currentPalette && currentPalette.length >= 2) {
    return currentPalette;
  }
  return [BG_COLOR, ROUTE_COLOR];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = [BG_COLOR, ROUTE_COLOR];
    return;
  }
  const choices = paletteData.palettes.filter((palette) => palette.colors && palette.colors.length >= 3);
  if (!choices.length) {
    currentPalette = [BG_COLOR, ROUTE_COLOR];
    return;
  }
  const pick = choices[floor(Math.random() * choices.length)];
  currentPalette = pick.colors.slice();
}

function shufflePalette() {
  if (!currentPalette || currentPalette.length < 2) {
    return;
  }
  const shuffled = currentPalette.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  currentPalette = shuffled;
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
  noiseSeed(seed);
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
  } else if (key === 'c' || key === 'C') {
    monochromeMode = false;
    pickRandomPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    monochromeMode = false;
    shufflePalette();
    redraw();
  } else if (key === 'm' || key === 'M') {
    monochromeMode = !monochromeMode;
    redraw();
  }
}
