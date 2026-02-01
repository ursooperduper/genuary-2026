// ============================================================================
// Day 29: Vertical Growth Strata (Botanical Relatives)
// Shared genome across strata, cumulative mutation only
// ============================================================================

const CONFIG = {
  // ========== CANVAS ==========
  // Canvas width in pixels
  WIDTH: 540,
  // Canvas height in pixels
  HEIGHT: 675,
  // Background color (paired with organism color via palette)
  BG: '#000000',

  // ========== SPINE CAPTURE ==========
  // Stroke weight while drawing a custom spine
  // Range: 1-10
  SPINE_DRAW_STROKE: 2,
  // Stroke color while drawing a custom spine
  SPINE_DRAW_COLOR: '#FFFFFF',
  // Minimum number of mouse points required to accept a spine
  // Range: 10-50
  MIN_POINTS: 10,
  // Minimum pixel distance between captured points (jitter rejection)
  // Range: 0.5-5
  MIN_DISTANCE: 2,
  // Simplification tolerance (RDP). Higher = simpler
  // Range: 1-8
  SIMPLIFY_EPS: 2.5,
  // Resample spacing in pixels along the spine
  // Range: 5-20
  RESAMPLE_STEP: 10,

  // Random lineage stem (default)
  // Number of points for the auto-generated spine
  // Range: 20-60
  // RANDOM_SPINE_POINTS: 38,
  RANDOM_SPINE_POINTS: 8,
  // Horizontal wobble amplitude in pixels
  // Range: 20-140
  // RANDOM_SPINE_WOBBLE: 90,
  RANDOM_SPINE_WOBBLE: 140,
  // RANDOM_SPINE_WOBBLE: 20,
  // Noise scale for wobble frequency
  // Range: 0.6-2.5
  // RANDOM_SPINE_NOISE_SCALE: 1.4,
  RANDOM_SPINE_NOISE_SCALE: 2.5,
  
  // ========== STRATA ==========
  // Number of horizontal strata
  // Range: 5-10 recommended
  STRATA_COUNT: 3,
  // Vertical gap between strata in pixels
  // Range: 0-16
  STRATA_GAP: -40,
  // Opacity (0-1) for top stratum
  // Range: 0.2-1
  // STRATA_OPACITY_TOP: 0.65,
  STRATA_OPACITY_TOP: 0.65,
  // Opacity (0-1) for bottom stratum
  // Range: 0.6-1
  STRATA_OPACITY_BOTTOM: 1.0,

  // Horizontal margin used to keep stem inside each stratum
  // Range: 20-80
  STEM_MARGIN_X: 50,
  // Vertical margin inside each stratum
  // Range: 8-30
  STEM_MARGIN_Y: 18,
  // Extra downward offset for the bottom stratum stem (pixels)
  // Range: 0-30
  BOTTOM_STEM_OVERRUN: 24,
  // Overall lineage height scale (min, max). 1 = full height.
  // Range: 0.7-1.1
  // LINEAGE_HEIGHT_SCALE_RANGE: [0.82, 1.05],
  LINEAGE_HEIGHT_SCALE_RANGE: [0.42, 1.05],

  // ========== VASCULAR STRUCTURE ==========
  // Maximum half-width of the body at its widest point
  // Range: 40-130
  // BODY_MAX_WIDTH: 70,
  BODY_MAX_WIDTH: 40,
  // Fraction of spine length tapered at each end
  // Range: 0.05-0.3
  // BODY_END_TAPER: 0.18,
  BODY_END_TAPER: 0.05,
  BODY_END_TAPER: 0.3,
  // Width profile: 'bell', 'linear', 'sigmoid', 'barrel', 'double-bump'
  BODY_WIDTH_PROFILE: 'linear',
  // How much curvature reduces width (0 = none)
  // Range: 0-0.45
  // CURVATURE_THINNING: 0.18,
  // CURVATURE_THINNING: 0.45,
  CURVATURE_THINNING: 0.15,
  // Line weight for vascular mesh
  // Range: 0.5-2
  SHELL_STROKE: 1,
  // Line weight for the stem (thicker than shell)
  // Range: 1-3
  STEM_STROKE: 4,
  // Primary organism color (paired with BG in palette)
  SHELL_COLOR: '#00FF66',
  // Triangulation diagonal pattern: 'alternate' or 'fixed'
  TRI_DIAGONAL_MODE: 'fixed',
  // Add braces every N segments (lower = denser)
  // Range: 2-10
  // BRACE_EVERY: 5,
  // BRACE_EVERY: 2,
  // BRACE_EVERY: 2,
  BRACE_EVERY: 5,
  // Probability each brace slot is used
  // Range: 0-1
  // BRACE_PROB: 0.4,
  // BRACE_PROB: 0,
  // BRACE_PROB: 0.6,
  BRACE_PROB: 0.2,
  // Add ribs every N segments (lower = denser)
  // Range: 2-10
  // INNER_RIB_EVERY: 6,
  // INNER_RIB_EVERY: 2,
  INNER_RIB_EVERY: 20,
  // INNER_RIB_EVERY: 10,

  // ========== MUTATION STEPS ==========
  // Per-stratum increments applied cumulatively
  // Values are scaled by a small random factor internally
  MUTATION_STEPS: {
    // Width increase per mutation step
    BODY_MAX_WIDTH: 6,
    // Curvature thinning increase per step
    CURVATURE_THINNING: 0.03,
    // Brace spacing change per step (negative = denser)
    // BRACE_EVERY: -1,
    BRACE_EVERY: 2,
    // Brace probability change per step
    BRACE_PROB: 0.08,
    // Rib spacing change per step (negative = denser)
    // INNER_RIB_EVERY: -1,
    INNER_RIB_EVERY: 4,
    // INNER_RIB_EVERY: 12,
  },

  // ========== BRANCHING ==========
  // Fixed fractional anchors along spine (0-1)
  BRANCH_ANCHOR_FRACTIONS: [0.18, 0.32, 0.48, 0.62, 0.78],
  // Additional anchors from highest curvature points
  // Range: 0-6
  // BRANCH_CURVATURE_ANCHORS: 3,
  BRANCH_CURVATURE_ANCHORS: 6,
  // Branch count range (early -> late strata)
  BRANCH_COUNT_RANGE: [0, 6],
  // Branch length range in pixels
  // BRANCH_LENGTH_RANGE: [50, 130],
  BRANCH_LENGTH_RANGE: [80, 150],
  // BRANCH_LENGTH_RANGE: [20, 120],
  // Base branch angle from tangent in degrees
  // Range: 10-45
  // BRANCH_ANGLE_BASE: 25,
  BRANCH_ANGLE_BASE: 45,
  // Max additional angle variance in degrees
  // Range: 10-60
  // BRANCH_ANGLE_VARIANCE_MAX: 35,
  BRANCH_ANGLE_VARIANCE_MAX: 50,
  // Max recursive depth
  // Range: 0-2
  // BRANCH_DEPTH_MAX: 2,
  BRANCH_DEPTH_MAX: 1,
  // Failure probability range (early -> late strata)
  BRANCH_FAILURE_RANGE: [0.1, 0.35],

  // ========== TERMINAL GROWTH ==========
  // Stratum ratio after which terminals appear (0-1)
  // 0.5 = start at middle
  // TERMINAL_START_RATIO: 0.55,
  // TERMINAL_START_RATIO: 0.95,
  TERMINAL_START_RATIO: 0.5,
  // TERMINAL_START_RATIO: 0.25,
  // Probability of terminals per tip (early -> late strata)
  // TERMINAL_DENSITY_RANGE: [0.0, 0.35],
  TERMINAL_DENSITY_RANGE: [0.0, 0.75],
  // TERMINAL_DENSITY_RANGE: [0.0, 0.45],
  // Terminal size range in pixels
  // TERMINAL_SIZE_RANGE: [6, 18],
  // TERMINAL_SIZE_RANGE: [2, 50],
  TERMINAL_SIZE_RANGE: [2, 20],
  // TERMINAL_SIZE_RANGE: [2, 10],
  // Burst lines for upward shoots
  BURST_ENABLED: true,
  // Number of lines per burst
  // Range: 8-20
  BURST_LINE_COUNT_RANGE: [8, 20],
  // Length range for burst lines (pixels)
  // Range: 12-40
  // BURST_LENGTH_RANGE: [14, 38],
  BURST_LENGTH_RANGE: [14, 40],
  // Fan spread in degrees (centered on tip direction)
  // Range: 30-120
  // BURST_SPREAD_DEG: 80,
  BURST_SPREAD_DEG: 120,
  // Curvature per segment in degrees
  // Range: 4-18
  // BURST_CURVE_DEG: 10,
  BURST_CURVE_DEG: 18,
  // Probability of burst on strong upward shoots
  // Range: 0-1
  // BURST_PROB: 0.6,
  BURST_PROB: 1,

  // ========== RENDERING ==========
  // Fill opacity for vascular mesh (0 = wireframe)
  // Range: 0-0.6
  FILL_OPACITY: 0.6,
};


