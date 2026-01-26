// ============================================================
// GENUARY 2026 DAY 22: PEN PLOTTER READY
// Continuous-Route Alphabet from Stroke-Only SVG Outlines
// ============================================================

// Global Configuration
const CONFIG = {
  // Canvas & layout
  CANVAS_W: 540,
  CANVAS_H: 675,
  MARGINS: { top: 48, right: 48, bottom: 48, left: 48 },
  
  // Seeding for reproducibility
  USE_SEED: false,
  SEED: 42,
  
  // Current letter / mode
  LETTER: 'A',
  MODE: 'single', // 'single' or 'batchAZ'
  
  // SVG sampling
  SAMPLE_POINTS: 1200,
  MIN_POINT_DIST: 0.2,
  SIMPLIFY_EPSILON: 0.5,
  MAX_TOTAL_POINTS: 12000,
  
  // Break behavior
  BREAK_MODE: 'topLeft', // 'topLeft' | 'leftMid' | 'minX' | 'maxY' | 'angleRay'
  BREAK_GAP_POINTS: 4,
  CLOSED_THRESHOLD: 2.0,
  
  // Styling
  STROKE_COLOR: '#111111',
  STROKE_WIDTH: 1.0,
  ROUND_CAPS: true,
  ROUND_JOINS: true,
  
  // Safety
  NO_LOOP: true,
  MAX_MS_PER_LETTER: 150,
  BATCH_YIELD: true,
};

// Global state
let currentPoints = [];
let currentBBox = null;
let currentLetter = CONFIG.LETTER;
let showGuide = false;
let batchQueue = [];
let isBatching = false;

// ============================================================
// SETUP & DRAW
// ============================================================

function setup() {
  createCanvas(CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  if (CONFIG.NO_LOOP) noLoop();
  
  // Initialize seed if enabled
  if (CONFIG.USE_SEED) randomSeed(CONFIG.SEED);
  
  // Load and render first letter
  loadAndRenderLetter(currentLetter);
}

function draw() {
  background(255);
  
  // Draw the current sampled points
  if (currentPoints.length > 0) {
    drawCurrentPath();
  }
  
  // Optional guide (original sampled outline)
  if (showGuide && currentPoints.length > 0) {
    drawGuide();
  }
  
  // Display info
  drawInfo();
}

// ============================================================
// LOADING & PROCESSING
// ============================================================

async function loadAndRenderLetter(letter) {
  const startTime = performance.now();
  
  try {
    // Load SVG file
    const svgPath = `assets/letterforms/stroke-nofill/${letter}.svg`;
    const response = await fetch(svgPath);
    
    if (!response.ok) {
      console.error(`Failed to load ${letter}.svg`);
      return;
    }
    
    const svgText = await response.text();
    
    // Parse SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    if (svgDoc.documentElement.tagName === 'parsererror') {
      console.error(`Parse error for ${letter}.svg`);
      return;
    }
    
    // Extract path data and viewBox
    const pathEl = svgDoc.querySelector('path');
    if (!pathEl) {
      console.error(`No path found in ${letter}.svg`);
      return;
    }
    
    const pathD = pathEl.getAttribute('d');
    const viewBoxStr = svgDoc.documentElement.getAttribute('viewBox');
    let viewBox = [0, 0, 100, 100];
    
    if (viewBoxStr) {
      viewBox = viewBoxStr.split(/[\s,]+/).map(Number);
    }
    
    // Sample path into points
    let points = samplePathD(pathD, CONFIG.SAMPLE_POINTS, viewBox);
    
    if (points.length === 0) {
      console.error(`Sampling produced no points for ${letter}`);
      return;
    }
    
    // Detect if closed
    const isClosed = isPathClosed(points);
    
    // Break the loop if closed
    if (isClosed) {
      const breakIndex = findBreakPoint(points);
      points = breakLoopAtIndex(points, breakIndex, CONFIG.BREAK_GAP_POINTS);
    }

    // Remove any invalid points before decimation
    const beforeSanitize = points.length;
    points = sanitizePoints(points);
    const removedBad = beforeSanitize - points.length;
    if (removedBad > 0) console.warn(`${letter}: removed ${removedBad} invalid points`);
    
    // Decimate by distance
    points = decimateByDistance(points, CONFIG.MIN_POINT_DIST);
    
    // Simplify using RDP
    points = rdpSimplify(points, CONFIG.SIMPLIFY_EPSILON);
    
    // Hard cap
    if (points.length > CONFIG.MAX_TOTAL_POINTS) {
      const step = Math.ceil(points.length / CONFIG.MAX_TOTAL_POINTS);
      points = points.filter((_, i) => i % step === 0);
    }
    
    // Normalize to canvas (540×675 with margins)
    const bbox = computeBBox(points);
    currentBBox = bbox;
    points = normalizePoints(points, bbox, viewBox);
    
    currentPoints = points;
    currentLetter = letter;
    
    const elapsedMs = performance.now() - startTime;
    console.log(`Loaded ${letter}`);
    
    redraw();
  } catch (err) {
    console.error(`Error loading ${letter}:`, err);
  }
}

