const WIDTH = 540;
const HEIGHT = 675;

const CONFIG = {
  // Canvas / layout
  MARGIN: 60,
  // TRI_SCALE: 0.90,
  TRI_SCALE: 1.10,
  ROOT_ORIENTATION: 'up', // 'up' | 'down'
  ROOT_ROTATION: null, // random rotation in radians (null = random)
  
  // Recursion
  MAX_DEPTH: 5,
  USE_SEED: true,
  SEED: null, // will be randomized if null
  // BIAS_MODE: 'byOrientation', // 'byOrientation' | 'byPosition' | 'randomButStable'
  BIAS_MODE: 'randomButStable', // 'byOrientation' | 'byPosition' | 'randomButStable'
  
  // Style
  STROKE_BASE: 1,
  STROKE_MIN: 0.5,
  STROKE_FALLOFF: 0.45,
  ACCENT_ENABLED: false,
  ACCENT_DEPTH: 2,
  ACCENT_COLOR: '#FF6B35',
  BG_COLOR: '#FFFFFF',
  STROKE_COLOR: '#000000',
  
  // Debug
  SHOW_DEPTH_LABELS: false,
  
  // Depth-specific parameters
  DEPTH_2_SELECT_COUNT: 2, // how many children to recurse at depth 2
  // DEPTH_3_BIAS_T: 0.4, // lerp parameter for distorted splits
  DEPTH_3_BIAS_T: 0.4, // lerp parameter for distorted splits
  // DEPTH_4_INSET: 0.18, // inset factor for echo
  DEPTH_4_INSET: 0.5, // inset factor for echo
  DEPTH_5_REFUSAL_TYPE: 'fill' // 'blank' | 'fill' | 'thick' | 'rotate'
  ,REFUSAL_COUNT: 5 // how many triangles get the refusal treatment
};

let allTriangles = [];
let seed;
let rootRotation = 0;
let refusalTriangleIndices = []; // which triangles get the "refusal" treatment
let paletteData = null;
let currentPalette = null;

function preload() {
  paletteData = loadJSON(
    'assets/colors.json',
    () => {},
    () => {
      paletteData = null;
    }
  );
}

function setup() {
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  
  initializeSketch();
  noLoop();
}

function initializeSketch() {
  // Set seed
  if (CONFIG.USE_SEED) {
    seed = CONFIG.SEED !== null ? CONFIG.SEED : floor(random(1000000));
    randomSeed(seed);
    console.log('Seed:', seed);
  }
  
  // Pick initial color palette if none selected
  if (!currentPalette) {
    pickRandomPalette();
  }
  
  // Set rotation
  rootRotation = CONFIG.ROOT_ROTATION !== null ? CONFIG.ROOT_ROTATION : random(TWO_PI);
  
  // Generate recursive triangles
  allTriangles = generateRecursiveTriangles();
  
  // Pick triangles for depth 5 refusal (deterministically)
  const depth5Triangles = allTriangles.filter(t => t.depth === 5 || t.depth === 4);
  refusalTriangleIndices = [];
  if (depth5Triangles.length > 0) {
    const count = min(CONFIG.REFUSAL_COUNT || 1, depth5Triangles.length);
    const indices = [...Array(depth5Triangles.length).keys()];
    // Fisher-Yates shuffle limited to count picks
    for (let i = 0; i < count; i++) {
      const j = i + floor(random(depth5Triangles.length - i));
      [indices[i], indices[j]] = [indices[j], indices[i]];
      refusalTriangleIndices.push(indices[i]);
    }
  }
  
  redraw();
}

function draw() {
  background(getBGColor());
  
  // Draw all triangles
  for (let i = 0; i < allTriangles.length; i++) {
    const tri = allTriangles[i];
    drawTriangle(tri, i);
  }
}

function generateRecursiveTriangles() {
  const rootTri = createRootTriangle();
  let triangles = [rootTri];
  const allTris = [rootTri];
  
  for (let depth = 1; depth <= CONFIG.MAX_DEPTH; depth++) {
    let nextTriangles = [];
    
    for (let tri of triangles) {
      if (tri.terminal) {
        // Don't subdivide terminal triangles
        continue;
      }
      
      const children = subdivideTriangle(tri, depth);
      nextTriangles.push(...children);
      allTris.push(...children);
    }
    
    triangles = nextTriangles;
  }
  
  return allTris;
}

