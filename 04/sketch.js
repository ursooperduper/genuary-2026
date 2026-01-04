const WIDTH = 540;
const HEIGHT = 675;

let srcImg = null;           // Loaded or generated source image
let workingImg = null;       // Source image scaled to canvas with cover fit
let cellSizeX = 24;          // Cell width
let cellSizeY = 24;          // Cell height
let cellLocked = false;      // Lock X and Y sliders together
let cellShape = 'square';    // Current shape: square, circle, diamond, hexagon, star, triangle
let cellPaddingX = 0.9;      // Cell fill ratio X (0.5 = gaps, 1.0 = no gaps)
let cellPaddingY = 0.9;      // Cell fill ratio Y (0.5 = gaps, 1.0 = no gaps)
let cellGapLocked = false;   // Lock X and Y gap sliders together
let adaptiveResolution = false; // Enable adaptive resolution based on contrast
let colorMode = 'full';      // Color mode: full, grayscale, duotone, indexed
let duotoneColor1 = '#ff0066'; // First color for duotone
let duotoneColor2 = '#00ffff'; // Second color for duotone
let paletteIndex = 0;        // Selected palette for indexed mode
let posterizeLevels = 256;   // Posterization levels (2-256, 256 = no posterization)
const minCell = 2;
const maxCell = 120;

function preload() {
  // Preload bowie.png so it's ready before setup
  srcImg = loadImage('bowie.png', 
    () => console.log('bowie.png loaded successfully'),
    () => {
      console.error('Failed to load bowie.png');
      srcImg = null;
    }
  );
}

function setup() {
  // Use default renderer for accurate PNG output; SVG export uses offscreen buffer
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  setAttributes('willReadFrequently', true);
  pixelDensity(1);
  noSmooth();
  frameRate(30);

  // If image failed to load or dimensions aren't valid, use procedural placeholder
  if (!srcImg || !srcImg.width || srcImg.width <= 1 || !srcImg.height || srcImg.height <= 1) {
    console.log('Using placeholder image');
    srcImg = createPlaceholder();
  }
  
  updateWorkingImage();

  // Set up file input handler
  setupFileInput();

  // Sliders for cell size X and Y
  setupCellSliders();

  // Shape selector dropdown
  setupShapeSelector();
  
  // Color mode selector dropdown
  setupColorModeSelector();
  
  // Posterize slider
  setupPosterizeSlider();
}

