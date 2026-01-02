const WIDTH = 540;
const HEIGHT = 675;

let paletteColors = [];
let paletteCount = 0;

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  noLoop();
  
  generateFibonacciPalette();
}

function draw() {
  background('#FFFFFF');
  noStroke();
  
  drawPaletteStack();
}

function generateFibonacciPalette() {
  // Fibonacci numbers between 3 and 13 (at least 3 colors)
  const fibCounts = [3, 5, 8, 13];
  paletteCount = random(fibCounts);
  
  // Fibonacci numbers that fit in RGB range (0-255)
  const fibRGB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
  
  // Pick base color with Fibonacci RGB values
  const baseR = random(fibRGB);
  const baseG = random(fibRGB);
  const baseB = random(fibRGB);
  
  // Convert base RGB to HSL for saturation stepping
  const baseColor = color(baseR, baseG, baseB);
  colorMode(HSL, 360, 100, 100);
  const h = hue(baseColor);
  const s = saturation(baseColor);
  const l = lightness(baseColor);
  
  paletteColors = [];
  const usedHues = new Set();
  
  // Generate palette with Fibonacci hue steps
  const fibSteps = [1, 2, 3, 5, 8, 13, 21, 34];
  
  for (let i = 0; i < paletteCount; i++) {
    const stepIndex = i % fibSteps.length;
    let hueOffset = fibSteps[stepIndex] * (360 / paletteCount) * i;
    let newH = Math.round((h + hueOffset) % 360);
    
    // Ensure unique hue
    let attempts = 0;
    while (usedHues.has(newH) && attempts < 360) {
      hueOffset += 1;
      newH = Math.round((h + hueOffset) % 360);
      attempts++;
    }
    
    usedHues.add(newH);
    paletteColors.push(color(newH, s, l));
  }
  
  colorMode(RGB, 255);
}

function drawPaletteStack() {
  const rectHeight = HEIGHT / paletteCount;
  
  for (let i = 0; i < paletteColors.length; i++) {
    fill(paletteColors[i]);
    rect(0, i * rectHeight, WIDTH, rectHeight);
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