function createRootTriangle() {
  const availW = WIDTH - 2 * CONFIG.MARGIN;
  const availH = HEIGHT - 2 * CONFIG.MARGIN;
  
  // Equilateral triangle: height = side * sqrt(3)/2
  const maxS = min(availW, availH * 2 / sqrt(3));
  const S = maxS * CONFIG.TRI_SCALE;
  const h = S * sqrt(3) / 2;
  
  // Center the triangle (with vertical adjustment for visual balance)
  const topX = WIDTH / 2;
  const topY = CONFIG.MARGIN + (availH - h) / 2 - 50;
  
  let a = { x: topX, y: topY }; // top vertex
  let b = { x: topX - S / 2, y: topY + h }; // bottom left
  let c = { x: topX + S / 2, y: topY + h }; // bottom right
  
  // Apply rotation around triangle's own center (centroid)
  if (rootRotation !== 0) {
    const center = {
      x: (a.x + b.x + c.x) / 3,
      y: (a.y + b.y + c.y) / 3
    };
    a = rotatePointAround(a, center, rootRotation);
    b = rotatePointAround(b, center, rootRotation);
    c = rotatePointAround(c, center, rootRotation);
  }
  
  return {
    a, b, c,
    depth: 0,
    terminal: false,
    orientation: 'up'
  };
}

function subdivideTriangle(tri, depth) {
  if (depth === 1) {
    return subdivideDepth1(tri);
  } else if (depth === 2) {
    return subdivideDepth2(tri);
  } else if (depth === 3) {
    return subdivideDepth3(tri);
  } else if (depth >= 4) {
    // Depth 4+: no more subdivision, mark as terminal
    return [{
      ...tri,
      depth: depth,
      terminal: true
    }];
  }
  return [];
}

function subdivideDepth1(tri) {
  // Classic 4-way equilateral split
  const ab = midpoint(tri.a, tri.b);
  const bc = midpoint(tri.b, tri.c);
  const ca = midpoint(tri.c, tri.a);
  
  const orient = tri.orientation === 'up' ? 'down' : 'up';
  const childOrient = tri.orientation;
  
  return [
    { a: tri.a, b: ab, c: ca, depth: 1, terminal: false, orientation: childOrient },
    { a: ab, b: tri.b, c: bc, depth: 1, terminal: false, orientation: childOrient },
    { a: ca, b: bc, c: tri.c, depth: 1, terminal: false, orientation: childOrient },
    { a: ab, b: bc, c: ca, depth: 1, terminal: false, orientation: orient } // center inverted
  ];
}

function subdivideDepth2(tri) {
  // Same split as depth 1, but only recurse into some children (bias introduced)
  const ab = midpoint(tri.a, tri.b);
  const bc = midpoint(tri.b, tri.c);
  const ca = midpoint(tri.c, tri.a);
  
  const orient = tri.orientation === 'up' ? 'down' : 'up';
  const childOrient = tri.orientation;
  
  const children = [
    { a: tri.a, b: ab, c: ca, depth: 2, terminal: false, orientation: childOrient, childIndex: 0 },
    { a: ab, b: tri.b, c: bc, depth: 2, terminal: false, orientation: childOrient, childIndex: 1 },
    { a: ca, b: bc, c: tri.c, depth: 2, terminal: false, orientation: childOrient, childIndex: 2 },
    { a: ab, b: bc, c: ca, depth: 2, terminal: false, orientation: orient, childIndex: 3 }
  ];
  
  // Select which children to continue recursing
  const selectedIndices = selectChildrenForRecursion(children, tri);
  
  return children.map((child, i) => ({
    ...child,
    terminal: !selectedIndices.includes(i)
  }));
}

