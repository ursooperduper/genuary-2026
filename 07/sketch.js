// Boolean Stack Machine — Genuary 2026 Day 7
// Canvas: 540 × 675
// Three vertical stacks of 17 SVG components controlled by Boolean logic

const CANVAS_W = 540;
const CANVAS_H = 675;
const ASSET_COUNT = 17;
const STACK_COUNT = 3;
const STAGE_SIZE = 300;
const STAGE_OFFSET = 125; // vertical spacing between stacks (causes overlap)

// ============================================================================
// State (Single Source of Truth)
// ============================================================================

let state = {
  seed: 42,
  motionEnabled: false,
  tickRate: 30,  // frames per tick
  tick: 0,
  
  // Per-stack program assignment
  programIds: ['union', 'xor', 'constraint'],
  
  // Visual toggles
  showStageBounds: false,
  showStackLabels: false,
  invertColors: false,
  showLegend: true,
  
  // Thresholds for Boolean primitives
  noiseThreshold: 0.5,
};

// Assets storage
let assets = [];
let paletteData = [];
let selectedPalette = [];
let svgCanvasElement = null; // Reference to the actual SVG element

// Stack render plans (computed each frame)
let stackPlans = [[], [], []];

// Frame counter
let frameCounter = 0;

// ============================================================================
// Boolean Programs
// ============================================================================

const PROGRAMS = {
  union: {
    name: 'Union (Permissive)',
    evaluate: (A, B, C, D) => ({
      visible: A || B,
      rotationSteps: (A ? 1 : 0) + (B ? 2 : 0),
      priority: C ? 100 : 0,
    }),
  },
  
  xor: {
    name: 'XOR (Conflict)',
    evaluate: (A, B, C, D) => ({
      visible: (A || B) && !(A && B), // XOR
      rotationSteps: (A ? 1 : 0) + (C ? 2 : 0),
      priority: B ? -100 : 0, // invert when B
    }),
  },
  
  constraint: {
    name: 'AND (Constraint)',
    evaluate: (A, B, C, D) => ({
      visible: A && B,
      rotationSteps: C ? 2 : 0,
      priority: (A && C) ? 100 : 0,
    }),
  },
  
  gate: {
    name: 'Gate (A AND B)',
    evaluate: (A, B, C, D) => ({
      visible: A && B,
      rotationSteps: B ? 1 : 0,
      priority: C ? 50 : 0,
    }),
  },
  
  mask: {
    name: 'Mask (A AND NOT B)',
    evaluate: (A, B, C, D) => ({
      visible: A && !B,
      rotationSteps: A ? 2 : 0,
      priority: 0,
    }),
  },
  
  dominance: {
    name: 'Dominance (A OR (B AND C))',
    evaluate: (A, B, C, D) => ({
      visible: A || (B && C),
      rotationSteps: (B && C) ? 3 : 0,
      priority: A ? 100 : -50,
    }),
  },
  
  silence: {
    name: 'Silence (NOT A AND C)',
    evaluate: (A, B, C, D) => ({
      visible: !A && C,
      rotationSteps: C ? 1 : 0,
      priority: 0,
    }),
  },
  
  parity: {
    name: 'Parity (A XOR C)',
    evaluate: (A, B, C, D) => ({
      visible: (A || C) && !(A && C),
      rotationSteps: (A ? 2 : 0) + (B ? 1 : 0),
      priority: C ? 20 : -20,
    }),
  },
  
  rhythm: {
    name: 'Rhythm (time-based)',
    evaluate: (A, B, C, D) => ({
      visible: A || D,
      rotationSteps: D ? 2 : 0,
      priority: D ? -50 : 50,
    }),
  },
  
  cluster: {
    name: 'Cluster (B AND (A OR C))',
    evaluate: (A, B, C, D) => ({
      visible: B && (A || C),
      rotationSteps: A ? 1 : (C ? 3 : 0),
      priority: B ? 100 : 0,
    }),
  },
  
  flutter: {
    name: 'Flutter (XOR with time)',
    evaluate: (A, B, C, D) => ({
      visible: ((A || D) && !(A && D)),
      rotationSteps: (A ? 1 : 0) + (D ? 2 : 0),
      priority: D ? 100 : 0,
    }),
  },
  
  inversion: {
    name: 'Inversion (NOT (A OR B))',
    evaluate: (A, B, C, D) => ({
      visible: !(A || B),
      rotationSteps: C ? 2 : 0,
      priority: 0,
    }),
  },
};

