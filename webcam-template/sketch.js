// Webcam scaffolding for p5.js: capture, sample, controls, PNG/SVG export
const WIDTH = 540;
const HEIGHT = 675;

const CFG = {
  sampleStep: 8,        // grid sampling step in pixels
  mirror: true,         // mirror horizontally (selfie view)
  shape: 'circle',      // 'circle' | 'rect'
  effect: 'none',       // 'none' | 'grayscale' | 'threshold'
  threshold: 0.5,       // threshold cut (0..1)
  strokeWeight: 0,      // stroke weight for drawn shapes
  strokeColor: '#ffffff',
  bgColor: '#000000',
  svgFillAlpha: 0.85,   // alpha for SVG fills (0..1)
  mode: 'grid',         // 'grid' | 'hand'
  handCircleSize: 20,   // size of circles for detected fingers
  // Hand landmark tuning
  handOffsetX: 0,       // X offset for hand landmarks (adjust if shifted left/right)
  handOffsetY: 0,       // Y offset for hand landmarks (adjust if shifted up/down)
  handScaleX: 1.0,      // X scale multiplier (adjust if stretched/compressed)
  handScaleY: 1.0,      // Y scale multiplier (adjust if stretched/compressed)
};

let video;
let videoReady = false;
let permissionDenied = false;
let handpose;
let handPredictions = [];
let handposeInitialized = false;

function preload() {
  // Don't initialize handpose here - do it in setup after ml5 is definitely ready
}

function setup() {
  // Use 2D renderer so PNG/blend modes work properly
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  frameRate(60);
  pixelDensity(1);

  // Request webcam with reasonable constraints
  const constraints = {
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  };

  try {
    video = createCapture(constraints);
    video.size(WIDTH, HEIGHT);
    video.hide();
    
    // Wait for video to load before initializing handpose
    video.elt.addEventListener('loadeddata', () => {
      console.log('Video loaded, initializing handpose...');
      videoReady = true;
      
      // Initialize handpose now that video is ready
      if (!handposeInitialized && typeof ml5 !== 'undefined' && ml5.handpose) {
        try {
          // ml5 v0.12.2 uses ml5.handpose() with lowercase 'p'
          handpose = ml5.handpose(video, () => {
            console.log('HandPose model loaded successfully');
            // Start continuous predictions
            handpose.on('predict', (results) => {
              handPredictions = results;
            });
            handposeInitialized = true;
          });
        } catch (err) {
          console.error('Error initializing handpose:', err);
        }
      }
    });
  } catch (e) {
    permissionDenied = true;
    console.error('Webcam init error:', e);
  }
}

function gotHands(results) {
  handPredictions = results;
  console.log('Hand detection update:', results ? results.length : 0, 'hands detected');
}

function draw() {
  background(CFG.bgColor);

  if (permissionDenied) {
    drawStatus('Camera permission denied. Use HTTPS and allow access.');
    return;
  }

  if (!video || !videoReady || video.width === 0) {
    drawStatus('Starting camera...');
    return;
  }

  // Choose mode: hand detection or grid sampling
  if (CFG.mode === 'hand') {
    drawHandMode();
  } else {
    // Sample the webcam into a grid of shapes
    drawSampleGrid();
  }

  // Overlay help
  drawHelp();
  
  // Debug info at top
  fill(255);
  textSize(14);
  text(`Mode: ${CFG.mode} | Hands: ${handPredictions.length}`, 10, 20);
}

function drawHandMode() {
  // Draw raw webcam feed
  push();
  if (CFG.mirror) {
    translate(WIDTH, 0);
    scale(-1, 1);
  }
  image(video, 0, 0, WIDTH, HEIGHT);
  pop();

  // Draw circles on detected finger tips
  if (handPredictions && handPredictions.length > 0) {
    
    // Get the actual source video dimensions (might be different from display size)
    const videoSourceWidth = video.elt.videoWidth || video.width;
    const videoSourceHeight = video.elt.videoHeight || video.height;
    
    // Debug once per second
    if (frameCount % 60 === 0) {
      console.log(`Source: ${videoSourceWidth}x${videoSourceHeight}, Display: ${video.width}x${video.height}, Canvas: ${WIDTH}x${HEIGHT}`);
    }
    
    for (let hand of handPredictions) {
      // ml5 v0.12.2 uses 'landmarks' not 'keypoints'
      const landmarks = hand.landmarks;
      
      if (!landmarks || !Array.isArray(landmarks)) {
        console.warn('No landmarks found in hand object');
        continue;
      }
      
      // Draw all 21 landmarks to see the full hand, not just fingertips
      for (let i = 0; i < landmarks.length; i++) {
        const landmark = landmarks[i];
        
        // Landmarks are [x, y, z] arrays
        if (Array.isArray(landmark) && landmark.length >= 2) {
          // Scale from source video resolution to canvas
          let x = (landmark[0] / videoSourceWidth) * WIDTH * CFG.handScaleX;
          let y = (landmark[1] / videoSourceHeight) * HEIGHT * CFG.handScaleY;
          
          // Apply offsets
          x += CFG.handOffsetX;
          y += CFG.handOffsetY;
          
          // Mirror x coordinate if needed (since video is mirrored)
          if (CFG.mirror) {
            x = WIDTH - x;
          }
          
          // Draw fingertips bigger and in green
          const fingerTips = [4, 8, 12, 16, 20];
          if (fingerTips.includes(i)) {
            fill(0, 255, 0);
            stroke(255, 255, 255);
            strokeWeight(2);
            circle(x, y, CFG.handCircleSize);
          } else {
            // Other landmarks in red (smaller)
            fill(255, 0, 0);
            noStroke();
            circle(x, y, 8);
          }
        }
      }
    }
  } else {
    // Debug: show text if no hands detected
    fill(255);
    textSize(20);
    text('No hands detected', 20, 40);
  }
}

