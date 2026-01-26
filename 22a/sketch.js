// ORIGINAL
const WIDTH = 540;           // Canvas width in px; keep under ~800 for quick redraws
const HEIGHT = 675;          // Canvas height in px; similar guidance as WIDTH
const MARGIN = 40;           // Padding around drawing area; 20–80 typical
const PNG_SCALE = 2;         // Multiplier for PNG export resolution; 1–3 common
const ROW_STEP = 8;          // Horizontal scanline vertical spacing (original 12); 6–14 for density
const H_STEP = 2;            // Horizontal step along a line (original 3); 1–4 keeps smooth curves
const ROW_STEP_V = 10;       // Vertical scan: horizontal spacing between lines; 6–14 good
const H_STEP_V = 2;          // Vertical step along a vertical line; 1–4 recommended
// const STROKE_W = 2;          // Stroke weight in px; 0.5–2 for plotter-ready hairlines
// const STROKE_W = 0.5;          // Stroke weight in px; 0.5–2 for plotter-ready hairlines
const STROKE_W = 2;          // Stroke weight in px; 0.5–2 for plotter-ready hairlines




// const WIDTH = 540;           // Canvas width in px; keep under ~800 for quick redraws
// const HEIGHT = 675;          // Canvas height in px; similar guidance as WIDTH
// const MARGIN = 40;           // Padding around drawing area; 20–80 typical
// const PNG_SCALE = 2;         // Multiplier for PNG export resolution; 1–3 common
// const ROW_STEP = 12;          // Horizontal scanline vertical spacing (original 12); 6–14 for density
// const H_STEP = 3;            // Horizontal step along a line (original 3); 1–4 keeps smooth curves
// const ROW_STEP_V = 12;       // Vertical scan: horizontal spacing between lines; 6–14 good
// const H_STEP_V = 3;          // Vertical step along a vertical line; 1–4 recommended
// const STROKE_W = 6;          // Stroke weight in px; 0.5–2 for plotter-ready hairlines

// Oscillation modes
const OSC_MODES = ['original', 'smooth', 'freqShift', 'phaseJogs', 'bandDisplace'];
let oscModeIndex = 1; // default to 'smooth'

// Base
const OSC_AMP = 2;           // Base amp outside letter; 1–4 subtle, 4–8 bold
const OSC_FREQ = Math.PI * 2 / 18; // Base freq outside; larger denom = slower wave
const OSC_AMP_V = 4;         // Vertical scan amp outside; 2–6 typical
const OSC_FREQ_V = Math.PI * 2 / 18; // Vertical scan base freq

// Smooth blend
// const OSC_AMP_IN = 4;        // Smooth mode amp inside; 3–8
const OSC_AMP_IN = 3;        // Smooth mode amp inside; 3–8
const OSC_FREQ_IN = Math.PI * 2 / 10; // Smooth mode freq inside; faster than base
// const OSC_BLEND_RATE = 0.15; // 0.05–0.3 controls smoothing speed entering/exiting
const OSC_BLEND_RATE = 0.05; // 0.05–0.3 controls smoothing speed entering/exiting
const OSC_AMP_V_IN = 6;      // Vertical smooth amp inside
const OSC_FREQ_V_IN = Math.PI * 2 / 12; // Vertical smooth freq inside

// Frequency shift (hard switch)
const FS_AMP = 2.5;          // Frequency shift amp inside; 2–6
// const FS_AMP = 4.2;          // Frequency shift amp inside; 2–6
const FS_FREQ_IN = Math.PI * 2 / 8; // Higher freq inside; lower divisor = faster
const FS_AMP_V = 4.5;        // Vertical freq shift amp
const FS_FREQ_V_IN = Math.PI * 2 / 9; // Vertical higher freq

