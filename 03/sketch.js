const WIDTH = 540;
const HEIGHT = 675;

// Fibonacci Tiling
let src; // Offscreen pattern buffer
let fib = []; // Fibonacci sequence
let tiles = []; // Array of {x, y, s} for each square tile
let tileScale = 1; // Scale factor to fit canvas
let tileOffsetX = 0, tileOffsetY = 0; // Translation to center tiling
let showDebug = false;
let isPaused = false; // Toggle animation pause with H key
let cropOffsetTime = 0; // Animated crop offset

// Wavy pattern controls
let wavyStrokeWeight = 20;
let wavyStrokeColor = '#bfff00ff';
let wavySpacing = 50; // Distance between parallel wavy lines
let wavyAmplitude = 15; // How far the wave oscillates
let wavyAngle = Math.PI / 4; // Angle to draw pattern at (default 45 degrees)
let wavyFrequency = 1; // How compressed/stretched the wave is

// Direction cycle for Fibonacci spiral: right, down, left, up
const spiralDirs = [
  [1, 0],  // right
  [0, 1],  // down
  [-1, 0], // left
  [0, -1]  // up
];

function setup() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  pixelDensity(1);
  
  // Create higher resolution offscreen buffer for crisp pattern at large scales
  src = createGraphics(WIDTH * 4, HEIGHT * 4);
  src.pixelDensity(1);
  
  // Build Fibonacci sequence
  buildFibs();
  
  // Generate Fibonacci tiling
  generateFibonacciTiling();
  
  // Render the base pattern once
  renderPattern(src);
  
  // Set up slider controls
  setupSliders();
  
  frameRate(20);
}

function setupSliders() {
  // Angle slider
  const angleSlider = document.getElementById('angleSlider');
  if (angleSlider) {
    angleSlider.addEventListener('input', (e) => {
      wavyAngle = parseFloat(e.target.value) * Math.PI / 180;
      document.getElementById('angleValue').textContent = e.target.value + '°';
      renderPattern(src);
    });
  }
  
  // Stroke weight slider
  const strokeWeightSlider = document.getElementById('strokeWeightSlider');
  if (strokeWeightSlider) {
    strokeWeightSlider.addEventListener('input', (e) => {
      wavyStrokeWeight = parseFloat(e.target.value);
      document.getElementById('strokeWeightValue').textContent = e.target.value + 'px';
      renderPattern(src);
    });
  }
  
  // Spacing slider
  const spacingSlider = document.getElementById('spacingSlider');
  if (spacingSlider) {
    spacingSlider.addEventListener('input', (e) => {
      wavySpacing = parseFloat(e.target.value);
      document.getElementById('spacingValue').textContent = e.target.value + 'px';
      renderPattern(src);
    });
  }
  
  // Amplitude slider
  const amplitudeSlider = document.getElementById('amplitudeSlider');
  if (amplitudeSlider) {
    amplitudeSlider.addEventListener('input', (e) => {
      wavyAmplitude = parseFloat(e.target.value);
      document.getElementById('amplitudeValue').textContent = e.target.value + 'px';
      renderPattern(src);
    });
  }
  
  // Frequency slider
  const frequencySlider = document.getElementById('frequencySlider');
  if (frequencySlider) {
    frequencySlider.addEventListener('input', (e) => {
      wavyFrequency = parseFloat(e.target.value);
      document.getElementById('frequencyValue').textContent = parseFloat(e.target.value).toFixed(1);
      renderPattern(src);
    });
  }
}

function draw() {
  background(0);
  
  // Slowly animate the crop offset (only if not paused)
  if (!isPaused) {
    cropOffsetTime += 0.02;
  }
  
  // Draw all tiles with cropped pattern
  drawTiledPattern();
  
  // Copy canvas, flip it, and apply DIFFERENCE blend mode
  blendMode(DIFFERENCE);
  push();
  translate(width / 2, height / 2);
  scale(-1, -1); // Flip both horizontally and vertically
  image(get(), -width / 2, -height / 2);
  pop();
  blendMode(BLEND); // Reset blend mode
  
  // Optional debug overlay
  if (showDebug) {
    drawDebugInfo();
  }
}

function buildFibs() {
  fib = [1, 1];
  // Generate enough Fibonacci numbers for tiling
  for (let i = 0; i < 15; i++) {
    const next = fib[fib.length - 1] + fib[fib.length - 2];
    fib.push(next);
  }
}

