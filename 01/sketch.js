const WIDTH = 540;
const HEIGHT = 675;

let img;
let imgBuffer;
const CELL_SIZE = 4; // primary halftone grid cell size in pixels (larger)
const CELL_SIZE_2 = CELL_SIZE * 4; // secondary pass cell size (smaller)
const DOT_HSL = { h: 0, s: 100, l: 63, a: 1.0 }; // single color for all circles (HSL)
let shapeType; // 'circle', 'square', or 'triangle'
let shapeSizeMultiplier = 1.0; // dynamic size control via keyboard

function setup() {
  // Use default (raster) renderer so blendMode works
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  colorMode(HSL, 360, 100, 100, 1);
  pixelDensity(1);
  // Offscreen buffer to draw the fitted image for sampling
  imgBuffer = createGraphics(WIDTH, HEIGHT);
  imgBuffer.pixelDensity(1);
  noLoop();

  // Pick a random shape type for this render
  const types = ['circle', 'square', 'triangle'];
  shapeType = random(types);
  loop();
}

function draw() {
  background('#ffffffff');
  if (!img) {
    return;
  }

  const hue = map(mouseX, 0, width, 0, 360);
  renderHalftone(hue, true);
}

function renderHalftone(hue, useBlendMode) {
  imgBuffer.clear();
  imgBuffer.background(255);
  const scale = Math.min(WIDTH / img.width, HEIGHT / img.height);
  const dw = Math.floor(img.width * scale);
  const dh = Math.floor(img.height * scale);
  const dx = Math.floor((WIDTH - dw) / 2);
  const dy = Math.floor((HEIGHT - dh) / 2);
  imgBuffer.image(img, dx, dy, dw, dh);
  imgBuffer.loadPixels();

  // Halftone: sample brightness and draw shapes in a single color
  noStroke();
  fill(hue, DOT_HSL.s, DOT_HSL.l, DOT_HSL.a);
  for (let y = 0; y < HEIGHT; y += CELL_SIZE) {
    for (let x = 0; x < WIDTH; x += CELL_SIZE) {
      const idx = 4 * ((y * WIDTH) + x);
      const r = imgBuffer.pixels[idx] ?? 255;
      const g = imgBuffer.pixels[idx + 1] ?? 255;
      const b = imgBuffer.pixels[idx + 2] ?? 255;
      const a = imgBuffer.pixels[idx + 3] ?? 255;
      // Treat fully transparent as white
      const rr = a === 0 ? 255 : r;
      const gg = a === 0 ? 255 : g;
      const bb = a === 0 ? 255 : b;
      // Luma (Rec. 709) brightness
      const bright = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
      // Larger dots for darker areas
      const d = CELL_SIZE * (1 - bright) * shapeSizeMultiplier;
      const cx = x + CELL_SIZE * 0.5;
      const cy = y + CELL_SIZE * 0.5;
      if (d > 0.5) {
        drawShape(cx, cy, d);
      }
    }
  }

  // Second pass: smaller cells with DIFFERENCE blend (if supported)
  if (useBlendMode) {
    blendMode(DIFFERENCE);
    // blendMode(REMOVE);
    // blendMode(HARD_LIGHT); // Good with circles
    // blendMode(BLEND); // Good with circles
  }
  fill(hue, DOT_HSL.s, DOT_HSL.l, DOT_HSL.a);
  for (let y = 0; y < HEIGHT; y += CELL_SIZE_2) {
    for (let x = 0; x < WIDTH; x += CELL_SIZE_2) {
      const idx = 4 * ((y * WIDTH) + x);
      const r = imgBuffer.pixels[idx] ?? 255;
      const g = imgBuffer.pixels[idx + 1] ?? 255;
      const b = imgBuffer.pixels[idx + 2] ?? 255;
      const a = imgBuffer.pixels[idx + 3] ?? 255;
      const rr = a === 0 ? 255 : r;
      const gg = a === 0 ? 255 : g;
      const bb = a === 0 ? 255 : b;
      const bright = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
      const d = CELL_SIZE_2 * (1 - bright) * shapeSizeMultiplier;
      const cx = x + CELL_SIZE_2 * 0.5;
      const cy = y + CELL_SIZE_2 * 0.5;
      if (d > 0.5) {
        drawShape(cx, cy, d);
      }
    }
  }
  if (useBlendMode) {
    blendMode(BLEND);
  }
}

