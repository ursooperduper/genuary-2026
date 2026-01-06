const WIDTH = 540;
const HEIGHT = 675;

let maskImg = null;
let marks = [];
let config = {
  seed: 42,
  layers: 1,
  iterations: 500,
  walkers: 50,
  stepSizeMin: 2,
  stepSizeMax: 6,
  strokeWeightMin: 0.5,
  strokeWeightMax: 2,
  opacity: 200,
  markTypeLines: 60,
  markTypeDots: 25,
  chaos: 0.5,
  flowFreq: 0.005,
  flowInfluence: 0.5,
  flowTurns: 2,
  snapMode: 'free',
  snapStrength: 0.5,
  edgeBias: 0.3,
  maskThreshold: 128,
  collisionMode: 'bounce',
  paperColor: '#ffffff',
  layer1Color: '#000000',
  layer2Color: '#cc0000',
  layer3Color: '#0066cc',
  smooth: true
};

function preload() {
  maskImg = loadImage('./jan05-gen26.png');
}

function setup() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  pixelDensity(1);
  smooth();
  strokeCap(PROJECT);
  strokeJoin(MITER);
  
  console.log('Setup called');
  console.log('maskImg before resize:', maskImg.width, 'x', maskImg.height);
  
  if (maskImg) {
    maskImg.resize(WIDTH, HEIGHT);
    maskImg.loadPixels();
    console.log('Mask image resized to:', maskImg.width, 'x', maskImg.height);
    console.log('Mask pixels length:', maskImg.pixels.length);
  } else {
    console.error('maskImg is null!');
  }
  
  setupControls();
  
  // Draw initial state
  background(config.paperColor);
  noLoop();
  
  // Generate the poster immediately on load
  generatePoster();
}

function draw() {
  // Static output, no continuous drawing
}

function setupControls() {
  console.log('setupControls called');
  
  // Check if checkbox exists
  const smoothCheckbox = document.getElementById('smoothToggle');
  console.log('Smooth checkbox found:', smoothCheckbox);
  
  // Sliders with value displays
  const sliders = [
    'iterations', 'walkers', 'stepSizeMin', 'stepSizeMax',
    'strokeWeightMin', 'strokeWeightMax', 'opacity',
    'markTypeLines', 'markTypeDots', 'chaos',
    'flowFreq', 'flowInfluence', 'flowTurns',
    'snapStrength', 'edgeBias', 'maskThreshold', 'layers'
  ];
  
  sliders.forEach(id => {
    const elem = document.getElementById(id);
    const display = document.getElementById(id + 'Value');
    if (elem && display) {
      elem.addEventListener('input', (e) => {
        config[id] = parseFloat(e.target.value);
        const val = id.includes('Freq') ? config[id].toFixed(4) : config[id];
        display.textContent = val;
      });
    }
  });
  
  // Selects
  document.getElementById('snapMode')?.addEventListener('change', (e) => {
    config.snapMode = e.target.value;
  });
  document.getElementById('collisionMode')?.addEventListener('change', (e) => {
    config.collisionMode = e.target.value;
  });
  
  // Color inputs
  document.getElementById('paperColor')?.addEventListener('change', (e) => {
    config.paperColor = e.target.value;
    document.getElementById('paperColorValue').value = e.target.value;
  });
  document.getElementById('layer1Color')?.addEventListener('change', (e) => {
    config.layer1Color = e.target.value;
    document.getElementById('layer1ColorValue').value = e.target.value;
  });
  document.getElementById('layer2Color')?.addEventListener('change', (e) => {
    config.layer2Color = e.target.value;
    document.getElementById('layer2ColorValue').value = e.target.value;
  });
  document.getElementById('layer3Color')?.addEventListener('change', (e) => {
    config.layer3Color = e.target.value;
    document.getElementById('layer3ColorValue').value = e.target.value;
  });
  
  // Seed input
  document.getElementById('seed')?.addEventListener('change', (e) => {
    config.seed = parseInt(e.target.value) || 42;
  });
  
  // Smooth toggle
  document.getElementById('smoothToggle')?.addEventListener('change', (e) => {
    config.smooth = e.target.checked;
    console.log('Smooth toggled to:', config.smooth);
    if (config.smooth) {
      smooth();
    } else {
      noSmooth();
    }
    // Regenerate with new smooth setting
    generatePoster();
  });
  
  // Buttons
  document.getElementById('generateBtn')?.addEventListener('click', () => {
    generatePoster();
  });
  
  document.getElementById('randomizeBtn')?.addEventListener('click', () => {
    config.seed = Math.floor(Math.random() * 1000000);
    document.getElementById('seed').value = config.seed;
    generatePoster();
  });
  
  document.getElementById('resetBtn')?.addEventListener('click', () => {
    marks = [];
    background(config.paperColor);
  });
  
  document.getElementById('exportPngBtn')?.addEventListener('click', () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveCanvas(`chaos-reveal-${timestamp}`, 'png');
  });
  
  document.getElementById('exportSvgBtn')?.addEventListener('click', () => {
    exportSVG();
  });
}