// ============================================================================
// STATE
// ============================================================================

let rawSpinePts = [];
let baseSpinePts = [];
let baseSpineNorm = [];
let baseSpineBox = null;
let strata = [];
let branchAnchors = [];
let built = false;
let isDrawing = false;
let paletteData = null;
let currentPalette = null;
let baseSeed = 0;

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
  generateLineage();
}

function draw() {
  background(getBGColor());

  if (isDrawing) {
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
    return;
  }

  if (built) {
    renderStrata();
  }
}

// ============================================================================
// INPUT: MOUSE DRAWING (OPTIONAL)
// ============================================================================

function mousePressed() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  rawSpinePts = [createVector(mouseX, mouseY)];
  built = false;
  isDrawing = true;
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
    buildLineageFromRaw();
  } else {
    generateLineage();
  }
}

// ============================================================================
// LINEAGE GENERATION
// ============================================================================

function generateLineage() {
  baseSeed = floor(random(1000000));
  randomSeed(baseSeed);
  rawSpinePts = generateRandomSpine();
  buildLineageFromRaw();
}

function buildLineageFromRaw() {
  const simplified = simplifyRDP(rawSpinePts, CONFIG.SIMPLIFY_EPS);
  const resampled = resample(simplified, CONFIG.RESAMPLE_STEP);
  baseSpinePts = resampled;

  if (baseSpinePts.length < 3) {
    built = false;
    return;
  }

  normalizeBaseSpine();
  branchAnchors = buildBranchAnchors();
  buildStrata();
  built = true;
}

