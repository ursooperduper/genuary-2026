const WIDTH = 540;
const HEIGHT = 675;
const ASSET_COUNT = 12;
const ASSET_PREFIX = 'person-';

// const PAPER_TONE = '#F6F4EE';
const PAPER_TONE = '#0c0c0c';
const PURE_WHITE = '#FFFFFF';

let assets = [];
let currentAssetIndex = 0;
let currentSeed = 0;
let canvasRenderer = null;

const config = {
  sep: 50,
  length: 220,
  shear: 0.15,
  alpha: 140,
  jitter: 2,
  snap: false,
  paper: true,
  debugLight: false,
  debugAnchor: false,
  debugVectors: false,
  debugOutline: false,
};

const channels = [
  { name: 'Cyan', color: [0, 174, 239], sepBias: 1, lengthBias: 0, scaleBias: -0.008, alphaBias: 1, seedOffset: 11 },
  { name: 'Magenta', color: [236, 0, 140], sepBias: -1, lengthBias: 0, scaleBias: 0, alphaBias: 1, seedOffset: 37 },
  { name: 'Yellow', color: [255, 242, 0], sepBias: 0.3, lengthBias: 0.08, scaleBias: 0.012, alphaBias: 0.75, seedOffset: 83 },
];

function preload() {
  assets = [];
  for (let i = 1; i <= ASSET_COUNT; i += 1) {
    const name = `${ASSET_PREFIX}${i}.svg`;
    assets.push(loadSVG(`./assets/${name}`));
  }
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvasRenderer = canvas;
  canvas.parent('sketch-holder');
  setupControls();
  selectNewAsset(true);
  noLoop();
}

function draw() {
  renderScene({
    showDebug:
      config.debugLight || config.debugAnchor || config.debugVectors || config.debugOutline,
  });
}

function renderScene({ showDebug }) {
  const bg = config.paper ? PAPER_TONE : PURE_WHITE;
  background(bg);

  if (!assets.length) {
    return;
  }

  randomSeed(currentSeed);
  noiseSeed(currentSeed);

  const asset = assets[currentAssetIndex];
  const svgSize = getSvgSize(asset);
  // const baseScale = computeScale(svgSize);
  const baseScale = computeScale(svgSize) * 1.3;
  const anchor = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
  };

  const { theta, length, dir } = getLightParameters();
  const perp = { x: -dir.y, y: dir.x };

  blendMode(MULTIPLY);
  for (const channel of channels) {
    const lengthAdjusted = length * (1 + channel.lengthBias);
    const baseVector = {
      x: dir.x * lengthAdjusted,
      y: dir.y * lengthAdjusted + lengthAdjusted * 0.6,
    };
    const jitter = getChannelJitter(channel, theta);
    const offset = {
      x: baseVector.x + perp.x * config.sep * channel.sepBias + jitter.x,
      y: baseVector.y + perp.y * config.sep * channel.sepBias + jitter.y,
    };
    const scale = baseScale * (1 + channel.scaleBias);
    drawShadowChannel(asset, svgSize, anchor, offset, scale, theta, channel);
  }
  blendMode(BLEND);

  drawHiddenMask(asset, svgSize, anchor, baseScale, bg);

  if (showDebug) {
    drawDebug(anchor, theta, length, perp);
    if (config.debugOutline) {
      drawDebugOutline(asset, svgSize, anchor, baseScale);
    }
  }
}

function computeScale(svgSize) {
  // const targetW = WIDTH * 0.82;
  // const targetH = HEIGHT * 0.55;
  const targetW = WIDTH * 0.9;
  const targetH = HEIGHT * 0.65;
  const svgW = svgSize.w || targetW;
  const svgH = svgSize.h || targetH;
  return min(targetW / svgW, targetH / svgH);
}