// ============================================================================
// Preload & Setup
// ============================================================================

function preload() {
  // Load colors.json
  loadJSON('./colors.json', (data) => {
    paletteData = data.palettes || [];
    // Pick a random palette
    if (paletteData.length > 0) {
      const paletteIndex = Math.floor(Math.random() * paletteData.length);
      selectedPalette = [...paletteData[paletteIndex].colors, '#ffffff']; // Add white
      console.log('Loaded palette:', paletteData[paletteIndex].name, selectedPalette);
    }
  });
  
  // Load all 17 SVG assets as DOM elements
  for (let i = 0; i < ASSET_COUNT; i++) {
    const idx = String(i).padStart(2, '0');
    // We'll load and process SVGs after setup
    assets[i] = null;
  }
}

function setup() {
  const c = createCanvas(CANVAS_W, CANVAS_H, SVG);
  c.parent('sketch-holder');
  pixelDensity(1); // SVG doesn't need pixel density
  
  // Store reference to the actual SVG element
  svgCanvasElement = document.querySelector('svg');
  
  // Start with static mode
  noLoop();
  
  // Load and process SVG assets, then render
  loadAndColorSVGs().then(() => {
    console.log('All SVGs loaded and colored');
    render();
  });
}

async function loadAndColorSVGs() {
  for (let i = 0; i < ASSET_COUNT; i++) {
    const idx = String(i).padStart(2, '0');
    const svgPath = `./assets/circle-${idx}.svg`;
    
    try {
      const response = await fetch(svgPath);
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      // Remove any style tags that might override our colors
      const styles = svgElement.querySelectorAll('style');
      styles.forEach(s => s.remove());
      
      // Get all shapes (path, circle, rect, line, etc.)
      const shapes = svgElement.querySelectorAll('path, circle, rect, line, ellipse, polygon, polyline');
      
      shapes.forEach((shape, shapeIdx) => {
        // Pick a color from the palette (deterministic based on asset and shape index)
        const colorIdx = (i + shapeIdx) % selectedPalette.length;
        const color = selectedPalette[colorIdx];
        
        // Remove class attribute to avoid CSS overrides
        shape.removeAttribute('class');
        
        // Set inline attributes directly
        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', 'none');
        shape.setAttribute('stroke-width', '0');
      });
      
      // Store the colored SVG element for vector rendering
      assets[i] = svgElement;
      console.log(`Loaded colored SVG ${i}`);
    } catch (err) {
      console.error(`Failed to load SVG ${i}:`, err);
    }
  }
}

function draw() {
  // Motion mode: advance tick periodically
  if (state.motionEnabled) {
    frameCounter++;
    if (frameCounter % state.tickRate === 0) {
      state.tick++;
      render();
    }
  }
}

// ============================================================================
// Deterministic Hash Function
// ============================================================================

function hash(seed, ...values) {
  let h = seed;
  for (let v of values) {
    h = ((h * 1103515245 + 12345) ^ (v * 2654435761)) >>> 0;
  }
  return (h % 10000) / 10000; // 0..1
}

// ============================================================================
// Compute Boolean Primitives
// ============================================================================

function computeBooleans(stackIndex, assetIndex) {
  const n = hash(state.seed, stackIndex, assetIndex, state.tick);
  const parity = assetIndex % 2 === 0;
  const quartile = assetIndex % 4;
  const highIndex = assetIndex > 8;
  const stackParity = stackIndex % 2 === 1;
  const timeBit = state.motionEnabled ? (state.tick % 2 === 0) : false;
  
  const A = n > state.noiseThreshold;
  const B = parity;
  const C = stackParity || highIndex;
  const D = timeBit;
  
  return { A, B, C, D };
}

