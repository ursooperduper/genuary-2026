const WIDTH = 540;
const HEIGHT = 675;

// Grid parameters
let cols = 12;
// let cols = 36;
// let cols = 60;
let rows = 15;
// let rows = 45;
// let rows = 75;
let cellW, cellH;

// CA parameters
const NUM_STATES = 9;
let grid = [];
let nextGrid = [];
let stepCount = 0;
let tickEvery = 12;
let frameCounter = 0;
let paused = false;
let currentRule = 'A'; // A, B, or C

// Colors - high contrast graphic design palette
const PAPER = '#F5F1E8';
const INK = '#1A1A1A';
const ACCENT = '#E63946';

// Tile style library
const numStyles = 9;

function setup() {
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  
  cellW = width / cols;
  cellH = height / rows;
  
  // Initialize grids
  initGrid();
  seedEditorialBlocks();
  
  frameRate(12);
}

function draw() {
  background(PAPER);
  
  // Update CA on tick interval
  if (!paused) {
    frameCounter++;
    if (frameCounter >= tickEvery) {
      updateGrid();
      frameCounter = 0;
      stepCount++;
    }
  }
  
  // Render the grid
  drawGrid();
  
  // Display info
  displayInfo();
}

function initGrid() {
  grid = [];
  nextGrid = [];
  for (let x = 0; x < cols; x++) {
    grid[x] = [];
    nextGrid[x] = [];
    for (let y = 0; y < rows; y++) {
      grid[x][y] = 0;
      nextGrid[x][y] = 0;
    }
  }
  stepCount = 0;
  frameCounter = 0;
}

function seedEditorialBlocks() {
  // Start mostly state 0, add structured blocks
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      grid[x][y] = 0;
    }
  }
  
  // Add 3 rectangular blocks of different states
  const numBlocks = 3;
  for (let i = 0; i < numBlocks; i++) {
    const bx = floor(random(cols * 0.2, cols * 0.8));
    const by = floor(random(rows * 0.2, rows * 0.8));
    const bw = floor(random(3, 8));
    const bh = floor(random(3, 8));
    const state = floor(random(2, NUM_STATES));
    
    for (let x = bx; x < min(bx + bw, cols); x++) {
      for (let y = by; y < min(by + bh, rows); y++) {
        grid[x][y] = state;
      }
    }
  }
  
  // Add a diagonal band
  const bandState = floor(random(1, NUM_STATES));
  for (let i = 0; i < cols; i++) {
    const y = floor(map(i, 0, cols, rows * 0.3, rows * 0.7));
    if (y >= 0 && y < rows) {
      grid[i][y] = bandState;
      if (y + 1 < rows) grid[i][y + 1] = bandState;
    }
  }
}

function seedTypeSkeleton() {
  // Clear grid
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      grid[x][y] = 0;
    }
  }
  
  // Create a letter-like form using corner segments (state 6)
  const cx = floor(cols / 2);
  const cy = floor(rows / 2);
  const size = floor(min(cols, rows) * 0.4);
  
  // Draw an "A" shape
  for (let i = -size/2; i < size/2; i++) {
    // Left leg
    const x1 = floor(cx - size/4 + i * 0.3);
    const y1 = floor(cy + i);
    if (x1 >= 0 && x1 < cols && y1 >= 0 && y1 < rows) {
      grid[x1][y1] = 6;
    }
    
    // Right leg
    const x2 = floor(cx + size/4 - i * 0.3);
    if (x2 >= 0 && x2 < cols && y1 >= 0 && y1 < rows) {
      grid[x2][y1] = 6;
    }
  }
  
  // Crossbar
  for (let i = floor(cx - size/4); i <= floor(cx + size/4); i++) {
    if (i >= 0 && i < cols) {
      const y = floor(cy + size/6);
      if (y >= 0 && y < rows) {
        grid[i][y] = 6;
      }
    }
  }
}

function updateGrid() {
  // Apply current rule set
  switch(currentRule) {
    case 'A':
      updateRuleA();
      break;
    case 'B':
      updateRuleB();
      break;
    case 'C':
      updateRuleC();
      break;
  }
  
  // Swap buffers
  const temp = grid;
  grid = nextGrid;
  nextGrid = temp;
}