function drawSampleGrid() {
  video.loadPixels();
  const step = max(1, CFG.sampleStep);
  noStroke();
  strokeWeight(CFG.strokeWeight);
  if (CFG.strokeWeight > 0) stroke(CFG.strokeColor);

  for (let y = 0; y < HEIGHT; y += step) {
    for (let x = 0; x < WIDTH; x += step) {
      const sx = CFG.mirror ? WIDTH - 1 - x : x;
      const idx = 4 * (y * WIDTH + sx);
      const r = video.pixels[idx + 0] || 0;
      const g = video.pixels[idx + 1] || 0;
      const b = video.pixels[idx + 2] || 0;

      // Effects
      let rr = r, gg = g, bb = b;
      if (CFG.effect === 'grayscale') {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        rr = gg = bb = lum;
      } else if (CFG.effect === 'threshold') {
        const lum = (r + g + b) / 3;
        const val = lum / 255 > CFG.threshold ? 255 : 0;
        rr = gg = bb = val;
      }

      fill(rr, gg, bb);
      if (CFG.shape === 'rect') {
        rect(x, y, step, step);
      } else {
        const d = step * 0.9;
        circle(x + step * 0.5, y + step * 0.5, d);
      }
    }
  }
}

function drawStatus(msg) {
  push();
  fill('#888');
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(14);
  text(msg, width * 0.5, height * 0.5);
  pop();
}

function drawHelp() {
  push();
  noStroke();
  fill(255, 160);
  textSize(11);
  textAlign(LEFT, BOTTOM);
  const lines = [
    'Controls:',
    '[ / ]  step size',
    'm      mirror on/off',
    '1/2/3  effect: none/gray/threshold',
    '+/-    threshold (when threshold mode)',
    'r      rect/circle',
    'h      hand detection mode',
    'p      save PNG',
    's      save SVG (vector grid)'
  ];
  const pad = 10;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], pad, height - pad - (lines.length - 1 - i) * 14);
  }
  pop();
}

function keyPressed() {
  if (key === '[') {
    CFG.sampleStep = max(1, CFG.sampleStep - 1);
  } else if (key === ']') {
    CFG.sampleStep = min(64, CFG.sampleStep + 1);
  } else if (key === 'm' || key === 'M') {
    CFG.mirror = !CFG.mirror;
  } else if (key === '1') {
    CFG.effect = 'none';
  } else if (key === '2') {
    CFG.effect = 'grayscale';
  } else if (key === '3') {
    CFG.effect = 'threshold';
  } else if (key === '+' || key === '=') {
    CFG.threshold = min(1, CFG.threshold + 0.05);
  } else if (key === '-') {
    CFG.threshold = max(0, CFG.threshold - 0.05);
  } else if (key === 'r' || key === 'R') {
    CFG.shape = CFG.shape === 'rect' ? 'circle' : 'rect';
  } else if (key === 'h' || key === 'H') {
    CFG.mode = CFG.mode === 'grid' ? 'hand' : 'grid';
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 's' || key === 'S') {
    saveAsSvg();
  }
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // Save current 2D frame as PNG
  const img = get();
  img.save(`webcam-${timestamp}.png`);
}

function saveAsSvg() {
  // Recreate the current grid as vector shapes into an offscreen SVG buffer
  const svg = createGraphics(WIDTH, HEIGHT, SVG);
  svg.background(CFG.bgColor);
  svg.noStroke();
  svg.strokeWeight(CFG.strokeWeight);
  if (CFG.strokeWeight > 0) svg.stroke(CFG.strokeColor);

  video.loadPixels();
  const step = max(1, CFG.sampleStep);
  for (let y = 0; y < HEIGHT; y += step) {
    for (let x = 0; x < WIDTH; x += step) {
      const sx = CFG.mirror ? WIDTH - 1 - x : x;
      const idx = 4 * (y * WIDTH + sx);
      const r = video.pixels[idx + 0] || 0;
      const g = video.pixels[idx + 1] || 0;
      const b = video.pixels[idx + 2] || 0;

      let rr = r, gg = g, bb = b;
      if (CFG.effect === 'grayscale') {
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        rr = gg = bb = lum;
      } else if (CFG.effect === 'threshold') {
        const lum = (r + g + b) / 3;
        const val = lum / 255 > CFG.threshold ? 255 : 0;
        rr = gg = bb = val;
      }

      const fillStr = `rgba(${rr},${gg},${bb},${CFG.svgFillAlpha})`;
      svg.fill(fillStr);
      if (CFG.shape === 'rect') {
        svg.rect(x, y, step, step);
      } else {
        const d = step * 0.9;
        svg.circle(x + step * 0.5, y + step * 0.5, d);
      }
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // Serialize the SVG and trigger a download
  try {
    const svgNode = svg._renderer.svg;
    const xml = new XMLSerializer().serializeToString(svgNode);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webcam-${timestamp}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('SVG export failed:', e);
  }
}