function generatePoster() {
  if (!maskImg) {
    console.error('Mask image not loaded');
    alert('Mask image not loaded');
    return;
  }
  
  console.log('Generating poster with', config.layers, 'layer(s), seed:', config.seed);
  
  // Apply smooth setting before drawing
  if (config.smooth) {
    smooth();
  } else {
    noSmooth();
  }
  
  marks = [];
  background(config.paperColor);
  
  // Run chaos engine for each layer
  for (let layerIndex = 0; layerIndex < config.layers; layerIndex++) {
    const layerSeed = config.seed + layerIndex * 1000;
    const layerColor = config['layer' + (layerIndex + 1) + 'Color'];
    console.log('Rendering layer', layerIndex + 1, 'with seed:', layerSeed, 'color:', layerColor);
    
    // Set deterministic randomness for this layer
    randomSeed(layerSeed);
    noiseSeed(layerSeed);
    
    // Init walkers for this layer
    let walkers = [];
    for (let i = 0; i < config.walkers; i++) {
      const pt = randomWhitePoint(config.edgeBias);
      if (pt) {
        walkers.push({
          x: pt.x,
          y: pt.y,
          angle: random(TWO_PI),
          life: config.iterations / config.walkers,
          maxLife: config.iterations / config.walkers
        });
      }
    }
    console.log('  Layer', layerIndex + 1, '- Initialized walkers:', walkers.length, 'out of', config.walkers);
    
    if (walkers.length === 0) {
      console.warn('  Layer', layerIndex + 1, 'has no walkers');
      continue;
    }
    
    // Run chaos engine for this layer
    let layerMarks = 0;
    for (let iter = 0; iter < config.iterations; iter++) {
      for (let walker of walkers) {
        // Update angle from flow field
        const flowAngle = noise(walker.x * config.flowFreq, walker.y * config.flowFreq, layerSeed) * TWO_PI * config.flowTurns;
        let angle = lerp(walker.angle, flowAngle, config.flowInfluence);
        
        // Add chaos jitter
        angle += random(-PI * config.chaos, PI * config.chaos);
        
        // Apply angle snapping
        angle = applySnapping(angle, config.snapMode, config.snapStrength);
        
        // Propose next position
        const stepSize = random(config.stepSizeMin, config.stepSizeMax);
        const nx = walker.x + cos(angle) * stepSize;
        const ny = walker.y + sin(angle) * stepSize;
        
        // Check collision
        const currentWhite = isWhiteCanvasPoint(walker.x, walker.y);
        const nextWhite = isWhiteCanvasPoint(nx, ny);
        
        if (nextWhite && currentWhite) {
          // Draw mark
          const markType = random(100);
          let type = 'line';
          if (markType < config.markTypeLines) {
            type = 'line';
          } else if (markType < config.markTypeLines + config.markTypeDots) {
            type = 'dot';
          } else {
            type = 'rect';
          }
          
          const sw = random(config.strokeWeightMin, config.strokeWeightMax);
          const mark = recordMark(type, walker.x, walker.y, nx, ny, sw);
          drawMark(mark, layerColor);
          layerMarks++;
          
          walker.x = nx;
          walker.y = ny;
          walker.angle = angle;
        } else {
          // Collision handling
          if (config.collisionMode === 'bounce') {
            walker.angle += HALF_PI + random(-0.2, 0.2);
          } else {
            // Respawn
            const pt = randomWhitePoint(0);
            if (pt) {
              walker.x = pt.x;
              walker.y = pt.y;
              walker.angle = random(TWO_PI);
            }
          }
        }
        
        walker.life--;
        if (walker.life <= 0) {
          const pt = randomWhitePoint(config.edgeBias);
          if (pt) {
            walker.x = pt.x;
            walker.y = pt.y;
            walker.angle = random(TWO_PI);
            walker.life = config.iterations / config.walkers;
          }
        }
      }
    }
    console.log('  Layer', layerIndex + 1, '- marks drawn:', layerMarks);
  }
  
  console.log('Total marks across all layers:', marks.length);
}