// ============================================================
// SVG PATH SAMPLING
// ============================================================

function samplePathD(pathD, maxPoints, viewBox) {
  // Create a temporary offscreen SVG to ensure getTotalLength works in all browsers
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  const [vbX, vbY, vbW, vbH] = viewBox || [0, 0, 1000, 1000];
  svg.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
  svg.setAttribute('width', vbW);
  svg.setAttribute('height', vbH);
  svg.style.position = 'absolute';
  svg.style.left = '-9999px';
  svg.style.top = '-9999px';
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'black');
  svg.appendChild(path);
  document.body.appendChild(svg);

  const points = [];
  let totalLen = 0;
  try {
    totalLen = path.getTotalLength();
  } catch (e) {
    console.error('getTotalLength failed', e);
  }

  console.log('totalLen', totalLen, 'viewBox', viewBox);

  const samples = Math.max(2, maxPoints);
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * totalLen;
    const pt = path.getPointAtLength(t);
    points.push([pt.x, pt.y]);
  }

  // Debug: log first few points
  console.log('first points', points.slice(0, 6));

  // Cleanup
  document.body.removeChild(svg);
  return points;
}

// ============================================================
// GEOMETRY HELPERS
// ============================================================

function arrDist(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function sanitizePoints(points) {
  const cleaned = [];
  for (const p of points) {
    if (p && Number.isFinite(p[0]) && Number.isFinite(p[1])) cleaned.push(p);
  }
  return cleaned;
}

function computeBBox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

function isPathClosed(points) {
  if (points.length < 3) return false;
  return arrDist(points[0], points[points.length - 1]) < CONFIG.CLOSED_THRESHOLD;
}

// ============================================================
// BREAK THE LOOP
// ============================================================

function findBreakPoint(points) {
  let breakIdx = 0;
  
  if (CONFIG.BREAK_MODE === 'topLeft') {
    // Find point with smallest x + y
    let bestScore = Infinity;
    for (let i = 0; i < points.length; i++) {
      const score = points[i][0] + points[i][1];
      if (score < bestScore) {
        bestScore = score;
        breakIdx = i;
      }
    }
  } else if (CONFIG.BREAK_MODE === 'minX') {
    // Find leftmost point
    let minX = Infinity;
    for (let i = 0; i < points.length; i++) {
      if (points[i][0] < minX) {
        minX = points[i][0];
        breakIdx = i;
      }
    }
  } else if (CONFIG.BREAK_MODE === 'leftMid') {
    // Find leftmost point, then among those, pick one near mid-height
    const bbox = computeBBox(points);
    const midY = (bbox.minY + bbox.maxY) / 2;
    let bestDist = Infinity;
    
    for (let i = 0; i < points.length; i++) {
      if (Math.abs(points[i][0] - bbox.minX) < 1) {
        const dy = Math.abs(points[i][1] - midY);
        if (dy < bestDist) {
          bestDist = dy;
          breakIdx = i;
        }
      }
    }
  } else if (CONFIG.BREAK_MODE === 'maxY') {
    // Find lowest point
    let maxY = -Infinity;
    for (let i = 0; i < points.length; i++) {
      if (points[i][1] > maxY) {
        maxY = points[i][1];
        breakIdx = i;
      }
    }
  } else if (CONFIG.BREAK_MODE === 'angleRay') {
    // Find point closest to 45° ray from center
    const bbox = computeBBox(points);
    const cx = (bbox.minX + bbox.maxX) / 2;
    const cy = (bbox.minY + bbox.maxY) / 2;
    const targetAngle = PI / 4; // 45°
    
    let bestAngleDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dx = points[i][0] - cx;
      const dy = points[i][1] - cy;
      const angle = atan2(dy, dx);
      let angleDiff = abs(angle - targetAngle);
      if (angleDiff > PI) angleDiff = TWO_PI - angleDiff;
      
      if (angleDiff < bestAngleDiff) {
        bestAngleDiff = angleDiff;
        breakIdx = i;
      }
    }
  }
  
  return breakIdx;
}

