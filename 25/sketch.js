// ============================================================================
// Day 25: Organic Geometry Creature
// Draw a spine → creature with shell + legs appears
// ============================================================================

const CONFIG = {
  // ========== SPINE CAPTURE ==========
  // Controls how the user's drawn stroke is captured and processed

  // Stroke weight while drawing the spine
  // Range: 1-10 (typical: 2-4)
  SPINE_DRAW_STROKE: 4,

  // Color of the spine while drawing
  // Any valid hex color; white for dark backgrounds, dark for light
  SPINE_DRAW_COLOR: '#FFFFFF',

  // Minimum number of mouse points required to build a creature
  // Range: 10-50 (lower = easier to draw, less detail; higher = requires longer strokes)
  MIN_POINTS: 10,

  // Minimum pixel distance between captured points to reject jitter
  // Range: 0.5-5 (lower = more points captured; higher = fewer but cleaner points)
  MIN_DISTANCE: 2,

  // Simplification tolerance for Ramer-Douglas-Peucker algorithm
  // Range: 1-8 (lower = more detail; higher = simpler silhouette)
  SIMPLIFY_EPS: 2.5,

  // Target spacing between resampled spine points (pixels)
  // Range: 5-20 (smaller = more segments, denser geometry; larger = fewer segments, sparser)
  RESAMPLE_STEP: 10,

  // ========== BODY SHELL ==========
  // Controls the shape and structure of the creature's body

  // Maximum half-width of the body at its widest point (pixels)
  // Range: 30-150 (wider = bigger creature, more triangles)
  // BODY_MAX_WIDTH: 70,
  BODY_MAX_WIDTH: 80,

  // Fraction of spine length tapered at each end (0-1)
  // Range: 0.05-0.3 (higher = more pointy ends; 0 = no taper)
  // BODY_END_TAPER: 0.15,
  // BODY_END_TAPER: 0.3,
  BODY_END_TAPER: 0.15,

  // Width profile shape: 'bell', 'linear', 'sigmoid', 'barrel', 'double-bump'
  // 'bell' = smooth bulge in middle, tapers at ends (organic)
  // 'linear' = straight taper, spindle-like (elegant)
  // 'sigmoid' = soft S-curve (smooth worm-like)
  // 'barrel' = heavy middle, aggressive taper (blocky/squat)
  // 'double-bump' = two peaks along spine (segmented insect-like)
  BODY_WIDTH_PROFILE: 'bell',

  // How much high curvature reduces body width (0-1)
  // Range: 0-0.5 (higher = more curvature-sensitive thinning; 0 = no effect)
  CURVATURE_THINNING: 0.2,

  // Line weight for shell edges (pixels)
  // Range: 0.5-3 (thinner looks delicate, thicker looks bold)
  SHELL_STROKE: 1,

  // Color of shell outline and main geometry
  // Use bright neon colors for dark backgrounds
  SHELL_COLOR: '#00FF66',

  // Triangulation diagonal pattern ('alternate' or 'fixed')
  // 'alternate' = diagonal flips per segment (more organic feel)
  // 'fixed' = same diagonal always (more rigid look)
  TRI_DIAGONAL_MODE: 'alternate',

  // Add cross-braces every N segments
  // Range: 2-8 (smaller = more bracing, denser look; larger = sparser)
  // BRACE_EVERY: 4,
  BRACE_EVERY: 4,

  // Probability each brace slot actually gets a brace (0-1)
  // Range: 0-1 (0 = no braces; 0.5 = 50% chance; 1 = all braces)
  BRACE_PROB: 0.6,

  // Add vertical ribs every N segments
  // Range: 3-12 (smaller = more ribs, more structured; larger = fewer ribs, looser)
  // INNER_RIB_EVERY: 6,
  INNER_RIB_EVERY: 3,

  // ========== LEGS ==========
  // Controls leg placement, shape, and geometry

  // Number of legs to generate
  // Range: 2-6 (typical: 4 for insect-like creatures)
  LEG_COUNT: 4,

  // Fractions along spine where legs attach (0-1)
  // Values: [front, front-mid, back-mid, back] for balanced stance
  // Adjust to move legs forward/backward
  LEG_ANCHOR_FRACTIONS: [0.22, 0.38, 0.62, 0.78],

  // Random jitter applied to leg anchor position (fraction of spine length)
  // Range: 0-0.1 (higher = more variation between creatures)
  LEG_ANCHOR_JITTER: 0.03,

  // Min and max leg length in pixels [min, max]
  // Range: [30, 200] (shorter = compact; longer = sprawling)
  LEG_LENGTH_RANGE: [70, 130],

  // How much the knee bends forward/back relative to leg length (0-1)
  // Range: 0-0.5 (higher = more dramatic knee angle, more organic)
  // LEG_KNEE_BEND: 0.35,
  LEG_KNEE_BEND: 0.75,

  // Sideways spread of foot from center line (pixels)
  // Range: 5-30 (larger = wider stance)
  // LEG_SPREAD: 18,
  LEG_SPREAD: 30,

  // Size of foot pad (pixels)
  // Range: 10-30 (larger = bigger feet)
  // FOOT_SIZE: 18,
  FOOT_SIZE: 30,

  // Number of toes (0, 2, or 3)
  // 0 = no toes; 2 = V-split toe; 3 = three-toed
  FOOT_TOES: 2,

  // Line weight for leg edges (pixels)
  // Range: 0.5-2
  LEG_STROKE: 1,

  // Color of legs and feet (typically match shell for cohesion)
  LEG_COLOR: '#00FF66',

  // ========== PHYSICS & VIEW ==========
  // Controls gravity and ground positioning

  // Gravity vector [x, y] - determines which way legs hang
  // [0, 1] = down; [0, -1] = up; [1, 0] = right, etc.
  GRAVITY: [0, 1],

  // Fixed ground y-position for feet, or null to auto-compute
  // null = feet align to the lowest leg foot in the creature
  // number = fixed baseline (e.g., 600 for canvas bottom)
  FOOT_GROUND_Y: null,

  // ========== ANIMATION ==========
  // Controls growth/reveal animation when creature is built

  // Enable growth animation that reveals shell progressively
  // true = animate; false = show complete creature instantly
  USE_GROWTH_ANIM: true,

  // Duration of growth animation in milliseconds
  // Range: 400-2500 (shorter = snappier; longer = more dramatic)
  GROWTH_DURATION_MS: 1600,

  // Easing function name for growth animation
  // 'outBack' = snappy pop-in; 'easeOutCubic' = smooth; 'elasticLite' = bouncy
  // GROWTH_EASE: 'outBack',
  GROWTH_EASE: 'easeOutCubic',

  // Delay in milliseconds before legs appear
  // Range: 0-500 (higher = legs pop in after shell is more built)
  LEG_POP_DELAY_MS: 180,

  // ========== RENDERING ==========
  // Canvas and display settings

  // Background color
  // '#000000' (black) for bright neon colors
  // '#FFFFFF' (white) for dark colors
  BG: '#000000',

  // Canvas width in pixels
  WIDTH: 540,

  // Canvas height in pixels
  HEIGHT: 675,

  // ========== FILL ==========
  // Optional semi-transparent fill for visual depth

  // Fill opacity for triangles and leg geometry (0-1)
  // 0 = no fill (wireframe only, default)
  // 0.1 = 10% opacity fill of stroke color
  // 0.3 = 30% opacity (more opaque)
  // 1.0 = fully opaque
  FILL_OPACITY: 0.5,

  // ===== CREATURE FEATURES =====
  
  // Orientation
  FLIP_HEAD_TAIL: false, // If true, head (antennae/eyes) at end, tail at start
  
  // Antennae
  ANTENNAE_ENABLED: true,
  ANTENNAE_STYLE: 'curved', // 'straight', 'curved', 'segmented', 'feathered'
  ANTENNAE_LENGTH: 60, // 30-100, length of antennae
  ANTENNAE_ANGLE: 40, // 20-70, angle in degrees from spine direction
  ANTENNAE_SEGMENTS: 5, // 3-8, number of segments (for 'segmented' style)
  ANTENNAE_FEATHER_COUNT: 6, // 4-10, side branches (for 'feathered' style)
  
  // Eyes
  EYES_ENABLED: true,
  EYES_STYLE: 'stalked', // 'simple', 'stalked', 'compound', 'multiple'
  EYES_SIZE: 8, // 4-15, base size of eye
  EYES_OFFSET: 15, // 8-25, distance from spine centerline
  EYES_STALK_LENGTH: 20, // 10-40, length of eye stalk (for 'stalked' style)
  EYES_COUNT: 3, // 2-5, number of eyes per side (for 'multiple' style)
  
  // Tail/Stinger
  TAIL_ENABLED: true,
  TAIL_STYLE: 'stinger', // 'simple', 'segmented', 'stinger', 'forked'
  TAIL_LENGTH: 80, // 40-150, total length of tail
  TAIL_SEGMENTS: 6, // 3-10, number of segments (for 'segmented' style)
  TAIL_CURVE: 0.3, // 0-0.5, amount of curve (0=straight, 0.5=very curved)
  TAIL_FORK_ANGLE: 25, // 15-45, angle between fork tines (for 'forked' style)
  
  // Wings
  WINGS_ENABLED: true,
  WINGS_STYLE: 'veined', // 'triangular', 'veined', 'butterfly', 'folded'
  WINGS_SIZE: 240, // 30-100, wingspan from body
  WINGS_PAIRS: 1, // 1-2, number of wing pairs
  WINGS_ANGLE: 90, // 20-70, angle from horizontal
  WINGS_VEIN_COUNT: 3, // 3-7, number of veins (for 'veined' style)

  // Structural Variation
  LEG_COUNT_CONFIGURABLE: 4, // 2-8, number of legs (configurable via UI)
  
  // Joint nodes - small circles at leg joints for mechanical look
  JOINT_NODES_ENABLED: false,
  JOINT_NODE_SIZE: 8,
  
};

