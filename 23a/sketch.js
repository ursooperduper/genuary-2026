const WIDTH = 540;
const HEIGHT = 675;

let numShapes;
let shapeSize = 80;
let copies = 6;     // number of stacked motifs
let overlap = 0.5;  // 0..1, fraction of motif extent to overlap between stacks
let shapeType;      // 'circle', 'square', or 'triangle'
let useUniformScale = true;  // decide if all stacks share the same scale
let stackScales = [];  // per-stack scale factors
let compositionBuffer;  // offscreen buffer for composition


function setup() {
  // Use raster renderer so blendMode(DIFFERENCE) works on screen
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  colorMode(HSL, 360, 100, 100, 1);
  // Create offscreen buffer for composition
  compositionBuffer = createGraphics(WIDTH, HEIGHT);
  compositionBuffer.colorMode(HSL, 360, 100, 100, 1);
  // Pick random number of shapes per stack (8-16)
  numShapes = floor(random(8, 16));
  // Pick a random shape type for this sketch
  const types = ['circle', 'square', 'triangle'];
  shapeType = random(types);
  // Pick a random number of copies (3-6)
  copies = floor(random(3, 7));
  // Randomly decide if all stacks use the same scale
  useUniformScale = random() > 0.5;
  // Populate stackScales: either all 1.0, or random 0.5-1.5
  stackScales = [];
  if (useUniformScale) {
    for (let i = 0; i < copies; i++) {
      stackScales.push(1.0);
    }
  } else {
    for (let i = 0; i < copies; i++) {
      stackScales.push(random(0.5, 2.2));
    }
  }
  loop();
}

function draw() {
  // Map horizontal mouse position to hue (0-360)
  const hue = map(mouseX, 0, width, 0, 360);
  
  // Draw composition to offscreen buffer
  compositionBuffer.clear();
  compositionBuffer.noStroke();
  compositionBuffer.fill(hue, 100, 63, 0.2);

  const spacing = shapeSize * 0.24;
  const motifExtent = shapeSize + (numShapes - 1) * spacing;
  const step = motifExtent * (1 - overlap);
  const totalHeight = motifExtent + (copies - 1) * step;
  const startY = (HEIGHT - totalHeight) / 2 + motifExtent / 2;

  for (let i = 0; i < copies; i++) {
    compositionBuffer.push();
    compositionBuffer.translate(WIDTH * 0.5, startY + i * step);
    compositionBuffer.scale(stackScales[i]);
    if (i > 0 && i < copies - 1) {
      compositionBuffer.blendMode(DIFFERENCE);
    } else {
      compositionBuffer.blendMode(BLEND);
    }
    drawMotifTo(compositionBuffer, spacing);
    compositionBuffer.pop();
  }
  compositionBuffer.blendMode(BLEND);

  // Now composite to main canvas
  background('#bdbdbdff');
  // Draw white rectangle (full height, half width)
  noStroke();
  // blendMode(NORMAL);
  fill(0, 0, 100, 0.5);
  rect(0, 0, width / 2, height);
  
  // Paste composition on top with blend mode
  // blendMode(DIFFERENCE);
  image(compositionBuffer, 0, 0);
  blendMode(DIFFERENCE);
  rotate(PI);
  translate(-width, -height);
  image(compositionBuffer, 0, 0);
  blendMode(BLEND);
}

function drawMotif(spacing) {
  const halfSpan = (spacing * (numShapes - 1)) / 2;
  drawStacks(spacing, halfSpan, halfSpan);
  rotate(PI / 4);
  drawStacks(spacing, halfSpan, halfSpan);
}

function drawMotifTo(pg, spacing) {
  const halfSpan = (spacing * (numShapes - 1)) / 2;
  drawStacksTo(pg, spacing, halfSpan, halfSpan);
  pg.rotate(PI / 4);
  drawStacksTo(pg, spacing, halfSpan, halfSpan);
}