// Phase jogs
const PJ_AMP = 2.5;          // Phase jogs amp; 2–5
// const PJ_AMP = 5;          // Phase jogs amp; 2–5
const PJ_FREQ = Math.PI * 2 / 16; // Base freq for phase jog mode
const PJ_JOG_INTERVAL = 22;  // Pixels traveled before a phase jump; 12–40
// const PJ_JOG_INTERVAL = 12;  // Pixels traveled before a phase jump; 12–40
const PJ_JOG_SIZE = Math.PI / 12; // Phase jump size; PI/12–PI/3 for subtle–bold
const PJ_AMP_V = 2.5;        // Vertical phase jog amp
const PJ_FREQ_V = Math.PI * 2 / 16; // Vertical base freq
const PJ_JOG_INTERVAL_V = 22; // Vertical jog interval
const PJ_JOG_SIZE_V = Math.PI / 5; // Vertical jump size

// Band displacement
// const BD_AMP = 6;            // Band displacement amp; 4–10
const BD_AMP = 4.2;            // Band displacement amp; 4–10
const BD_FREQ = Math.PI * 2 / 140; // Slow sweep; increase denominator to slow more
// const BD_PHASE_STEP = Math.PI / 18; // Phase offset per line; PI/36–PI/8
const BD_PHASE_STEP = Math.PI / 8; // Phase offset per line; PI/36–PI/8
const BD_AMP_V = 6;          // Vertical band displacement amp
const BD_FREQ_V = Math.PI * 2 / 140; // Vertical sweep
const BD_PHASE_STEP_V = Math.PI / 18; // Vertical phase offset per line
// const BLEED = 140; // original
const BLEED = 20;

const BG_COLOR = '#f2efe6';
const LINE_COLOR = '#1c1c1c';

const SHAPE_COUNT_MIN = 1;   // Unused now (legacy); kept for compatibility
const SHAPE_COUNT_MAX = 3;   // Unused now
const ROTATE_SHAPES = true;  // Unused now

let seed = 1;
let shapes = [];
let verticalScan = false;
let invertColors = false;
let monochromeMode = false;
let paletteData = null;
let currentPalette = null;

// Letter loading
let currentLetter = 'A';
let letterPath2D = null;
let letterTransform = { scale: 1, tx: 0, ty: 0 };
const MAX_LETTER_WIDTH = 350; // Max rendered width in px; 250–420 keeps good margins


// Reusable offscreen canvas for hit testing (performance optimization)
let hitTestCanvas = null;
let hitTestCtx = null;

function preload() {
  paletteData = loadJSON(
    'assets/colors.json',
    () => {},
    () => {
      paletteData = null;
    },
  );
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  pixelDensity(1);
  noLoop();
  pickRandomPalette();
  
  // Create reusable offscreen canvas for hit testing
  hitTestCanvas = new OffscreenCanvas(1, 1);
  hitTestCtx = hitTestCanvas.getContext('2d');
  console.log(`Mode: ${OSC_MODES[oscModeIndex]}`);
  
  loadLetter(currentLetter);
}

function draw() {
  randomSeed(seed);
  renderScene(this, 1);
}

