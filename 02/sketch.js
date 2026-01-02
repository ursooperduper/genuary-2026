const WIDTH = 540;
const HEIGHT = 675;

// Animation state
let activePrinciple = null; // 0-11 or null
let animationProgress = 0; // 0-1
let animationDuration = 120; // frames (2 seconds at 60fps)
let loopCount = 0; // Track number of completed loops
let buttons = []; // Store button bounds for click detection

// Line properties
let LINE_WIDTH = 200;
const ANIMATION_HEIGHT = HEIGHT * 0.8; // Top 4/5 for animation

// Bezier curve properties
let CONTROL_POINT_SIZE = 80;
const HANDLE_LINE_WEIGHT = 2;

// 12 Principles of Animation
const principles = [
  'Squash & Stretch',
  'Anticipation',
  'Staging',
  'Straight Ahead & Pose to Pose',
  'Follow Through',
  'Slow In & Slow Out',
  'Arc',
  'Secondary Action',
  'Timing',
  'Exaggeration',
  'Solid Drawing',
  'Appeal'
];

function setup() {
  // Use raster renderer (SVG renderer can cause issues with saveCanvas)
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  noLoop();
  
  // Initialize button positions
  calculateButtonBounds();

  // Wire up UI sliders if present
  setupSliders();
}

function calculateButtonBounds() {
  buttons = [];
  const uiHeight = HEIGHT / 5;
  const uiTop = HEIGHT - uiHeight;
  const cols = 6;
  const rows = 2;
  const padding = 20;
  const availableWidth = WIDTH - (padding * 2);
  const availableHeight = uiHeight - (padding * 2);
  const squareSpacingX = availableWidth / cols;
  const squareSpacingY = availableHeight / rows;
  const squareSize = Math.min(squareSpacingX, squareSpacingY) * 0.7;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = padding + col * squareSpacingX + squareSpacingX / 2;
      const y = uiTop + padding + row * squareSpacingY + squareSpacingY / 2;
      buttons.push({
        x: x,
        y: y,
        size: squareSize,
        index: row * cols + col
      });
    }
  }
}

function draw() {
  background('#000000');
  
  // Update animation progress if active
  if (activePrinciple !== null) {
    animationProgress += 1 / animationDuration;
    
    if (animationProgress >= 1.0) {
      loopCount++;
      
      if (loopCount >= 2) {
        // Animation complete after 2 loops - reset to idle
        activePrinciple = null;
        animationProgress = 0;
        loopCount = 0;
        noLoop();
      } else {
        // Continue looping
        animationProgress = animationProgress - 1.0;
      }
    }
  }
  
  // Draw the animated line
  drawAnimatedLine();
  
  // Draw UI buttons at bottom
  drawButtons();
}

function drawAnimatedLine() {
  // Set base drawing state for all animations
  stroke('#ffffff');
  strokeWeight(LINE_WIDTH);
  strokeCap(SQUARE);
  noFill();
  
  // Line base position (centered horizontally, in animation area)
  const baseX = WIDTH / 2;
  const baseY = ANIMATION_HEIGHT / 2;
  const lineHeight = ANIMATION_HEIGHT * 0.55;
  
  if (activePrinciple === null) {
    // Idle state - draw straight bezier line
    drawBezierLine(baseX, baseY - lineHeight / 2, baseX, baseY, baseX, baseY, baseX, baseY + lineHeight / 2);
  } else {
    // Apply bezier animation
    applyBezierPrincipleAnimation(activePrinciple, animationProgress, baseX, baseY, lineHeight);
  }
}

function drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  push();
  
  // Draw the bezier curve (inherit stroke settings from caller)
  noFill();
  bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
  
  // Draw control points and handles
  stroke(255, 255, 255, 100);
  strokeWeight(HANDLE_LINE_WEIGHT);
  line(x1, y1, cx1, cy1);
  line(x2, y2, cx2, cy2);
  
  // Draw control point circles
  fill(255, 200, 0);
  noStroke();
  circle(cx1, cy1, CONTROL_POINT_SIZE);
  circle(cx2, cy2, CONTROL_POINT_SIZE);
  
  // Draw anchor points
  fill(255, 100, 100);
  circle(x1, y1, CONTROL_POINT_SIZE * 0.8);
  circle(x2, y2, CONTROL_POINT_SIZE * 0.8);
  
  pop();
}