// ============================================================================
// STATE
// ============================================================================

let rawSpinePts = [];
let spinePts = [];
let leftRail = [];
let rightRail = [];
let triangles = [];
let braces = [];
let legs = [];
let antennae = [];
let eyes = [];
let tail = [];
let wings = [];
let built = false;
let growthT = 0;
let growthStartTime = null;
let isDrawing = false;
let paletteData = null;
let currentPalette = null;

// ============================================================================
// SETUP & DRAW
// ============================================================================

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
  createCanvas(CONFIG.WIDTH, CONFIG.HEIGHT, SVG);
  background(CONFIG.BG);
}

function draw() {
  background(getBGColor());

  if (isDrawing) {
    // Show spine being drawn
    stroke(CONFIG.SPINE_DRAW_COLOR);
    strokeWeight(CONFIG.SPINE_DRAW_STROKE);
    noFill();
    if (rawSpinePts.length > 1) {
      beginShape();
      for (let pt of rawSpinePts) {
        vertex(pt.x, pt.y);
      }
      endShape();
    }
  } else if (built) {
    // Render built creature with optional growth
    if (CONFIG.USE_GROWTH_ANIM && growthStartTime !== null) {
      const elapsed = millis() - growthStartTime;
      growthT = constrain(elapsed / CONFIG.GROWTH_DURATION_MS, 0, 1);
      if (growthT >= 1) {
        growthStartTime = null;
        growthT = 1;
      }
    }

    renderCreature();
  }
}

// ============================================================================
// INPUT: MOUSE DRAWING
// ============================================================================

function mousePressed() {
  // Only start if inside canvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  rawSpinePts = [createVector(mouseX, mouseY)];
  spinePts = [];
  leftRail = [];
  rightRail = [];
  triangles = [];
  braces = [];
  legs = [];
  antennae = [];
  eyes = [];
  tail = [];
  wings = [];
  built = false;
  isDrawing = true;
  growthT = 0;
  growthStartTime = null;
  background(CONFIG.BG);
}

function mouseDragged() {
  if (!isDrawing) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  const pt = createVector(mouseX, mouseY);
  const last = rawSpinePts[rawSpinePts.length - 1];
  if (p5.Vector.dist(pt, last) >= CONFIG.MIN_DISTANCE) {
    rawSpinePts.push(pt);
  }
}

function mouseReleased() {
  if (!isDrawing) return;
  isDrawing = false;

  if (rawSpinePts.length >= CONFIG.MIN_POINTS) {
    buildCreature();
    built = true;
    if (CONFIG.USE_GROWTH_ANIM) {
      growthT = 0;
      growthStartTime = millis();
    } else {
      growthT = 1;
      growthStartTime = null;
    }
  } else {
    reset();
  }
}

// Rebuild only attachable features (antennae/eyes/tail/wings/rings) without touching body or legs
function rebuildFeatures() {
  if (!built || spinePts.length === 0) return;
  
  antennae = [];
  eyes = [];
  tail = [];
  wings = [];
 
  if (CONFIG.ANTENNAE_ENABLED) generateAntennae();
  if (CONFIG.EYES_ENABLED) generateEyes();
  if (CONFIG.TAIL_ENABLED) generateTail();
  if (CONFIG.WINGS_ENABLED) generateWings();
}

// ============================================================================
// SPINE PROCESSING
// ============================================================================

function simplifyRDP(pts, eps) {
  if (pts.length < 3) return pts.slice();

  // Ramer-Douglas-Peucker simplification
  function perpDistance(pt, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const denom = sqrt(dx * dx + dy * dy);
    if (denom < 0.0001) return dist(pt, start);
    const num = abs(dy * pt.x - dx * pt.y + end.x * start.y - end.y * start.x);
    return num / denom;
  }

  function rdp(pts, eps, start, end) {
    let maxDist = 0;
    let maxIdx = 0;
    for (let i = start + 1; i < end; i++) {
      const d = perpDistance(pts[i], pts[start], pts[end]);
      if (d > maxDist) {
        maxDist = d;
        maxIdx = i;
      }
    }
    if (maxDist > eps) {
      const left = rdp(pts, eps, start, maxIdx);
      const right = rdp(pts, eps, maxIdx, end);
      return left.concat(right.slice(1));
    } else {
      return [pts[start], pts[end]];
    }
  }

  return rdp(pts, eps, 0, pts.length - 1);
}

function resample(pts, step) {
  if (pts.length < 2) return pts.slice();

  const result = [pts[0].copy()];
  let accumulated = 0;

  for (let i = 1; i < pts.length; i++) {
    const d = p5.Vector.dist(pts[i], pts[i - 1]);
    accumulated += d;

    while (accumulated >= step) {
      accumulated -= step;
      // Interpolate
      const overflow = accumulated;
      const frac = (d - overflow) / d;
      const interpPt = p5.Vector.lerp(pts[i - 1], pts[i], frac);
      result.push(interpPt);
    }
  }

  // Always include end
  if (p5.Vector.dist(result[result.length - 1], pts[pts.length - 1]) > 0.1) {
    result.push(pts[pts.length - 1].copy());
  }

  return result;
}

// Build full creature geometry from the captured spine
function buildCreature() {
  // Fresh state
  spinePts = [];
  leftRail = [];
  rightRail = [];
  triangles = [];
  braces = [];
  legs = [];
  antennae = [];
  eyes = [];
  tail = [];
  wings = [];

  // Process raw spine points
  const simplified = simplifyRDP(rawSpinePts, CONFIG.SIMPLIFY_EPS);
  const resampled = resample(simplified, CONFIG.RESAMPLE_STEP);
  spinePts = resampled;

  if (spinePts.length < 3) {
    built = false;
    return;
  }

  computeRails();
  triangulateShell();
  generateLegs();

  // Attach optional features
  if (CONFIG.ANTENNAE_ENABLED) generateAntennae();
  if (CONFIG.EYES_ENABLED) generateEyes();
  if (CONFIG.TAIL_ENABLED) generateTail();
  if (CONFIG.WINGS_ENABLED) generateWings();
}

// ============================================================================
// WIDTH PROFILE COMPUTATION
// ============================================================================

function computeWidthProfile(t, N) {
  // t = normalized position (0 to 1 along spine)
  // Returns raw width multiplier before taper application
  // Taper is applied separately to all profiles

  const profile = CONFIG.BODY_WIDTH_PROFILE;

  if (profile === 'bell') {
    // Smooth sine curve: peaks at middle
    return sin(PI * t);
  } else if (profile === 'linear') {
    // Triangle/spindle: linear taper from middle to ends
    return 1 - abs(t - 0.5) * 2;
  } else if (profile === 'sigmoid') {
    // Soft S-curve: smooth step-like bulge
    // Thin at start, bulges in middle, tapers at end
    const smoothMid = smoothstep(0.1, 0.9, t) * smoothstep(0.9, 0.1, t);
    return smoothMid;
  } else if (profile === 'barrel') {
    // Aggressive bulge in middle, sharp taper at ends
    // Uses power curve for heavier middle
    const centered = sin(PI * t);
    return centered * centered; // Squared for more emphasis
  } else if (profile === 'double-bump') {
    // Two peaks: segmented insect-like appearance
    // Bumps at 1/3 and 2/3 along spine
    const bump1 = sin(PI * t * 3) * sin(PI * t);
    const bump2 = sin(PI * (t - 0.5) * 3) * sin(PI * t);
    return max(bump1, bump2) * 0.8;
  }

  // Fallback to bell
  return sin(PI * t);
}

// ============================================================================
// RAIL COMPUTATION
// ============================================================================

function computeRails() {
  const N = spinePts.length;
  leftRail = [];
  rightRail = [];

  for (let i = 0; i < N; i++) {
    // Compute tangent
    let tangent;
    if (i === 0) {
      tangent = p5.Vector.sub(spinePts[1], spinePts[0]);
    } else if (i === N - 1) {
      tangent = p5.Vector.sub(spinePts[N - 1], spinePts[N - 2]);
    } else {
      tangent = p5.Vector.sub(spinePts[i + 1], spinePts[i - 1]);
    }
    tangent.normalize();

    // Perpendicular (normal)
    const normal = createVector(-tangent.y, tangent.x);

    // Compute width at this point
    const t = i / (N - 1);
    const profileWidth = computeWidthProfile(t, N);
    const taper =
      smoothstep(0, CONFIG.BODY_END_TAPER, t) *
      smoothstep(0, CONFIG.BODY_END_TAPER, 1 - t);
    let w = CONFIG.BODY_MAX_WIDTH * profileWidth * taper;

    // Optional curvature thinning
    if (i > 0 && i < N - 1) {
      const prev_tang = p5.Vector.sub(spinePts[i], spinePts[i - 1]).normalize();
      const next_tang = p5.Vector.sub(spinePts[i + 1], spinePts[i]).normalize();
      const curvature = acos(constrain(p5.Vector.dot(prev_tang, next_tang), -1, 1));
      w *= 1 - curvature * CONFIG.CURVATURE_THINNING;
    }

    // Build rails
    const left = p5.Vector.add(spinePts[i], p5.Vector.mult(normal, w));
    const right = p5.Vector.add(spinePts[i], p5.Vector.mult(normal, -w));

    leftRail.push(left);
    rightRail.push(right);
  }
}