function renderScene(g, scale = 1) {
  const palette = getActivePalette();
  const bg = palette[0] || BG_COLOR;
  const line = palette[1] || LINE_COLOR;
  g.background(bg);
  g.stroke(line);
  g.strokeWeight(STROKE_W);
  g.strokeJoin(ROUND);
  g.strokeCap(SQUARE);
  g.noFill();

  g.push();
  if (scale !== 1) {
    g.scale(scale);
  }

  const xMin = MARGIN;
  const xMax = WIDTH - MARGIN;
  const yMin = MARGIN;
  const yMax = HEIGHT - MARGIN;

  g.beginShape();
  if (!verticalScan) {
    let y = yMin;
    let dir = 1;
    let oscMix = 0;
    let phase = 0;
    let jogAccum = 0;
    let lineIdx = 0;

    while (y <= yMax) {
      const startX = dir === 1 ? xMin : xMax;
      const endX = dir === 1 ? xMax : xMin;
      const step = dir === 1 ? H_STEP : -H_STEP;
      let x = startX;
      let traveled = 0;

      while ((dir === 1 && x <= endX) || (dir === -1 && x >= endX)) {
        const inside = pointInShapes(x, y);
        let offset = 0;
        const mode = OSC_MODES[oscModeIndex];
        if (mode === 'original') {
          offset = inside ? sin(traveled * OSC_FREQ) * OSC_AMP : 0;
        } else if (mode === 'smooth') {
          const target = inside ? 1 : 0;
          oscMix = lerp(oscMix, target, OSC_BLEND_RATE);
          const amp = lerp(OSC_AMP, OSC_AMP_IN, oscMix);
          const freq = lerp(OSC_FREQ, OSC_FREQ_IN, oscMix);
          offset = sin(traveled * freq) * amp;
        } else if (mode === 'freqShift') {
          offset = inside ? sin(traveled * FS_FREQ_IN) * FS_AMP : 0;
        } else if (mode === 'phaseJogs') {
          if (inside) {
            jogAccum += abs(step);
            if (jogAccum >= PJ_JOG_INTERVAL) {
              phase += PJ_JOG_SIZE;
              jogAccum = 0;
            }
            offset = sin(traveled * PJ_FREQ + phase) * PJ_AMP;
          } else {
            phase = 0;
            jogAccum = 0;
            offset = 0;
          }
        } else if (mode === 'bandDisplace') {
          if (inside) {
            const basePhase = lineIdx * BD_PHASE_STEP;
            offset = sin(traveled * BD_FREQ + basePhase) * BD_AMP;
          } else {
            offset = 0;
          }
        }
        g.vertex(x, y + offset);
        x += step;
        traveled += abs(step);
      }

      g.vertex(endX, y);
      y += ROW_STEP;
      if (y > yMax) {
        break;
      }
      g.vertex(endX, y);
      dir *= -1;
      lineIdx += 1;
    }
  } else {
    let x = xMin;
    let dir = 1;
    let oscMix = 0;
    let phase = 0;
    let jogAccum = 0;
    let lineIdx = 0;

    while (x <= xMax) {
      const startY = dir === 1 ? yMin : yMax;
      const endY = dir === 1 ? yMax : yMin;
      const step = dir === 1 ? H_STEP_V : -H_STEP_V;
      let y = startY;
      let traveled = 0;

      while ((dir === 1 && y <= endY) || (dir === -1 && y >= endY)) {
        const inside = pointInShapes(x, y);
        let offset = 0;
        const mode = OSC_MODES[oscModeIndex];
        if (mode === 'original') {
          offset = inside ? sin(traveled * OSC_FREQ_V) * OSC_AMP_V : 0;
        } else if (mode === 'smooth') {
          const target = inside ? 1 : 0;
          oscMix = lerp(oscMix, target, OSC_BLEND_RATE);
          const amp = lerp(OSC_AMP_V, OSC_AMP_V_IN, oscMix);
          const freq = lerp(OSC_FREQ_V, OSC_FREQ_V_IN, oscMix);
          offset = sin(traveled * freq) * amp;
        } else if (mode === 'freqShift') {
          offset = inside ? sin(traveled * FS_FREQ_V_IN) * FS_AMP_V : 0;
        } else if (mode === 'phaseJogs') {
          if (inside) {
            jogAccum += abs(step);
            if (jogAccum >= PJ_JOG_INTERVAL_V) {
              phase += PJ_JOG_SIZE_V;
              jogAccum = 0;
            }
            offset = sin(traveled * PJ_FREQ_V + phase) * PJ_AMP_V;
          } else {
            phase = 0;
            jogAccum = 0;
            offset = 0;
          }
        } else if (mode === 'bandDisplace') {
          if (inside) {
            const basePhase = lineIdx * BD_PHASE_STEP_V;
            offset = sin(traveled * BD_FREQ_V + basePhase) * BD_AMP_V;
          } else {
            offset = 0;
          }
        }
        g.vertex(x + offset, y);
        y += step;
        traveled += abs(step);
      }

      g.vertex(x, endY);
      x += ROW_STEP_V;
      if (x > xMax) {
        break;
      }
      g.vertex(x, endY);
      dir *= -1;
      lineIdx += 1;
    }
  }

  g.endShape();
  g.pop();
}

function getActivePalette() {
  if (monochromeMode) {
    return invertColors ? ['#ffffff', '#000000'] : ['#000000', '#ffffff'];
  }
  if (currentPalette && currentPalette.length >= 2) {
    return currentPalette;
  }
  return [BG_COLOR, LINE_COLOR];
}

