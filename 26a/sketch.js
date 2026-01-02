// Tunable parameters
const CANVAS_WIDTH = 540;
const CANVAS_HEIGHT = 675;
const TRI_HEIGHT_RATIO = 0.6; // 0-1, how tall the main triangle is relative to canvas height
const MAX_DEPTH = 6;          // Maximum recursion depth per cell (actual depth varies per cell)
const MIN_SIZE = 8;           // Stop subdividing when an edge gets smaller than this (pixels)
const STROKE_WEIGHT = 1;
const STROKE_COLOR = '#ffffff';
const BG_COLOR = '#000000';
const STROKE_HSL = { h: 67, s: 100, l: 63, a: 1.0 }; 

function setup() {
  // Use default renderer (not SVG) so blend modes work properly
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent('sketch-holder');
  colorMode(HSL, 360, 100, 100, 1);
  strokeWeight(STROKE_WEIGHT);
  stroke(STROKE_COLOR);
  noFill();
  frameRate(60);
  noLoop(); // Render once for a static grid with no flicker; reload for a new random layout
}

function draw() {
  background(BG_COLOR);

  // Use a shared seed so both passes (original and flipped) share the same random recursion
  const seed = floor(random(1e9));

  // Start with a large triangle filling most of the canvas
  const h = CANVAS_HEIGHT * TRI_HEIGHT_RATIO;
  const w = (2 * h) / Math.sqrt(3); // Equilateral: side length from height
  const x = (CANVAS_WIDTH - w) / 2;
  const y = (CANVAS_HEIGHT - h) / 2;

  const p1 = createVector(x, y + h);
  const p2 = createVector(x + w, y + h);
  const p3 = createVector(x + w / 2, y);

  const primaryStroke = color(STROKE_HSL.h, STROKE_HSL.s, STROKE_HSL.l, STROKE_HSL.a);
  const primaryFill = color(STROKE_HSL.h, STROKE_HSL.s, STROKE_HSL.l, 0.1);

  randomSeed(seed);
  drawRecursiveTriangleGrid(p1, p2, p3, 0, primaryStroke, primaryFill);
}

function drawRecursiveTriangleGrid(p1, p2, p3, depth, strokeColor, fillColor) {
  // Draw the triangle
  stroke(strokeColor);
  strokeWeight(STROKE_WEIGHT);
  fill(fillColor);
  triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);

  // Randomize recursion depth for this cell
  const maxLocalDepth = floor(random(0, MAX_DEPTH + 1));

  // If we've reached local max depth or triangle is too small, stop
  if (depth >= maxLocalDepth) return;
  const size = p5.Vector.dist(p1, p2);
  if (size < MIN_SIZE) return;

  // Subdivide into 3 smaller triangles (one at each midpoint)
  const mid12 = p5.Vector.lerp(p1, p2, 0.5);
  const mid23 = p5.Vector.lerp(p2, p3, 0.5);
  const mid31 = p5.Vector.lerp(p3, p1, 0.5);

  // Recurse in each of the 3 child triangles
  drawRecursiveTriangleGrid(p1, mid12, mid31, depth + 1, strokeColor, fillColor);
  drawRecursiveTriangleGrid(mid12, p2, mid23, depth + 1, strokeColor, fillColor);
  drawRecursiveTriangleGrid(mid31, mid23, p3, depth + 1, strokeColor, fillColor);
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