// ============================================================================
// TRIANGULATION
// ============================================================================

function triangulateShell() {
  const N = spinePts.length;

  for (let i = 0; i < N - 1; i++) {
    const L0 = leftRail[i];
    const L1 = leftRail[i + 1];
    const R0 = rightRail[i];
    const R1 = rightRail[i + 1];

    // Split quad into two triangles
    if (CONFIG.TRI_DIAGONAL_MODE === 'alternate') {
      if (i % 2 === 0) {
        triangles.push([L0, L1, R1]);
        triangles.push([L0, R1, R0]);
      } else {
        triangles.push([L0, L1, R0]);
        triangles.push([L1, R1, R0]);
      }
    } else {
      triangles.push([L0, L1, R1]);
      triangles.push([L0, R1, R0]);
    }

    // Optional braces
    if (i % CONFIG.BRACE_EVERY === 0 && random() < CONFIG.BRACE_PROB) {
      if (i % 2 === 0) {
        braces.push({ a: L0, b: R1 });
      } else {
        braces.push({ a: R0, b: L1 });
      }
    }

    // Optional ribs
    if (i % CONFIG.INNER_RIB_EVERY === 0) {
      braces.push({ a: L0, b: R0 });
    }
  }
}

// ============================================================================
// LEG GENERATION
// ============================================================================

function generateLegs() {
  const N = spinePts.length;

  for (let frac of CONFIG.LEG_ANCHOR_FRACTIONS) {
    let idx = floor(frac * (N - 1));
    const jitterN = floor(CONFIG.LEG_ANCHOR_JITTER * N);
    idx = constrain(idx + floor(random(-jitterN, jitterN)), 1, N - 2);

    // Determine underside (lower rail)
    const isLeftLower = leftRail[idx].y > rightRail[idx].y;
    const undersideRail = isLeftLower ? leftRail : rightRail;
    let hip = undersideRail[idx].copy();

    // Move slightly toward spine
    hip = p5.Vector.lerp(hip, spinePts[idx], 0.15);

    // Compute leg direction
    const forward = p5.Vector.sub(spinePts[idx + 1], spinePts[idx - 1]).normalize();
    const gravity = createVector(CONFIG.GRAVITY[0], CONFIG.GRAVITY[1]).normalize();

    const legLen = random(CONFIG.LEG_LENGTH_RANGE[0], CONFIG.LEG_LENGTH_RANGE[1]);
    const kneeBend = random(-CONFIG.LEG_KNEE_BEND, CONFIG.LEG_KNEE_BEND);

    // Knee
    const knee = p5.Vector.add(
      hip,
      p5.Vector.add(
        p5.Vector.mult(gravity, legLen * 0.6),
        p5.Vector.mult(forward, kneeBend * legLen * 0.15)
      )
    );

    // Foot
    const foot = p5.Vector.add(
      hip,
      p5.Vector.add(
        p5.Vector.mult(gravity, legLen),
        p5.Vector.mult(forward, random(-legLen * 0.05, legLen * 0.05))
      )
    );

    legs.push({
      hip,
      knee,
      foot,
      side: isLeftLower ? 'left' : 'right',
    });
  }

  // Enforce ground line
  let groundY = CONFIG.FOOT_GROUND_Y;
  if (groundY === null) {
    groundY = max(legs.map((l) => l.foot.y)) + 10;
  }

  for (let leg of legs) {
    leg.foot.y = groundY;
  }

  // Build foot geometry
  for (let leg of legs) {
    buildFootGeometry(leg);
  }
}

function buildFootGeometry(leg) {
  const footWidth = CONFIG.FOOT_SIZE + random(-2, 2);
  const footPad = {
    left: createVector(leg.foot.x - footWidth / 2, leg.foot.y),
    right: createVector(leg.foot.x + footWidth / 2, leg.foot.y),
    tip: createVector(leg.foot.x, leg.foot.y - CONFIG.FOOT_SIZE * 0.35),
  };

  leg.footPad = footPad;

  if (CONFIG.FOOT_TOES === 2) {
    leg.toeL = createVector(leg.foot.x - CONFIG.FOOT_SIZE * 0.15, leg.foot.y - CONFIG.FOOT_SIZE * 0.25);
    leg.toeR = createVector(leg.foot.x + CONFIG.FOOT_SIZE * 0.15, leg.foot.y - CONFIG.FOOT_SIZE * 0.25);
  } else if (CONFIG.FOOT_TOES === 3) {
    const yOffset = CONFIG.FOOT_SIZE * 0.28;
    const xSpread = CONFIG.FOOT_SIZE * 0.18;
    leg.toeL = createVector(leg.foot.x - xSpread, leg.foot.y - yOffset);
    leg.toeM = createVector(leg.foot.x, leg.foot.y - yOffset * 1.05);
    leg.toeR = createVector(leg.foot.x + xSpread, leg.foot.y - yOffset);
  }
}

// ============================================================================
// CREATURE FEATURES GENERATION
// ============================================================================

function generateAntennae() {
  if (spinePts.length < 2) return;
  
  // Head is at start or end depending on flip setting
  const headIdx = CONFIG.FLIP_HEAD_TAIL ? spinePts.length - 1 : 0;
  const head = spinePts[headIdx];
  const nextPt = CONFIG.FLIP_HEAD_TAIL ? 
    spinePts[Math.max(spinePts.length - 2, 0)] : 
    spinePts[Math.min(1, spinePts.length - 1)];
  
  // Calculate forward direction from spine (outward from head)
  const tangent = CONFIG.FLIP_HEAD_TAIL ?
    p5.Vector.sub(head, nextPt).normalize() :
    p5.Vector.sub(nextPt, head).normalize();
  const angleRad = radians(CONFIG.ANTENNAE_ANGLE);
  
  // Create left and right antennae
  for (let side of [-1, 1]) {
    const antenna = { side, points: [] };
    
    // Rotate tangent for antenna direction
    const dir = tangent.copy().rotate(side * angleRad);
    
    if (CONFIG.ANTENNAE_STYLE === 'straight') {
      // Simple straight antenna
      antenna.points.push(head.copy());
      const tip = p5.Vector.add(head, p5.Vector.mult(dir, CONFIG.ANTENNAE_LENGTH));
      antenna.points.push(tip);
      
    } else if (CONFIG.ANTENNAE_STYLE === 'curved') {
      // Curved antenna with bezier-like curve
      const segments = 8;
      antenna.points.push(head.copy());
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const len = CONFIG.ANTENNAE_LENGTH * t;
        // Add progressively more rotation for curve
        const curveAngle = side * t * radians(30);
        const curvedDir = dir.copy().rotate(curveAngle);
        const pt = p5.Vector.add(head, p5.Vector.mult(curvedDir, len));
        antenna.points.push(pt);
      }
      
    } else if (CONFIG.ANTENNAE_STYLE === 'segmented') {
      // Segmented antenna with distinct sections
      antenna.points.push(head.copy());
      const segLen = CONFIG.ANTENNAE_LENGTH / CONFIG.ANTENNAE_SEGMENTS;
      let currentPos = head.copy();
      let currentDir = dir.copy();
      
      for (let i = 0; i < CONFIG.ANTENNAE_SEGMENTS; i++) {
        // Slight angle change at each segment
        const bendAngle = side * radians(random(-5, 5));
        currentDir.rotate(bendAngle);
        currentPos = p5.Vector.add(currentPos, p5.Vector.mult(currentDir, segLen));
        antenna.points.push(currentPos.copy());
      }
      
    } else if (CONFIG.ANTENNAE_STYLE === 'feathered') {
      // Main shaft with side branches
      const segments = CONFIG.ANTENNAE_FEATHER_COUNT;
      antenna.points.push(head.copy());
      antenna.feathers = [];
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const len = CONFIG.ANTENNAE_LENGTH * t;
        const pt = p5.Vector.add(head, p5.Vector.mult(dir, len));
        antenna.points.push(pt);
        
        // Add feather branches
        if (i > 1 && i < segments) {
          const featherLen = CONFIG.ANTENNAE_LENGTH * 0.2 * (1 - t);
          const featherAngle = side * radians(60);
          const featherDir = dir.copy().rotate(featherAngle);
          const featherTip = p5.Vector.add(pt, p5.Vector.mult(featherDir, featherLen));
          antenna.feathers.push({ base: pt.copy(), tip: featherTip });
        }
      }
    }
    
    antennae.push(antenna);
  }
}