function setupFileInput() {
  const fileInput = document.getElementById('imageUpload');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            srcImg = createImage(img.width, img.height);
            srcImg.drawingContext.drawImage(img, 0, 0);
            updateWorkingImage();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function createPlaceholder() {
  const g = createGraphics(360, 360);
  g.noSmooth();
  g.colorMode(HSB, 360, 100, 100, 100);
  for (let y = 0; y < g.height; y++) {
    const hue = map(y, 0, g.height, 180, 300);
    g.stroke(hue, 70, 90);
    g.line(0, y, g.width, y);
  }
  g.noFill();
  g.stroke(0, 0, 20, 50);
  for (let i = 0; i < 80; i++) {
    const x = random(g.width);
    const y = random(g.height);
    const r = random(6, 24);
    g.circle(x, y, r);
  }
  return g;
}

function updateWorkingImage() {
  if (!srcImg) return;
  workingImg = createGraphics(WIDTH, HEIGHT);
  workingImg.noSmooth();
  workingImg.imageMode(CENTER);

  // Cover fit: scale image so it covers the canvas
  const imgAspect = srcImg.width / srcImg.height;
  const canvasAspect = WIDTH / HEIGHT;
  let drawW, drawH;
  if (imgAspect > canvasAspect) {
    drawH = HEIGHT;
    drawW = drawH * imgAspect;
  } else {
    drawW = WIDTH;
    drawH = drawW / imgAspect;
  }

  workingImg.push();
  workingImg.translate(WIDTH / 2, HEIGHT / 2);
  workingImg.image(srcImg, 0, 0, drawW, drawH);
  workingImg.pop();
  workingImg.loadPixels();
}

function draw() {
  background(20);

  drawMosaic(this);
}

function drawMosaic(g) {
  if (!workingImg) return;
  g.noStroke();
  workingImg.loadPixels();

  const cols = ceil(width / cellSizeX);
  const rows = ceil(height / cellSizeY);
  for (let y = 0; y < rows; y++) {
    const sy = floor(map(y, 0, rows, 0, workingImg.height));
    for (let x = 0; x < cols; x++) {
      const sx = floor(map(x, 0, cols, 0, workingImg.width));
      const idx = (sy * workingImg.width + sx) * 4;
      const r = workingImg.pixels[idx];
      const gVal = workingImg.pixels[idx + 1];
      const b = workingImg.pixels[idx + 2];
      const a = workingImg.pixels[idx + 3];
      
      // Apply color mode transformation
      const finalColor = applyColorMode(r, gVal, b, a);
      g.fill(finalColor[0], finalColor[1], finalColor[2], finalColor[3]);
      
      const cx = x * cellSizeX + cellSizeX / 2;
      const cy = y * cellSizeY + cellSizeY / 2;
      
      // Calculate adaptive size based on local contrast if enabled
      let sizeMultiplier = 1.0;
      if (adaptiveResolution) {
        const contrast = calculateLocalContrast(sx, sy);
        // High contrast = small shapes (detail), Low contrast = large shapes (chunky)
        // contrast ranges 0-1, map to size 1.5 down to 0.5
        sizeMultiplier = map(contrast, 0, 1, 1.5, 0.5);
      }
      
      drawCellShape(g, cx, cy, cellSizeX * sizeMultiplier, cellSizeY * sizeMultiplier, cellShape, finalColor, x, y);
    }
  }
}

function applyColorMode(r, g, b, a) {
  let color;
  
  switch(colorMode) {
    case 'grayscale':
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      color = [gray, gray, gray, a];
      break;
    
    case 'duotone':
      const brightness = (r + g + b) / 3;
      const t = brightness / 255;
      const c1 = hexToRgb(duotoneColor1);
      const c2 = hexToRgb(duotoneColor2);
      color = [
        lerp(c1[0], c2[0], t),
        lerp(c1[1], c2[1], t),
        lerp(c1[2], c2[2], t),
        a
      ];
      break;
    
    case 'indexed':
      const palette = getPalette(paletteIndex);
      const targetBrightness = (r + g + b) / 3;
      let closestColor = palette[0];
      let minDist = 999999;
      
      for (let col of palette) {
        const dist = abs(targetBrightness - (col[0] + col[1] + col[2]) / 3);
        if (dist < minDist) {
          minDist = dist;
          closestColor = col;
        }
      }
      color = [...closestColor, a];
      break;
    
    case 'full':
    default:
      color = [r, g, b, a];
      break;
  }
  
  // Apply posterization if enabled
  if (posterizeLevels < 256) {
    color[0] = posterize(color[0], posterizeLevels);
    color[1] = posterize(color[1], posterizeLevels);
    color[2] = posterize(color[2], posterizeLevels);
  }
  
  return color;
}

function posterize(value, levels) {
  // Reduce color to specific number of levels
  const step = 255 / (levels - 1);
  return round(value / step) * step;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
}

function getPalette(index) {
  const palettes = [
    [[0, 0, 0], [255, 0, 0], [255, 255, 0], [255, 255, 255]], // Classic
    [[34, 32, 52], [69, 40, 60], [102, 57, 49], [143, 86, 59], [223, 113, 38]], // Sweetie 16
    [[20, 12, 28], [68, 36, 52], [48, 52, 109], [78, 74, 78], [133, 149, 161]], // Purple
    [[255, 0, 110], [255, 119, 168], [255, 204, 170], [148, 242, 255], [0, 180, 216]] // Miami
  ];
  return palettes[index % palettes.length];
}

function calculateLocalContrast(sx, sy) {
  // Sample a 3x3 neighborhood around the pixel and calculate variance
  const neighbors = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = constrain(sx + dx, 0, workingImg.width - 1);
      const ny = constrain(sy + dy, 0, workingImg.height - 1);
      const idx = (ny * workingImg.width + nx) * 4;
      const brightness = (workingImg.pixels[idx] + workingImg.pixels[idx + 1] + workingImg.pixels[idx + 2]) / 3;
      neighbors.push(brightness);
    }
  }
  
  // Calculate variance
  const mean = neighbors.reduce((a, b) => a + b) / neighbors.length;
  const variance = neighbors.reduce((sum, val) => sum + (val - mean) ** 2, 0) / neighbors.length;
  
  // Normalize variance to 0-1 range (255 is max brightness difference)
  return constrain(variance / (255 * 255), 0, 1);
}


function drawCellShape(g, cx, cy, w, h, shape, colorArr = null, gridX = 0, gridY = 0) {
  const sw = w * cellPaddingX; // Controllable cell fill ratio X
  const sh = h * cellPaddingY; // Controllable cell fill ratio Y
  
  switch(shape) {
    case 'circle':
      g.ellipse(cx, cy, sw, sh);
      break;
    case 'diamond':
      g.push();
      g.translate(cx, cy);
      g.rotate(QUARTER_PI);
      // Diamond rotated 45° - scale so it fits the box
      const diagSize = min(sw, sh) / sqrt(2);
      g.rect(-diagSize / 2, -diagSize / 2, diagSize, diagSize);
      g.pop();
      break;
    case 'hexagon':
      drawHexagon(g, cx, cy, sw, sh);
      break;
    case 'star':
      drawStar(g, cx, cy, sw, sh, 5);
      break;
    case 'triangle':
      drawTriangle(g, cx, cy, sw, sh);
      break;
    case 'square':
    default:
      g.rect(cx - sw / 2, cy - sh / 2, sw, sh);
      break;
  }
}