function drawButtons() {
  noStroke();
  
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    
    // Red if active, white otherwise
    if (activePrinciple === i) {
      fill('#ff0000');
    } else {
      fill('#ffffff');
    }
    
    rectMode(CENTER);
    rect(btn.x, btn.y, btn.size, btn.size);
  }
}

function setupSliders() {
  const lineWidthSlider = document.getElementById('line-width-slider');
  const controlSizeSlider = document.getElementById('control-size-slider');

  if (lineWidthSlider) {
    lineWidthSlider.value = LINE_WIDTH;
    lineWidthSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      LINE_WIDTH = constrain(isNaN(v) ? LINE_WIDTH : v, 20, 200);
      redraw();
    });
  }

  if (controlSizeSlider) {
    controlSizeSlider.value = CONTROL_POINT_SIZE;
    controlSizeSlider.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      CONTROL_POINT_SIZE = constrain(isNaN(v) ? CONTROL_POINT_SIZE : v, 8, 80);
      redraw();
    });
  }
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  try {
    saveCanvas(`genuary-${timestamp}`, 'png');
    console.log('PNG saved: genuary-' + timestamp + '.png');
  } catch (e) {
    console.error('Error saving PNG:', e);
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsPng();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  }
}

function mousePressed() {
  // Check if any button was clicked
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const halfSize = btn.size / 2;

    console.log('Button clicked:', i);
    
    if (mouseX >= btn.x - halfSize && mouseX <= btn.x + halfSize &&
        mouseY >= btn.y - halfSize && mouseY <= btn.y + halfSize) {
      // Start animation for this principle
      activePrinciple = i;
      animationProgress = 0;
      loopCount = 0;
      loop();
      return false;
    }
  }
}

// ========================================
// EASING & HELPER FUNCTIONS
// ========================================

// Smooth loop - eases in and out for seamless animation loops
// Uses a sine wave to create smooth transitions at both start and end
function smoothLoop(t) {
  // Convert linear t (0->1) to a sine wave that smoothly goes 0->1->0
  // This creates a natural loop without abrupt transitions
  return (1 - cos(t * TWO_PI)) * 0.5;
}

// Easing functions
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}

function easeOutElastic(t) {
  const c4 = (2 * PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : pow(2, -10 * t) * sin((t * 10 - 0.75) * c4) + 1;
}

function easeInBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
}

// ========================================
// BEZIER CURVE ANIMATIONS
// ========================================

function applyBezierPrincipleAnimation(principle, progress, baseX, baseY, lineHeight) {
  // Apply smooth loop easing to create seamless transitions
  const smoothProgress = smoothLoop(progress);
  
  switch(principle) {
    case 0: animateBezierSquashStretch(smoothProgress, baseX, baseY, lineHeight); break;
    case 1: animateBezierAnticipation(smoothProgress, baseX, baseY, lineHeight); break;
    case 2: animateBezierStaging(smoothProgress, baseX, baseY, lineHeight); break;
    case 3: animateBezierStraightAhead(smoothProgress, baseX, baseY, lineHeight); break;
    case 4: animateBezierFollowThrough(smoothProgress, baseX, baseY, lineHeight); break;
    case 5: animateBezierSlowInOut(smoothProgress, baseX, baseY, lineHeight); break;
    case 6: animateBezierArc(smoothProgress, baseX, baseY, lineHeight); break;
    case 7: animateBezierSecondaryAction(smoothProgress, baseX, baseY, lineHeight); break;
    case 8: animateBezierTiming(smoothProgress, baseX, baseY, lineHeight); break;
    case 9: animateBezierExaggeration(smoothProgress, baseX, baseY, lineHeight); break;
    case 10: animateBezierSolidDrawing(smoothProgress, baseX, baseY, lineHeight); break;
    case 11: animateBezierAppeal(smoothProgress, baseX, baseY, lineHeight); break;
  }
}