function generateEyes() {
  if (spinePts.length < 2) return;
  
  // Head is at start or end depending on flip setting
  const headIdx = CONFIG.FLIP_HEAD_TAIL ? spinePts.length - 1 : 0;
  const head = spinePts[headIdx];
  const nextPt = CONFIG.FLIP_HEAD_TAIL ? 
    spinePts[Math.max(spinePts.length - 2, 0)] : 
    spinePts[Math.min(1, spinePts.length - 1)];
  
  // Calculate perpendicular direction for eye placement
  const tangent = CONFIG.FLIP_HEAD_TAIL ?
    p5.Vector.sub(head, nextPt).normalize() :
    p5.Vector.sub(nextPt, head).normalize();
  const normal = createVector(-tangent.y, tangent.x);
  
  if (CONFIG.EYES_STYLE === 'simple') {
    // Simple dot eyes on each side
    for (let side of [-1, 1]) {
      const eyePos = p5.Vector.add(head, p5.Vector.mult(normal, side * CONFIG.EYES_OFFSET));
      eyes.push({ side, pos: eyePos, size: CONFIG.EYES_SIZE });
    }
    
  } else if (CONFIG.EYES_STYLE === 'stalked') {
    // Eyes on stalks
    for (let side of [-1, 1]) {
      const basePos = p5.Vector.add(head, p5.Vector.mult(normal, side * CONFIG.EYES_OFFSET * 0.5));
      const stalkDir = normal.copy().mult(side);
      const eyePos = p5.Vector.add(basePos, p5.Vector.mult(stalkDir, CONFIG.EYES_STALK_LENGTH));
      eyes.push({ 
        side, 
        base: basePos, 
        pos: eyePos, 
        size: CONFIG.EYES_SIZE,
        stalked: true 
      });
    }
    
  } else if (CONFIG.EYES_STYLE === 'compound') {
    // Compound eyes with multiple facets
    for (let side of [-1, 1]) {
      const eyePos = p5.Vector.add(head, p5.Vector.mult(normal, side * CONFIG.EYES_OFFSET));
      const facets = [];
      const facetCount = 7;
      const facetSize = CONFIG.EYES_SIZE * 0.3;
      
      for (let i = 0; i < facetCount; i++) {
        const angle = (i / facetCount) * TWO_PI;
        const radius = CONFIG.EYES_SIZE * 0.6;
        const fx = eyePos.x + cos(angle) * radius;
        const fy = eyePos.y + sin(angle) * radius;
        facets.push(createVector(fx, fy));
      }
      
      eyes.push({ 
        side, 
        pos: eyePos, 
        size: CONFIG.EYES_SIZE,
        facets,
        facetSize,
        compound: true 
      });
    }
    
  } else if (CONFIG.EYES_STYLE === 'multiple') {
    // Multiple eyes in a row
    for (let side of [-1, 1]) {
      for (let i = 0; i < CONFIG.EYES_COUNT; i++) {
        const alongSpine = i * 8;
        
        // Start from head end
        let idx;
        if (CONFIG.FLIP_HEAD_TAIL) {
          // Head at end, so count backwards
          const distFromEnd = alongSpine / CONFIG.RESAMPLE_STEP;
          idx = Math.max(spinePts.length - 1 - Math.floor(distFromEnd), 0);
        } else {
          // Head at start, count forwards
          idx = Math.min(Math.floor(alongSpine / CONFIG.RESAMPLE_STEP), spinePts.length - 2);
        }
        
        const spinePos = spinePts[idx];
        const nextSpinePos = spinePts[Math.min(idx + 1, spinePts.length - 1)];
        const spineTangent = p5.Vector.sub(nextSpinePos, spinePos).normalize();
        const spineNormal = createVector(-spineTangent.y, spineTangent.x);
        
        const eyePos = p5.Vector.add(spinePos, p5.Vector.mult(spineNormal, side * CONFIG.EYES_OFFSET));
        const eyeSize = CONFIG.EYES_SIZE * (1 - i * 0.15);
        eyes.push({ side, pos: eyePos, size: eyeSize });
      }
    }
  }
}

function generateTail() {
  if (spinePts.length < 2) return;
  
  // Tail is at end or start depending on flip setting
  const tailIdx = CONFIG.FLIP_HEAD_TAIL ? 0 : spinePts.length - 1;
  const tailBase = spinePts[tailIdx];
  const prevPt = CONFIG.FLIP_HEAD_TAIL ? 
    spinePts[Math.min(1, spinePts.length - 1)] :
    spinePts[Math.max(tailIdx - 1, 0)];
  
  // Calculate backward direction from spine (outward from tail)
  const tangent = CONFIG.FLIP_HEAD_TAIL ?
    p5.Vector.sub(tailBase, prevPt).normalize() :
    p5.Vector.sub(tailBase, prevPt).normalize();
  
  if (CONFIG.TAIL_STYLE === 'simple') {
    // Simple straight tail
    tail.push(tailBase.copy());
    const tip = p5.Vector.add(tailBase, p5.Vector.mult(tangent, CONFIG.TAIL_LENGTH));
    tail.push(tip);
    
  } else if (CONFIG.TAIL_STYLE === 'segmented') {
    // Segmented tail with joints
    tail.push(tailBase.copy());
    const segLen = CONFIG.TAIL_LENGTH / CONFIG.TAIL_SEGMENTS;
    let currentPos = tailBase.copy();
    let currentDir = tangent.copy();
    
    for (let i = 0; i < CONFIG.TAIL_SEGMENTS; i++) {
      const t = i / CONFIG.TAIL_SEGMENTS;
      // Add curve
      const curveAngle = radians(CONFIG.TAIL_CURVE * 60 * sin(t * PI));
      currentDir.rotate(curveAngle);
      currentPos = p5.Vector.add(currentPos, p5.Vector.mult(currentDir, segLen));
      tail.push(currentPos.copy());
    }
    
  } else if (CONFIG.TAIL_STYLE === 'stinger') {
    // Tail with stinger tip
    const segments = 8;
    tail.push(tailBase.copy());
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const len = CONFIG.TAIL_LENGTH * t;
      // Add upward curve
      const curveAngle = radians(-CONFIG.TAIL_CURVE * 40 * sin(t * PI));
      const curvedDir = tangent.copy().rotate(curveAngle);
      const pt = p5.Vector.add(tailBase, p5.Vector.mult(curvedDir, len));
      tail.push(pt);
    }
    
    // Add stinger barbs
    const tipIdx = tail.length - 1;
    const tip = tail[tipIdx];
    const beforeTip = tail[tipIdx - 1];
    const tipDir = p5.Vector.sub(tip, beforeTip).normalize();
    const barbLen = CONFIG.TAIL_LENGTH * 0.15;
    const barbAngle = radians(25);
    
    tail.push({ 
      isBarb: true,
      left: p5.Vector.add(beforeTip, p5.Vector.mult(tipDir.copy().rotate(-barbAngle), barbLen)),
      right: p5.Vector.add(beforeTip, p5.Vector.mult(tipDir.copy().rotate(barbAngle), barbLen))
    });
    
  } else if (CONFIG.TAIL_STYLE === 'forked') {
    // Forked tail
    const mainLen = CONFIG.TAIL_LENGTH * 0.6;
    tail.push(tailBase.copy());
    const forkBase = p5.Vector.add(tailBase, p5.Vector.mult(tangent, mainLen));
    tail.push(forkBase.copy());
    
    // Create two fork tines
    const forkAngleRad = radians(CONFIG.TAIL_FORK_ANGLE);
    const forkLen = CONFIG.TAIL_LENGTH * 0.4;
    
    const leftDir = tangent.copy().rotate(-forkAngleRad);
    const rightDir = tangent.copy().rotate(forkAngleRad);
    
    tail.push({
      isFork: true,
      base: forkBase.copy(),
      left: p5.Vector.add(forkBase, p5.Vector.mult(leftDir, forkLen)),
      right: p5.Vector.add(forkBase, p5.Vector.mult(rightDir, forkLen))
    });
  }
}