function drawShape(x, y, size) {
  if (shapeType === 'square') {
    rectMode(CENTER);
    rect(x, y, size, size);
  } else if (shapeType === 'triangle') {
    const h = size * 0.866; // equilateral height
    triangle(x, y - h / 2, x - size / 2, y + h / 2, x + size / 2, y + h / 2);
  } else {
    circle(x, y, size);
  }
}

function drawShapeToBuffer(buffer, x, y, size) {
  if (shapeType === 'square') {
    buffer.rectMode(CENTER);
    buffer.rect(x, y, size, size);
  } else if (shapeType === 'triangle') {
    const h = size * 0.866; // equilateral height
    buffer.triangle(x, y - h / 2, x - size / 2, y + h / 2, x + size / 2, y + h / 2);
  } else {
    buffer.circle(x, y, size);
  }
}

function saveAsSvg() {
  if (!img) {
    console.warn('Image not loaded yet');
    return;
  }
  
  // Create offscreen SVG buffer
  const svgBuffer = createGraphics(WIDTH, HEIGHT, SVG);
  svgBuffer.colorMode(HSL, 360, 100, 100, 1);
  svgBuffer.background('#ffffff');
  
  // Get current hue from mouse position
  const hue = map(mouseX, 0, width, 0, 360);
  
  // Render halftone to SVG (without blend modes since SVG doesn't support DIFFERENCE)
  svgBuffer.noStroke();
  svgBuffer.fill(hue, DOT_HSL.s, DOT_HSL.l, DOT_HSL.a);
  
  for (let y = 0; y < HEIGHT; y += CELL_SIZE) {
    for (let x = 0; x < WIDTH; x += CELL_SIZE) {
      const idx = 4 * ((y * WIDTH) + x);
      const r = imgBuffer.pixels[idx] ?? 255;
      const g = imgBuffer.pixels[idx + 1] ?? 255;
      const b = imgBuffer.pixels[idx + 2] ?? 255;
      const a = imgBuffer.pixels[idx + 3] ?? 255;
      const rr = a === 0 ? 255 : r;
      const gg = a === 0 ? 255 : g;
      const bb = a === 0 ? 255 : b;
      const bright = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
      const d = CELL_SIZE * (1 - bright) * shapeSizeMultiplier;
      const cx = x + CELL_SIZE * 0.5;
      const cy = y + CELL_SIZE * 0.5;
      if (d > 0.5) {
        drawShapeToBuffer(svgBuffer, cx, cy, d);
      }
    }
  }
  
  // Second pass (without blend mode for SVG compatibility)
  svgBuffer.fill(hue, DOT_HSL.s, DOT_HSL.l, DOT_HSL.a);
  for (let y = 0; y < HEIGHT; y += CELL_SIZE_2) {
    for (let x = 0; x < WIDTH; x += CELL_SIZE_2) {
      const idx = 4 * ((y * WIDTH) + x);
      const r = imgBuffer.pixels[idx] ?? 255;
      const g = imgBuffer.pixels[idx + 1] ?? 255;
      const b = imgBuffer.pixels[idx + 2] ?? 255;
      const a = imgBuffer.pixels[idx + 3] ?? 255;
      const rr = a === 0 ? 255 : r;
      const gg = a === 0 ? 255 : g;
      const bb = a === 0 ? 255 : b;
      const bright = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
      const d = CELL_SIZE_2 * (1 - bright) * shapeSizeMultiplier;
      const cx = x + CELL_SIZE_2 * 0.5;
      const cy = y + CELL_SIZE_2 * 0.5;
      if (d > 0.5) {
        drawShapeToBuffer(svgBuffer, cx, cy, d);
      }
    }
  }
  
  // Serialize and download SVG
  const svgElement = svgBuffer.canvas;
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const link = document.createElement('a');
  link.href = url;
  link.download = `genuary-${timestamp}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveCanvas(`genuary-23-${timestamp}`, 'png');
}

function keyPressed() {
  if (key === '-') {
    shapeSizeMultiplier = max(0.1, shapeSizeMultiplier - 0.1);
    redraw();
  } else if (key === '+' || key === '=') {
    shapeSizeMultiplier = min(3.0, shapeSizeMultiplier + 0.1);
    redraw();
  } else if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  }
}

function mousePressed() {
  // Cycle through shape types on click
  const types = ['circle', 'square', 'triangle'];
  const currentIndex = types.indexOf(shapeType);
  shapeType = types[(currentIndex + 1) % types.length];
  redraw();
}

function preload() {
  // Load default image from project folder
  img = loadImage('ess.png');
}