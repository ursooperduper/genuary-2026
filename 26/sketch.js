const WIDTH = 540;
const HEIGHT = 675;

const STROKE_WEIGHT = 20;
const STROKE_COLOR = '#999999';
const GRID_SIZE = 300;
const GRID_DIVS = 3;
const MIN_SIZE = 4;
const SPEED = 0.05; // commands per frame (lower = slower)
const HOLD_FRAMES = 30; // pause when full/empty to reduce flashing

let OUTER_X = 0;
let OUTER_Y = 0;

let pg;
let commands = [];
let phase = 'forward';
let cmdIndex = 0;
let hold = 0;
let stepAccumulator = 0;

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  pg = createGraphics(WIDTH, HEIGHT);
  pg.strokeWeight(STROKE_WEIGHT);
  pg.noFill();

  strokeWeight(STROKE_WEIGHT);
  stroke(STROKE_COLOR);

  buildCommands();
  frameRate(30);
}

function draw() {
  background('#000000');

  // Fractional stepper: accumulate speed, draw full commands for each whole step,
  // and draw a partial command for the remaining fraction to smooth motion.
  stepAccumulator += SPEED;

  if (phase === 'hold-full' || phase === 'hold-empty') {
    if (hold > 0) {
      hold--;
    } else {
      if (phase === 'hold-full') {
        phase = 'backward';
        cmdIndex = commands.length - 1;
        pg.stroke('#000000');
      } else {
        pg.clear();
        phase = 'forward';
        cmdIndex = 0;
        pg.stroke(STROKE_COLOR);
      }
      stepAccumulator = 0;
    }
  }

  if (phase === 'forward') {
    // Draw full commands for each whole step
    while (stepAccumulator >= 1 && cmdIndex < commands.length) {
      stepAccumulator -= 1;
      pg.stroke(STROKE_COLOR);
      drawCommand(commands[cmdIndex]);
      cmdIndex++;
    }
    // Draw partial of next command for the remaining fraction
    if (cmdIndex < commands.length) {
      const t = constrain(stepAccumulator, 0, 1);
        pg.stroke(STROKE_COLOR);
        drawPartialCommand(commands[cmdIndex], t, false);
    } else {
      phase = 'hold-full';
      hold = HOLD_FRAMES;
      stepAccumulator = 0;
    }
  } else if (phase === 'backward') {
    while (stepAccumulator >= 1 && cmdIndex >= 0) {
      stepAccumulator -= 1;
      pg.stroke('#000000');
      drawCommand(commands[cmdIndex]);
      cmdIndex--;
    }
    if (cmdIndex >= 0) {
      const t = constrain(stepAccumulator, 0, 1);
        pg.stroke('#000000');
        drawPartialCommand(commands[cmdIndex], t, true);
    } else {
      phase = 'hold-empty';
      hold = HOLD_FRAMES;
      stepAccumulator = 0;
    }
  }

  image(pg, 0, 0);

  // Always-visible outer boundary (draw last, force white stroke)
  push();
  noFill();
  stroke(STROKE_COLOR);
  strokeWeight(STROKE_WEIGHT);
  rect(OUTER_X, OUTER_Y, GRID_SIZE, GRID_SIZE);
  pop();
}

function buildCommands() {
  commands = [];
  OUTER_X = (WIDTH - GRID_SIZE) / 2;
  OUTER_Y = (HEIGHT - GRID_SIZE) / 2;
  recurseGrid(OUTER_X, OUTER_Y, GRID_SIZE, GRID_SIZE, 'cols');
}

function recurseGrid(x, y, w, h, mode) {
  if (w < MIN_SIZE || h < MIN_SIZE) return;

  commands.push({ x, y, w, h, mode });

  const inset = STROKE_WEIGHT - 0.25;
  const innerW = w - inset * 2;
  const innerH = h - inset * 2;
  if (innerW < MIN_SIZE || innerH < MIN_SIZE) return;

  if (mode === 'cols') {
    const cw = innerW / GRID_DIVS;
    for (let i = 0; i < GRID_DIVS; i++) {
      const cx = x + inset + i * cw;
      const cy = y + inset;
      recurseGrid(cx, cy, cw, innerH, 'rows');
    }
  } else {
    const ch = innerH / GRID_DIVS;
    for (let j = 0; j < GRID_DIVS; j++) {
      const cx = x + inset;
      const cy = y + inset + j * ch;
      recurseGrid(cx, cy, innerW, ch, 'cols');
    }
  }
}

function drawCommand(cmd) {
  // Draw cell boundary
  pg.rect(cmd.x, cmd.y, cmd.w, cmd.h);

  if (cmd.mode === 'cols') {
    const step = cmd.w / GRID_DIVS;
    for (let i = 1; i < GRID_DIVS; i++) {
      const gx = cmd.x + i * step;
      pg.line(gx, cmd.y, gx, cmd.y + cmd.h);
    }
  } else {
    const step = cmd.h / GRID_DIVS;
    for (let j = 1; j < GRID_DIVS; j++) {
      const gy = cmd.y + j * step;
      pg.line(cmd.x, gy, cmd.x + cmd.w, gy);
    }
  }
}

function drawPartialCommand(cmd, t, reverse) {
  const tt = constrain(t, 0, 1);
  pg.rect(cmd.x, cmd.y, cmd.w, cmd.h);
  if (cmd.mode === 'cols') {
    const step = cmd.w / GRID_DIVS;
    const len = cmd.h * tt;
    for (let i = 1; i < GRID_DIVS; i++) {
      const gx = cmd.x + i * step;
      if (reverse) {
        pg.line(gx, cmd.y + cmd.h, gx, cmd.y + cmd.h - len);
      } else {
        pg.line(gx, cmd.y, gx, cmd.y + len);
      }
    }
  } else {
    const step = cmd.h / GRID_DIVS;
    const len = cmd.w * tt;
    for (let j = 1; j < GRID_DIVS; j++) {
      const gy = cmd.y + j * step;
      if (reverse) {
        pg.line(cmd.x + cmd.w, gy, cmd.x + cmd.w - len, gy);
      } else {
        pg.line(cmd.x, gy, cmd.x + len, gy);
      }
    }
  }
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