function generateWings() {
  if (spinePts.length < 4 || leftRail.length < 4) return;
  
  // Attach wings to upper body
  const positions = [];
  if (CONFIG.WINGS_PAIRS === 1) {
    positions.push(0.3); // Single pair at 30% along spine
  } else if (CONFIG.WINGS_PAIRS === 2) {
    positions.push(0.25, 0.45); // Two pairs
  }
  
  for (let posRatio of positions) {
    const idx = Math.floor(posRatio * spinePts.length);
    const clampedIdx = constrain(idx, 0, spinePts.length - 2);
    
    const spinePos = spinePts[clampedIdx];
    const nextSpinePos = spinePts[Math.min(clampedIdx + 1, spinePts.length - 1)];
    const tangent = p5.Vector.sub(nextSpinePos, spinePos).normalize();
    const normal = createVector(-tangent.y, tangent.x);
    
    const leftAttach = leftRail[clampedIdx];
    const rightAttach = rightRail[clampedIdx];
    
    // Create wings on both sides
    for (let side of [-1, 1]) {
      const attach = side < 0 ? leftAttach : rightAttach;
      const wingDir = normal.copy().mult(side);
      
      if (CONFIG.WINGS_STYLE === 'triangular') {
        // Simple triangular wings
        const angleRad = radians(CONFIG.WINGS_ANGLE);
        const forwardDir = tangent.copy().rotate(side * angleRad);
        const backDir = tangent.copy().rotate(side * -angleRad * 0.5);
        
        const tip = p5.Vector.add(attach, p5.Vector.mult(forwardDir, CONFIG.WINGS_SIZE));
        const back = p5.Vector.add(attach, p5.Vector.mult(backDir, CONFIG.WINGS_SIZE * 0.4));
        
        wings.push({
          side,
          attach: attach.copy(),
          tip,
          back,
          triangular: true
        });
        
      } else if (CONFIG.WINGS_STYLE === 'veined') {
        // Wings with vein structure
        const angleRad = radians(CONFIG.WINGS_ANGLE);
        const forwardDir = tangent.copy().rotate(side * angleRad);
        const backDir = tangent.copy().rotate(side * -angleRad * 0.5);
        
        const tip = p5.Vector.add(attach, p5.Vector.mult(forwardDir, CONFIG.WINGS_SIZE));
        const back = p5.Vector.add(attach, p5.Vector.mult(backDir, CONFIG.WINGS_SIZE * 0.4));
        
        // Generate veins
        const veins = [];
        for (let i = 0; i < CONFIG.WINGS_VEIN_COUNT; i++) {
          const t = i / (CONFIG.WINGS_VEIN_COUNT - 1);
          const veinAngle = lerp(-angleRad * 0.5, angleRad, t);
          const veinDir = tangent.copy().rotate(side * veinAngle);
          const veinLen = CONFIG.WINGS_SIZE * lerp(0.4, 1, sin(t * PI));
          const veinTip = p5.Vector.add(attach, p5.Vector.mult(veinDir, veinLen));
          veins.push(veinTip);
        }
        
        wings.push({
          side,
          attach: attach.copy(),
          tip,
          back,
          veins,
          veined: true
        });
        
      } else if (CONFIG.WINGS_STYLE === 'butterfly') {
        // Rounded butterfly wings
        const angleRad = radians(CONFIG.WINGS_ANGLE);
        const points = [];
        const segments = 12;
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const angle = lerp(-angleRad * 0.6, angleRad, t);
          const radius = CONFIG.WINGS_SIZE * sin(t * PI) * lerp(0.7, 1, sin(t * PI * 2));
          const dir = tangent.copy().rotate(side * angle);
          const pt = p5.Vector.add(attach, p5.Vector.mult(dir, radius));
          points.push(pt);
        }
        
        wings.push({
          side,
          attach: attach.copy(),
          points,
          butterfly: true
        });
        
      } else if (CONFIG.WINGS_STYLE === 'folded') {
        // Folded wings close to body
        const foldAngle = radians(20);
        const foldDir = normal.copy().mult(side).rotate(side * foldAngle);
        const backDir = tangent.copy().rotate(side * radians(150));
        
        const midPt = p5.Vector.add(attach, p5.Vector.mult(foldDir, CONFIG.WINGS_SIZE * 0.3));
        const tip = p5.Vector.add(midPt, p5.Vector.mult(backDir, CONFIG.WINGS_SIZE * 0.5));
        
        wings.push({
          side,
          attach: attach.copy(),
          midPt,
          tip,
          folded: true
        });
      }
    }
  }
}

// ============================================================================
// RENDERING
// ============================================================================

function renderCreature() {
  const N = spinePts.length;
  const growthN = growthT < 1 ? floor((N - 1) * growthT) : N - 1;
  const shellColor = getShellColor();

  // Render shell triangles
  stroke(shellColor);
  strokeWeight(CONFIG.SHELL_STROKE);
  strokeJoin(ROUND);
  
  // Apply fill if opacity > 0
  if (CONFIG.FILL_OPACITY > 0) {
    const r = parseInt(shellColor.slice(1, 3), 16);
    const g = parseInt(shellColor.slice(3, 5), 16);
    const b = parseInt(shellColor.slice(5, 7), 16);
    const alpha = CONFIG.FILL_OPACITY * 255;
    fill(r, g, b, alpha);
  } else {
    noFill();
  }

  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    // Check if this triangle is in growth range
    const triSegIdx = floor(i / 2);
    if (triSegIdx <= growthN) {
      drawTriangle(tri[0], tri[1], tri[2]);
    }
  }

  // Render braces
  noFill(); // Braces always wireframe
  for (let brace of braces) {
    const segIdx = floor(N * (brace.a.y - spinePts[0].y) / (spinePts[N - 1].y - spinePts[0].y + 0.001));
    if (segIdx <= growthN) {
      line(brace.a.x, brace.a.y, brace.b.x, brace.b.y);
    }
  }

  // Render legs (appear after delay)
  const legsShow = growthT >= (CONFIG.LEG_POP_DELAY_MS / CONFIG.GROWTH_DURATION_MS);
  if (legsShow) {
    renderLegs();
    
    // Render joint nodes if enabled
    if (CONFIG.JOINT_NODES_ENABLED) {
      renderJointNodes();
    }
  }
  
  // Render creature features
  if (growthT >= 0.7) {
    renderFeatures();
  }

  // Render spine (thin, optional)
  stroke(shellColor);
  strokeWeight(0.5);
  for (let i = 0; i < spinePts.length - 1; i++) {
    const pt = spinePts[i];
    const next = spinePts[i + 1];
    line(pt.x, pt.y, next.x, next.y);
  }
}

function renderLegs() {
  const legColor = getLegColor();
  stroke(legColor);
  strokeWeight(CONFIG.LEG_STROKE);
  strokeJoin(ROUND);
  
  // Apply fill if opacity > 0
  if (CONFIG.FILL_OPACITY > 0) {
    const r = parseInt(legColor.slice(1, 3), 16);
    const g = parseInt(legColor.slice(3, 5), 16);
    const b = parseInt(legColor.slice(5, 7), 16);
    const alpha = CONFIG.FILL_OPACITY * 255;
    fill(r, g, b, alpha);
  } else {
    noFill();
  }

  for (let leg of legs) {
    // Main truss
    line(leg.hip.x, leg.hip.y, leg.knee.x, leg.knee.y);
    line(leg.knee.x, leg.knee.y, leg.foot.x, leg.foot.y);

    // Side struts
    line(leg.hip.x, leg.hip.y, leg.footPad.left.x, leg.footPad.left.y);
    line(leg.knee.x, leg.knee.y, leg.footPad.right.x, leg.footPad.right.y);
    line(leg.footPad.left.x, leg.footPad.left.y, leg.footPad.right.x, leg.footPad.right.y);

    // Foot pad
    drawTriangle(leg.footPad.left, leg.footPad.right, leg.footPad.tip);

    // Toes
    if (CONFIG.FOOT_TOES === 2) {
      line(leg.toeL.x, leg.toeL.y, leg.toeR.x, leg.toeR.y);
    } else if (CONFIG.FOOT_TOES === 3) {
      // Draw three toes as lines fanning from the foot tip
      line(leg.footPad.tip.x, leg.footPad.tip.y, leg.toeL.x, leg.toeL.y);
      line(leg.footPad.tip.x, leg.footPad.tip.y, leg.toeM.x, leg.toeM.y);
      line(leg.footPad.tip.x, leg.footPad.tip.y, leg.toeR.x, leg.toeR.y);
    }
  }
}

// Render creature to a specific graphics target (e.g., offscreen SVG)
function renderCreatureTo(g) {
  const N = spinePts.length;
  const growthN = growthT < 1 ? floor((N - 1) * growthT) : N - 1;

  // Shell triangles
  g.stroke(CONFIG.SHELL_COLOR);
  g.strokeWeight(CONFIG.SHELL_STROKE);
  g.noFill();

  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    const triSegIdx = floor(i / 2);
    if (triSegIdx <= growthN) {
      g.line(tri[0].x, tri[0].y, tri[1].x, tri[1].y);
      g.line(tri[1].x, tri[1].y, tri[2].x, tri[2].y);
      g.line(tri[2].x, tri[2].y, tri[0].x, tri[0].y);
    }
  }

  // Braces
  for (let brace of braces) {
    const segIdx = floor(N * (brace.a.y - spinePts[0].y) / (spinePts[N - 1].y - spinePts[0].y + 0.001));
    if (segIdx <= growthN) {
      g.line(brace.a.x, brace.a.y, brace.b.x, brace.b.y);
    }
  }

  // Legs
  const legsShow = growthT >= (CONFIG.LEG_POP_DELAY_MS / CONFIG.GROWTH_DURATION_MS);
  if (legsShow) {
    renderLegsTo(g);
    
    // Render joint nodes if enabled
    if (CONFIG.JOINT_NODES_ENABLED) {
      renderJointNodesTo(g);
    }
  }
  
  // Creature features
  if (growthT >= 0.7) {
    renderFeaturesTo(g);
  }

  // Spine
  g.stroke(CONFIG.SHELL_COLOR);
  g.strokeWeight(0.5);
  for (let i = 0; i < spinePts.length - 1; i++) {
    const pt = spinePts[i];
    const next = spinePts[i + 1];
    g.line(pt.x, pt.y, next.x, next.y);
  }
}

function renderJointNodes() {
  const legColor = getLegColor();
  stroke(legColor);
  strokeWeight(1.5);
  fill(legColor);
  
  for (let leg of legs) {
    // Draw circles at hip, knee, and foot joints
    ellipse(leg.hip.x, leg.hip.y, CONFIG.JOINT_NODE_SIZE * 2, CONFIG.JOINT_NODE_SIZE * 2);
    ellipse(leg.knee.x, leg.knee.y, CONFIG.JOINT_NODE_SIZE * 2, CONFIG.JOINT_NODE_SIZE * 2);
    ellipse(leg.foot.x, leg.foot.y, CONFIG.JOINT_NODE_SIZE * 2, CONFIG.JOINT_NODE_SIZE * 2);
  }
}