function normalizeBaseSpine() {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let pt of baseSpinePts) {
    minX = min(minX, pt.x);
    maxX = max(maxX, pt.x);
    minY = min(minY, pt.y);
    maxY = max(maxY, pt.y);
  }

  const boxWidth = max(10, maxX - minX);
  const boxHeight = max(10, maxY - minY);
  const centerX = (minX + maxX) / 2;

  baseSpineNorm = baseSpinePts.map((pt) =>
    createVector((pt.x - centerX) / boxWidth, (pt.y - minY) / boxHeight),
  );
  baseSpineBox = { width: boxWidth, height: boxHeight };
}

function buildStrata() {
  strata = [];
  const count = CONFIG.STRATA_COUNT;
  const gap = CONFIG.STRATA_GAP;
  randomSeed(baseSeed + 7);
  const heightScale = random(
    CONFIG.LINEAGE_HEIGHT_SCALE_RANGE[0],
    CONFIG.LINEAGE_HEIGHT_SCALE_RANGE[1],
  );
  const stackHeight = height * heightScale;
  const startY = height - stackHeight;
  const stratumHeight = (stackHeight - gap * (count - 1)) / count;
  const availableWidth = width - CONFIG.STEM_MARGIN_X * 2;
  const availableHeight = stratumHeight - CONFIG.STEM_MARGIN_Y * 2;

  const scale = min(
    availableWidth / baseSpineBox.width,
    availableHeight / baseSpineBox.height,
  );

  const mutationStack = buildMutationStack(count);

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 1 : i / (count - 1);
    const topY = startY + i * (stratumHeight + gap);
    const marginTop = CONFIG.STEM_MARGIN_Y;
    const marginBottom = CONFIG.STEM_MARGIN_Y;
    const extraYOffset = i === count - 1 ? CONFIG.BOTTOM_STEM_OVERRUN : 0;
    const bounds = {
      top: topY,
      bottom: topY + stratumHeight,
      height: stratumHeight,
      marginTop,
      marginBottom,
    };

    const spinePts = mapNormalizedSpine(scale, topY, marginTop, extraYOffset);
    const params = mutationStack[i];

    randomSeed(baseSeed + i * 1337);
    const rails = computeRails(spinePts, params);
    const shell = triangulateShell(spinePts, rails.left, rails.right, params);

    const branches = generateBranches(
      spinePts,
      rails,
      params,
      t,
      bounds,
      baseSeed + i * 197,
    );

    const terminals = generateTerminals(
      spinePts,
      branches,
      t,
      bounds,
      baseSeed + i * 271,
    );

    strata.push({
      spinePts,
      leftRail: rails.left,
      rightRail: rails.right,
      triangles: shell.triangles,
      braces: shell.braces,
      branches,
      terminals,
      t,
      bounds,
    });
  }
}