function pickRandomPalette() {
  if (!paletteData || !paletteData.palettes) {
    currentPalette = [BG_COLOR, LINE_COLOR];
    return;
  }
  const choices = paletteData.palettes.filter(
    (palette) => palette.colors && palette.colors.length >= 2 && palette.colors.length <= 2,
  );
  if (!choices.length) {
    currentPalette = [BG_COLOR, LINE_COLOR];
    return;
  }
  const pick = choices[Math.floor(Math.random() * choices.length)];
  currentPalette = pick.colors.slice(0, 2);
}

function shufflePalette() {
  if (!currentPalette || currentPalette.length < 2) {
    return;
  }
  currentPalette = [currentPalette[1], currentPalette[0]];
}

function reseed() {
  seed = floor(random(1_000_000_000));
  randomSeed(seed);
  loadLetter(currentLetter);
}

async function loadLetter(letter) {
  const svgPath = `assets/letterforms/${letter}.svg`;
  
  try {
    const response = await fetch(svgPath);
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl = svgDoc.querySelector('svg');
    const pathEl = svgDoc.querySelector('path');
    
    if (!pathEl) {
      console.error('No path found in SVG');
      return;
    }
    
    const pathD = pathEl.getAttribute('d');
    const viewBox = svgEl.getAttribute('viewBox');
    const [vbX, vbY, vbW, vbH] = viewBox ? viewBox.split(' ').map(Number) : [0, 0, 100, 100];
    
    // Calculate transform to center and scale the letter
    const scale = MAX_LETTER_WIDTH / vbW;
    const scaledW = vbW * scale;
    const scaledH = vbH * scale;
    const tx = (WIDTH - scaledW) / 2 - vbX * scale;
    const ty = (HEIGHT - scaledH) / 2 - vbY * scale;
    
    letterTransform = { scale, tx, ty };
    letterPath2D = new Path2D(pathD);
    
    console.log(`Loaded ${letter}: viewBox=${viewBox}, scale=${scale.toFixed(2)}, center=(${(tx + scaledW/2).toFixed(1)}, ${(ty + scaledH/2).toFixed(1)})`);
    
    redraw();
  } catch (err) {
    console.error('Error loading letter:', err);
  }
}

function pointInShapes(px, py) {
  if (!letterPath2D || !letterTransform || !hitTestCtx) {
    return false;
  }
  
  // Convert canvas coords to SVG coords
  const { scale, tx, ty } = letterTransform;
  const svgX = (px - tx) / scale;
  const svgY = (py - ty) / scale;
  
  // Use global offscreen canvas for hit testing (reused for performance)
  return hitTestCtx.isPointInPath(letterPath2D, svgX, svgY, 'nonzero');
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const pg = createGraphics(WIDTH * PNG_SCALE, HEIGHT * PNG_SCALE);
  pg.pixelDensity(1);
  randomSeed(seed);
  renderScene(pg, PNG_SCALE);
  saveCanvas(pg, `genuary-23-${timestamp}`, 'png');
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'n' || key === 'N') {
    // Next letter
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idx = letters.indexOf(currentLetter);
    currentLetter = letters[(idx + 1) % letters.length];
    loadLetter(currentLetter);
  } else if (key === 'v' || key === 'V') {
    verticalScan = !verticalScan;
    redraw();
  } else if (key === 'm' || key === 'M') {
    monochromeMode = !monochromeMode;
    redraw();
  } else if (key === 'i' || key === 'I') {
    if (monochromeMode) {
      invertColors = !invertColors;
      redraw();
    }
  } else if (key === 'c' || key === 'C') {
    monochromeMode = false;
    pickRandomPalette();
    redraw();
  } else if (key === 'k' || key === 'K') {
    monochromeMode = false;
    shufflePalette();
    redraw();
  } else if (key === 'o' || key === 'O') {
    oscModeIndex = (oscModeIndex + 1) % OSC_MODES.length;
    console.log(`Mode: ${OSC_MODES[oscModeIndex]}`);
    redraw();
  }
}