function drawHexagon(g, cx, cy, w, h) {
  g.push();
  g.translate(cx, cy);
  g.beginShape();
  // Draw hexagon with flat top/bottom to maximize vertical fill
  // Starting at 30° offset for flat-topped hexagon
  for (let i = 0; i < 6; i++) {
    const angle = TWO_PI / 6 * i + PI / 6;
    // For flat-topped hexagon, the width spans the full horizontal extent
    // but height only spans cos(30°) = sqrt(3)/2 ≈ 0.866 of the radius
    // To fill height h, we scale appropriately
    const x = cos(angle) * w / 2;
    const y = sin(angle) * h / (2 * 0.866); // Scale to fill full height
    g.vertex(x, y);
  }
  g.endShape(CLOSE);
  g.pop();
}

function drawStar(g, cx, cy, w, h, points) {
  g.push();
  g.translate(cx, cy);
  const outerRW = w / 2;
  const outerRH = h / 2;
  const innerRW = outerRW * 0.4;
  const innerRH = outerRH * 0.4;
  
  g.beginShape();
  for (let i = 0; i < points * 2; i++) {
    // Start at top (-HALF_PI) for proper alignment
    const angle = TWO_PI / (points * 2) * i - HALF_PI;
    const isOuter = i % 2 === 0;
    const rw = isOuter ? outerRW : innerRW;
    const rh = isOuter ? outerRH : innerRH;
    const x = cos(angle) * rw;
    const y = sin(angle) * rh;
    g.vertex(x, y);
  }
  g.endShape(CLOSE);
  g.pop();
}

function drawTriangle(g, cx, cy, w, h) {
  g.push();
  g.translate(cx, cy);
  g.beginShape();
  g.vertex(0, -h / 2);
  g.vertex(w / 2, h / 2);
  g.vertex(-w / 2, h / 2);
  g.endShape(CLOSE);
  g.pop();
}

function mousePressed() {
  // Quick way to reset to placeholder if desired
  if (!srcImg || !workingImg) {
    srcImg = createPlaceholder();
    updateWorkingImage();
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveCanvas('genuary-04-lowres', 'png');
  } else if (key === 'v' || key === 'V') {
    exportSVG();
  }
}

function exportSVG() {
  if (!workingImg) return;
  // Render mosaic into an SVG graphics buffer and save
  const gfx = createGraphics(WIDTH, HEIGHT, SVG);
  gfx.noSmooth();
  gfx.background(20);

  const cols = ceil(WIDTH / cellSizeX);
  const rows = ceil(HEIGHT / cellSizeY);
  for (let y = 0; y < rows; y++) {
    const sy = floor(map(y, 0, rows, 0, workingImg.height));
    for (let x = 0; x < cols; x++) {
      const sx = floor(map(x, 0, cols, 0, workingImg.width));
      const idx = (sy * workingImg.width + sx) * 4;
      const r = workingImg.pixels[idx];
      const gVal = workingImg.pixels[idx + 1];
      const b = workingImg.pixels[idx + 2];
      const a = workingImg.pixels[idx + 3];
      
      // Apply color mode transformation
      const finalColor = applyColorMode(r, gVal, b, a);
      gfx.fill(finalColor[0], finalColor[1], finalColor[2], finalColor[3]);
      gfx.noStroke();
      
      const cx = x * cellSizeX + cellSizeX / 2;
      const cy = y * cellSizeY + cellSizeY / 2;
      drawCellShape(gfx, cx, cy, cellSizeX, cellSizeY, cellShape, finalColor, x, y);
    }
  }
  save(gfx, 'genuary-04-lowres.svg');
}

function setupShapeSelector() {
  const selector = document.getElementById('shapeSelector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      cellShape = e.target.value;
    });
  }
}

function setupColorModeSelector() {
  const selector = document.getElementById('colorModeSelector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      colorMode = e.target.value;
    });
  }
}

function setupPosterizeSlider() {
  const slider = document.getElementById('posterizeSlider');
  const label = document.getElementById('posterizeValue');
  if (slider && label) {
    const applyValue = (val) => {
      posterizeLevels = constrain(parseInt(val), 2, 256);
      label.textContent = posterizeLevels === 256 ? '256 (off)' : posterizeLevels;
    };
    applyValue(slider.value || posterizeLevels);
    slider.addEventListener('input', (e) => applyValue(e.target.value));
  }
}