function buildMutationStack(count) {
  const mutations = [];
  let current = {
    BODY_MAX_WIDTH: CONFIG.BODY_MAX_WIDTH,
    BODY_END_TAPER: CONFIG.BODY_END_TAPER,
    BODY_WIDTH_PROFILE: CONFIG.BODY_WIDTH_PROFILE,
    CURVATURE_THINNING: CONFIG.CURVATURE_THINNING,
    TRI_DIAGONAL_MODE: CONFIG.TRI_DIAGONAL_MODE,
    BRACE_EVERY: CONFIG.BRACE_EVERY,
    BRACE_PROB: CONFIG.BRACE_PROB,
    INNER_RIB_EVERY: CONFIG.INNER_RIB_EVERY,
  };

  mutations.push({ ...current });

  for (let i = 1; i < count; i++) {
    randomSeed(baseSeed + i * 101);
    const next = { ...current };
    const keys = ['BODY_MAX_WIDTH', 'CURVATURE_THINNING', 'BRACE_EVERY', 'BRACE_PROB', 'INNER_RIB_EVERY'];
    const pickCount = random() < 0.65 ? 1 : 2;

    for (let k = 0; k < pickCount; k++) {
      const key = keys[floor(random(keys.length))];
      const step = CONFIG.MUTATION_STEPS[key];
      const delta = step * (0.6 + random() * 0.6);

      if (key === 'BRACE_EVERY' || key === 'INNER_RIB_EVERY') {
        next[key] = constrain(round(next[key] + delta), 2, 10);
      } else if (key === 'CURVATURE_THINNING') {
        next[key] = constrain(next[key] + delta, 0, 0.45);
      } else if (key === 'BRACE_PROB') {
        next[key] = constrain(next[key] + delta, 0.05, 0.95);
      } else if (key === 'BODY_MAX_WIDTH') {
        next[key] = constrain(next[key] + delta, 40, 130);
      }
    }

    mutations.push(next);
    current = next;
  }

  return mutations;
}

function mapNormalizedSpine(scale, topY, marginTop, extraYOffset) {
  const centerX = width / 2;
  return baseSpineNorm.map((pt) =>
    createVector(
      centerX + pt.x * baseSpineBox.width * scale,
      topY + marginTop + pt.y * baseSpineBox.height * scale + extraYOffset,
    ),
  );
}

function generateRandomSpine() {
  const pts = [];
  const marginX = CONFIG.STEM_MARGIN_X + 20;
  const marginY = CONFIG.STEM_MARGIN_Y + 20;
  const usableHeight = height - marginY * 2;
  const centerX = width / 2 + random(-40, 40);
  const noiseOffset = random(1000);

  for (let i = 0; i < CONFIG.RANDOM_SPINE_POINTS; i++) {
    const t = i / (CONFIG.RANDOM_SPINE_POINTS - 1);
    const wobble =
      (noise(noiseOffset + t * CONFIG.RANDOM_SPINE_NOISE_SCALE) - 0.5) *
      CONFIG.RANDOM_SPINE_WOBBLE;
    const x = constrain(centerX + wobble, marginX, width - marginX);
    const y = marginY + t * usableHeight;
    pts.push(createVector(x, y));
  }

  return pts;
}

// ============================================================================
// BRANCH ANCHORS & GENERATION
// ============================================================================

function buildBranchAnchors() {
  const anchors = [];
  const N = baseSpinePts.length;

  for (let frac of CONFIG.BRANCH_ANCHOR_FRACTIONS) {
    const idx = constrain(floor(frac * (N - 1)), 1, N - 2);
    anchors.push({ idx, weight: 0.5 });
  }

  const curvatureScores = [];
  for (let i = 1; i < N - 1; i++) {
    const prev = baseSpinePts[i - 1];
    const curr = baseSpinePts[i];
    const next = baseSpinePts[i + 1];
    const v1 = p5.Vector.sub(curr, prev).normalize();
    const v2 = p5.Vector.sub(next, curr).normalize();
    const curvature = acos(constrain(p5.Vector.dot(v1, v2), -1, 1));
    curvatureScores.push({ idx: i, curvature });
  }

  curvatureScores.sort((a, b) => b.curvature - a.curvature);
  for (let i = 0; i < CONFIG.BRANCH_CURVATURE_ANCHORS && i < curvatureScores.length; i++) {
    anchors.push({ idx: curvatureScores[i].idx, weight: 1 });
  }

  anchors.sort((a, b) => a.idx - b.idx);
  return anchors;
}

function generateBranches(spinePts, rails, params, t, bounds, seed) {
  randomSeed(seed);
  const branchCount = floor(lerp(CONFIG.BRANCH_COUNT_RANGE[0], CONFIG.BRANCH_COUNT_RANGE[1], t));
  const angleVariance = lerp(CONFIG.BRANCH_ANGLE_BASE, CONFIG.BRANCH_ANGLE_VARIANCE_MAX, t);
  const maxDepth = t < 0.45 ? 0 : t < 0.75 ? 1 : CONFIG.BRANCH_DEPTH_MAX;
  const failureProb = lerp(CONFIG.BRANCH_FAILURE_RANGE[0], CONFIG.BRANCH_FAILURE_RANGE[1], t);

  if (branchCount <= 0) return [];

  const availableAnchors = branchAnchors.slice();
  shuffle(availableAnchors, true);
  const selected = availableAnchors.slice(0, min(branchCount, availableAnchors.length));

  const branches = [];
  for (let anchor of selected) {
    const branch = buildBranchFromAnchor(
      spinePts,
      anchor.idx,
      params,
      t,
      bounds,
      0,
      maxDepth,
      failureProb,
      angleVariance,
    );
    if (branch) branches.push(branch);
  }

  return branches;
}