function getSvgSize(asset) {
  if (!asset || !asset.elt) {
    return { w: WIDTH * 0.82, h: HEIGHT * 0.55 };
  }
  const svg = asset.elt;
  const widthAttr = svg.getAttribute('width');
  const heightAttr = svg.getAttribute('height');
  const viewBoxAttr = svg.getAttribute('viewBox');

  const parseNumber = (value) => {
    if (!value) {
      return null;
    }
    const numeric = parseFloat(value.replace('px', ''));
    return Number.isFinite(numeric) ? numeric : null;
  };

  const w = parseNumber(widthAttr);
  const h = parseNumber(heightAttr);
  if (w && h) {
    return { w, h };
  }

  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+/).map((v) => parseFloat(v));
    if (parts.length === 4 && parts.every((v) => Number.isFinite(v))) {
      return { w: parts[2], h: parts[3] };
    }
  }

  return { w: WIDTH * 0.82, h: HEIGHT * 0.55 };
}

function getLightParameters() {
  const mx = mouseX >= 0 && mouseX <= WIDTH ? mouseX : WIDTH / 2;
  const my = mouseY >= 0 && mouseY <= HEIGHT ? mouseY : HEIGHT * 0.65;
  const minTheta = -PI / 3;
  const maxTheta = PI / 3;
  let theta = map(mx, 0, WIDTH, minTheta, maxTheta);
  if (config.snap) {
    const steps = 7;
    const step = (maxTheta - minTheta) / (steps - 1);
    theta = round((theta - minTheta) / step) * step + minTheta;
  }
  const elevation = map(constrain(my, 0, HEIGHT), 0, HEIGHT, 0.35, 1.1);
  const length = config.length * elevation;
  const dir = { x: cos(theta), y: sin(theta) };
  return { theta, length, dir };
}

function getChannelJitter(channel, theta) {
  const jitterMag = config.jitter;
  if (jitterMag === 0) {
    return { x: 0, y: 0 };
  }
  const nx = noise(channel.seedOffset, theta * 0.6 + 1.2);
  const ny = noise(channel.seedOffset + 5, theta * 0.6 + 2.8);
  return {
    x: map(nx, 0, 1, -jitterMag, jitterMag),
    y: map(ny, 0, 1, -jitterMag, jitterMag),
  };
}

function drawShadowChannel(asset, svgSize, anchor, offset, scaleFactor, theta, channel) {
  const alpha = constrain(config.alpha * channel.alphaBias, 0, 255);
  const passes = 2;
  const haloJitter = 0.8;

  push();
  translate(anchor.x + offset.x, anchor.y + offset.y);
  shearX(theta * config.shear);
  scale(scaleFactor);
  imageMode(CENTER);
  applySvgColor(asset, channel, alpha);

  randomSeed(currentSeed + channel.seedOffset);
  for (let i = 0; i < passes; i += 1) {
    const jx = random(-haloJitter, haloJitter);
    const jy = random(-haloJitter, haloJitter);
    setSvgOpacity(asset, alpha * 0.4);
    image(asset, jx, jy, svgSize.w, svgSize.h);
  }

  setSvgOpacity(asset, alpha);
  image(asset, 0, 0, svgSize.w, svgSize.h);
  pop();
}

function applySvgColor(asset, channel, alpha) {
  if (!asset || !asset.elt) {
    return;
  }
  const colorValue = `rgb(${channel.color[0]}, ${channel.color[1]}, ${channel.color[2]})`;
  const elements = asset.elt.querySelectorAll('*');
  elements.forEach((el) => {
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if (fill !== 'none') {
      el.setAttribute('fill', colorValue);
    }
    if (stroke && stroke !== 'none') {
      el.setAttribute('stroke', colorValue);
    }
    if (!fill && !stroke) {
      el.setAttribute('fill', colorValue);
    }
  });
  setSvgOpacity(asset, alpha);
}

function applySvgFillOnly(svgElement, fillColor, alpha) {
  if (!svgElement) {
    return;
  }
  const colorValue = `rgb(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]})`;
  const elements = svgElement.querySelectorAll('*');
  elements.forEach((el) => {
    el.setAttribute('fill', colorValue);
    el.setAttribute('stroke', 'none');
  });
  setSvgOpacityOnElement(svgElement, alpha);
}