// Rule A: Weighted Sum + Mod + Anti-Uniformity
function updateRuleA() {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const k = grid[x][y];
      
      // Edge frame rule: bias edges toward states 0 and 1
      if (x < 2 || x >= cols - 2 || y < 2 || y >= rows - 2) {
        nextGrid[x][y] = (stepCount % 13 === 0) ? 1 : 0;
        continue;
      }
      
      // Get weighted neighbor sum
      const neighbors = getNeighbors(x, y);
      let weightedSum = 0;
      
      // Orthogonal neighbors: weight 2
      weightedSum += (neighbors.n || 0) * 2;
      weightedSum += (neighbors.s || 0) * 2;
      weightedSum += (neighbors.e || 0) * 2;
      weightedSum += (neighbors.w || 0) * 2;
      
      // Diagonal neighbors: weight 1
      weightedSum += (neighbors.ne || 0);
      weightedSum += (neighbors.nw || 0);
      weightedSum += (neighbors.se || 0);
      weightedSum += (neighbors.sw || 0);
      
      let next = (k + weightedSum) % NUM_STATES;
      
      // Anti-uniformity: if all neighbors same as k, force change
      const allSame = Object.values(neighbors).every(v => v === k);
      if (allSame) {
        next = (k + floor(NUM_STATES / 2)) % NUM_STATES;
      }
      
      nextGrid[x][y] = next;
    }
  }
}

// Rule B: Majority With Least Common Tie-Breaker
function updateRuleB() {
  // Count global state frequencies
  const globalCounts = new Array(NUM_STATES).fill(0);
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      globalCounts[grid[x][y]]++;
    }
  }
  
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const neighbors = getNeighborsArray(x, y);
      const counts = new Array(NUM_STATES).fill(0);
      
      neighbors.forEach(n => counts[n]++);
      
      // Find majority
      let maxCount = Math.max(...counts);
      let majorityStates = [];
      for (let i = 0; i < NUM_STATES; i++) {
        if (counts[i] === maxCount) {
          majorityStates.push(i);
        }
      }
      
      let next;
      if (majorityStates.length === 1) {
        next = majorityStates[0];
      } else {
        // Tie: choose least common globally
        let minGlobal = Infinity;
        let leastCommon = majorityStates[0];
        for (let s of majorityStates) {
          if (globalCounts[s] < minGlobal) {
            minGlobal = globalCounts[s];
            leastCommon = s;
          }
        }
        next = leastCommon;
      }
      
      // Mutation on Fibonacci-ish cadence
      if (stepCount % 34 === 0) {
        next = (next + 1) % NUM_STATES;
      }
      
      nextGrid[x][y] = next;
    }
  }
}

// Rule C: Cyclic Predator-Prey
function updateRuleC() {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const k = grid[x][y];
      const predator = (k + 1) % NUM_STATES;
      
      const neighbors = getNeighborsArray(x, y);
      const hasPredator = neighbors.includes(predator);
      
      if (hasPredator) {
        nextGrid[x][y] = predator;
      } else {
        nextGrid[x][y] = k;
      }
      
      // Add noise on borders
      if ((x < 2 || x >= cols - 2 || y < 2 || y >= rows - 2) && random() < 0.05) {
        nextGrid[x][y] = floor(random(NUM_STATES));
      }
    }
  }
}

function getNeighbors(x, y) {
  // Returns Moore neighborhood as object (with wrapping)
  const get = (dx, dy) => {
    const nx = (x + dx + cols) % cols;
    const ny = (y + dy + rows) % rows;
    return grid[nx][ny];
  };
  
  return {
    nw: get(-1, -1), n: get(0, -1), ne: get(1, -1),
    w:  get(-1, 0),                 e:  get(1, 0),
    sw: get(-1, 1),  s: get(0, 1),  se: get(1, 1)
  };
}

function getNeighborsArray(x, y) {
  // Returns Moore neighborhood as array
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = (x + dx + cols) % cols;
      const ny = (y + dy + rows) % rows;
      neighbors.push(grid[nx][ny]);
    }
  }
  return neighbors;
}

function drawGrid() {
  push();
  noStroke();
  
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const state = grid[x][y];
      const px = x * cellW;
      const py = y * cellH;
      
      // Determine if this cell should use accent color
      const useAccent = shouldUseAccent(x, y, state);
      
      drawTile(state, px, py, cellW, cellH, useAccent);
    }
  }
  
  pop();
}

function shouldUseAccent(x, y, state) {
  // Accent logic: use for high-conflict edges or specific state
  if (state === NUM_STATES - 1) return true;
  
  // Check neighbor diversity
  const neighbors = getNeighborsArray(x, y);
  const uniqueStates = new Set(neighbors).size;
  return uniqueStates >= 6;
}