function selectChildrenForRecursion(children, parent) {
  const count = CONFIG.DEPTH_2_SELECT_COUNT;
  
  if (CONFIG.BIAS_MODE === 'byOrientation') {
    // Recurse only into triangles with same orientation as parent
    const matching = children
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.orientation === parent.orientation);
    return matching.slice(0, count).map(({ i }) => i);
  } else if (CONFIG.BIAS_MODE === 'byPosition') {
    // Recurse into triangles whose centroid is left of center
    const centerX = WIDTH / 2;
    const sorted = children
      .map((c, i) => ({ c, i, cx: centroid(c).x }))
      .sort((a, b) => a.cx - b.cx);
    return sorted.slice(0, count).map(({ i }) => i);
  } else {
    // randomButStable: use seeded random
    const indices = [0, 1, 2, 3];
    const selected = [];
    for (let i = 0; i < count && indices.length > 0; i++) {
      const idx = floor(random(indices.length));
      selected.push(indices[idx]);
      indices.splice(idx, 1);
    }
    return selected;
  }
}

function subdivideDepth3(tri) {
  // Distorted split using biased lerp
  const t = CONFIG.DEPTH_3_BIAS_T;
  const ab = lerpPoint(tri.a, tri.b, t);
  const bc = lerpPoint(tri.b, tri.c, 0.5); // keep some edges normal
  const ca = lerpPoint(tri.c, tri.a, 1 - t);
  
  const orient = tri.orientation === 'up' ? 'down' : 'up';
  const childOrient = tri.orientation;
  
  return [
    { a: tri.a, b: ab, c: ca, depth: 3, terminal: false, orientation: childOrient },
    { a: ab, b: tri.b, c: bc, depth: 3, terminal: false, orientation: childOrient },
    { a: ca, b: bc, c: tri.c, depth: 3, terminal: false, orientation: childOrient },
    { a: ab, b: bc, c: ca, depth: 3, terminal: false, orientation: orient }
  ];
}

function drawTriangle(tri, index) {
  // Check if this is the refusal triangle
  const depth5Triangles = allTriangles.filter(t => t.depth === 5 || t.depth === 4);
  const isRefusal = refusalTriangleIndices.some(idx => tri === depth5Triangles[idx]);
  
  // Set stroke weight by depth: MAX_DEPTH at depth 0, decreasing by 1 each level, multiplied by 2
  const sw = max(CONFIG.STROKE_MIN, (CONFIG.MAX_DEPTH - tri.depth) * 2);
  strokeWeight(sw);
  
  // Set stroke join based on depth
  if (tri.depth === 0) {
    strokeJoin(MITER);
  } else {
    strokeJoin(BEVEL);
  }
  strokeCap(ROUND);
  
  // Set stroke color
  if (CONFIG.ACCENT_ENABLED && tri.depth === CONFIG.ACCENT_DEPTH) {
    stroke(CONFIG.ACCENT_COLOR);
  } else {
    stroke(getStrokeColor());
  }
  
  // Set fill based on depth
  const fillColor = getFillColorForDepth(tri.depth);
  if (fillColor) {
    fill(fillColor);
  } else {
    noFill();
  }
  
  // Handle depth 5 refusal
  if (tri.depth >= 4 && isRefusal) {
    if (CONFIG.DEPTH_5_REFUSAL_TYPE === 'blank') {
      // Draw nothing
      return;
    } else if (CONFIG.DEPTH_5_REFUSAL_TYPE === 'fill') {
      // Fill with background to create a quiet void
      fill(getBGColor());
      noStroke();
      triangle(tri.a.x, tri.a.y, tri.b.x, tri.b.y, tri.c.x, tri.c.y);
      return;
    } else if (CONFIG.DEPTH_5_REFUSAL_TYPE === 'thick') {
      strokeWeight(sw * 3);
    }
  }
  
  // Draw main triangle outline
  triangle(tri.a.x, tri.a.y, tri.b.x, tri.b.y, tri.c.x, tri.c.y);
  
  // Depth 4: structural echo (inset)
  if (tri.depth === 4) {
    const center = centroid(tri);
    const inset = CONFIG.DEPTH_4_INSET;
    const rotate = (tri.depth >= 4 && isRefusal && CONFIG.DEPTH_5_REFUSAL_TYPE === 'rotate');
    
    let a2, b2, c2;
    if (rotate) {
      // Rotate the echo by 180 degrees around centroid
      a2 = rotatePointAround(lerpPoint(tri.a, center, inset), center, PI);
      b2 = rotatePointAround(lerpPoint(tri.b, center, inset), center, PI);
      c2 = rotatePointAround(lerpPoint(tri.c, center, inset), center, PI);
    } else {
      a2 = lerpPoint(tri.a, center, inset);
      b2 = lerpPoint(tri.b, center, inset);
      c2 = lerpPoint(tri.c, center, inset);
    }
    
    triangle(a2.x, a2.y, b2.x, b2.y, c2.x, c2.y);
    
    // Optional diagonal
    line(a2.x, a2.y, b2.x, b2.y);
  }
  
  // Debug: depth labels
  if (CONFIG.SHOW_DEPTH_LABELS) {
    const center = centroid(tri);
    push();
    fill(CONFIG.STROKE_COLOR);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(8);
    text(tri.depth, center.x, center.y);
    pop();
  }
}