function applySnapping(angle, mode, strength) {
  let snappedAngle = angle;
  
  if (mode === 'ortho') {
    const quantized = round(angle / HALF_PI) * HALF_PI;
    snappedAngle = lerp(angle, quantized, strength);
  } else if (mode === 'diag') {
    const quantized = round(angle / QUARTER_PI) * QUARTER_PI;
    snappedAngle = lerp(angle, quantized, strength);
  } else if (mode === '8way') {
    const steps = 8;
    const quantized = round((angle / TWO_PI) * steps) / steps * TWO_PI;
    snappedAngle = lerp(angle, quantized, strength);
  }
  
  return snappedAngle;
}

function randomWhitePoint(edgeBias) {
  let attempts = 0;
  const maxAttempts = 500;
  
  while (attempts < maxAttempts) {
    const x = floor(random(maskImg.width));
    const y = floor(random(maskImg.height));
    
    if (isWhiteCanvasPoint(x, y)) {
      if (random() < (1 - edgeBias) || edgeBias === 0) {
        return { x, y };
      }
      if (isEdgePoint(x, y)) {
        return { x, y };
      }
    }
    attempts++;
  }
  
  return null;
}

function isWhiteCanvasPoint(x, y) {
  if (x < 0 || x >= maskImg.width || y < 0 || y >= maskImg.height) return false;
  if (!maskImg) return true;
  
  const ix = constrain(floor(x), 0, maskImg.width - 1);
  const iy = constrain(floor(y), 0, maskImg.height - 1);
  const idx = (iy * maskImg.width + ix) * 4;
  
  if (idx < 0 || idx >= maskImg.pixels.length) {
    return true;
  }
  
  const brightness = maskImg.pixels[idx];
  const isWhite = brightness > config.maskThreshold;
  
  return isWhite;
}

function isEdgePoint(x, y) {
  if (!maskImg) return false;
  
  const isWhite = isWhiteCanvasPoint(x, y);
  
  if (!isWhite) return false;
  
  // Check neighbors
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (!isWhiteCanvasPoint(nx, ny)) {
        return true;
      }
    }
  }
  
  return false;
}

function recordMark(type, x1, y1, x2, y2, sw) {
  const mark = {
    type: type,
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    cx: (x1 + x2) / 2,
    cy: (y1 + y2) / 2,
    r: sw * 2,
    strokeWeight: sw,
    opacity: config.opacity
  };
  marks.push(mark);
  return mark;
}

function drawMark(mark, layerColor = '#000000') {
  push();
  
  const rgb = hexToRgb(layerColor);
  
  if (mark.type === 'line') {
    stroke(rgb[0], rgb[1], rgb[2], config.opacity);
    strokeWeight(mark.strokeWeight);
    noFill();
    line(mark.x1, mark.y1, mark.x2, mark.y2);
  } else if (mark.type === 'dot') {
    noStroke();
    fill(rgb[0], rgb[1], rgb[2], config.opacity);
    circle(mark.cx, mark.cy, mark.r);
  } else if (mark.type === 'rect') {
    noStroke();
    fill(rgb[0], rgb[1], rgb[2], config.opacity);
    const sz = mark.r;
    rect(mark.cx - sz / 2, mark.cy - sz / 2, sz, sz);
  }
  
  pop();
}

function exportSVG() {
  if (marks.length === 0) {
    alert('No marks to export. Generate a poster first.');
    return;
  }
  
  let svgString = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">`;
  svgString += `<rect width="${WIDTH}" height="${HEIGHT}" fill="${config.paperColor}" />`;
  
  const inkHex = config.inkColor;
  
  for (let mark of marks) {
    const opacity = (config.opacity / 255).toFixed(2);
    
    if (mark.type === 'line') {
      svgString += `<line x1="${mark.x1.toFixed(1)}" y1="${mark.y1.toFixed(1)}" x2="${mark.x2.toFixed(1)}" y2="${mark.y2.toFixed(1)}" stroke="${inkHex}" stroke-width="${mark.strokeWeight.toFixed(2)}" stroke-opacity="${opacity}" />`;
    } else if (mark.type === 'dot') {
      svgString += `<circle cx="${mark.cx.toFixed(1)}" cy="${mark.cy.toFixed(1)}" r="${mark.r.toFixed(1)}" fill="${inkHex}" opacity="${opacity}" />`;
    } else if (mark.type === 'rect') {
      const sz = mark.r;
      svgString += `<rect x="${(mark.cx - sz/2).toFixed(1)}" y="${(mark.cy - sz/2).toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="${inkHex}" opacity="${opacity}" />`;
    }
  }
  
  svgString += '</svg>';
  
  // Download as file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chaos-reveal-${timestamp}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}