function drawTile(state, x, y, w, h, useAccent) {
  push();
  translate(x, y);
  
  const styleIndex = state % numStyles;
  const lineWeight = min(w, h) * 0.08;
  
  // Choose color
  const fillColor = useAccent ? ACCENT : INK;
  const bgColor = PAPER;
  
  // Draw tile based on style
  switch(styleIndex) {
    case 0: // Solid fill
      fill(fillColor);
      noStroke();
      rect(0, 0, w, h);
      break;
      
    case 1: // Horizontal stripes
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      stroke(fillColor);
      strokeWeight(lineWeight);
      const hSpacing = h / (4 + state % 3);
      for (let i = 0; i < h; i += hSpacing) {
        line(0, i, w, i);
      }
      break;
      
    case 2: // Vertical stripes
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      stroke(fillColor);
      strokeWeight(lineWeight);
      const vSpacing = w / (4 + state % 3);
      for (let i = 0; i < w; i += vSpacing) {
        line(i, 0, i, h);
      }
      break;
      
    case 3: // Diagonal hatch (/)
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      stroke(fillColor);
      strokeWeight(lineWeight);
      const dSpacing1 = (w + h) / 8;
      for (let i = -h; i < w + h; i += dSpacing1) {
        line(i, 0, i + h, h);
      }
      break;
      
    case 4: // Diagonal hatch (\)
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      stroke(fillColor);
      strokeWeight(lineWeight);
      const dSpacing2 = (w + h) / 8;
      for (let i = 0; i < w + h; i += dSpacing2) {
        line(i, 0, i - h, h);
      }
      break;
      
    case 5: // Dot grid
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      fill(fillColor);
      const dotSize = min(w, h) * 0.25;
      const dotSpacing = min(w, h) / 3;
      for (let dx = dotSpacing / 2; dx < w; dx += dotSpacing) {
        for (let dy = dotSpacing / 2; dy < h; dy += dotSpacing) {
          ellipse(dx, dy, dotSize, dotSize);
        }
      }
      break;
      
    case 6: // Corner-L shape (modular type segment)
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      fill(fillColor);
      noStroke();
      const lThick = w * 0.3;
      rect(0, 0, lThick, h); // Vertical bar
      rect(0, h - lThick, w, lThick); // Horizontal bar
      break;
      
    case 7: // Thin border inset
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      noFill();
      stroke(fillColor);
      strokeWeight(lineWeight);
      const inset = min(w, h) * 0.15;
      rect(inset, inset, w - inset * 2, h - inset * 2);
      break;
      
    case 8: // Knockout / empty
      fill(bgColor);
      noStroke();
      rect(0, 0, w, h);
      break;
  }
  
  pop();
}

function displayInfo() {
  push();
  fill(INK);
  noStroke();
  // textAlign(LEFT, TOP);
  // textSize(10);
  // text(`Rule: ${currentRule} | Step: ${stepCount} | ${paused ? 'PAUSED' : 'RUNNING'}`, 10, 10);
  // text(`[Space] pause | [R] reseed blocks | [Z] reseed type | [1/2/3] rules | [S] PNG | [P] SVG | [+/-] speed`, 10, 25);
  pop();
}

function keyPressed() {
  if (key === ' ') {
    paused = !paused;
  } else if (key === 'r' || key === 'R') {
    initGrid();
    seedEditorialBlocks();
  } else if (key === 'z' || key === 'Z') {
    initGrid();
    seedTypeSkeleton();
  } else if (key === '1') {
    currentRule = 'A';
    stepCount = 0;
  } else if (key === '2') {
    currentRule = 'B';
    stepCount = 0;
  } else if (key === '3') {
    currentRule = 'C';
    stepCount = 0;
  } else if (key === 's' || key === 'S') {
    saveFrame();
  } else if (key === 'p' || key === 'P') {
    saveAsSvg();
  } else if (key === '+' || key === '=') {
    tickEvery = max(1, tickEvery - 1);
  } else if (key === '-' || key === '_') {
    tickEvery = min(15, tickEvery + 1);
  }
}

function saveFrame() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `genuary-09-${timestamp}`;
  
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const isSvgRenderer = renderer === SVG;
  
  if (!isSvgRenderer) {
    saveCanvas(base, 'png');
    return;
  }

  // SVG mode: rasterize to PNG
  let svgNode = document.querySelector('#sketch-holder svg') || document.querySelector('svg');
  if (!(svgNode instanceof Node)) {
    console.warn('PNG export failed: no SVG node found');
    return;
  }

  const serializer = new XMLSerializer();
  const rawSvg = serializer.serializeToString(svgNode);
  const parsed = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
  const root = parsed.documentElement;
  const targetW = WIDTH * 2;
  const targetH = HEIGHT * 2;
  root.setAttribute('width', `${targetW}`);
  root.setAttribute('height', `${targetH}`);
  if (!root.getAttribute('viewBox')) {
    root.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  }
  const svgData = serializer.serializeToString(root);

  const img = new Image();
  const buffer = document.createElement('canvas');
  buffer.width = targetW;
  buffer.height = targetH;
  const ctx = buffer.getContext('2d');

  img.onload = () => {
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const link = document.createElement('a');
    link.download = `${base}.png`;
    link.href = buffer.toDataURL('image/png');
    link.click();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-09-${timestamp}.svg`);
}