// ============================================================================
// Build Render Plans
// ============================================================================

function buildRenderPlans() {
  for (let stackIdx = 0; stackIdx < STACK_COUNT; stackIdx++) {
    const programName = state.programIds[stackIdx];
    const program = PROGRAMS[programName];
    const plan = [];
    
    for (let assetIdx = 0; assetIdx < ASSET_COUNT; assetIdx++) {
      const { A, B, C, D } = computeBooleans(stackIdx, assetIdx);
      const result = program.evaluate(A, B, C, D);
      
      if (result.visible) {
        plan.push({
          assetIdx,
          rotationSteps: result.rotationSteps % 4,
          priority: result.priority + assetIdx * 0.01, // stable tie-breaker
        });
      }
    }
    
    // Sort by priority (higher first)
    plan.sort((a, b) => b.priority - a.priority);
    
    stackPlans[stackIdx] = plan;
  }
}

// ============================================================================
// Determine Stack Draw Order
// ============================================================================

function getStackDrawOrder() {
  // Use Boolean primitives to determine which stack is topmost
  const n1 = hash(state.seed, 'stacking', state.tick);
  const n2 = hash(state.seed, 'stacking', state.tick + 1);
  
  const A = n1 > state.noiseThreshold;
  const B = n2 > state.noiseThreshold;
  const C = state.tick % 2 === 0;
  
  // Boolean logic to determine stack ordering
  // This creates a cyclic priority system that changes based on noise and time
  const topmostLogic = [
    A && B,           // Stack 0 topmost if both noise values high
    B && !A,          // Stack 1 topmost if B high but A low
    !A && !B && C,    // Stack 2 topmost if both noise low and C true
  ];
  
  // Find topmost stack
  let topmostStack = 2; // default
  for (let i = 0; i < 3; i++) {
    if (topmostLogic[i]) {
      topmostStack = i;
      break;
    }
  }
  
  // Create draw order with topmost stack last (drawn on top)
  // e.g., if stack 1 is topmost: [0, 2, 1]
  const order = [0, 1, 2].filter(i => i !== topmostStack);
  order.push(topmostStack);
  
  return order;
}

// ============================================================================
// Rendering
// ============================================================================

function render() {
  buildRenderPlans();
  
  const bg = state.invertColors ? 0 : 255;
  const fg = state.invertColors ? 255 : 0;
  
  background(bg);
  
  // Compute stack positions (centered both horizontally and vertically)
  const stackX = (CANVAS_W - STAGE_SIZE) / 2;
  
  // Calculate vertical centering for all three stacks with overlap
  // Total height occupied by stacks: (STACK_COUNT - 1) * offset + 1 stage size
  const totalStackHeight = (STACK_COUNT - 1) * STAGE_OFFSET + STAGE_SIZE;
  const stackY0 = (CANVAS_H - totalStackHeight) / 2;
  
  // Get dynamically-determined draw order
  const drawOrder = getStackDrawOrder();
  
  // Draw stacks in determined order
  for (let stackIdx of drawOrder) {
    const sx = stackX;
    const sy = stackY0 + stackIdx * STAGE_OFFSET;
    
    push();
    translate(sx, sy);
    
    // Draw stage bounds (debug)
    if (state.showStageBounds) {
      noFill();
      stroke(128);
      strokeWeight(1);
      rect(0, 0, STAGE_SIZE, STAGE_SIZE);
    }
    
    // Draw assets in stack
    const plan = stackPlans[stackIdx];
    for (let item of plan) {
      drawAsset(item.assetIdx, item.rotationSteps, fg, sx, sy);
    }
    
    // Draw stack label (debug)
    if (state.showStackLabels) {
      fill(fg);
      noStroke();
      textSize(10);
      textAlign(LEFT, TOP);
      text(`Stack ${stackIdx}: ${state.programIds[stackIdx]}`, 5, 5);
    }
    
    pop();
  }
  
  // Draw legend
  if (state.showLegend) {
    drawLegend(fg);
  }
}