function renderJointNodesTo(g) {
  g.stroke('#FF0000'); // Bright red stroke  
  g.strokeWeight(2);
  g.fill('#FF0000', 100); // Semi-transparent red fill
  
  for (let leg of legs) {
    // Draw circles at hip, knee, and foot joints
    g.ellipse(leg.hip.x, leg.hip.y, CONFIG.JOINT_NODE_SIZE * 2, CONFIG.JOINT_NODE_SIZE * 2);
    g.ellipse(leg.knee.x, leg.knee.y, CONFIG.JOINT_NODE_SIZE * 2, CONFIG.JOINT_NODE_SIZE * 2);
    g.ellipse(leg.foot.x, leg.foot.y, CONFIG.JOINT_NODE_SIZE * 2, CONFIG.JOINT_NODE_SIZE * 2);
  }
}

function renderLegsTo(g) {
  g.stroke(CONFIG.LEG_COLOR);
  g.strokeWeight(CONFIG.LEG_STROKE);
  g.noFill();

  for (let leg of legs) {
    // Main truss
    g.line(leg.hip.x, leg.hip.y, leg.knee.x, leg.knee.y);
    g.line(leg.knee.x, leg.knee.y, leg.foot.x, leg.foot.y);

    // Side struts
    g.line(leg.hip.x, leg.hip.y, leg.footPad.left.x, leg.footPad.left.y);
    g.line(leg.knee.x, leg.knee.y, leg.footPad.right.x, leg.footPad.right.y);
    g.line(leg.footPad.left.x, leg.footPad.left.y, leg.footPad.right.x, leg.footPad.right.y);

    // Foot pad
    g.line(leg.footPad.left.x, leg.footPad.left.y, leg.footPad.right.x, leg.footPad.right.y);
    g.line(leg.footPad.right.x, leg.footPad.right.y, leg.footPad.tip.x, leg.footPad.tip.y);
    g.line(leg.footPad.tip.x, leg.footPad.tip.y, leg.footPad.left.x, leg.footPad.left.y);

    // Toes
    if (CONFIG.FOOT_TOES === 2) {
      g.line(leg.toeL.x, leg.toeL.y, leg.toeR.x, leg.toeR.y);
    }
  }
}

function drawTriangle(a, b, c) {
  triangle(a.x, a.y, b.x, b.y, c.x, c.y);
}

// ============================================================================
// CREATURE FEATURES RENDERING
// ============================================================================

function renderFeatures() {
  const shellColor = getShellColor();
  stroke(shellColor);
  strokeWeight(CONFIG.SHELL_STROKE);
  strokeJoin(ROUND);
  noFill();
  
  // Render antennae
  for (let antenna of antennae) {
    if (CONFIG.ANTENNAE_STYLE === 'feathered' && antenna.feathers) {
      // Draw main shaft
      for (let i = 0; i < antenna.points.length - 1; i++) {
        const p = antenna.points[i];
        const n = antenna.points[i + 1];
        line(p.x, p.y, n.x, n.y);
      }
      // Draw feather branches
      for (let feather of antenna.feathers) {
        line(feather.base.x, feather.base.y, feather.tip.x, feather.tip.y);
      }
    } else {
      // Draw antenna as connected line segments
      for (let i = 0; i < antenna.points.length - 1; i++) {
        const p = antenna.points[i];
        const n = antenna.points[i + 1];
        line(p.x, p.y, n.x, n.y);
      }
    }
  }
  
  // Render eyes
  for (let eye of eyes) {
    if (eye.stalked) {
      // Draw eye stalk
      line(eye.base.x, eye.base.y, eye.pos.x, eye.pos.y);
      // Draw eye (filled)
      fill(shellColor);
      circle(eye.pos.x, eye.pos.y, eye.size);
      noFill();
    } else if (eye.compound) {
      // Draw compound eye outline
      circle(eye.pos.x, eye.pos.y, eye.size * 2);
      // Draw facets (filled)
      fill(shellColor);
      for (let facet of eye.facets) {
        circle(facet.x, facet.y, eye.facetSize);
      }
      noFill();
    } else {
      // Simple dot eye (filled)
      fill(shellColor);
      circle(eye.pos.x, eye.pos.y, eye.size);
      noFill();
    }
  }
  
  // Render tail
  if (tail.length > 0) {
    // Draw main tail segments
    for (let i = 0; i < tail.length; i++) {
      const segment = tail[i];
      
      if (segment.isBarb) {
        // Draw stinger barbs
        const prevPt = tail[i - 1];
        line(prevPt.x, prevPt.y, segment.left.x, segment.left.y);
        line(prevPt.x, prevPt.y, segment.right.x, segment.right.y);
      } else if (segment.isFork) {
        // Draw forked tail
        line(segment.base.x, segment.base.y, segment.left.x, segment.left.y);
        line(segment.base.x, segment.base.y, segment.right.x, segment.right.y);
      } else if (i < tail.length - 1 && !tail[i + 1].isBarb && !tail[i + 1].isFork) {
        // Draw normal segment
        const next = tail[i + 1];
        line(segment.x, segment.y, next.x, next.y);
      }
    }
  }
  
  // Render wings
  for (let wing of wings) {
    if (wing.triangular) {
      // Draw triangular wing
      line(wing.attach.x, wing.attach.y, wing.tip.x, wing.tip.y);
      line(wing.tip.x, wing.tip.y, wing.back.x, wing.back.y);
      line(wing.back.x, wing.back.y, wing.attach.x, wing.attach.y);
    } else if (wing.veined) {
      // Draw wing outline
      line(wing.attach.x, wing.attach.y, wing.tip.x, wing.tip.y);
      line(wing.tip.x, wing.tip.y, wing.back.x, wing.back.y);
      line(wing.back.x, wing.back.y, wing.attach.x, wing.attach.y);
      // Draw veins
      for (let vein of wing.veins) {
        line(wing.attach.x, wing.attach.y, vein.x, vein.y);
      }
    } else if (wing.butterfly) {
      // Draw butterfly wing outline
      for (let i = 0; i < wing.points.length - 1; i++) {
        const p = wing.points[i];
        const n = wing.points[i + 1];
        line(p.x, p.y, n.x, n.y);
      }
      // Close the wing
      line(wing.points[wing.points.length - 1].x, wing.points[wing.points.length - 1].y, 
           wing.attach.x, wing.attach.y);
    } else if (wing.folded) {
      // Draw folded wing
      line(wing.attach.x, wing.attach.y, wing.midPt.x, wing.midPt.y);
      line(wing.midPt.x, wing.midPt.y, wing.tip.x, wing.tip.y);
    }
  }
  
}

function renderFeaturesTo(g) {
  const shellColor = getShellColor();
  g.stroke(shellColor);
  g.strokeWeight(CONFIG.SHELL_STROKE);
  g.noFill();
  
  // Render antennae
  for (let antenna of antennae) {
    if (CONFIG.ANTENNAE_STYLE === 'feathered' && antenna.feathers) {
      // Draw main shaft
      for (let i = 0; i < antenna.points.length - 1; i++) {
        const p = antenna.points[i];
        const n = antenna.points[i + 1];
        g.line(p.x, p.y, n.x, n.y);
      }
      // Draw feather branches
      for (let feather of antenna.feathers) {
        g.line(feather.base.x, feather.base.y, feather.tip.x, feather.tip.y);
      }
    } else {
      // Draw antenna as connected line segments
      for (let i = 0; i < antenna.points.length - 1; i++) {
        const p = antenna.points[i];
        const n = antenna.points[i + 1];
        g.line(p.x, p.y, n.x, n.y);
      }
    }
  }
  
  // Render eyes
  for (let eye of eyes) {
    if (eye.stalked) {
      // Draw eye stalk
      g.line(eye.base.x, eye.base.y, eye.pos.x, eye.pos.y);
      // Draw eye (filled)
      g.fill(shellColor);
      g.circle(eye.pos.x, eye.pos.y, eye.size);
      g.noFill();
    } else if (eye.compound) {
      // Draw compound eye outline
      g.circle(eye.pos.x, eye.pos.y, eye.size * 2);
      // Draw facets (filled)
      g.fill(shellColor);
      for (let facet of eye.facets) {
        g.circle(facet.x, facet.y, eye.facetSize);
      }
      g.noFill();
    } else {
      // Simple dot eye (filled)
      g.fill(shellColor);
      g.circle(eye.pos.x, eye.pos.y, eye.size);
      g.noFill();
    }
  }
  
  // Render tail
  if (tail.length > 0) {
    // Draw main tail segments
    for (let i = 0; i < tail.length; i++) {
      const segment = tail[i];
      
      if (segment.isBarb) {
        // Draw stinger barbs
        const prevPt = tail[i - 1];
        g.line(prevPt.x, prevPt.y, segment.left.x, segment.left.y);
        g.line(prevPt.x, prevPt.y, segment.right.x, segment.right.y);
      } else if (segment.isFork) {
        // Draw forked tail
        g.line(segment.base.x, segment.base.y, segment.left.x, segment.left.y);
        g.line(segment.base.x, segment.base.y, segment.right.x, segment.right.y);
      } else if (i < tail.length - 1 && !tail[i + 1].isBarb && !tail[i + 1].isFork) {
        // Draw normal segment
        const next = tail[i + 1];
        g.line(segment.x, segment.y, next.x, next.y);
      }
    }
  }
  
  // Render wings
  for (let wing of wings) {
    if (wing.triangular) {
      // Draw triangular wing
      g.line(wing.attach.x, wing.attach.y, wing.tip.x, wing.tip.y);
      g.line(wing.tip.x, wing.tip.y, wing.back.x, wing.back.y);
      g.line(wing.back.x, wing.back.y, wing.attach.x, wing.attach.y);
    } else if (wing.veined) {
      // Draw wing outline
      g.line(wing.attach.x, wing.attach.y, wing.tip.x, wing.tip.y);
      g.line(wing.tip.x, wing.tip.y, wing.back.x, wing.back.y);
      g.line(wing.back.x, wing.back.y, wing.attach.x, wing.attach.y);
      // Draw veins
      for (let vein of wing.veins) {
        g.line(wing.attach.x, wing.attach.y, vein.x, vein.y);
      }
    } else if (wing.butterfly) {
      // Draw butterfly wing outline
      for (let i = 0; i < wing.points.length - 1; i++) {
        const p = wing.points[i];
        const n = wing.points[i + 1];
        g.line(p.x, p.y, n.x, n.y);
      }
      // Close the wing
      g.line(wing.points[wing.points.length - 1].x, wing.points[wing.points.length - 1].y, 
             wing.attach.x, wing.attach.y);
    } else if (wing.folded) {
      // Draw folded wing
      g.line(wing.attach.x, wing.attach.y, wing.midPt.x, wing.midPt.y);
      g.line(wing.midPt.x, wing.midPt.y, wing.tip.x, wing.tip.y);
    }
  }
  
}

