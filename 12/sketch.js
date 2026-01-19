const WIDTH = 540;
const HEIGHT = 675;
const PLEDGE_POS = { x: 94.52, y: 69.66 };
const REDACT_POS = { x: 91, y: 61 };
const DEBUG_BOXES = false;
const PRESSURE_RADIUS = 120;
// const PRESSURE_RADIUS = 220;
// const MAX_SHIFT_PX = 4;
const MAX_SHIFT_PX = 30;
// const MAX_SHEAR = 0.06;
const MAX_SHEAR = 0.18;
const MOVE_LERP = 0.06;
const SNAP_LERP = 0.85;
const HIDE_BOX_ENABLED = true;
const HIDE_BOX_NUMBER = 25;
const PNG_SCALE = 2;

let pledgeImg;
let pledgeSvg;
let redactImg;
let redactSvg;
let redactBoxes = [];

function preload() {
  pledgeImg = loadImage('assets/txt-pledge.svg');
  if (typeof loadSVG === 'function') {
    pledgeSvg = loadSVG('assets/txt-pledge.svg');
  }
  redactImg = loadImage('assets/txt-redact.svg');
  if (typeof loadSVG === 'function') {
    redactSvg = loadSVG('assets/txt-redact.svg');
  }
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent('sketch-holder');
  loop();

  if (redactSvg && typeof redactSvg.query === 'function') {
    redactBoxes = collectRedactBoxes(redactSvg);
  }
}

function draw() {
  if (redactBoxes.length > 0) {
    updateRedactionBoxes();
  }
  renderScene(getDrawContext(), { drawDebug: true, useInlineSvg: false });
}

function collectRedactBoxes(svgElement) {
  const rects = svgElement.query('rect');
  return rects.map((rect, index) => {
    const x = readNumberAttr(rect, 'x', 0);
    const y = readNumberAttr(rect, 'y', 0);
    const width = readNumberAttr(rect, 'width', 0);
    const height = readNumberAttr(rect, 'height', 0);
    const restX = REDACT_POS.x + x;
    const restY = REDACT_POS.y + y;
    return {
      element: rect,
      index,
      x,
      y,
      width,
      height,
      restX,
      restY,
      restShear: 0,
      currentX: restX,
      currentY: restY,
      currentShear: 0,
    };
  });
}

function updateRedactionBoxes() {
  const activeBox = findActiveBox();
  if (!activeBox) {
    redactBoxes.forEach((box) => {
      box.currentX = lerp(box.currentX, box.restX, SNAP_LERP);
      box.currentY = lerp(box.currentY, box.restY, SNAP_LERP);
      box.currentShear = lerp(box.currentShear, box.restShear, SNAP_LERP);
    });
    return;
  }

  const centerX = activeBox.restX + activeBox.width / 2;
  const centerY = activeBox.restY + activeBox.height / 2;
  const dx = centerX - mouseX;
  const dy = centerY - mouseY;
  const distance = Math.hypot(dx, dy);
  const pressure = clamp(1 - distance / PRESSURE_RADIUS, 0, 1);

  if (pressure > 0) {
    const inv = distance === 0 ? 0 : 1 / distance;
    const dirX = dx * inv;
    const dirY = dy * inv;
    const shift = pressure * MAX_SHIFT_PX;
    const targetX = activeBox.restX + dirX * shift;
    const targetY = activeBox.restY + dirY * shift;
    const targetShear = pressure * MAX_SHEAR * (dirX >= 0 ? 1 : -1);

    activeBox.currentX = lerp(activeBox.currentX, targetX, MOVE_LERP);
    activeBox.currentY = lerp(activeBox.currentY, targetY, MOVE_LERP);
    activeBox.currentShear = lerp(activeBox.currentShear, targetShear, MOVE_LERP);
  } else {
    activeBox.currentX = lerp(activeBox.currentX, activeBox.restX, SNAP_LERP);
    activeBox.currentY = lerp(activeBox.currentY, activeBox.restY, SNAP_LERP);
    activeBox.currentShear = lerp(activeBox.currentShear, activeBox.restShear, SNAP_LERP);
  }

  redactBoxes.forEach((box) => {
    if (box === activeBox) {
      return;
    }
    box.currentX = box.restX;
    box.currentY = box.restY;
    box.currentShear = box.restShear;
  });
}

function renderScene(ctx, { drawDebug, useInlineSvg, scale = 1 }) {
  const isSvgRenderer = ctx && ctx._renderer && ctx._renderer.isSVG;
  const useTransformScale = !(isSvgRenderer && useInlineSvg);

  ctx.background('#FFFFFF');
  if (useTransformScale) {
    ctx.push();
    ctx.scale(scale);
  }

  if (useInlineSvg && pledgeSvg && isInlineSvg(pledgeSvg)) {
    drawInlineSvg(ctx, pledgeSvg, PLEDGE_POS.x, PLEDGE_POS.y, scale, isSvgRenderer);
  } else if (pledgeImg) {
    const drawX = useTransformScale ? PLEDGE_POS.x : PLEDGE_POS.x * scale;
    const drawY = useTransformScale ? PLEDGE_POS.y : PLEDGE_POS.y * scale;
    ctx.image(pledgeImg, drawX, drawY);
  }

  if (redactBoxes.length > 0) {
    drawRedactionBoxes(ctx, useTransformScale ? 1 : scale);
    if (DEBUG_BOXES && drawDebug) {
      drawDebugBoxes(ctx, useTransformScale ? 1 : scale);
    }
  }

  if (useTransformScale) {
    ctx.pop();
  }
}

function getDrawContext(pg) {
  if (pg) {
    return pg;
  }
  return {
    background,
    image,
    scale,
    noStroke,
    fill,
    rectMode,
    push,
    pop,
    translate,
    shearX,
    rect,
    stroke,
    strokeWeight,
  };
}