function breakLoopAtIndex(points, breakIdx, gapSize) {
  // Remove gapSize points centered on breakIdx
  const k = Math.floor(gapSize / 2);
  const startRemove = Math.max(0, breakIdx - k);
  const endRemove = Math.min(points.length - 1, breakIdx + k);
  
  // Reorder: start after removed segment, end before it
  const reordered = [];
  for (let i = endRemove + 1; i < startRemove + points.length; i++) {
    reordered.push(points[i % points.length]);
  }

  // Deduplicate in case break landed on identical neighbors
  const deduped = [reordered[0]];
  for (let i = 1; i < reordered.length; i++) {
    if (arrDist(reordered[i], deduped[deduped.length - 1]) > 1e-6) {
      deduped.push(reordered[i]);
    }
  }
  return deduped;
}

// ============================================================
// POINT CLEANING
// ============================================================

function decimateByDistance(points, minDist) {
  if (points.length < 2) return points;
  
  const kept = [points[0]];
  let lastKept = points[0];
  let skipped = 0;
  for (let i = 1; i < points.length; i++) {
    const d = arrDist(points[i], lastKept);
    if (!Number.isFinite(d)) {
      skipped++;
      continue;
    }
    if (d >= minDist) {
      kept.push(points[i]);
      lastKept = points[i];
    }
  }

  // Ensure we keep the final point for open polylines
  const last = points[points.length - 1];
  const dLast = arrDist(kept[kept.length - 1], last);
  if (Number.isFinite(dLast) && dLast >= 1e-6) {
    kept.push(last);
  }
  if (skipped > 0) console.warn(`decimate: skipped ${skipped} invalid distances`);
  return kept;
}

function rdpSimplify(points, epsilon) {
  if (points.length < 3) return points;
  
  const dmax = { dist: 0, idx: 0 };
  
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistToSegment(points[i], points[0], points[points.length - 1]);
    if (d > dmax.dist) {
      dmax.dist = d;
      dmax.idx = i;
    }
  }
  
  if (dmax.dist > epsilon) {
    const left = rdpSimplify(points.slice(0, dmax.idx + 1), epsilon);
    const right = rdpSimplify(points.slice(dmax.idx), epsilon);
    const merged = left.slice(0, -1).concat(right);
    // Deduplicate accidental repeats
    const deduped = [merged[0]];
    for (let i = 1; i < merged.length; i++) {
      if (arrDist(merged[i], deduped[deduped.length - 1]) > 1e-6) {
        deduped.push(merged[i]);
      }
    }
    return deduped;
  } else {
    return [points[0], points[points.length - 1]];
  }
}

function perpDistToSegment(p, a, b) {
  const ap = [p[0] - a[0], p[1] - a[1]];
  const ab = [b[0] - a[0], b[1] - a[1]];
  const abab = ab[0] * ab[0] + ab[1] * ab[1];
  
  if (abab === 0) return arrDist(p, a);
  
  const t = (ap[0] * ab[0] + ap[1] * ab[1]) / abab;
  const closest = [a[0] + t * ab[0], a[1] + t * ab[1]];
  return arrDist(p, closest);
}

// ============================================================
// NORMALIZATION
// ============================================================

function normalizePoints(points, bbox, viewBox) {
  const bboxW = bbox.maxX - bbox.minX;
  const bboxH = bbox.maxY - bbox.minY;
  if (bboxW === 0 || bboxH === 0) return points.slice();
  
  const MAX_LETTER_WIDTH = 320;
  const CANVAS_H = CONFIG.CANVAS_H;
  const CANVAS_W = CONFIG.CANVAS_W;
  
  // Scale constrained by max width
  const scaleByWidth = MAX_LETTER_WIDTH / bboxW;
  const scaleByHeight = CANVAS_H / bboxH;
  const scale = Math.min(scaleByWidth, scaleByHeight);
  
  // Scaled dimensions
  const scaledW = bboxW * scale;
  const scaledH = bboxH * scale;
  
  // Center horizontally and vertically on canvas
  const tx = (CANVAS_W - scaledW) / 2 - bbox.minX * scale;
  const ty = (CANVAS_H - scaledH) / 2 - bbox.minY * scale;
  
  return points.map(([x, y]) => [x * scale + tx, y * scale + ty]);
}

// ============================================================
// SVG EXPORT
// ============================================================

