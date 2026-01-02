const WIDTH = 540;
const HEIGHT = 675;

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  noLoop();
}

function draw() {
  background('#0f172a');
  noStroke();
  fill('#38bdf8');
  circle(width * 0.5, height * 0.45, 220);

  fill('#94a3b8');
  textAlign(CENTER, CENTER);
  textSize(16);
  text('Replace me with your Genuary sketch', width * 0.5, height * 0.75);
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