function setupCellSliders() {
  const sliderX = document.getElementById('cellSliderX');
  const sliderY = document.getElementById('cellSliderY');
  const labelX = document.getElementById('cellValueX');
  const labelY = document.getElementById('cellValueY');
  const lockBtn = document.getElementById('cellLock');
  
  // Define both apply functions in outer scope so they can reference each other
  const applyX = (val) => {
    cellSizeX = constrain(parseFloat(val), minCell, maxCell);
    if (labelX) labelX.textContent = `${cellSizeX.toFixed(1)} px`;
    if (cellLocked && sliderY) {
      sliderY.value = cellSizeX;
      cellSizeY = cellSizeX;
      if (labelY) labelY.textContent = `${cellSizeY.toFixed(1)} px`;
    }
  };
  
  const applyY = (val) => {
    cellSizeY = constrain(parseFloat(val), minCell, maxCell);
    if (labelY) labelY.textContent = `${cellSizeY.toFixed(1)} px`;
    if (cellLocked && sliderX) {
      sliderX.value = cellSizeY;
      cellSizeX = cellSizeY;
      if (labelX) labelX.textContent = `${cellSizeX.toFixed(1)} px`;
    }
  };
  
  // Initialize and attach listeners
  if (sliderX && labelX) {
    applyX(sliderX.value || cellSizeX);
    sliderX.addEventListener('input', (e) => applyX(e.target.value));
  }
  
  if (sliderY && labelY) {
    applyY(sliderY.value || cellSizeY);
    sliderY.addEventListener('input', (e) => applyY(e.target.value));
  }
  
  if (lockBtn) {
    lockBtn.addEventListener('change', (e) => {
      cellLocked = e.target.checked;
      if (cellLocked) {
        // Sync both to Y when locking
        sliderX.value = cellSizeY;
        cellSizeX = cellSizeY;
        if (labelX) labelX.textContent = `${cellSizeX.toFixed(1)} px`;
      }
    });
  }
  
  // Gap sliders for X and Y control
  const gapSliderX = document.getElementById('cellGapSliderX');
  const gapSliderY = document.getElementById('cellGapSliderY');
  const gapLabelX = document.getElementById('cellGapValueX');
  const gapLabelY = document.getElementById('cellGapValueY');
  const gapLockBtn = document.getElementById('cellGapLock');
  
  const applyGapX = (val) => {
    cellPaddingX = constrain(parseFloat(val), 0.5, 1.0);
    if (gapLabelX) {
      const gapPercent = Math.round((1 - cellPaddingX) * 100);
      gapLabelX.textContent = `${gapPercent}% gap`;
    }
    if (cellGapLocked && gapSliderY) {
      gapSliderY.value = cellPaddingX;
      cellPaddingY = cellPaddingX;
      if (gapLabelY) {
        const gapPercent = Math.round((1 - cellPaddingY) * 100);
        gapLabelY.textContent = `${gapPercent}% gap`;
      }
    }
  };
  
  const applyGapY = (val) => {
    cellPaddingY = constrain(parseFloat(val), 0.5, 1.0);
    if (gapLabelY) {
      const gapPercent = Math.round((1 - cellPaddingY) * 100);
      gapLabelY.textContent = `${gapPercent}% gap`;
    }
    if (cellGapLocked && gapSliderX) {
      gapSliderX.value = cellPaddingY;
      cellPaddingX = cellPaddingY;
      if (gapLabelX) {
        const gapPercent = Math.round((1 - cellPaddingX) * 100);
        gapLabelX.textContent = `${gapPercent}% gap`;
      }
    }
  };
  
  if (gapSliderX && gapLabelX) {
    applyGapX(gapSliderX.value || cellPaddingX);
    gapSliderX.addEventListener('input', (e) => applyGapX(e.target.value));
  }
  
  if (gapSliderY && gapLabelY) {
    applyGapY(gapSliderY.value || cellPaddingY);
    gapSliderY.addEventListener('input', (e) => applyGapY(e.target.value));
  }
  
  if (gapLockBtn) {
    gapLockBtn.addEventListener('change', (e) => {
      cellGapLocked = e.target.checked;
      if (cellGapLocked) {
        gapSliderX.value = cellPaddingY;
        cellPaddingX = cellPaddingY;
        if (gapLabelX) {
          const gapPercent = Math.round((1 - cellPaddingX) * 100);
          gapLabelX.textContent = `${gapPercent}% gap`;
        }
      }
    });
  }

  // Adaptive resolution checkbox
  const adaptiveCheckbox = document.getElementById('adaptiveCheckbox');
  if (adaptiveCheckbox) {
    adaptiveCheckbox.addEventListener('change', (e) => {
      adaptiveResolution = e.target.checked;
    });
  }
}