function applySvgStrokeOnly(svgElement, strokeColor, alpha) {
  if (!svgElement) {
    return;
  }
  const colorValue = `rgb(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]})`;
  const elements = svgElement.querySelectorAll('*');
  elements.forEach((el) => {
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', colorValue);
    el.setAttribute('stroke-width', '2');
    el.setAttribute('vector-effect', 'non-scaling-stroke');
  });
  setSvgOpacityOnElement(svgElement, alpha);
}

function setSvgOpacity(asset, alpha) {
  if (!asset || !asset.elt) {
    return;
  }
  setSvgOpacityOnElement(asset.elt, alpha);
}

function setSvgOpacityOnElement(svgElement, alpha) {
  const opacity = constrain(alpha, 0, 255) / 255;
  svgElement.setAttribute('opacity', opacity.toFixed(3));
}

function drawDebug(anchor, theta, length, perp) {
  push();
  noFill();
  strokeWeight(1);

  if (config.debugAnchor) {
    stroke(20, 120, 220);
    circle(anchor.x, anchor.y, 8);
  }

  if (config.debugLight) {
    const dir = { x: cos(theta), y: sin(theta) };
    const v = {
      x: dir.x * length,
      y: dir.y * length + length * 0.6,
    };
    stroke(255, 255, 255);
    line(anchor.x, anchor.y, anchor.x + v.x, anchor.y + v.y);
  }

  if (config.debugVectors) {
    const sep = config.sep;
    stroke(0, 174, 239);
    line(anchor.x, anchor.y, anchor.x + perp.x * sep, anchor.y + perp.y * sep);
    stroke(236, 0, 140);
    line(anchor.x, anchor.y, anchor.x - perp.x * sep, anchor.y - perp.y * sep);
    stroke(255, 242, 0);
    line(anchor.x, anchor.y, anchor.x + perp.x * sep * 0.3, anchor.y + perp.y * sep * 0.3);
  }

  pop();
}

function drawDebugOutline(asset, svgSize, anchor, scaleFactor) {
  if (!asset || !asset.elt) {
    return;
  }
  const outline = asset.elt.cloneNode(true);
  push();
  translate(anchor.x, anchor.y);
  scale(scaleFactor);
  imageMode(CENTER);
  applySvgStrokeOnly(outline, [0, 0, 0], 180);
  image(outline, 0, 0, svgSize.w, svgSize.h);
  pop();
}

function drawHiddenMask(asset, svgSize, anchor, scaleFactor, bgColor) {
  if (!asset || !asset.elt) {
    return;
  }
  const mask = asset.elt.cloneNode(true);
  const rgb = color(bgColor);
  applySvgFillOnly(mask, [red(rgb), green(rgb), blue(rgb)], 255);

  push();
  translate(anchor.x, anchor.y);
  scale(scaleFactor);
  imageMode(CENTER);
  image(mask, 0, 0, svgSize.w, svgSize.h);
  pop();
}

function setupControls() {
  bindSlider('sep', (value) => {
    config.sep = value;
  });
  bindSlider('length', (value) => {
    config.length = value;
  });
  bindSlider('shear', (value) => {
    config.shear = value;
  });
  bindSlider('alpha', (value) => {
    config.alpha = value;
  });
  bindSlider('jitter', (value) => {
    config.jitter = value;
  });

  bindToggle('snap', (value) => {
    config.snap = value;
  });
  bindToggle('paper', (value) => {
    config.paper = value;
  });
  bindToggle('debug-light', (value) => {
    config.debugLight = value;
  });
  bindToggle('debug-anchor', (value) => {
    config.debugAnchor = value;
  });
  bindToggle('debug-vectors', (value) => {
    config.debugVectors = value;
  });
  bindToggle('debug-outline', (value) => {
    config.debugOutline = value;
  });
}

