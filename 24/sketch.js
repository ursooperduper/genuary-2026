const WIDTH = 540;
const HEIGHT = 675;
const WORD = ['K', 'E', 'R', 'N'];
const TEXT_Y_OFFSET = -50; // raise text a bit
// const SPACING_STATES = [
//   { name: 'VERY_TIGHT', value: -16 },
//   { name: 'TIGHT', value: -8 },
//   { name: 'OK', value: 0 },
//   { name: 'LOOSE', value: 12 },
//   { name: 'VERY_LOOSE', value: 28 },
//   { name: 'OFFENSIVE', value: 48 },
// ];

const SPACING_STATES = [
  { name: 'VERY_TIGHT', value: -24 },
  { name: 'TIGHT', value: -16 },
  { name: 'OK', value: 0 },
  { name: 'LOOSE', value: 24 },
  { name: 'VERY_LOOSE', value: 40 },
  { name: 'OFFENSIVE', value: 64 },
];

let mainFont = null;
let boldFont = null;
let spacing = [0, 0, 0];
let displayedSpacing = [0, 0, 0];
let animations = [null, null, null];
let clickCount = 0;

const INSTRUCTION = 'Click between letters to fix kerning';

function preload() {
  mainFont = loadFont('./assets/Inter-Regular.ttf'); // Use regular weight
  boldFont = loadFont('./assets/Inter-Black.ttf');   // Could load separate Bold if available
}

function setup() {
  // Use default 2D canvas renderer (not SVG) to support variable font weight
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  applyTextSettings(this);
  resetSpacing(true);
  frameRate(60);
}

function draw() {
  updateAnimations();
  renderFrame(this, displayedSpacing);
  updateCursor();
}

function drawWord(g, sp) {
  const renderer = g || this;
  const spacingVals = sp || displayedSpacing;
  renderer.fill(255);
  renderer.noStroke();
  const positions = computePositions(renderer, spacingVals);
  const y = HEIGHT / 2 + TEXT_Y_OFFSET;
  for (let i = 0; i < WORD.length; i += 1) {
    renderer.text(WORD[i], positions[i], y);
  }
}

function drawInstruction(g) {
  const renderer = g || this;
  renderer.textFont(mainFont); // Use regular weight for instructions
  renderer.fill(255, 153);
  renderer.noStroke();
  renderer.textAlign(CENTER, CENTER);
  renderer.textSize(14);
  renderer.text(INSTRUCTION, WIDTH / 2, HEIGHT - 28);
  renderer.textAlign(LEFT, CENTER);
  renderer.textSize(200);
}

function computePositions(g, sp) {
  const renderer = g || this;
  const spacingVals = sp || displayedSpacing;
  const sizes = WORD.map((ch) => renderer.textWidth(ch));
  const totalWidth = sizes.reduce((a, b) => a + b, 0) + spacingVals.reduce((a, b) => a + b, 0);
  const startX = (WIDTH - totalWidth) / 2;
  const positions = [];
  let x = startX;
  for (let i = 0; i < WORD.length; i += 1) {
    positions.push(x);
    x += sizes[i];
    if (i < spacingVals.length) {
      x += spacingVals[i];
    }
  }
  return positions;
}

function mouseMoved() {
  // cursor handled in updateCursor()
}

function mousePressed() {
  const gap = whichGap(mouseX, mouseY);
  if (gap === -1) return;
  triggerGapChange(gap);
}

function whichGap(mx, my) {
  // Ensure text settings are applied for accurate measurements
  push();
  applyTextSettings(this);
  const positions = computePositions(this, displayedSpacing);
  const sizes = WORD.map((ch) => textWidth(ch));
  pop();
  
  const yCenter = HEIGHT / 2 + TEXT_Y_OFFSET;
  const hitH = 280; // Even larger clickable area for Black weight
  if (abs(my - yCenter) > hitH / 2) return -1;
  
  for (let i = 0; i < spacing.length; i += 1) {
    const rawLeft = positions[i] + sizes[i];
    const rawRight = positions[i + 1];
    const left = min(rawLeft, rawRight);
    const right = max(rawLeft, rawRight);
    if (mx >= left && mx <= right) {
      return i;
    }
  }
  return -1;
}

function updateCursor() {
  const gap = whichGap(mouseX, mouseY);
  if (gap === -1) {
    cursor(ARROW);
  } else {
    cursor('ew-resize');
  }
}

function triggerGapChange(clickedGap) {
  clickCount += 1;
  const newSpacings = spacing.slice();
  // Decide new states for all gaps
  for (let i = 0; i < spacing.length; i += 1) {
    const bias = i === clickedGap ? 1 : 0;
    newSpacings[i] = pickSpacingState(spacing[i], bias);
  }
  // Enforce never-solved rule
  if (newSpacings.every((v) => v === 0)) {
    const idx = floor(random(newSpacings.length));
    newSpacings[idx] = pickBadState();
  }
  // Usually two bad gaps
  const badCount = newSpacings.filter((v) => v !== 0).length;
  if (badCount < 2 && random() < 0.7) {
    const candidates = newSpacings.map((v, i) => ({ v, i })).filter((c) => c.v === 0);
    if (candidates.length) {
      const pick = random(candidates).i;
      newSpacings[pick] = pickBadState();
    }
  }

  // Create animations
  for (let i = 0; i < spacing.length; i += 1) {
    const plan = makeAnimationPlan(spacing[i], newSpacings[i], i === clickedGap);
    animations[i] = plan;
  }

  spacing = newSpacings;
}

