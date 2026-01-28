const WIDTH = 540;
const HEIGHT = 675;

// Centralized controls
const CFG = {
  background: '#d00098',
  blobFill: [255, 45], // white with alpha
  segments: 32,
  widthFactor: 0.5, // blob width = canvas * factor
  heightFactor: 1 / 3, // blob height = canvas * factor
  // Motion / shape
  noiseAmount: 0.6,
  noiseScale: 0.7,
  noiseSpeed: 0.35,
  // weightBiasTop: -0.06,
  weightBiasTop: -3.2,
  // weightBiasBottom: 0.28,
  weightBiasBottom: 1200,
  breatheAmp: 0.08,
  breatheSpeed: 0.8,
  breathePhase: 0.9,
  yBiasSin: 0.06,
  baseControl: 0.28,
  elasticControl: 0.06,
  squashFactor: 0.38,
  fps: 60
};

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  frameRate(CFG.fps);
}

function draw() {
  background(CFG.background);
  noStroke();
  fill(...CFG.blobFill);
  const t = frameCount * 0.02;
  const w = WIDTH * CFG.widthFactor;
  const h = HEIGHT * CFG.heightFactor;
  drawGloopyBlob(WIDTH / 2, HEIGHT / 2, w, h, CFG.segments, t);
}

// Gloopy, elastic blob with downward weight bias and time-driven deformation
function drawGloopyBlob(cx, cy, w, h, n, t) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (TWO_PI * i) / n;
    const rx = (w * 0.5);
    const ry = (h * 0.5);

    // Time-varying irregularity via angle-space noise (with temporal component)
    const nval = noise(Math.cos(a) * CFG.noiseScale + 100, Math.sin(a) * CFG.noiseScale + 50, t * CFG.noiseSpeed);
    const ir = 1 + (nval - 0.5) * CFG.noiseAmount;
    // Weight bias: expand at bottom, compress at top
    const weight = map(Math.sin(a), -1, 1, CFG.weightBiasTop, CFG.weightBiasBottom);
    // Breathing / elastic pulse with phase offset across the blob
    const breathe = 1 + CFG.breatheAmp * Math.sin(t * CFG.breatheSpeed + Math.sin(a) * CFG.breathePhase);
    const rScale = ir * breathe + weight;

    const x = cx + Math.cos(a) * rx * rScale;
    const y = cy + Math.sin(a) * ry * (rScale + CFG.yBiasSin * Math.sin(a));
    pts.push(createVector(x, y));
  }

  // Tangents based on neighboring points for smooth cubic segments
  const tans = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const t = p5.Vector.sub(next, prev).normalize();
    tans.push(t);
  }

  beginShape();
  vertex(pts[0].x, pts[0].y);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const d = p5.Vector.dist(pts[i], pts[j]);
    // Base control length with time-varying elasticity
    let k = d * (CFG.baseControl + CFG.elasticControl * Math.sin(t + i * 0.25));
    // Squash near the bottom to suggest weight/contact
    const squash = 1 - CFG.squashFactor * Math.max(0, Math.sin((TWO_PI * i) / n));
    k *= squash;

    const c1 = p5.Vector.add(pts[i], p5.Vector.mult(tans[i], k));
    const c2 = p5.Vector.sub(pts[j], p5.Vector.mult(tans[j], k));
    bezierVertex(c1.x, c1.y, c2.x, c2.y, pts[j].x, pts[j].y);
  }
  endShape(CLOSE);
}
function drawOrganicBlob(cx, cy, w, h, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (TWO_PI * i) / n;
    const rs = 1 + random(-0.18, 0.18);
    const x = cx + Math.cos(a) * (w * 0.5) * rs;
    const y = cy + Math.sin(a) * (h * 0.5) * rs;
    pts.push(createVector(x, y));
  }
  const tans = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const t = p5.Vector.sub(next, prev).normalize();
    tans.push(t);
  }
  beginShape();
  vertex(pts[0].x, pts[0].y);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const d = p5.Vector.dist(pts[i], pts[j]);
    const k = d * 0.25;
    const c1 = p5.Vector.add(pts[i], p5.Vector.mult(tans[i], k));
    const c2 = p5.Vector.sub(pts[j], p5.Vector.mult(tans[j], k));
    bezierVertex(c1.x, c1.y, c2.x, c2.y, pts[j].x, pts[j].y);
  }
  endShape(CLOSE);
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveCanvas(`genuary-23-${timestamp}`, 'png');
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  }
}