// ============================================================================
// CONTROLS
// ============================================================================

function keyPressed() {
  if (key === 'r' || key === 'R') {
    reset();
  } else if (key === 's' || key === 'S') {
    savePNG();
  } else if (key === 'v' || key === 'V') {
    saveSVG();
  } else if (key === 'g' || key === 'G') {
    // Reset to default color scheme
    currentPalette = null;
    redraw();
  } else if (key === 'c' || key === 'C') {
    // Pick random 2-color palette
    pickRandomPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    // Shuffle current palette
    shufflePalette();
    redraw();
  }
}

function reset() {
  rawSpinePts = [];
  spinePts = [];
  leftRail = [];
  rightRail = [];
  triangles = [];
  braces = [];
  legs = [];
  antennae = [];
  eyes = [];
  tail = [];
  wings = [];
  rings = [];
  built = false;
  growthT = 0;
  growthStartTime = null;
  isDrawing = false;
  background(getBGColor());
}

function getActivePalette() {
  if (currentPalette && currentPalette.length >= 2) {
    return currentPalette;
  }
  return [CONFIG.BG, CONFIG.SHELL_COLOR];
}

function getShellColor() {
  const palette = getActivePalette();
  return palette[1];
}

function getLegColor() {
  const palette = getActivePalette();
  return palette[1];
}

function getBGColor() {
  const palette = getActivePalette();
  return palette[0];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = null;
    return;
  }

  // Pick random 2-color palette only
  const choices = paletteData.palettes.filter(
    (palette) => palette.colors && palette.colors.length === 2,
  );

  if (!choices.length) {
    currentPalette = null;
    return;
  }

  const pick = choices[Math.floor(Math.random() * choices.length)];
  currentPalette = pick.colors;
}

function shufflePalette() {
  if (!currentPalette || currentPalette.length < 2) {
    return;
  }
  // Swap the two colors
  currentPalette = [currentPalette[1], currentPalette[0]];
}

