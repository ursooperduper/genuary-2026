const WIDTH = 540;
const HEIGHT = 675;

const CFG = {
  // sampleStep: 2,      // pixel step when sampling the SVG into points
  // shapeScale: 6,    // overall scale of the SVG point cloud
  // spin: 0.01,         // radians per frame, base rotation
  // radialWarp: 0.35,   // stretch amount as a function of angle
  // angleWarp: 0.4,     // additional angular twist
  // warpFreq: 3.0,      // frequency for radial warp modulation
  sampleStep: 2,      // pixel step when sampling the SVG into points
  shapeScale: 5,    // overall scale of the SVG point cloud
  spin: 0.01,         // radians per frame, base rotation
  radialWarp: 12.8,   // stretch amount as a function of angle
  angleWarp: 0.2,     // additional angular twist
  warpFreq: 1.8,      // frequency for radial warp modulation
  pointSize: 2.0,     // stroke weight for rendered points
};

let pcShape;
let pcPoints = [];
let pointCloudReady = false;

function preload() {
  pcShape = loadImage('pcshape9.svg');
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  frameRate(60);
}

function draw() {
  background('#000000');

  if (!pcShape) {
    drawStatus('Loading pcshape2.svg ...');
    return;
  }

  if (!pointCloudReady) {
    buildPointCloud();
  }

  if (!pointCloudReady) {
    drawStatus('Preparing point cloud ...');
    return;
  }

  drawWarpedCloud();
}

function buildPointCloud() {
  if (!pcShape.width || !pcShape.height) return;

  pcShape.loadPixels();
  pcPoints = [];
  const step = max(1, CFG.sampleStep);
  for (let y = 0; y < pcShape.height; y += step) {
    for (let x = 0; x < pcShape.width; x += step) {
      const idx = 4 * (y * pcShape.width + x);
      const a = pcShape.pixels[idx + 3];
      if (a > 10) {
        pcPoints.push({
          x: x - pcShape.width / 2,
          y: y - pcShape.height / 2,
        });
      }
    }
  }
  pointCloudReady = pcPoints.length > 0;
}

function drawWarpedCloud() {
  const t = frameCount * CFG.spin;
  const radialWarpInteractive = map(mouseX, 0, width, 0, 1);

  push();
  translate(width / 2, height / 2);
  stroke(255);
  strokeWeight(CFG.pointSize);
  noFill();

  beginShape(POINTS);
  for (const p of pcPoints) {
    const sx = p.x * CFG.shapeScale;
    const sy = p.y * CFG.shapeScale;
    const r = sqrt(sx * sx + sy * sy);
    const ang = atan2(sy, sx);

    const rWarp = r * (1 + radialWarpInteractive * sin(ang * CFG.warpFreq + t));
    const angWarp = ang + CFG.angleWarp * sin(t + r * 0.005);

    const ox = cos(angWarp + t) * rWarp;
    const oy = sin(angWarp + t) * rWarp;
    vertex(ox, oy);
  }
  endShape();

  pop();
}

function drawStatus(msg) {
  push();
  fill('#888');
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text(msg, width * 0.5, height * 0.5);
  pop();
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // Create a temporary 2D buffer to capture the render, then save as PNG
  const buffer = createGraphics(WIDTH, HEIGHT);
  buffer.background('#000000');
  
  if (pointCloudReady) {
    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);
    buffer.stroke(255);
    buffer.strokeWeight(CFG.pointSize);
    buffer.noFill();
    
    const t = frameCount * CFG.spin;
    buffer.beginShape(POINTS);
    for (const p of pcPoints) {
      const sx = p.x * CFG.shapeScale;
      const sy = p.y * CFG.shapeScale;
      const r = sqrt(sx * sx + sy * sy);
      const ang = atan2(sy, sx);
      const rWarp = r * (1 + CFG.radialWarp * sin(ang * CFG.warpFreq + t));
      const angWarp = ang + CFG.angleWarp * sin(t + r * 0.005);
      const ox = cos(angWarp + t) * rWarp;
      const oy = sin(angWarp + t) * rWarp;
      buffer.vertex(ox, oy);
    }
    buffer.endShape();
    buffer.pop();
  }
  
  buffer.save(`genuary-${timestamp}.png`);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  }
}