function bindSlider(id, onChange) {
  const input = document.getElementById(id);
  const label = document.querySelector(`[data-value-for="${id}"]`);
  if (!input) {
    return;
  }
  const update = () => {
    const value = Number(input.value);
    if (label) {
      label.textContent = input.step.includes('.') ? value.toFixed(2) : value;
    }
    onChange(value);
    redraw();
  };
  input.addEventListener('input', update);
  update();
}

function bindToggle(id, onChange) {
  const input = document.getElementById(id);
  if (!input) {
    return;
  }
  const update = () => {
    onChange(input.checked);
    redraw();
  };
  input.addEventListener('change', update);
  update();
}

function selectNewAsset(randomizeAsset) {
  if (randomizeAsset) {
    currentAssetIndex = floor(random(assets.length));
  }
  currentSeed = floor(random(1e9));
  updateMeta();
  redraw();
}

function updateMeta() {
  const assetLabel = document.getElementById('asset-name');
  const seedLabel = document.getElementById('seed-value');
  if (assetLabel) {
    assetLabel.textContent = `Asset: ${ASSET_PREFIX}${currentAssetIndex + 1}.svg`;
  }
  if (seedLabel) {
    seedLabel.textContent = `Seed: ${currentSeed}`;
  }
}

function saveAsSvg() {
  const previous = {
    debugLight: config.debugLight,
    debugAnchor: config.debugAnchor,
    debugVectors: config.debugVectors,
    debugOutline: config.debugOutline,
  };
  config.debugLight = false;
  config.debugAnchor = false;
  config.debugVectors = false;
  config.debugOutline = false;
  renderScene({ showDebug: false });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-${timestamp}.svg`);
  Object.assign(config, previous);
  renderScene({
    showDebug:
      config.debugLight || config.debugAnchor || config.debugVectors || config.debugOutline,
  });
}

function saveAsPng() {
  const previous = {
    debugLight: config.debugLight,
    debugAnchor: config.debugAnchor,
    debugVectors: config.debugVectors,
    debugOutline: config.debugOutline,
  };
  config.debugLight = false;
  config.debugAnchor = false;
  config.debugVectors = false;
  config.debugOutline = false;
  renderScene({ showDebug: false });
  exportPngFromSvg(() => {
    Object.assign(config, previous);
    renderScene({
      showDebug:
        config.debugLight || config.debugAnchor || config.debugVectors || config.debugOutline,
    });
  });
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'n' || key === 'N') {
    selectNewAsset(true);
  } else if (key === 'r' || key === 'R') {
    selectNewAsset(false);
  }
}

function mouseMoved() {
  if (mouseX >= 0 && mouseX <= WIDTH && mouseY >= 0 && mouseY <= HEIGHT) {
    redraw();
  }
}

function mouseDragged() {
  mouseMoved();
}

function exportPngFromSvg(onDone) {
  const svgElement = getSvgElement();
  const svgNode = svgElement && svgElement.elt ? svgElement.elt : svgElement;
  if (!svgNode || !svgNode.nodeType) {
    if (onDone) {
      onDone();
    }
    return;
  }

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgNode);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = WIDTH * 2;
    exportCanvas.height = HEIGHT * 2;
    const ctx = exportCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height);
    URL.revokeObjectURL(url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `genuary-15b-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (onDone) {
      onDone();
    }
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    if (onDone) {
      onDone();
    }
  };

  img.src = url;
}

function getSvgElement() {
  if (canvasRenderer) {
    if (canvasRenderer.svg) {
      return canvasRenderer.svg;
    }
    if (canvasRenderer.elt && canvasRenderer.elt.svg) {
      return canvasRenderer.elt.svg;
    }
    if (canvasRenderer.elt) {
      return canvasRenderer.elt;
    }
  }
  const holder = document.getElementById('sketch-holder');
  return holder ? holder.querySelector('svg') : null;
}