function drawInlineSvg(ctx, svgElement, x, y, scale = 1, flatten = false) {
  const size = getSvgSize(svgElement);
  if (!size) {
    if (pledgeImg) {
      ctx.image(pledgeImg, x * scale, y * scale);
    }
    return;
  }
  if (flatten && ctx && ctx._renderer && ctx._renderer.isSVG && svgElement.elt) {
    const create = typeof p5 !== 'undefined' && p5.SVGElement ? p5.SVGElement.create : null;
    if (create) {
      const group = create('g');
      group.elt.setAttribute(
        'transform',
        `translate(${x * scale} ${y * scale}) scale(${scale})`
      );
      const clone = svgElement.elt.cloneNode(true);
      while (clone.childNodes.length > 0) {
        group.elt.appendChild(clone.childNodes[0]);
      }
      ctx._renderer.appendChild(group.elt);
      return;
    }
  }
  ctx.image(
    svgElement,
    0,
    0,
    size.width,
    size.height,
    x * scale,
    y * scale,
    size.width * scale,
    size.height * scale
  );
}

function getSvgSize(svgElement) {
  if (!svgElement || !svgElement.elt) {
    return null;
  }
  const width = readNumberAttr(svgElement, 'width', NaN);
  const height = readNumberAttr(svgElement, 'height', NaN);
  if (!Number.isNaN(width) && !Number.isNaN(height) && width > 0 && height > 0) {
    return { width, height };
  }
  const viewBox = svgElement.elt.getAttribute('viewBox');
  if (!viewBox) {
    return null;
  }
  const parts = viewBox.split(/[\s,]+/).map((part) => parseFloat(part));
  if (parts.length === 4 && parts.every((part) => !Number.isNaN(part))) {
    if (parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  return null;
}

function drawRedactionBoxes(ctx, scale = 1) {
  ctx.noStroke();
  ctx.fill(0);
  ctx.rectMode(CORNER);
  redactBoxes.forEach((box) => {
    if (isHiddenBox(box)) {
      return;
    }
    ctx.push();
    ctx.translate(box.currentX * scale, box.currentY * scale);
    ctx.shearX(box.currentShear);
    ctx.rect(0, 0, box.width * scale, box.height * scale);
    ctx.pop();
  });
}

function findActiveBox() {
  for (let i = 0; i < redactBoxes.length; i += 1) {
    const box = redactBoxes[i];
    if (isHiddenBox(box)) {
      continue;
    }
    if (
      mouseX >= box.restX &&
      mouseX <= box.restX + box.width &&
      mouseY >= box.restY &&
      mouseY <= box.restY + box.height
    ) {
      return box;
    }
  }
  let nearest = null;
  let nearestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < redactBoxes.length; i += 1) {
    const box = redactBoxes[i];
    if (isHiddenBox(box)) {
      continue;
    }
    const centerX = box.restX + box.width / 2;
    const centerY = box.restY + box.height / 2;
    const dist = Math.hypot(centerX - mouseX, centerY - mouseY);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = box;
    }
  }
  return nearest;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isInlineSvg(svgElement) {
  return (
    svgElement &&
    svgElement.elt &&
    svgElement.elt.nodeName &&
    svgElement.elt.nodeName.toLowerCase() === 'svg'
  );
}

function drawDebugBoxes(ctx, scale = 1) {
  const hovered = findActiveBox();
  ctx.noFill();
  ctx.stroke('#ff0000');
  ctx.strokeWeight(2);
  redactBoxes.forEach((box) => {
    if (isHiddenBox(box)) {
      return;
    }
    ctx.rect(
      box.restX * scale,
      box.restY * scale,
      box.width * scale,
      box.height * scale
    );
  });
  if (hovered) {
    ctx.stroke(0, 200, 0);
    ctx.strokeWeight(0.5);
    ctx.rect(
      hovered.restX * scale,
      hovered.restY * scale,
      hovered.width * scale,
      hovered.height * scale
    );
  }
}

function isHiddenBox(box) {
  return HIDE_BOX_ENABLED && box.index + 1 === HIDE_BOX_NUMBER;
}

function readNumberAttr(svgElement, name, fallback) {
  if (!svgElement.elt) {
    return fallback;
  }
  const raw = svgElement.elt.getAttribute(name);
  const value = raw === null ? NaN : parseFloat(raw);
  return Number.isNaN(value) ? fallback : value;
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (typeof SVG === 'undefined') {
    save(`genuary-${timestamp}.svg`);
    return;
  }
  const pg = createGraphics(WIDTH, HEIGHT, SVG);
  renderScene(getDrawContext(pg), { drawDebug: false, useInlineSvg: true, scale: 1 });
  save(pg, `genuary-${timestamp}.svg`);
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (typeof SVG === 'undefined') {
    const pg = createGraphics(WIDTH * PNG_SCALE, HEIGHT * PNG_SCALE);
    pg.pixelDensity(1);
    pg.scale(PNG_SCALE);
    renderScene(getDrawContext(pg), { drawDebug: false, useInlineSvg: false, scale: 1 });
    saveCanvas(pg, `genuary-23-${timestamp}`, 'png');
    setTimeout(() => {
      pg.remove();
    }, 0);
    return;
  }
  const pg = createGraphics(WIDTH * PNG_SCALE, HEIGHT * PNG_SCALE, SVG);
  renderScene(getDrawContext(pg), { drawDebug: false, useInlineSvg: true, scale: PNG_SCALE });
  save(pg, `genuary-23-${timestamp}.png`);
  setTimeout(() => {
    pg.remove();
  }, 0);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  }
}