function pickSpacingState(current, clickedBias) {
  const baseWeights = [1, 2, 2.5, 2, 1.3, 0.9];
  const extremeBoost = 0.18 * min(clickCount, 20);
  const okPenalty = 0.12 * min(clickCount, 25);

  const weights = baseWeights.map((w, idx) => {
    const state = SPACING_STATES[idx];
    let weight = w;
    if (state.name === 'OK') weight = max(0.1, w - okPenalty);
    if (state.name === 'VERY_TIGHT' || state.name === 'VERY_LOOSE' || state.name === 'OFFENSIVE') {
      weight += extremeBoost;
    }
    if (clickedBias && state.value === current) {
      weight *= 0.4; // discourage staying the same when clicked
    }
    return max(0.01, weight);
  });

  const total = weights.reduce((a, b) => a + b, 0);
  const r = random(total);
  let acc = 0;
  for (let i = 0; i < SPACING_STATES.length; i += 1) {
    acc += weights[i];
    if (r <= acc) return SPACING_STATES[i].value;
  }
  return SPACING_STATES[SPACING_STATES.length - 1].value;
}

function pickBadState() {
  const bad = SPACING_STATES.filter((s) => s.name !== 'OK');
  return random(bad).value;
}

function makeAnimationPlan(from, to, isClicked) {
  const now = millis();
  const durationBase = map(min(clickCount, 20), 0, 20, 160, 420);
  const behaviors = ['overshoot', 'easeJitter', 'jump', 'delay', 'twoStep'];
  // Avoid repeating the same behavior for the clicked gap if possible
  let behavior = random(behaviors);

  const segments = [];

  if (behavior === 'jump') {
    segments.push({ from, to, start: now, delay: 0, duration: 90, ease: 'step', jitter: maybeJitter() });
  } else if (behavior === 'delay') {
    const delay = random(200, 400);
    segments.push({ from, to, start: now, delay, duration: durationBase, ease: 'easeOut', jitter: maybeJitter() });
  } else if (behavior === 'twoStep') {
    const wrong = pickBadState();
    segments.push({ from, to: wrong, start: now, delay: 0, duration: durationBase * 0.45, ease: 'overshoot', jitter: 0 });
    segments.push({ from: wrong, to, start: now + durationBase * 0.45, delay: 40, duration: durationBase * 0.6, ease: 'easeOut', jitter: maybeJitter() });
  } else if (behavior === 'overshoot') {
    segments.push({ from, to, start: now, delay: 0, duration: durationBase, ease: 'overshoot', jitter: maybeJitter() });
  } else {
    // easeJitter
    segments.push({ from, to, start: now, delay: 0, duration: durationBase, ease: 'easeOut', jitter: maybeJitter(true) });
  }

  return { segments, index: 0, done: false };
}

function maybeJitter(includeMicro) {
  if (includeMicro && random() < 0.45) {
    return 4; // small twitch after settling
  }
  if (random() < 0.2) return 6;
  if (random() < 0.35) return 3;
  return 0;
}

function updateAnimations() {
  const now = millis();
  for (let i = 0; i < animations.length; i += 1) {
    const anim = animations[i];
    if (!anim || anim.done) {
      displayedSpacing[i] = spacing[i];
      continue;
    }
    const seg = anim.segments[anim.index];
    const t0 = seg.start + seg.delay;
    const t1 = t0 + seg.duration;
    if (now < t0) {
      displayedSpacing[i] = seg.from;
      continue;
    }
    const t = constrain((now - t0) / seg.duration, 0, 1);
    let eased = applyEase(t, seg.ease, seg.from, seg.to);
    if (t >= 1 && seg.jitter) {
      const wobble = sin((now - t1) * 0.02) * seg.jitter * 0.6;
      eased += wobble;
    }
    displayedSpacing[i] = eased;
    if (t >= 1) {
      anim.index += 1;
      if (anim.index >= anim.segments.length) {
        anim.done = true;
        displayedSpacing[i] = spacing[i];
      }
    }
  }
}

function applyEase(t, type, a, b) {
  const d = b - a;
  if (type === 'step') return b;
  if (type === 'overshoot') {
    const s = 1.4;
    const ts = t - 1;
    return a + d * (ts * ts * ((s + 1) * ts + s) + 1);
  }
  // easeOut quad
  const eased = 1 - (1 - t) * (1 - t);
  return a + d * eased;
}

function resetSpacing(initial) {
  spacing = [0, 12, -8];
  displayedSpacing = spacing.slice();
  animations = [null, null, null];
  clickCount = 0;
  if (!initial) {
    redraw();
  }
}

function renderFrame(g, sp) {
  const renderer = g || this;
  applyTextSettings(renderer);
  renderer.background(0);
  drawWord(renderer, sp);
  drawInstruction(renderer);
}

function applyTextSettings(g) {
  const renderer = g || this;
  // Use the loaded font file
  renderer.textFont(boldFont); // mainFont for normal weight, boldFont for bold
  renderer.textAlign(LEFT, CENTER);
  renderer.textSize(180);
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const pg = createGraphics(WIDTH * 2, HEIGHT * 2);
  pg.pixelDensity(1);
  renderFrame(pg, displayedSpacing);
  save(pg, `genuary-24-${timestamp}.png`);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'r' || key === 'R') {
    resetSpacing(false);
  }
}
