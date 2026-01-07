const WIDTH = 540;
const HEIGHT = 675;
const REVEAL_DIAMETER = 250;
const FEATHER_PIXELS = 20; // adjust for softer/harder mask edge

let lightsOnImg;
let lightsOffImg;
let maskLayer;
let revealLayer;
let isPointerOverCanvas = false;

function preload() {
  lightsOnImg = loadImage('./tribute-gen26-j6-lightsoff.svg');
  lightsOffImg = loadImage('./tribute-gen26-j6-lightson.svg');
}

function setup() {
  // Use the default renderer to support raster masking of the SVG assets
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.parent('sketch-holder');
  pixelDensity(1);

  maskLayer = createGraphics(WIDTH, HEIGHT);
  maskLayer.pixelDensity(1);

  revealLayer = createGraphics(WIDTH, HEIGHT);
  revealLayer.pixelDensity(1);

  canvas.mouseOver(() => {
    isPointerOverCanvas = true;
    redraw();
  });
  canvas.mouseOut(() => {
    isPointerOverCanvas = false;
    redraw();
  });

  noLoop();
  redraw();
}

function draw() {
  if (!lightsOnImg || !lightsOffImg) {
    background('#000000');
    return;
  }

  background('#FFFFFF');
  image(lightsOnImg, 0, 0, WIDTH, HEIGHT);

  if (!isPointerOverCanvas) return;
  if (mouseX < 0 || mouseX > WIDTH || mouseY < 0 || mouseY > HEIGHT) return;

  // Use a circular mask at the pointer to reveal the "lights off" version
  maskLayer.clear();
  maskLayer.noStroke();
  maskLayer.fill(255);
  maskLayer.circle(mouseX, mouseY, REVEAL_DIAMETER);
  // maskLayer.ellipse(mouseX, mouseY, REVEAL_DIAMETER, REVEAL_DIAMETER * 1.4); // vertical ellipse for portrait orientation

  if (FEATHER_PIXELS > 0) {
    maskLayer.filter(BLUR, FEATHER_PIXELS);
  }

  // Prepare the reveal layer with a black base under the alternate artwork
  revealLayer.push();
  revealLayer.clear();
  revealLayer.background('#FFFFFF');
  revealLayer.image(lightsOffImg, 0, 0, WIDTH, HEIGHT);
  revealLayer.pop();

  const maskedOff = revealLayer.get();
  maskedOff.mask(maskLayer.get());
  image(maskedOff, 0, 0, WIDTH, HEIGHT);
}

function mouseMoved() {
  if (isPointerOverCanvas) {
    redraw();
  }
}

function touchMoved() {
  if (isPointerOverCanvas) {
    redraw();
  }
  return false;
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