function generateFibonacciTiling() {
  tiles = [];
  
  // Place two 1x1 squares side by side
  tiles.push({ x: 0, y: 0, s: fib[0] });
  tiles.push({ x: fib[0], y: 0, s: fib[1] });
  
  // Build the spiral: each new square is placed against the bounding box of all previous squares
  // Direction cycle: up, right, down, left, up, right, down, left...
  let dirIndex = 0;
  
  for (let i = 2; i < min(fib.length, 12); i++) {
    const size = fib[i];
    let newX = 0, newY = 0;
    
    // Calculate bounding box of all tiles so far
    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    for (const tile of tiles) {
      minX = min(minX, tile.x);
      minY = min(minY, tile.y);
      maxX = max(maxX, tile.x + tile.s);
      maxY = max(maxY, tile.y + tile.s);
    }
    
    // Place new square based on direction cycle
    const dir = dirIndex % 4;
    
    if (dir === 0) { // up
      newX = minX;
      newY = minY - size;
    } else if (dir === 1) { // right
      newX = maxX;
      newY = minY;
    } else if (dir === 2) { // down
      newX = maxX - size;
      newY = maxY;
    } else { // left
      newX = minX - size;
      newY = maxY - size;
    }
    
    tiles.push({ x: newX, y: newY, s: size });
    dirIndex++;
  }
  
  // Compute bounding box
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  for (const tile of tiles) {
    minX = min(minX, tile.x);
    minY = min(minY, tile.y);
    maxX = max(maxX, tile.x + tile.s);
    maxY = max(maxY, tile.y + tile.s);
  }
  
  // Compute scaling to fit canvas with "cover" behavior
  const tilingWidth = maxX - minX;
  const tilingHeight = maxY - minY;
  
  const scaleX = WIDTH / tilingWidth;
  const scaleY = HEIGHT / tilingHeight;
  tileScale = max(scaleX, scaleY); // Cover behavior to fill canvas
  
  // Center the tiling
  const scaledWidth = tilingWidth * tileScale;
  const scaledHeight = tilingHeight * tileScale;
  tileOffsetX = (WIDTH - scaledWidth) / 2 - minX * tileScale;
  tileOffsetY = (HEIGHT - scaledHeight) / 2 - minY * tileScale;
}

function renderPattern(g) {
  // Repeating wavy pattern at specified angle with customizable controls
  g.background(0);
  g.noFill();
  g.stroke(wavyStrokeColor);
  g.strokeWeight(wavyStrokeWeight);
  g.strokeCap(SQUARE);
  
  // Apply rotation transform to draw at specified angle
  g.push();
  g.translate(g.width / 2, g.height / 2);
  g.rotate(wavyAngle);
  g.translate(-g.width / 2, -g.height / 2);
  
  // Calculate number of wavy lines needed
  const numLines = ceil((g.width + g.height) / wavySpacing) + 2;
  
  for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
    const startX = -g.width;
    const startY = (lineIndex - numLines / 2) * wavySpacing;
    
    g.beginShape();
    
    // Draw wavy line using sine wave
    const numWaves = ceil((g.width * 2) / (2 * Math.PI * wavyAmplitude / wavyFrequency)) + 2;
    
    for (let waveIndex = 0; waveIndex <= numWaves; waveIndex++) {
      const x = startX + (waveIndex * g.width * 2) / numWaves;
      // Sine wave oscillation
      const offset = sin(x * wavyFrequency) * wavyAmplitude;
      const y = startY + offset;
      
      g.vertex(x, y);
    }
    
    g.endShape();
  }
  
  g.pop();
}

function drawTiledPattern() {
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    
    // Calculate screen position and size
    const screenX = tile.x * tileScale + tileOffsetX;
    const screenY = tile.y * tileScale + tileOffsetY;
    const screenSize = tile.s * tileScale;
    
    // Compute crop from src with animated offset
    const cropSize = src.width * 0.3;
    const offsetX = sin(cropOffsetTime + i * 0.5) * src.width * 0.2;
    const offsetY = cos(cropOffsetTime + i * 0.3) * src.height * 0.2;
    const cropX = constrain(src.width / 2 + offsetX, 0, src.width - cropSize);
    const cropY = constrain(src.height / 2 + offsetY, 0, src.height - cropSize);
    
    // Optional flips based on tile index
    const flipX = (i % 3 === 0) ? -1 : 1;
    const flipY = (i % 5 === 0) ? -1 : 1;
    
    // Draw tile with clipping
    drawingContext.save();
    
    // Set up clipping rectangle for this tile
    drawingContext.beginPath();
    drawingContext.rect(screenX, screenY, screenSize, screenSize);
    drawingContext.clip();
    
    // Translate to tile center
    push();
    translate(screenX + screenSize / 2, screenY + screenSize / 2);
    
    // Rotate based on tile index
    rotate(i * HALF_PI);
    
    // Apply flips
    scale(flipX, flipY);
    
    // Scale crop to cover the square
    const coverScale = screenSize / cropSize * 1.2; // 1.2 for slight overflow
    const drawSize = cropSize * coverScale;
    
    // Draw the cropped pattern
    image(src,
      -drawSize / 2, -drawSize / 2, drawSize, drawSize,
      cropX, cropY, cropSize, cropSize);
    
    pop();
    drawingContext.restore();
    
    // Draw tile outline for visibility
    noFill();
    stroke(255, 50);
    strokeWeight(1);
    strokeCap(SQUARE);
    rect(screenX, screenY, screenSize, screenSize);
  }
}

function drawDebugInfo() {
  push();
  fill(255, 255, 0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  text(`Tiles: ${tiles.length}`, 10, 10);
  text(`Scale: ${tileScale.toFixed(2)}`, 10, 30);
  text(`Offset: (${floor(tileOffsetX)}, ${floor(tileOffsetY)})`, 10, 50);
  pop();
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
    saveAsPng();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'd' || key === 'D') {
    showDebug = !showDebug;
  } else if (key === 'h' || key === 'H') {
    isPaused = !isPaused;
  }
}