function buildBranchFromAnchor(spinePts, idx, params, t, bounds, depth, maxDepth, failureProb, angleVariance) {
  if (random() < failureProb && depth > 0) return null;

  const N = spinePts.length;
  const prev = spinePts[max(0, idx - 1)];
  const curr = spinePts[idx];
  const next = spinePts[min(N - 1, idx + 1)];
  const tangent = p5.Vector.sub(next, prev).normalize();
  const normal = createVector(-tangent.y, tangent.x);
  const side = random() < 0.5 ? -1 : 1;

  const angle = radians(random(-CONFIG.BRANCH_ANGLE_BASE, CONFIG.BRANCH_ANGLE_BASE) + side * random(10, 20));
  const dir = tangent.copy().rotate(angle).mult(0.2).add(normal.copy().mult(side));
  dir.y = min(dir.y, -0.25);
  dir.normalize();

  const length = random(CONFIG.BRANCH_LENGTH_RANGE[0], CONFIG.BRANCH_LENGTH_RANGE[1]) * (0.6 + t * 0.6);
  const segments = floor(lerp(6, 10, t));
  const pts = [curr.copy()];
  let current = curr.copy();
  let currentDir = dir.copy();

  for (let i = 1; i <= segments; i++) {
    const bend = radians(random(-angleVariance, angleVariance)) * 0.15;
    currentDir.rotate(bend);
    const step = length / segments;
    const nextPt = p5.Vector.add(current, p5.Vector.mult(currentDir, step));

    if (nextPt.y < bounds.top + bounds.marginTop) {
      nextPt.y = bounds.top + bounds.marginTop;
    }
    if (nextPt.y > bounds.bottom - bounds.marginBottom) {
      break;
    }

    pts.push(nextPt);
    current = nextPt;
  }

  if (pts.length < 3) return null;

  const branchParams = {
    ...params,
    BODY_MAX_WIDTH: params.BODY_MAX_WIDTH * 0.35,
    BODY_END_TAPER: 0.3,
  };

  const rails = computeRails(pts, branchParams);
  const shell = triangulateShell(pts, rails.left, rails.right, branchParams);

  const branch = {
    spinePts: pts,
    leftRail: rails.left,
    rightRail: rails.right,
    triangles: shell.triangles,
    braces: shell.braces,
    tip: pts[pts.length - 1].copy(),
    tipDir: p5.Vector.sub(pts[pts.length - 1], pts[pts.length - 2]).normalize(),
    depth,
  };

  if (depth < maxDepth && random() > failureProb) {
    const forkIdx = floor(pts.length * random(0.6, 0.85));
    const child = buildBranchFromAnchor(
      pts,
      forkIdx,
      branchParams,
      t,
      bounds,
      depth + 1,
      maxDepth,
      failureProb,
      angleVariance,
    );
    if (child) {
      branch.children = [child];
    }
  }

  return branch;
}

// ============================================================================
// TERMINAL GROWTH
// ============================================================================

function generateTerminals(spinePts, branches, t, bounds, seed) {
  randomSeed(seed);
  if (t < CONFIG.TERMINAL_START_RATIO) return [];

  const density = lerp(
    CONFIG.TERMINAL_DENSITY_RANGE[0],
    CONFIG.TERMINAL_DENSITY_RANGE[1],
    (t - CONFIG.TERMINAL_START_RATIO) / (1 - CONFIG.TERMINAL_START_RATIO + 0.001),
  );

  const terminals = [];
  const tips = collectBranchTips(branches);
  const spineTipDir = p5.Vector.sub(
    spinePts[spinePts.length - 1],
    spinePts[spinePts.length - 2],
  ).normalize();
  tips.push({ pos: spinePts[spinePts.length - 1], dir: spineTipDir, source: 'stem' });

  for (let tipData of tips) {
    if (random() > density) continue;

    const size = random(CONFIG.TERMINAL_SIZE_RANGE[0], CONFIG.TERMINAL_SIZE_RANGE[1]) * (0.6 + t * 0.6);
    const typeRoll = random();
    const upwardness = tipData.dir ? -tipData.dir.y : 0;

    if (
      CONFIG.BURST_ENABLED &&
      upwardness > 0.75 &&
      random() < CONFIG.BURST_PROB
    ) {
      terminals.push(buildBurst(tipData.pos, tipData.dir, size));
    } else if (typeRoll < 0.4) {
      terminals.push(buildFilamentCluster(tipData.pos, size, bounds));
    } else if (typeRoll < 0.75) {
      terminals.push(buildLeaf(tipData.pos, size));
    } else {
      terminals.push(buildPod(tipData.pos, size));
    }
  }

  return terminals;
}

function collectBranchTips(branches) {
  const tips = [];
  for (let branch of branches) {
    tips.push({ pos: branch.tip, dir: branch.tipDir, source: 'branch' });
    if (branch.children) {
      tips.push(...collectBranchTips(branch.children));
    }
  }
  return tips;
}