function drawAsset(assetIdx, rotationSteps, fg, stackX, stackY) {
  const svgElement = assets[assetIdx];
  if (!svgElement || !svgCanvasElement) return;
  
  // Calculate full transform: stack position + center + rotate + scale
  const tx = stackX + STAGE_SIZE / 2;
  const ty = stackY + STAGE_SIZE / 2;
  const angle = rotationSteps * HALF_PI;
  const scaleFactor = STAGE_SIZE * 0.9 / 100;
  
  // Create SVG group with transforms applied
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', 
    `translate(${tx},${ty}) rotate(${angle * 180 / Math.PI}) scale(${scaleFactor}) translate(-50,-50)`
  );
  
  // Clone and append all children from the asset SVG
  for (let child of svgElement.children) {
    g.appendChild(child.cloneNode(true));
  }
  
  // Append group to the SVG canvas
  svgCanvasElement.appendChild(g);
}

function drawLegend(fg) {
  push();
  fill(fg);
  noStroke();
  textSize(10);
  textAlign(LEFT, BOTTOM);
  
  const info = `Seed: ${state.seed} | Motion: ${state.motionEnabled ? 'ON' : 'OFF'} | Tick: ${state.tick}`;
  text(info, 10, CANVAS_H - 30);
  
  const programs = state.programIds.map((id, i) => `S${i}: ${PROGRAMS[id].name}`).join(' | ');
  text(programs, 10, CANVAS_H - 10);
  
  pop();
}

// ============================================================================
// UI Handlers
// ============================================================================

function updateState(key, value) {
  state[key] = value;
  render();
}

function updateProgramId(stackIndex, programId) {
  state.programIds[stackIndex] = programId;
  render();
}

function randomizeSeed() {
  state.seed = Math.floor(Math.random() * 100000);
  document.getElementById('seed').value = state.seed;
  
  // Pick a new random palette
  if (paletteData.length > 0) {
    const paletteIndex = Math.floor(Math.random() * paletteData.length);
    selectedPalette = [...paletteData[paletteIndex].colors, '#ffffff'];
    console.log('New palette:', paletteData[paletteIndex].name);
    // Reload SVGs with new colors
    loadAndColorSVGs().then(() => {
      setTimeout(() => render(), 100);
    });
  } else {
    render();
  }
}

function toggleMotion() {
  state.motionEnabled = !state.motionEnabled;
  if (state.motionEnabled) {
    loop();
  } else {
    noLoop();
  }
  updateMotionButton();
}

function updateMotionButton() {
  const btn = document.getElementById('motionToggle');
  if (btn) {
    btn.textContent = state.motionEnabled ? 'Stop Motion' : 'Start Motion';
  }
}

function resetTick() {
  state.tick = 0;
  frameCounter = 0;
  render();
}

// ============================================================================
// Export
// ============================================================================

function exportPNG() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Get the SVG element
  const svgElement = svgCanvasElement;
  if (!svgElement) return;
  
  // Serialize SVG to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  
  // Create canvas for rasterization at 2x resolution
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = CANVAS_W * 2;
  tempCanvas.height = CANVAS_H * 2;
  const ctx = tempCanvas.getContext('2d');
  
  // Convert SVG to image and draw to canvas
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  img.onload = function() {
    ctx.drawImage(img, 0, 0, CANVAS_W * 2, CANVAS_H * 2);
    URL.revokeObjectURL(url);
    
    // Download as PNG
    tempCanvas.toBlob(function(blob) {
      const link = document.createElement('a');
      link.download = `boolean-stack-${timestamp}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };
  
  img.src = url;
}

function exportSVG() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`boolean-stack-${timestamp}.svg`);
}

// Keyboard shortcuts
function keyPressed() {
  if (key === 'p' || key === 'P') {
    exportPNG();
  } else if (key === 's' || key === 'S') {
    exportSVG();
  } else if (key === 'm' || key === 'M') {
    toggleMotion();
  } else if (key === 'r' || key === 'R') {
    randomizeSeed();
  }
}