function drawStacks(spacing, halfWidth, halfHeight) {
  // vertical stack
  for (let i = 0; i < numShapes; i++) {
    const y = -halfHeight + i * spacing;
    drawShape(0, y, shapeSize);
  }

  // horizontal stack
  for (let i = 0; i < numShapes; i++) {
    const x = -halfWidth + i * spacing;
    drawShape(x, 0, shapeSize);
  }
}

function drawStacksTo(pg, spacing, halfWidth, halfHeight) {
  // vertical stack
  for (let i = 0; i < numShapes; i++) {
    const y = -halfHeight + i * spacing;
    drawShapeTo(pg, 0, y, shapeSize);
  }

  // horizontal stack
  for (let i = 0; i < numShapes; i++) {
    const x = -halfWidth + i * spacing;
    drawShapeTo(pg, x, 0, shapeSize);
  }
}

function drawShape(x, y, size) {
  push();
  translate(x, y);
  if (shapeType === 'circle') {
    circle(0, 0, size);
  } else if (shapeType === 'square') {
    rectMode(CENTER);
    rect(0, 0, size, size);
  } else if (shapeType === 'triangle') {
    const h = size * 0.866; // height of equilateral triangle
    triangle(0, -h / 2, -size / 2, h / 2, size / 2, h / 2);
  }
  pop();
}

function drawShapeTo(pg, x, y, size) {
  pg.push();
  pg.translate(x, y);
  if (shapeType === 'circle') {
    pg.circle(0, 0, size);
  } else if (shapeType === 'square') {
    pg.rectMode(CENTER);
    pg.rect(0, 0, size, size);
  } else if (shapeType === 'triangle') {
    const h = size * 0.866; // height of equilateral triangle
    pg.triangle(0, -h / 2, -size / 2, h / 2, size / 2, h / 2);
  }
  pg.pop();
}

function saveAsSvg() {
  // Re-render to an offscreen SVG without blend modes
  const g = createGraphics(WIDTH, HEIGHT, SVG);
  g.background('#FFFFFF');
  g.noStroke();
  // Use current hue from mouseX
  const hue = map(mouseX, 0, width, 0, 359);
  g.fill(`hsla(${hue}, 100%, 63%, 0.16)`);

  const spacing = shapeSize * 0.24;
  const motifExtent = shapeSize + (numShapes - 1) * spacing;
  const step = motifExtent * (1 - overlap);
  const totalHeight = motifExtent + (copies - 1) * step;
  const startY = (HEIGHT - totalHeight) / 2 + motifExtent / 2;

  for (let i = 0; i < copies; i++) {
    g.push();
    g.translate(WIDTH * 0.5, startY + i * step);
    g.scale(stackScales[i]);
    drawMotifTo(g, spacing);
    g.pop();
  }

  // Serialize and download the SVG element (avoid saveCanvas/toBlob)
  const svgEl = getSvgRoot(g);
  if (!svgEl) {
    console.error('SVG export failed: could not locate SVG root');
    g.remove();
    return;
  }
  svgEl.setAttribute('width', String(WIDTH));
  svgEl.setAttribute('height', String(HEIGHT));
  if (!svgEl.getAttribute('xmlns')) svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!svgEl.getAttribute('xmlns:xlink')) svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `genuary-23-${timestamp}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  g.remove();
}

function getSvgRoot(pg) {
  // Try common locations exposed by p5.js-svg
  if (typeof SVGElement !== 'undefined' && pg.elt instanceof SVGElement) {
    return pg.elt;
  }
  if (pg.elt && typeof pg.elt.querySelector === 'function') {
    const found = pg.elt.querySelector('svg');
    if (found) return found;
  }
  if (pg._renderer) {
    if (pg._renderer.svg) return pg._renderer.svg;
    if (pg._renderer._svg) return pg._renderer._svg;
    if (pg._renderer.drawingContext && pg._renderer.drawingContext.svg) {
      return pg._renderer.drawingContext.svg;
    }
  }
  return null;
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  }
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveCanvas(`genuary-23-${timestamp}`, 'png');
}