// Bezier Principle 0: Squash & Stretch
function animateBezierSquashStretch(t, x, y, h) {
  // Single bounce cycle showing squash and stretch clearly
  const bounceHeight = 200;
  const maxSquashAmount = 140;
  const maxStretchAmount = 80;
  const controlPointSpread = 100;
  
  let topYOffset = 0;
  let heightChange = 0;
  let bulge = 0;
  
  // Bottom anchor point stays fixed
  const bottomY = y + h / 2;
  
  // Break the cycle into clear phases
  if (t < 0.3) {
    // Phase 1: Squash down (0 -> 0.3)
    const phase = t / 0.3;
    const eased = easeInOutCubic(phase);
    topYOffset = 0; // Top at rest position initially
    heightChange = eased * maxSquashAmount; // Top moves DOWN toward bottom (squash)
    bulge = eased * controlPointSpread; // Bulge out
  } else if (t < 0.5) {
    // Phase 2: Spring up with stretch (0.3 -> 0.5)
    const phase = (t - 0.3) / 0.2;
    const eased = easeOutCubic(phase);
    topYOffset = -eased * bounceHeight; // Top launches upward
    heightChange = maxSquashAmount * (1 - eased) - eased * maxStretchAmount; // From squash to stretch
    bulge = controlPointSpread * (1 - eased); // Bulge decreases
  } else if (t < 0.7) {
    // Phase 3: Reach peak with full stretch (0.5 -> 0.7)
    const phase = (t - 0.5) / 0.2;
    topYOffset = -bounceHeight; // At peak
    heightChange = -maxStretchAmount; // Full stretch (top moves UP away from bottom)
    bulge = 0;
  } else {
    // Phase 4: Fall back down and squash (0.7 -> 1.0)
    const phase = (t - 0.7) / 0.3;
    const eased = easeInOutCubic(phase);
    topYOffset = -bounceHeight * (1 - eased); // Fall down
    heightChange = -maxStretchAmount * (1 - eased) + eased * maxSquashAmount; // From stretch to squash
    bulge = eased * controlPointSpread; // Bulge returns
  }
  
  // Anchor points - bottom is FIXED, top moves
  const x1 = x;
  const y1 = y - h / 2 + topYOffset + heightChange; // Top moves up/down and squashes/stretches
  const x2 = x;
  const y2 = bottomY; // Bottom stays anchored
  
  // Control points bulge out when squashed
  const cx1 = x - bulge;
  const cy1 = lerp(y1, y2, 0.33);
  const cx2 = x + bulge;
  const cy2 = lerp(y1, y2, 0.66);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 1: Anticipation
function animateBezierAnticipation(t, x, y, h) {
  // Tunable parameters
  const anticipationAmount = 100;
  const launchDistance = 250;
  const controlPointWind = 150;
  const anticipationDuration = 0.25;
  
  let xOffset, controlBend;
  
  if (t < anticipationDuration) {
    // Pull back with building tension
    const antiT = t / anticipationDuration;
    xOffset = -anticipationAmount * easeInBack(antiT);
    controlBend = -controlPointWind * antiT;
  } else {
    // Explosive launch forward
    const launchT = (t - anticipationDuration) / (1 - anticipationDuration);
    xOffset = map(easeOutCubic(launchT), 0, 1, -anticipationAmount, launchDistance);
    controlBend = controlPointWind * (1 - launchT);
  }
  
  const x1 = x + xOffset;
  const y1 = y - h / 2;
  const x2 = x + xOffset;
  const y2 = y + h / 2;
  
  const cx1 = x + xOffset + controlBend;
  const cy1 = lerp(y1, y2, 0.33);
  const cx2 = x + xOffset - controlBend * 0.5;
  const cy2 = lerp(y1, y2, 0.66);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 2: Staging
function animateBezierStaging(t, x, y, h) {
  // Simple staging: line moves left to right
  const xOffset = map(t, 0, 1, -100, 100);
  
  const x1 = x + xOffset;
  const y1 = y - h / 2;
  const x2 = x + xOffset;
  const y2 = y + h / 2;
  
  const cx1 = x + xOffset + 50;
  const cy1 = lerp(y1, y2, 0.33);
  const cx2 = x + xOffset - 50;
  const cy2 = lerp(y1, y2, 0.66);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 3: Straight Ahead & Pose to Pose
function animateBezierStraightAhead(t, x, y, h) {
  // Tunable parameters
  const drawSpeed = 1.2; // Speed multiplier
  const waveAmount = 60;
  const waveFrequency = 3;
  
  const drawProgress = min(t * drawSpeed, 1);
  const currentHeight = h * drawProgress;
  
  // Add organic wave to the drawing
  const wave = sin(drawProgress * PI * waveFrequency) * waveAmount;
  
  const x1 = x;
  const y1 = y + h / 2;
  const x2 = x;
  const y2 = y + h / 2 - currentHeight;
  
  // Control points create the wave
  const cx1 = x + wave;
  const cy1 = lerp(y1, y2, 0.33);
  const cx2 = x - wave * 0.7;
  const cy2 = lerp(y1, y2, 0.66);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 4: Follow Through
function animateBezierFollowThrough(t, x, y, h) {
  // Tunable parameters
  const moveDistance = 200;
  const stopPoint = 0.6;
  const whipAmount = 150;
  const settleTime = 0.4;
  
  let xOffset, trailBend;
  
  if (t < stopPoint) {
    // Main body moves
    xOffset = map(easeInOutCubic(t / stopPoint), 0, 1, 0, moveDistance);
    trailBend = whipAmount * (t / stopPoint);
  } else {
    // Body stops, curve follows through and settles
    xOffset = moveDistance;
    const followT = (t - stopPoint) / settleTime;
    const oscillation = sin(followT * PI * 3) * (1 - followT);
    trailBend = whipAmount + oscillation * whipAmount;
  }
  
  const x1 = x + xOffset;
  const y1 = y - h / 2;
  const x2 = x + xOffset;
  const y2 = y + h / 2;
  
  const cx1 = x + xOffset - trailBend * 0.5;
  const cy1 = lerp(y1, y2, 0.25);
  const cx2 = x + xOffset - trailBend;
  const cy2 = lerp(y1, y2, 0.75);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 5: Slow In & Slow Out
function animateBezierSlowInOut(t, x, y, h) {
  // Tunable parameters
  const travelDistance = 220;
  const curveRelaxAmount = 100;
  
  const eased = easeInOutCubic(t);
  const xOffset = map(eased, 0, 1, -travelDistance / 2, travelDistance / 2);
  
  // Curve becomes more relaxed (less curved) during slow portions
  const velocity = abs(eased - 0.5) * 2; // 0 at middle, 1 at ends
  const curvature = map(velocity, 0, 1, curveRelaxAmount, 20);
  
  const x1 = x + xOffset;
  const y1 = y - h / 2;
  const x2 = x + xOffset;
  const y2 = y + h / 2;
  
  const cx1 = x + xOffset + curvature;
  const cy1 = lerp(y1, y2, 0.33);
  const cx2 = x + xOffset - curvature;
  const cy2 = lerp(y1, y2, 0.66);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 6: Arc
function animateBezierArc(t, x, y, h) {
  // Tunable parameters
  const arcRadius = 160;
  const handleLength = 120;
  const rotationAmount = PI / 2;
  
  const angle = map(t, 0, 1, -PI / 3, PI / 3);
  const xOffset = sin(angle) * arcRadius;
  const yOffset = -cos(angle) * arcRadius + arcRadius / 2;
  
  // Curve rotates as it travels the arc
  const rotation = angle * 1.5;
  
  const x1 = x + xOffset;
  const y1 = y + yOffset - h / 2;
  const x2 = x + xOffset;
  const y2 = y + yOffset + h / 2;
  
  // Control points rotate with the curve
  const cx1 = x + xOffset + cos(rotation) * handleLength;
  const cy1 = lerp(y1, y2, 0.33) + sin(rotation) * handleLength;
  const cx2 = x + xOffset - cos(rotation) * handleLength;
  const cy2 = lerp(y1, y2, 0.66) - sin(rotation) * handleLength;
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 7: Secondary Action
function animateBezierSecondaryAction(t, x, y, h) {
  // Tunable parameters
  const primaryDistance = 180;
  const waveFrequency = 5;
  const waveAmplitude = 80;
  const breathAmount = 30;
  
  // Primary action: horizontal movement
  const xOffset = map(t, 0, 1, 0, primaryDistance);
  
  // Secondary action: undulating wave
  const wave = sin(t * PI * waveFrequency) * waveAmplitude;
  
  // Tertiary action: subtle breathing
  const breath = sin(t * PI * 2) * breathAmount;
  
  const x1 = x + xOffset;
  const y1 = y - h / 2 + breath;
  const x2 = x + xOffset;
  const y2 = y + h / 2 - breath;
  
  const cx1 = x + xOffset + wave;
  const cy1 = lerp(y1, y2, 0.4);
  const cx2 = x + xOffset - wave * 0.8;
  const cy2 = lerp(y1, y2, 0.6);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 8: Timing
function animateBezierTiming(t, x, y, h) {
  // Tunable parameters
  const fastSpeed = 2.5;
  const slowSpeed = 0.6;
  const distance = 170;
  const curveAmount = 70;
  
  // Fast curve (left)
  const fastT = min(t * fastSpeed, 1);
  const fastX = x - 70 + map(easeOutCubic(fastT), 0, 1, 0, distance);
  const fastCurve = curveAmount * (1 - fastT);
  
  drawBezierLine(
    fastX, y - h / 2,
    fastX + fastCurve, y - h / 6,
    fastX - fastCurve, y + h / 6,
    fastX, y + h / 2
  );
  
  // Slow curve (right)
  const slowT = t * slowSpeed;
  const slowX = x + 70 + map(easeInOutCubic(slowT), 0, 1, 0, distance);
  const slowCurve = curveAmount * sin(slowT * PI);
  
  drawBezierLine(
    slowX, y - h / 2,
    slowX + slowCurve, y - h / 6,
    slowX - slowCurve, y + h / 6,
    slowX, y + h / 2
  );
}

// Bezier Principle 9: Exaggeration
function animateBezierExaggeration(t, x, y, h) {
  // Tunable parameters
  const extremeBulge = 180;
  const heightExaggeration = 100;
  const pulseCycles = 2;
  
  const pulseT = sin(t * PI * pulseCycles);
  const intensity = abs(pulseT);
  
  // Extremely exaggerated bulging
  const bulge = extremeBulge * intensity;
  const heightMod = heightExaggeration * intensity;
  
  const x1 = x;
  const y1 = y - h / 2 - heightMod;
  const x2 = x;
  const y2 = y + h / 2 + heightMod;
  
  // Alternate bulge direction
  const direction = pulseT > 0 ? 1 : -1;
  const cx1 = x + bulge * direction;
  const cy1 = lerp(y1, y2, 0.3);
  const cx2 = x - bulge * direction * 0.8;
  const cy2 = lerp(y1, y2, 0.7);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

// Bezier Principle 10: Solid Drawing
function animateBezierSolidDrawing(t, x, y, h) {
  // Tunable parameters
  const rotationCycles = 2;
  const depthAmount = 140;
  const perspectiveShift = 60;
  
  const angle = t * TWO_PI * rotationCycles;
  const depth = cos(angle);
  const side = sin(angle);
  
  // Simulate 3D rotation with perspective
  const scale3D = map(abs(depth), 0, 1, 0.15, 1);
  const xShift = side * perspectiveShift;
  
  const x1 = x + xShift;
  const y1 = y - h / 2;
  const x2 = x + xShift;
  const y2 = y + h / 2;
  
  // Control points show depth
  const cx1 = x + depth * depthAmount;
  const cy1 = lerp(y1, y2, 0.33);
  const cx2 = x - depth * depthAmount * 0.7;
  const cy2 = lerp(y1, y2, 0.66);
  
  push();
  translate(x, y);
  scale(scale3D, 1);
  translate(-x, -y);
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
  pop();
}

// Bezier Principle 11: Appeal
function animateBezierAppeal(t, x, y, h) {
  // Tunable parameters
  const bounceOvershoot = 1.8;
  const moveDistance = 180;
  const gracefulCurve = 90;
  const settleTime = 0.7;
  
  // Smooth elastic motion with overshoot
  const eased = easeOutElastic(t);
  const xOffset = map(eased, 0, 1, -moveDistance / 2, moveDistance / 2);
  
  // Graceful curve that flows
  const flowPhase = min(t / settleTime, 1);
  const flow = sin(flowPhase * PI) * gracefulCurve;
  
  const x1 = x + xOffset;
  const y1 = y - h / 2;
  const x2 = x + xOffset;
  const y2 = y + h / 2;
  
  const cx1 = x + xOffset + flow;
  const cy1 = lerp(y1, y2, 0.35);
  const cx2 = x + xOffset - flow * 0.7;
  const cy2 = lerp(y1, y2, 0.65);
  
  drawBezierLine(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}