function buildFilamentCluster(origin, size, bounds) {
  const filaments = [];
  const count = floor(random(3, 7));
  for (let i = 0; i < count; i++) {
    const angle = radians(random(-60, 60));
    const length = size * random(0.8, 1.6);
    const segments = 5;
    const pts = [origin.copy()];
    let current = origin.copy();
    let dir = createVector(cos(angle), -abs(sin(angle)));

    for (let j = 0; j < segments; j++) {
      const bend = radians(random(-8, 8));
      dir.rotate(bend);
      const next = p5.Vector.add(current, p5.Vector.mult(dir, length / segments));
      next.y = max(next.y, bounds.top + bounds.marginTop);
      pts.push(next);
      current = next;
    }

    filaments.push(pts);
  }

  return { type: 'filament', filaments };
}

function buildLeaf(origin, size) {
  const angle = radians(random(-40, 40));
  const dir = createVector(cos(angle), -abs(sin(angle)));
  const tip = p5.Vector.add(origin, p5.Vector.mult(dir, size));
  const side = createVector(-dir.y, dir.x).mult(size * 0.35);

  return {
    type: 'leaf',
    base: origin.copy(),
    tip,
    left: p5.Vector.add(origin, side),
    right: p5.Vector.sub(origin, side),
  };
}

function buildPod(origin, size) {
  return {
    type: 'pod',
    center: origin.copy(),
    rx: size * 0.45,
    ry: size * 0.6,
  };
}

function buildBurst(origin, dir, size) {
  const lines = [];
  const lineCount = floor(
    random(CONFIG.BURST_LINE_COUNT_RANGE[0], CONFIG.BURST_LINE_COUNT_RANGE[1] + 1),
  );
  const baseAngle = dir ? atan2(dir.y, dir.x) : -HALF_PI;
  const spread = radians(CONFIG.BURST_SPREAD_DEG);
  const curve = radians(CONFIG.BURST_CURVE_DEG);

  for (let i = 0; i < lineCount; i++) {
    const t = lineCount <= 1 ? 0.5 : i / (lineCount - 1);
    const angle = baseAngle + lerp(-spread / 2, spread / 2, t) + radians(random(-8, 8));
    const length = random(CONFIG.BURST_LENGTH_RANGE[0], CONFIG.BURST_LENGTH_RANGE[1]) * (0.6 + size * 0.03);
    const segments = 6;
    const pts = [origin.copy()];
    let current = origin.copy();
    let currentDir = createVector(cos(angle), sin(angle));

    for (let j = 0; j < segments; j++) {
      const bend = random(-curve, curve);
      currentDir.rotate(bend);
      current = p5.Vector.add(current, p5.Vector.mult(currentDir, length / segments));
      pts.push(current.copy());
    }

    lines.push(pts);
  }

  return { type: 'burst', lines };
}

// ============================================================================
// VASCULAR STRUCTURE
// ============================================================================

function computeWidthProfile(t, profile) {
  if (profile === 'bell') return sin(PI * t);
  if (profile === 'linear') return 1 - abs(t - 0.5) * 2;
  if (profile === 'sigmoid') {
    const smoothMid = smoothstep(0.1, 0.9, t) * smoothstep(0.9, 0.1, t);
    return smoothMid;
  }
  if (profile === 'barrel') {
    const centered = sin(PI * t);
    return centered * centered;
  }
  if (profile === 'double-bump') {
    const bump1 = sin(PI * t * 3) * sin(PI * t);
    const bump2 = sin(PI * (t - 0.5) * 3) * sin(PI * t);
    return max(bump1, bump2) * 0.8;
  }
  return sin(PI * t);
}

function computeRails(spinePts, params) {
  const N = spinePts.length;
  const left = [];
  const right = [];

  for (let i = 0; i < N; i++) {
    let tangent;
    if (i === 0) {
      tangent = p5.Vector.sub(spinePts[1], spinePts[0]);
    } else if (i === N - 1) {
      tangent = p5.Vector.sub(spinePts[N - 1], spinePts[N - 2]);
    } else {
      tangent = p5.Vector.sub(spinePts[i + 1], spinePts[i - 1]);
    }
    tangent.normalize();
    const normal = createVector(-tangent.y, tangent.x);

    const t = i / (N - 1);
    const profileWidth = computeWidthProfile(t, params.BODY_WIDTH_PROFILE);
    const taper =
      smoothstep(0, params.BODY_END_TAPER, t) *
      smoothstep(0, params.BODY_END_TAPER, 1 - t);
    let w = params.BODY_MAX_WIDTH * profileWidth * taper;

    if (i > 0 && i < N - 1) {
      const prev_tang = p5.Vector.sub(spinePts[i], spinePts[i - 1]).normalize();
      const next_tang = p5.Vector.sub(spinePts[i + 1], spinePts[i]).normalize();
      const curvature = acos(constrain(p5.Vector.dot(prev_tang, next_tang), -1, 1));
      w *= 1 - curvature * params.CURVATURE_THINNING;
    }

    left.push(p5.Vector.add(spinePts[i], p5.Vector.mult(normal, w)));
    right.push(p5.Vector.add(spinePts[i], p5.Vector.mult(normal, -w)));
  }

  return { left, right };
}