function exportSVG(letter, points) {
  if (points.length === 0) {
    console.warn(`No points to export for ${letter}`);
    return;
  }
  
  // Build path d attribute
  let pathD = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
  }
  
  // Build SVG string
  const svgContent = `<svg viewBox="0 0 ${CONFIG.CANVAS_W} ${CONFIG.CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathD}" 
        fill="none" 
        stroke="${CONFIG.STROKE_COLOR}" 
        stroke-width="${CONFIG.STROKE_WIDTH}"
        stroke-linecap="round"
        stroke-linejoin="round"/>
</svg>`;
  
  // Save file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `plotter_letter_${letter}_${CONFIG.SEED}_${CONFIG.BREAK_MODE}.svg`;
  
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  console.log(`Exported ${filename} (${points.length} points)`);
}

// ============================================================
// DRAWING (PREVIEW)
// ============================================================

function drawCurrentPath() {
  stroke(CONFIG.STROKE_COLOR);
  strokeWeight(CONFIG.STROKE_WIDTH);
  noFill();
  
  beginShape();
  for (const [x, y] of currentPoints) {
    vertex(x, y);
  }
  endShape();
  
  // Draw points
  fill(100, 100);
  noStroke();
  for (const [x, y] of currentPoints) {
    circle(x, y, 2);
  }
}

function drawGuide() {
  // Draw a faint version of something for reference
  stroke(200);
  strokeWeight(0.5);
  noFill();
  
  beginShape();
  for (const [x, y] of currentPoints) {
    vertex(x, y);
  }
  endShape();
}

function drawInfo() {
  fill(0);
  noStroke();
  textSize(11);
  textAlign(LEFT);
  
  let info = `Letter: ${currentLetter} | Points: ${currentPoints.length} | Mode: ${CONFIG.BREAK_MODE}`;
  info += `\nKeys: S=export, N/P=next/prev, B=batch, G=guide, [/]=gap`;
  
  text(info, 10, 20);
}

// ============================================================
// BATCH PROCESSING
// ============================================================

async function batchExportAZ() {
  if (isBatching) return;
  
  isBatching = true;
  batchQueue = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  console.log(`Starting batch export of ${batchQueue.length} letters...`);
  
  const processNext = async () => {
    if (batchQueue.length === 0) {
      console.log('Batch export complete!');
      isBatching = false;
      return;
    }
    
    const letter = batchQueue.shift();
    const startTime = performance.now();
    
    await loadAndRenderLetter(letter);
    
    if (currentPoints.length > 0) {
      exportSVG(letter, currentPoints);
    }
    
    const elapsedMs = performance.now() - startTime;
    console.log(`Exported ${letter} (${currentPoints.length} pts, ${elapsedMs.toFixed(0)}ms)`);
    
    // Yield to prevent freezing
    if (CONFIG.BATCH_YIELD) {
      setTimeout(processNext, 16);
    } else {
      processNext();
    }
  };
  
  processNext();
}

// ============================================================
// KEY CONTROLS
// ============================================================

function keyPressed() {
  if (key.toUpperCase() === 'S') {
    // Export current letter
    exportSVG(currentLetter, currentPoints);
  } else if (key.toUpperCase() === 'N') {
    // Next letter
    const idx = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(currentLetter);
    if (idx < 25) {
      const nextLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[idx + 1];
      loadAndRenderLetter(nextLetter);
    }
  } else if (key.toUpperCase() === 'P') {
    // Previous letter
    const idx = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(currentLetter);
    if (idx > 0) {
      const prevLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[idx - 1];
      loadAndRenderLetter(prevLetter);
    }
  } else if (key.toUpperCase() === 'B') {
    // Batch export A-Z
    batchExportAZ();
  } else if (key.toUpperCase() === 'G') {
    // Toggle guide
    showGuide = !showGuide;
    redraw();
  } else if (key === '[') {
    // Decrease break gap
    CONFIG.BREAK_GAP_POINTS = Math.max(1, CONFIG.BREAK_GAP_POINTS - 1);
    console.log(`Break gap: ${CONFIG.BREAK_GAP_POINTS}`);
    loadAndRenderLetter(currentLetter);
  } else if (key === ']') {
    // Increase break gap
    CONFIG.BREAK_GAP_POINTS++;
    console.log(`Break gap: ${CONFIG.BREAK_GAP_POINTS}`);
    loadAndRenderLetter(currentLetter);
  } else if (key >= '1' && key <= '5') {
    // Switch break mode (debug)
    const modes = ['topLeft', 'leftMid', 'minX', 'maxY', 'angleRay'];
    CONFIG.BREAK_MODE = modes[parseInt(key) - 1];
    console.log(`Break mode: ${CONFIG.BREAK_MODE}`);
    loadAndRenderLetter(currentLetter);
  }
  
  return false;
}