function savePNG() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scale = 2; // 2x upscaling: 540×675 → 1080×1350
  const exportWidth = CONFIG.WIDTH * scale;
  const exportHeight = CONFIG.HEIGHT * scale;

  // Create off-screen HTML canvas element
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = exportWidth;
  offscreenCanvas.height = exportHeight;
  const ctx = offscreenCanvas.getContext('2d');
  // Active 2-color palette: [background, creature]
  const palette = getActivePalette();
  const bgColor = palette[0];
  const creatureColor = palette[1];

  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, exportWidth, exportHeight);

  // Setup fill style if opacity > 0
  let fillStyle = null;
  if (CONFIG.FILL_OPACITY > 0) {
    const r = parseInt(creatureColor.slice(1, 3), 16);
    const g = parseInt(creatureColor.slice(3, 5), 16);
    const b = parseInt(creatureColor.slice(5, 7), 16);
    const alpha = Math.round(CONFIG.FILL_OPACITY * 255);
    fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
  }

  // Render shell triangles at scaled size
  ctx.strokeStyle = creatureColor;
  ctx.lineWidth = CONFIG.SHELL_STROKE * scale;
  ctx.lineJoin = 'round';
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
  }

  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    const triSegIdx = floor(i / 2);
    if (triSegIdx <= floor((spinePts.length - 1) * growthT) || growthT >= 1) {
      const p0 = { x: tri[0].x * scale, y: tri[0].y * scale };
      const p1 = { x: tri[1].x * scale, y: tri[1].y * scale };
      const p2 = { x: tri[2].x * scale, y: tri[2].y * scale };
      drawFilledTriangleToContext(ctx, p0, p1, p2, fillStyle);
    }
  }

  // Render braces
  ctx.fillStyle = 'transparent'; // Braces never filled
  for (let brace of braces) {
    const segIdx = floor(spinePts.length * (brace.a.y - spinePts[0].y) / (spinePts[spinePts.length - 1].y - spinePts[0].y + 0.001));
    if (segIdx <= floor((spinePts.length - 1) * growthT) || growthT >= 1) {
      ctx.beginPath();
      ctx.moveTo(brace.a.x * scale, brace.a.y * scale);
      ctx.lineTo(brace.b.x * scale, brace.b.y * scale);
      ctx.stroke();
    }
  }

  // Render spine
  ctx.lineWidth = 0.5 * scale;
  for (let i = 0; i < spinePts.length - 1; i++) {
    const pt = spinePts[i];
    const next = spinePts[i + 1];
    ctx.beginPath();
    ctx.moveTo(pt.x * scale, pt.y * scale);
    ctx.lineTo(next.x * scale, next.y * scale);
    ctx.stroke();
  }

  // Render legs (if animation complete)
  const legsShow = growthT >= (CONFIG.LEG_POP_DELAY_MS / CONFIG.GROWTH_DURATION_MS) || !CONFIG.USE_GROWTH_ANIM;
  if (legsShow && legs.length > 0) {
    ctx.strokeStyle = creatureColor;
    ctx.lineWidth = CONFIG.LEG_STROKE * scale;
    ctx.lineJoin = 'round';
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
    }

    for (let leg of legs) {
      // Main truss
      ctx.beginPath();
      ctx.moveTo(leg.hip.x * scale, leg.hip.y * scale);
      ctx.lineTo(leg.knee.x * scale, leg.knee.y * scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leg.knee.x * scale, leg.knee.y * scale);
      ctx.lineTo(leg.foot.x * scale, leg.foot.y * scale);
      ctx.stroke();

      // Side struts
      ctx.beginPath();
      ctx.moveTo(leg.hip.x * scale, leg.hip.y * scale);
      ctx.lineTo(leg.footPad.left.x * scale, leg.footPad.left.y * scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leg.knee.x * scale, leg.knee.y * scale);
      ctx.lineTo(leg.footPad.right.x * scale, leg.footPad.right.y * scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(leg.footPad.left.x * scale, leg.footPad.left.y * scale);
      ctx.lineTo(leg.footPad.right.x * scale, leg.footPad.right.y * scale);
      ctx.stroke();

      // Foot pad (with fill if enabled)
      const fp0 = { x: leg.footPad.left.x * scale, y: leg.footPad.left.y * scale };
      const fp1 = { x: leg.footPad.right.x * scale, y: leg.footPad.right.y * scale };
      const fp2 = { x: leg.footPad.tip.x * scale, y: leg.footPad.tip.y * scale };
      drawFilledTriangleToContext(ctx, fp0, fp1, fp2, fillStyle);

      // Toes
      if (CONFIG.FOOT_TOES === 2) {
        ctx.beginPath();
        ctx.moveTo(leg.toeL.x * scale, leg.toeL.y * scale);
        ctx.lineTo(leg.toeR.x * scale, leg.toeR.y * scale);
        ctx.stroke();
      }
    }
  }
  
  // Render creature features
  ctx.strokeStyle = creatureColor;
  ctx.lineWidth = CONFIG.SHELL_STROKE * scale;
  ctx.lineJoin = 'round';
  
  // Antennae
  for (let antenna of antennae) {
    if (CONFIG.ANTENNAE_STYLE === 'feathered' && antenna.feathers) {
      for (let i = 0; i < antenna.points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(antenna.points[i].x * scale, antenna.points[i].y * scale);
        ctx.lineTo(antenna.points[i + 1].x * scale, antenna.points[i + 1].y * scale);
        ctx.stroke();
      }
      for (let feather of antenna.feathers) {
        ctx.beginPath();
        ctx.moveTo(feather.base.x * scale, feather.base.y * scale);
        ctx.lineTo(feather.tip.x * scale, feather.tip.y * scale);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < antenna.points.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(antenna.points[i].x * scale, antenna.points[i].y * scale);
        ctx.lineTo(antenna.points[i + 1].x * scale, antenna.points[i + 1].y * scale);
        ctx.stroke();
      }
    }
  }
  
  // Eyes
  for (let eye of eyes) {
    if (eye.stalked) {
      ctx.beginPath();
      ctx.moveTo(eye.base.x * scale, eye.base.y * scale);
      ctx.lineTo(eye.pos.x * scale, eye.pos.y * scale);
      ctx.stroke();
      ctx.fillStyle = creatureColor;
      ctx.beginPath();
      ctx.arc(eye.pos.x * scale, eye.pos.y * scale, eye.size * scale / 2, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
    } else if (eye.compound) {
      ctx.beginPath();
      ctx.arc(eye.pos.x * scale, eye.pos.y * scale, eye.size * scale, 0, TWO_PI);
      ctx.stroke();
      ctx.fillStyle = creatureColor;
      for (let facet of eye.facets) {
        ctx.beginPath();
        ctx.arc(facet.x * scale, facet.y * scale, eye.facetSize * scale / 2, 0, TWO_PI);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = creatureColor;
      ctx.beginPath();
      ctx.arc(eye.pos.x * scale, eye.pos.y * scale, eye.size * scale / 2, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
    }
  }
  
  // Tail
  for (let i = 0; i < tail.length; i++) {
    const segment = tail[i];
    if (segment.isBarb) {
      const prevPt = tail[i - 1];
      ctx.beginPath();
      ctx.moveTo(prevPt.x * scale, prevPt.y * scale);
      ctx.lineTo(segment.left.x * scale, segment.left.y * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(prevPt.x * scale, prevPt.y * scale);
      ctx.lineTo(segment.right.x * scale, segment.right.y * scale);
      ctx.stroke();
    } else if (segment.isFork) {
      ctx.beginPath();
      ctx.moveTo(segment.base.x * scale, segment.base.y * scale);
      ctx.lineTo(segment.left.x * scale, segment.left.y * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(segment.base.x * scale, segment.base.y * scale);
      ctx.lineTo(segment.right.x * scale, segment.right.y * scale);
      ctx.stroke();
    } else if (i < tail.length - 1 && !tail[i + 1].isBarb && !tail[i + 1].isFork) {
      const next = tail[i + 1];
      ctx.beginPath();
      ctx.moveTo(segment.x * scale, segment.y * scale);
      ctx.lineTo(next.x * scale, next.y * scale);
      ctx.stroke();
    }
  }
  
  // Wings
  for (let wing of wings) {
    if (wing.triangular) {
      ctx.beginPath();
      ctx.moveTo(wing.attach.x * scale, wing.attach.y * scale);
      ctx.lineTo(wing.tip.x * scale, wing.tip.y * scale);
      ctx.lineTo(wing.back.x * scale, wing.back.y * scale);
      ctx.closePath();
      ctx.stroke();
    } else if (wing.veined) {
      ctx.beginPath();
      ctx.moveTo(wing.attach.x * scale, wing.attach.y * scale);
      ctx.lineTo(wing.tip.x * scale, wing.tip.y * scale);
      ctx.lineTo(wing.back.x * scale, wing.back.y * scale);
      ctx.closePath();
      ctx.stroke();
      for (let vein of wing.veins) {
        ctx.beginPath();
        ctx.moveTo(wing.attach.x * scale, wing.attach.y * scale);
        ctx.lineTo(vein.x * scale, vein.y * scale);
        ctx.stroke();
      }
    } else if (wing.butterfly) {
      ctx.beginPath();
      ctx.moveTo(wing.attach.x * scale, wing.attach.y * scale);
      for (let p of wing.points) {
        ctx.lineTo(p.x * scale, p.y * scale);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (wing.folded) {
      ctx.beginPath();
      ctx.moveTo(wing.attach.x * scale, wing.attach.y * scale);
      ctx.lineTo(wing.midPt.x * scale, wing.midPt.y * scale);
      ctx.lineTo(wing.tip.x * scale, wing.tip.y * scale);
      ctx.stroke();
    }
  }
  

  // Convert canvas to blob and download
  offscreenCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genuary-25-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function drawTriangleToContext(ctx, a, b, c) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.stroke();
}

function drawFilledTriangleToContext(ctx, a, b, c, fillStyle) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fill();
  }
  ctx.stroke();
}

function saveSVG() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `genuary-25-${timestamp}.svg`;

  // If SVG plugin isn't available, fall back to p5 save()
  if (typeof SVG === 'undefined') {
    save(filename);
    return;
  }

  // Render to an offscreen SVG graphics
  const pg = createGraphics(CONFIG.WIDTH, CONFIG.HEIGHT, SVG);
  renderCreatureTo(pg);

  // Serialize the SVG directly and force the desired filename
  try {
    const svgNode = pg._renderer && pg._renderer.svg ? pg._renderer.svg : null;
    if (svgNode) {
      const svgString = new XMLSerializer().serializeToString(svgNode);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback to p5 save if renderer internals not accessible
      save(pg, filename);
    }
  } catch (e) {
    console.error('SVG export failed, falling back to p5 save:', e);
    save(pg, filename);
  }

  setTimeout(() => {
    pg.remove();
  }, 0);
}

// ============================================================================
// HTML INTERFACE COMMUNICATION
// ============================================================================

// Called by HTML dropdown to change width profile
function setWidthProfile(profileName) {
  CONFIG.BODY_WIDTH_PROFILE = profileName;
  // Rebuild if already built (without resetting animation)
  if (built && spinePts.length > 0) {
    buildCreature();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

// Feature control functions called from HTML
function setAntennaeEnabled(enabled) {
  CONFIG.ANTENNAE_ENABLED = enabled;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setAntennaeStyle(style) {
  CONFIG.ANTENNAE_STYLE = style;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setAntennaeLength(length) {
  CONFIG.ANTENNAE_LENGTH = length;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setAntennaeAngle(angle) {
  CONFIG.ANTENNAE_ANGLE = angle;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setAntennaeSegments(segments) {
  CONFIG.ANTENNAE_SEGMENTS = segments;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setAntennaeFeatherCount(count) {
  CONFIG.ANTENNAE_FEATHER_COUNT = count;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setEyesEnabled(enabled) {
  CONFIG.EYES_ENABLED = enabled;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setEyesStyle(style) {
  CONFIG.EYES_STYLE = style;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setEyesSize(size) {
  CONFIG.EYES_SIZE = size;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setEyesOffset(offset) {
  CONFIG.EYES_OFFSET = offset;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setEyesStalkLength(length) {
  CONFIG.EYES_STALK_LENGTH = length;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setEyesCount(count) {
  CONFIG.EYES_COUNT = count;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setTailEnabled(enabled) {
  CONFIG.TAIL_ENABLED = enabled;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setTailStyle(style) {
  CONFIG.TAIL_STYLE = style;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setTailLength(length) {
  CONFIG.TAIL_LENGTH = length;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setTailSegments(segments) {
  CONFIG.TAIL_SEGMENTS = segments;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setTailCurve(curve) {
  CONFIG.TAIL_CURVE = curve;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setTailForkAngle(angle) {
  CONFIG.TAIL_FORK_ANGLE = angle;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setWingsEnabled(enabled) {
  CONFIG.WINGS_ENABLED = enabled;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setWingsStyle(style) {
  CONFIG.WINGS_STYLE = style;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setFlipHeadTail(flip) {
  CONFIG.FLIP_HEAD_TAIL = flip;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    // Always set growth to 100% so no animation plays
    growthT = 1;
  }
}

function setWingsSize(size) {
  CONFIG.WINGS_SIZE = size;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setWingsAngle(angle) {
  CONFIG.WINGS_ANGLE = angle;
  if (built && spinePts.length > 0) {
    rebuildFeatures();
    growthT = 1;
  }
}

function setLegCount(count) {
  CONFIG.LEG_COUNT_CONFIGURABLE = count;
  // Update LEG_ANCHOR_FRACTIONS based on count
  if (count === 2) {
    CONFIG.LEG_ANCHOR_FRACTIONS = [0.35, 0.65];
  } else if (count === 3) {
    CONFIG.LEG_ANCHOR_FRACTIONS = [0.25, 0.5, 0.75];
  } else if (count === 4) {
    CONFIG.LEG_ANCHOR_FRACTIONS = [0.22, 0.38, 0.62, 0.78];
  } else if (count === 5) {
    CONFIG.LEG_ANCHOR_FRACTIONS = [0.18, 0.36, 0.5, 0.64, 0.82];
  } else if (count === 6) {
    CONFIG.LEG_ANCHOR_FRACTIONS = [0.15, 0.3, 0.45, 0.55, 0.7, 0.85];
  } else if (count === 7) {
    CONFIG.LEG_ANCHOR_FRACTIONS = [0.14, 0.27, 0.4, 0.5, 0.6, 0.73, 0.86];
  } else if (count === 8) {
    CONFIG.LEG_ANCHOR_FRACTIONS = [0.125, 0.25, 0.375, 0.475, 0.525, 0.625, 0.75, 0.875];
  }
  if (built && spinePts.length > 0) {
    // Regenerate legs with new anchor positions
    legs = [];
    generateLegs();
    growthT = 1;
  }
}

function setJointNodesEnabled(enabled) {
  CONFIG.JOINT_NODES_ENABLED = enabled;
  if (built && spinePts.length > 0) {
    growthT = 1;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function smoothstep(edge0, edge1, x) {
  const t = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return sqrt(dx * dx + dy * dy);
}