// Geometry helpers
function midpoint(p, q) {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}

function lerpPoint(p, q, t) {
  return { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) };
}

function centroid(tri) {
  return {
    x: (tri.a.x + tri.b.x + tri.c.x) / 3,
    y: (tri.a.y + tri.b.y + tri.c.y) / 3
  };
}

function rotatePointAround(p, center, angle) {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos(angle) - dy * sin(angle),
    y: center.y + dx * sin(angle) + dy * cos(angle)
  };
}

function getActivePalette() {
  if (currentPalette && currentPalette.length >= 3) {
    return currentPalette;
  }
  return [CONFIG.BG_COLOR, CONFIG.STROKE_COLOR, CONFIG.STROKE_COLOR];
}

function getBGColor() {
  const palette = getActivePalette();
  return palette[0];
}

function getStrokeColor(depth) {
  const palette = getActivePalette();
  // Use different colors from palette based on depth
  if (palette.length >= 5) {
    // 5 colors: map each depth to a color
    const colorIndex = min(depth + 1, palette.length - 1);
    return palette[colorIndex];
  } else if (palette.length >= 4) {
    // 4 colors: background, then cycle through remaining 3
    const colorIndex = ((depth % 3) + 1);
    return palette[colorIndex];
  } else {
    // 3 colors: background, primary stroke, secondary stroke
    return depth === 0 ? palette[1] : palette[min(depth, palette.length - 1)];
  }
}

function getFillColor() {
  const palette = getActivePalette();
  return palette[palette.length - 1];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = null;
    return;
  }

  // Pick random palette with 3-5 colors
  const choices = paletteData.palettes.filter(
    (palette) => palette.colors && palette.colors.length >= 3 && palette.colors.length <= 5
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
  // Shuffle all colors including background
  const shuffled = [...currentPalette];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  currentPalette = shuffled;
}

// Palette helper functions
function getActivePalette() {
  if (currentPalette && currentPalette.length >= 3) {
    return currentPalette;
  }
  return [CONFIG.BG_COLOR, CONFIG.STROKE_COLOR, CONFIG.STROKE_COLOR];
}

function getBGColor() {
  const palette = getActivePalette();
  return palette[0];
}

function getStrokeColor() {
  const palette = getActivePalette();
  // Always use second color for strokes
  return palette[1];
}

function getFillColor() {
  const palette = getActivePalette();
  return palette[palette.length - 1];
}