function triangulateShell(spinePts, leftRail, rightRail, params) {
  const triangles = [];
  const braces = [];
  const N = spinePts.length;

  for (let i = 0; i < N - 1; i++) {
    const L0 = leftRail[i];
    const L1 = leftRail[i + 1];
    const R0 = rightRail[i];
    const R1 = rightRail[i + 1];

    if (params.TRI_DIAGONAL_MODE === 'alternate') {
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

    if (i % params.BRACE_EVERY === 0 && random() < params.BRACE_PROB) {
      if (i % 2 === 0) {
        braces.push({ a: L0, b: R1 });
      } else {
        braces.push({ a: R0, b: L1 });
      }
    }

    if (i % params.INNER_RIB_EVERY === 0) {
      braces.push({ a: L0, b: R0 });
    }
  }

  return { triangles, braces };
}

// ============================================================================
// RENDERING
// ============================================================================

function renderStrata() {
  renderStrataTo(null);
}

function renderStrataTo(g) {
  const target = g || window;
  const shellColor = getShellColor();
  const rgb = hexToRgb(shellColor);

  for (let s = 0; s < strata.length; s++) {
    const stratum = strata[s];
    const opacity = lerp(CONFIG.STRATA_OPACITY_TOP, CONFIG.STRATA_OPACITY_BOTTOM, stratum.t);
    const strokeAlpha = opacity * 255;
    const fillAlpha = CONFIG.FILL_OPACITY * opacity * 255;

    target.stroke(rgb.r, rgb.g, rgb.b, strokeAlpha);
    target.strokeWeight(CONFIG.SHELL_STROKE);
    target.strokeJoin(ROUND);
    target.strokeCap(ROUND);

    if (CONFIG.FILL_OPACITY > 0) {
      target.fill(rgb.r, rgb.g, rgb.b, fillAlpha);
    } else {
      target.noFill();
    }

    // 1. Stem (thicker, visible)
    target.noFill();
    target.strokeWeight(CONFIG.STEM_STROKE);
    if (s > 0) {
      const prev = strata[s - 1];
      const prevTip = prev.spinePts[prev.spinePts.length - 1];
      const currRoot = stratum.spinePts[0];
      target.line(prevTip.x, prevTip.y, currRoot.x, currRoot.y);
    }
    for (let i = 0; i < stratum.spinePts.length - 1; i++) {
      const a = stratum.spinePts[i];
      const b = stratum.spinePts[i + 1];
      target.line(a.x, a.y, b.x, b.y);
    }

    // 2. Vascular mesh (triangles)
    target.strokeWeight(CONFIG.SHELL_STROKE);
    for (let tri of stratum.triangles) {
      target.triangle(tri[0].x, tri[0].y, tri[1].x, tri[1].y, tri[2].x, tri[2].y);
    }

    // 3. Braces / ribs
    target.noFill();
    for (let brace of stratum.braces) {
      target.line(brace.a.x, brace.a.y, brace.b.x, brace.b.y);
    }

    // 4. Branches
    renderBranches(target, stratum.branches, rgb, strokeAlpha, fillAlpha);

    // 5. Terminal growth
    renderTerminals(target, stratum.terminals, rgb, strokeAlpha);
  }
}

function renderBranches(target, branches, rgb, strokeAlpha, fillAlpha) {
  if (!branches || branches.length === 0) return;

  for (let branch of branches) {
    target.stroke(rgb.r, rgb.g, rgb.b, strokeAlpha);
    target.strokeWeight(CONFIG.SHELL_STROKE);
    target.strokeJoin(ROUND);

    if (CONFIG.FILL_OPACITY > 0) {
      target.fill(rgb.r, rgb.g, rgb.b, fillAlpha);
    } else {
      target.noFill();
    }

    for (let tri of branch.triangles) {
      target.triangle(tri[0].x, tri[0].y, tri[1].x, tri[1].y, tri[2].x, tri[2].y);
    }

    target.noFill();
    for (let brace of branch.braces) {
      target.line(brace.a.x, brace.a.y, brace.b.x, brace.b.y);
    }

    for (let i = 0; i < branch.spinePts.length - 1; i++) {
      const a = branch.spinePts[i];
      const b = branch.spinePts[i + 1];
      target.line(a.x, a.y, b.x, b.y);
    }

    if (branch.children) {
      renderBranches(target, branch.children, rgb, strokeAlpha, fillAlpha);
    }
  }
}

function renderTerminals(target, terminals, rgb, strokeAlpha) {
  if (!terminals || terminals.length === 0) return;

  target.stroke(rgb.r, rgb.g, rgb.b, strokeAlpha);
  target.strokeWeight(CONFIG.SHELL_STROKE);
  target.noFill();

  for (let terminal of terminals) {
    if (terminal.type === 'filament') {
      for (let filament of terminal.filaments) {
        for (let i = 0; i < filament.length - 1; i++) {
          const a = filament[i];
          const b = filament[i + 1];
          target.line(a.x, a.y, b.x, b.y);
        }
      }
    } else if (terminal.type === 'burst') {
      for (let line of terminal.lines) {
        for (let i = 0; i < line.length - 1; i++) {
          const a = line[i];
          const b = line[i + 1];
          target.line(a.x, a.y, b.x, b.y);
        }
      }
    } else if (terminal.type === 'leaf') {
      target.line(terminal.base.x, terminal.base.y, terminal.tip.x, terminal.tip.y);
      target.line(terminal.base.x, terminal.base.y, terminal.left.x, terminal.left.y);
      target.line(terminal.base.x, terminal.base.y, terminal.right.x, terminal.right.y);
      target.line(terminal.left.x, terminal.left.y, terminal.tip.x, terminal.tip.y);
      target.line(terminal.right.x, terminal.right.y, terminal.tip.x, terminal.tip.y);
    } else if (terminal.type === 'pod') {
      target.ellipse(terminal.center.x, terminal.center.y, terminal.rx * 2, terminal.ry * 2);
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

function savePNG() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scale = 2;
  const exportWidth = CONFIG.WIDTH * scale;
  const exportHeight = CONFIG.HEIGHT * scale;

  const pg = createGraphics(exportWidth, exportHeight);
  pg.scale(scale);
  pg.background(getBGColor());
  renderStrataTo(pg);

  pg.canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genuary-29-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function saveSVG() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `genuary-29-${timestamp}.svg`;

  if (typeof SVG === 'undefined') {
    save(filename);
    return;
  }

  const pg = createGraphics(CONFIG.WIDTH, CONFIG.HEIGHT, SVG);
  pg.background(getBGColor());
  renderStrataTo(pg);

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
// CONTROLS
// ============================================================================

function keyPressed() {
  if (key === 'r' || key === 'R') {
    generateLineage();
  } else if (key === 's' || key === 'S') {
    savePNG();
  } else if (key === 'v' || key === 'V') {
    saveSVG();
  } else if (key === 'g' || key === 'G') {
    currentPalette = null;
    redraw();
  } else if (key === 'c' || key === 'C') {
    pickRandomPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    shufflePalette();
    redraw();
  }
}

// ============================================================================
// PALETTE
// ============================================================================

function getActivePalette() {
  if (currentPalette && currentPalette.length >= 2) {
    return currentPalette;
  }
  return [CONFIG.BG, CONFIG.SHELL_COLOR];
}

function getShellColor() {
  return getActivePalette()[1];
}

function getBGColor() {
  return getActivePalette()[0];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = null;
    return;
  }

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
  if (!currentPalette || currentPalette.length < 2) return;
  currentPalette = [currentPalette[1], currentPalette[0]];
}


// ============================================================================
// UTILITY
// ============================================================================

function simplifyRDP(pts, eps) {
  if (pts.length < 3) return pts.slice();

  function perpDistance(pt, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const denom = sqrt(dx * dx + dy * dy);
    if (denom < 0.0001) return dist(pt, start);
    const num = abs(dy * pt.x - dx * pt.y + end.x * start.y - end.y * start.x);
    return num / denom;
  }

  function rdp(list, tolerance, start, end) {
    let maxDist = 0;
    let maxIdx = 0;
    for (let i = start + 1; i < end; i++) {
      const d = perpDistance(list[i], list[start], list[end]);
      if (d > maxDist) {
        maxDist = d;
        maxIdx = i;
      }
    }
    if (maxDist > tolerance) {
      const left = rdp(list, tolerance, start, maxIdx);
      const right = rdp(list, tolerance, maxIdx, end);
      return left.concat(right.slice(1));
    }
    return [list[start], list[end]];
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
      const overflow = accumulated;
      const frac = (d - overflow) / d;
      const interpPt = p5.Vector.lerp(pts[i - 1], pts[i], frac);
      result.push(interpPt);
    }
  }

  if (p5.Vector.dist(result[result.length - 1], pts[pts.length - 1]) > 0.1) {
    result.push(pts[pts.length - 1].copy());
  }

  return result;
}

function smoothstep(edge0, edge1, x) {
  const t = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return sqrt(dx * dx + dy * dy);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}