function getFillColorForDepth(depth) {
  const palette = getActivePalette();
  // Colors 0 = bg, 1 = stroke, 2+ = fills
  if (palette.length <= 2) {
    // No fill colors available
    return null;
  }
  const fillColors = palette.slice(2); // Get colors from index 2 onwards
  // Cycle through fill colors based on depth
  return fillColors[depth % fillColors.length];
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-26-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const scale = 2; // 2x scale: 540×675 → 1080×1350
  const exportWidth = WIDTH * scale;
  const exportHeight = HEIGHT * scale;
  
  // Create offscreen graphics buffer
  const pg = createGraphics(exportWidth, exportHeight);
  pg.pixelDensity(1);
  
  // Draw background
  pg.background(getBGColor());
  
  // Draw all triangles at scaled size
  for (let i = 0; i < allTriangles.length; i++) {
    const tri = allTriangles[i];
    drawTriangleScaled(pg, tri, i, scale);
  }
  
  // Save the graphics buffer
  saveCanvas(pg, `genuary-26-${timestamp}`, 'png');
  
  // Clean up
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function drawTriangleScaled(g, tri, index, scale) {
  // Check if this is the refusal triangle
  const depth5Triangles = allTriangles.filter(t => t.depth === 5 || t.depth === 4);
  const isRefusal = refusalTriangleIndices.some(idx => tri === depth5Triangles[idx]);
  
  // Set stroke weight by depth
  const sw = max(CONFIG.STROKE_MIN, (CONFIG.MAX_DEPTH - tri.depth) * 2) * scale;
  g.strokeWeight(sw);
  
  // Set stroke join based on depth
  if (tri.depth === 0) {
    g.strokeJoin(MITER);
  } else {
    g.strokeJoin(BEVEL);
  }
  g.strokeCap(ROUND);
  
  // Set stroke color
  if (CONFIG.ACCENT_ENABLED && tri.depth === CONFIG.ACCENT_DEPTH) {
    g.stroke(CONFIG.ACCENT_COLOR);
  } else {
    g.stroke(getStrokeColor());
  }
  
  // Set fill based on depth
  const fillColor = getFillColorForDepth(tri.depth);
  if (fillColor) {
    g.fill(fillColor);
  } else {
    g.noFill();
  }
  
  // Handle depth 5 refusal
  if (tri.depth >= 4 && isRefusal) {
    if (CONFIG.DEPTH_5_REFUSAL_TYPE === 'blank') {
      // Draw nothing
      return;
    } else if (CONFIG.DEPTH_5_REFUSAL_TYPE === 'fill') {
      // Fill with background to create a quiet void
      g.fill(getBGColor());
      g.noStroke();
      g.triangle(
        tri.a.x * scale, tri.a.y * scale,
        tri.b.x * scale, tri.b.y * scale,
        tri.c.x * scale, tri.c.y * scale
      );
      return;
    } else if (CONFIG.DEPTH_5_REFUSAL_TYPE === 'thick') {
      g.strokeWeight(sw * 3);
    }
  }
  
  // Draw main triangle outline
  g.triangle(
    tri.a.x * scale, tri.a.y * scale,
    tri.b.x * scale, tri.b.y * scale,
    tri.c.x * scale, tri.c.y * scale
  );
  
  // Depth 4: structural echo (inset)
  if (tri.depth === 4) {
    const center = centroid(tri);
    const inset = CONFIG.DEPTH_4_INSET;
    const rotate = (tri.depth >= 4 && isRefusal && CONFIG.DEPTH_5_REFUSAL_TYPE === 'rotate');
    
    let a2, b2, c2;
    if (rotate) {
      // Rotate the echo by 180 degrees around centroid
      a2 = rotatePointAround(lerpPoint(tri.a, center, inset), center, PI);
      b2 = rotatePointAround(lerpPoint(tri.b, center, inset), center, PI);
      c2 = rotatePointAround(lerpPoint(tri.c, center, inset), center, PI);
    } else {
      a2 = lerpPoint(tri.a, center, inset);
      b2 = lerpPoint(tri.b, center, inset);
      c2 = lerpPoint(tri.c, center, inset);
    }
    
    g.triangle(a2.x * scale, a2.y * scale, b2.x * scale, b2.y * scale, c2.x * scale, c2.y * scale);
    
    // Optional diagonal
    g.line(a2.x * scale, a2.y * scale, b2.x * scale, b2.y * scale);
  }
  
  // Debug: depth labels
  if (CONFIG.SHOW_DEPTH_LABELS) {
    const center = centroid(tri);
    g.push();
    g.fill(getStrokeColor());
    g.noStroke();
    g.textAlign(CENTER, CENTER);
    g.textSize(8 * scale);
    g.text(tri.depth, center.x * scale, center.y * scale);
    g.pop();
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'r' || key === 'R') {
    // Reroll with new seed
    CONFIG.SEED = null;
    initializeSketch();
  } else if (key === 'd' || key === 'D') {
    // Toggle debug
    CONFIG.SHOW_DEPTH_LABELS = !CONFIG.SHOW_DEPTH_LABELS;
    redraw();
  } else if (key >= '1' && key <= '5') {
    // Set max depth
    CONFIG.MAX_DEPTH = int(key);
    initializeSketch();
  } else if (key === 'g' || key === 'G') {
    // Reset to default colors
    currentPalette = null;
    redraw();
  } else if (key === 'c' || key === 'C') {
    // Pick random color palette
    pickRandomPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    // Shuffle current palette
    shufflePalette();
    redraw();
  }
}
