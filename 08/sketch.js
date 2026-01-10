// Genuary 2026 — Day 8: "Impossible Isometric City"
// Graphic-forward, deterministic iso metropolis with a single rule violation.

const CONFIG = {
  width: 540,
  height: 675,
  tileW: 36,
  tileH: 18,
  zUnit: 12,
  grid: { w: 12, h: 14 },
  // grid: { w: 10, h: 10 },
  originYFactor: 0.53, // shift city down for better vertical centering
  density: {
    // base: 0.08,
    base: 0.06,
    radialWeight: 0.75,
    radialFalloff: 5.5,
    // noiseWeight: 0.35,
    noiseWeight: 0.15,
    noiseScale: 0.22,
    placementStrength: 0.9,
    // placementStrength: 3.9,
    // placementStrength: 12.3,
    heightMin: 1,
    heightMax: 12,
  },
  palette: {
    background: '#040404',
    shadows: '#1c1a1a',
    buildings: ['#d7d0c8', '#b4b0aa', '#8f8c88', '#b7ff1b', '#2e7da3'],
    outline: '#ffffff',
    curve: '#04549a',
    bridge: 'rgb(216, 248, 255)',
  },
  prob: {
    misalign: 0.12,
    fuse: 0.28,
    float: 0.5,
  },
  scaleTiers: [
    { name: 'TINY', scale: 0.6 },
    { name: 'NORMAL', scale: 1.0 },
    { name: 'HUGE', scale: 1.6 },
  ],
  shadow: {
    offsetX: 22,
    offsetY: 28,
    altOffsetX: -18,
    altOffsetY: 20,
    alpha: 220,
  },
  violations: {
    enabled: true,
    options: [
      { type: 'curve', weight: 1 },
      { type: 'rotation-crime', weight: 1 },
      { type: 'shadow-betrayal', weight: 1 },
      { type: 'scale-out-of-bounds', weight: 1 },
      { type: 'impossible-bridge', weight: 1 },
    ],
    oddScale: 1.25,
  },
  texture: {
    enabled: true,
    count: 380,
    alpha: 16,
  },
  stripes: {
    enabled: true,
    prob: 0.22,
    side: 'right',
    color: '#000000',
    thickness: 6,
    gap: 4,
  },
};

let city = null;
let currentSeed = Math.floor(Math.random() * 1_000_000_000);
let downtownSpin = 0;
let mainCanvas = null;
let isSvgRenderer = false;

function setup() {
  const renderer = typeof SVG === 'undefined' ? undefined : SVG;
  const canvas = createCanvas(CONFIG.width, CONFIG.height, renderer);
  canvas.parent('sketch-holder');
  mainCanvas = canvas;
  isSvgRenderer = renderer === SVG;
  pixelDensity(2);
  noLoop();
  regenerate(currentSeed, downtownSpin);
  
  // Expose regenerate to global scope for button access
  window.rerollCity = () => regenerate(Math.floor(Math.random() * 1_000_000_000), 0);
}

function regenerate(seed = currentSeed, jitter = downtownSpin) {
  currentSeed = seed;
  downtownSpin = jitter;
  randomSeed(seed);
  noiseSeed(seed + 999);
  city = buildCity();
  redraw();
}

function buildCity() {
  const origin = {
    x: CONFIG.width * 0.5 + 20, // nudge city right for better centering
    y: CONFIG.height * CONFIG.originYFactor,
  };

  const downtown = pickDowntown();
  const occupancy = Array.from({ length: CONFIG.grid.h }, () =>
    Array.from({ length: CONFIG.grid.w }, () => false)
  );

  const buildings = [];
  for (let y = 0; y < CONFIG.grid.h; y++) {
    for (let x = 0; x < CONFIG.grid.w; x++) {
      if (occupancy[y][x]) continue;
      const density = densityAt(x, y, downtown);
      if (random() > density * CONFIG.density.placementStrength) continue;

      const footprint = pickFootprint(x, y, occupancy, density);
      if (!footprint) continue;

      const scaleTier = pickScaleTier(density);
      const h = pickHeight(density, scaleTier.scale);
      const colorGroup = pickColorGroup(density);
      const styleVariant = floor(random(3));

      const building = {
        id: buildings.length,
        x,
        y,
        w: footprint.w,
        d: footprint.d,
        h,
        scale: scaleTier.scale,
        scaleTier: scaleTier.name,
        colorGroup,
        styleVariant,
        offsetWorld: { x: 0, y: 0 },
        offsetScreen: { x: 0, y: 0 },
        floatZ: 0,
        groupId: null,
        rotated: false,
        shadowBetrayal: false,
        violationTag: null,
        hasStripes:
          CONFIG.stripes.enabled && random() < CONFIG.stripes.prob,
      };

      occupy(x, y, footprint.w, footprint.d, occupancy);
      buildings.push(building);
    }
  }

  applyMisalign(buildings);
  applyFloating(buildings);
  const fusionGroups = fuseBuildings(buildings);
  const violation = pickViolation(buildings, fusionGroups, downtown);

  return { origin, downtown, buildings, fusionGroups, violation };
}

function draw() {
  if (!city) return;
  randomSeed(currentSeed);
  noiseSeed(currentSeed + 999);
  background(CONFIG.palette.background);

  renderCity(city);
  if (CONFIG.texture.enabled) addTexture();
}

function renderCity(data) {
  const sorted = [...data.buildings].sort((a, b) => {
    const da = a.x + a.y;
    const db = b.x + b.y;
    if (da !== db) return da - db;
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.id - b.id;
  });

  sorted.forEach((b) => drawShadow(b, data.origin));
  sorted.forEach((b) => drawBuilding(b, data.origin));

  if (data.fusionGroups.length > 0) {
    data.fusionGroups.forEach((g) => drawFusionRoof(g, data.origin));
  }

  drawViolationArtifacts(data, data.origin);
}

function densityAt(x, y, downtown) {
  const dx = x - downtown.x;
  const dy = y - downtown.y;
  const radial = exp(-sqrt(dx * dx + dy * dy) / CONFIG.density.radialFalloff);
  const n = noise(
    x * CONFIG.density.noiseScale,
    y * CONFIG.density.noiseScale,
    downtownSpin * 0.07
  );
  const val =
    CONFIG.density.base +
    CONFIG.density.radialWeight * radial +
    CONFIG.density.noiseWeight * n;
  return constrain(val, 0, 1);
}

function pickDowntown() {
  const spread = 0.24;
  const baseX = noise(currentSeed * 0.013 + downtownSpin) * (1 - 2 * spread) + spread;
  const baseY = noise(currentSeed * 0.023 + downtownSpin * 3.1) * (1 - 2 * spread) + spread;
  return {
    x: baseX * CONFIG.grid.w,
    y: baseY * CONFIG.grid.h,
  };
}

function pickFootprint(x, y, occupancy, density) {
  const options = [
    { w: 1, d: 1, weight: 0.48 },
    { w: 1, d: 2, weight: 0.16 + density * 0.2 },
    { w: 2, d: 1, weight: 0.16 + density * 0.2 },
    { w: 2, d: 2, weight: 0.12 + density * 0.22 },
  ];

  const choice = weightedPick(options);
  if (canPlace(x, y, choice.w, choice.d, occupancy)) return choice;
  if (canPlace(x, y, 1, 1, occupancy)) return { w: 1, d: 1 };
  return null;
}

function pickScaleTier(density) {
  const r = random();
  if (density > 0.6 && r < 0.45) return CONFIG.scaleTiers[2];
  if (density < 0.3 && r < 0.4) return CONFIG.scaleTiers[0];
  if (r < 0.15) return CONFIG.scaleTiers[0];
  if (r > 0.85) return CONFIG.scaleTiers[2];
  return CONFIG.scaleTiers[1];
}

function pickHeight(density, scale) {
  const bias = pow(random(), 0.6);
  const target = constrain(density * 0.75 + bias * 0.4, 0, 1);
  const h = floor(
    lerp(CONFIG.density.heightMin, CONFIG.density.heightMax, target) * scale
  );
  return max(CONFIG.density.heightMin, h);
}

function pickColorGroup(density) {
  if (density > 0.65 && random() < 0.45) return 4; // blue accent
  if (density > 0.55 && random() < 0.35) return 3; // red accent
  return floor(random(3));
}

function applyMisalign(buildings) {
  buildings.forEach((b) => {
    if (random() > CONFIG.prob.misalign) return;
    if (random() < 0.5) {
      b.offsetScreen.x += random([-6, -4, -2, 2, 4, 6]);
      b.offsetScreen.y += random([-6, -4, -2, 2, 4, 6]);
    } else {
      b.offsetWorld.x += random([-0.18, -0.12, 0.12, 0.18]);
      b.offsetWorld.y += random([-0.18, -0.12, 0.12, 0.18]);
    }
  });
}

function applyFloating(buildings) {
  buildings.forEach((b) => {
    if (random() > CONFIG.prob.float) return;
    b.floatZ = floor(random(1, 4));
  });
}

function fuseBuildings(buildings) {
  const lookup = new Map();
  buildings.forEach((b) => {
    for (let dx = 0; dx < b.w; dx++) {
      for (let dy = 0; dy < b.d; dy++) {
        lookup.set(`${b.x + dx},${b.y + dy}`, b);
      }
    }
  });
  const groups = [];
  let nextGroupId = 0;

  buildings.forEach((b) => {
    if (b.groupId !== null) return;
    if (random() > CONFIG.prob.fuse) return;
    const candidates = [
      lookup.get(`${b.x + b.w},${b.y}`),
      lookup.get(`${b.x},${b.y + b.d}`),
    ].filter(Boolean);
    if (candidates.length === 0) return;
    const partner = random(candidates);
    if (partner.groupId !== null) return;

    const gid = nextGroupId++;
    b.groupId = gid;
    partner.groupId = gid;
    groups.push({ id: gid, members: [b, partner] });
  });

  return groups;
}

function pickViolation(buildings, fusionGroups, downtown) {
  if (!CONFIG.violations.enabled || buildings.length === 0) return null;
  const type = weightedPick(CONFIG.violations.options).type;
  const target = random(buildings);
  let payload = null;

  switch (type) {
    case 'curve': {
      payload = {
        type,
        center: {
          x: target.x + target.w * 0.5,
          y: target.y + target.d * 0.5,
          z: topHeight(target) + CONFIG.zUnit * 0.4,
        },
        r: random(0.35, 0.6) * target.w,
      };
      break;
    }
    case 'rotation-crime': {
      target.rotated = true;
      target.violationTag = type;
      payload = { type, buildingId: target.id };
      break;
    }
    case 'shadow-betrayal': {
      target.shadowBetrayal = true;
      target.violationTag = type;
      payload = { type, buildingId: target.id };
      break;
    }
    case 'scale-out-of-bounds': {
      target.scale = CONFIG.violations.oddScale;
      target.violationTag = type;
      payload = { type, buildingId: target.id };
      break;
    }
    case 'impossible-bridge': {
      const partner = pickBridgePartner(buildings, target);
      if (partner) {
        payload = {
          type,
          a: target.id,
          b: partner.id,
          z: min(topHeight(target), topHeight(partner)) - CONFIG.zUnit * 0.2,
        };
      }
      break;
    }
    default:
      break;
  }

  if (payload) {
    console.log('Violation:', payload.type, 'Building:', target.id);
  }
  return payload;
}

function pickBridgePartner(buildings, source) {
  const pool = buildings.filter((b) => b.id !== source.id);
  if (pool.length === 0) return null;
  pool.sort((a, b) => Math.abs(topHeight(a) - topHeight(source)) - Math.abs(topHeight(b) - topHeight(source)));
  return pool[0];
}

function drawShadow(building, origin) {
  const base = footprintPoints(building, origin, 0);
  const offsetX = building.shadowBetrayal
    ? CONFIG.shadow.altOffsetX
    : CONFIG.shadow.offsetX;
  const offsetY = building.shadowBetrayal
    ? CONFIG.shadow.altOffsetY
    : CONFIG.shadow.offsetY;
  const shadowPoly = base.map((p) => ({ x: p.x + offsetX, y: p.y + offsetY }));

  noStroke();
  const c = color(CONFIG.palette.shadows);
  c.setAlpha(CONFIG.shadow.alpha);
  fill(c);
  beginShape();
  shadowPoly.forEach((p) => vertex(p.x, p.y));
  endShape(CLOSE);
}

function drawBuilding(building, origin) {
  const baseZ = building.floatZ * CONFIG.zUnit;
  const topZ = baseZ + building.h * CONFIG.zUnit * building.scale;
  const w = building.rotated ? building.d * building.scale : building.w * building.scale;
  const d = building.rotated ? building.w * building.scale : building.d * building.scale;

  const p0 = iso(building.x + building.offsetWorld.x, building.y + building.offsetWorld.y, baseZ, origin, building.offsetScreen);
  const p1 = iso(building.x + w + building.offsetWorld.x, building.y + building.offsetWorld.y, baseZ, origin, building.offsetScreen);
  const p2 = iso(building.x + w + building.offsetWorld.x, building.y + d + building.offsetWorld.y, baseZ, origin, building.offsetScreen);
  const p3 = iso(building.x + building.offsetWorld.x, building.y + d + building.offsetWorld.y, baseZ, origin, building.offsetScreen);

  const t0 = iso(building.x + building.offsetWorld.x, building.y + building.offsetWorld.y, topZ, origin, building.offsetScreen);
  const t1 = iso(building.x + w + building.offsetWorld.x, building.y + building.offsetWorld.y, topZ, origin, building.offsetScreen);
  const t2 = iso(building.x + w + building.offsetWorld.x, building.y + d + building.offsetWorld.y, topZ, origin, building.offsetScreen);
  const t3 = iso(building.x + building.offsetWorld.x, building.y + d + building.offsetWorld.y, topZ, origin, building.offsetScreen);

  const baseColor = color(CONFIG.palette.buildings[building.colorGroup]);
  const leftColor = lerpColor(baseColor, color(0), 0.12);
  const rightColor = lerpColor(baseColor, color(0), 0.22);
  const topColor = lerpColor(baseColor, color('#ffffff'), 0.06);

  noStroke();
  fill(leftColor);
  quad(p0.x, p0.y, p3.x, p3.y, t3.x, t3.y, t0.x, t0.y);

  fill(rightColor);
  quad(p1.x, p1.y, p2.x, p2.y, t2.x, t2.y, t1.x, t1.y);
  if (building.hasStripes && CONFIG.stripes.side === 'right') {
    drawStripedFace([p1, p2, t2, t1]);
  }

  fill(topColor);
  quad(t0.x, t0.y, t1.x, t1.y, t2.x, t2.y, t3.x, t3.y);

  stroke(CONFIG.palette.outline);
  strokeWeight(0.8);
  noFill();
  beginShape();
  [t0, t1, t2, t3].forEach((p) => vertex(p.x, p.y));
  endShape(CLOSE);
}

function drawStripedFace(points) {
  // points ordered as quad
  push();
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.clip();

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - 8;
  const maxX = Math.max(...xs) + 8;
  const minY = Math.min(...ys) - 8;
  const maxY = Math.max(...ys) + 8;

  stroke(CONFIG.stripes.color);
  strokeWeight(CONFIG.stripes.thickness);
  const step = CONFIG.stripes.thickness + CONFIG.stripes.gap;
  for (let y = minY; y <= maxY; y += step) {
    line(minX, y, maxX, y);
  }

  ctx.restore();
  pop();
}

function drawFusionRoof(group, origin) {
  const members = group.members;
  if (members.length < 2) return;
  const xs = [];
  const ys = [];
  members.forEach((b) => {
    const w = b.rotated ? b.d * b.scale : b.w * b.scale;
    const d = b.rotated ? b.w * b.scale : b.d * b.scale;
    xs.push(b.x + b.offsetWorld.x, b.x + w + b.offsetWorld.x);
    ys.push(b.y + b.offsetWorld.y, b.y + d + b.offsetWorld.y);
  });

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const maxHeight = Math.max(...members.map(topHeight));

  const z = maxHeight + CONFIG.zUnit * 0.2;
  const p0 = iso(minX, minY, z, origin, { x: 0, y: 0 });
  const p1 = iso(maxX, minY, z, origin, { x: 0, y: 0 });
  const p2 = iso(maxX, maxY, z, origin, { x: 0, y: 0 });
  const p3 = iso(minX, maxY, z, origin, { x: 0, y: 0 });

  noStroke();
  const baseColor = color(CONFIG.palette.buildings[members[0].colorGroup]);
  const capColor = lerpColor(baseColor, color('#ffffff'), 0.12);
  fill(capColor);
  quad(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
}

function drawViolationArtifacts(data, origin) {
  const v = data.violation;
  if (!v) return;

  if (v.type === 'curve') {
    const center = iso(v.center.x, v.center.y, v.center.z, origin, { x: 0, y: 0 });
    noStroke();
    const c = color(CONFIG.palette.curve);
    c.setAlpha(230);
    fill(c);
    ellipse(center.x, center.y, v.r * CONFIG.tileW, v.r * CONFIG.tileH * 0.7);
  }

  if (v.type === 'impossible-bridge') {
    const a = data.buildings.find((b) => b.id === v.a);
    const b = data.buildings.find((b) => b.id === v.b);
    if (!a || !b) return;

    const z = v.z;
    const ax = a.x + (a.w * a.scale) / 2 + a.offsetWorld.x;
    const ay = a.y + (a.d * a.scale) / 2 + a.offsetWorld.y;
    const bx = b.x + (b.w * b.scale) / 2 + b.offsetWorld.x;
    const by = b.y + (b.d * b.scale) / 2 + b.offsetWorld.y;

    const p0 = iso(ax - 0.2, ay, z, origin, { x: 0, y: 0 });
    const p1 = iso(bx + 0.2, by, z, origin, { x: 0, y: 0 });
    const p2 = iso(bx + 0.2, by, z + CONFIG.zUnit * 0.15, origin, { x: 0, y: 0 });
    const p3 = iso(ax - 0.2, ay, z + CONFIG.zUnit * 0.15, origin, { x: 0, y: 0 });

    noStroke();
    const c = color(CONFIG.palette.bridge);
    c.setAlpha(235);
    fill(c);
    quad(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  }
}

function addTexture() {
  const grainColor = color(CONFIG.palette.outline);
  grainColor.setAlpha(CONFIG.texture.alpha);
  stroke(grainColor);
  strokeWeight(1);
  randomSeed(currentSeed + 55555);
  for (let i = 0; i < CONFIG.texture.count; i++) {
    const x = random(width);
    const y = random(height);
    point(x, y);
  }
}

function iso(x, y, z, origin, screenOffset) {
  const sx = origin.x + (x - y) * (CONFIG.tileW / 2);
  const sy = origin.y + (x + y) * (CONFIG.tileH / 2) - z;
  return {
    x: sx + (screenOffset?.x || 0),
    y: sy + (screenOffset?.y || 0),
  };
}

function footprintPoints(building, origin, z) {
  const w = building.rotated ? building.d * building.scale : building.w * building.scale;
  const d = building.rotated ? building.w * building.scale : building.d * building.scale;
  const p0 = iso(building.x + building.offsetWorld.x, building.y + building.offsetWorld.y, z, origin, building.offsetScreen);
  const p1 = iso(building.x + w + building.offsetWorld.x, building.y + building.offsetWorld.y, z, origin, building.offsetScreen);
  const p2 = iso(building.x + w + building.offsetWorld.x, building.y + d + building.offsetWorld.y, z, origin, building.offsetScreen);
  const p3 = iso(building.x + building.offsetWorld.x, building.y + d + building.offsetWorld.y, z, origin, building.offsetScreen);
  return [p0, p1, p2, p3];
}

function occupy(x, y, w, d, occupancy) {
  for (let j = y; j < y + d; j++) {
    for (let i = x; i < x + w; i++) {
      if (occupancy[j]) occupancy[j][i] = true;
    }
  }
}

function canPlace(x, y, w, d, occupancy) {
  if (x + w > CONFIG.grid.w || y + d > CONFIG.grid.h) return false;
  for (let j = y; j < y + d; j++) {
    for (let i = x; i < x + w; i++) {
      if (occupancy[j][i]) return false;
    }
  }
  return true;
}

function weightedPick(list) {
  const total = list.reduce((acc, item) => acc + item.weight, 0);
  let r = random(total);
  for (const item of list) {
    if ((r -= item.weight) <= 0) return item;
  }
  return list[list.length - 1];
}

function topHeight(b) {
  return (b.floatZ * CONFIG.zUnit) + b.h * CONFIG.zUnit * b.scale;
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  save(`genuary-08-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `genuary-08-${timestamp}`;
  if (!isSvgRenderer) {
    saveCanvas(mainCanvas, base, 'png');
    return;
  }

  let svgNode = null;
  if (mainCanvas && mainCanvas.elt && mainCanvas.elt instanceof Node) {
    svgNode = mainCanvas.elt;
  } else {
    // Fallback: look for the svg created by p5.svg inside the holder
    svgNode = document.querySelector('#sketch-holder svg') || document.querySelector('svg');
  }

  if (!(svgNode instanceof Node)) {
    console.warn('PNG export failed: no SVG node found');
    return;
  }

  // Clone the SVG as a string and upscale to 2x dimensions for export.
  const serializer = new XMLSerializer();
  const rawSvg = serializer.serializeToString(svgNode);
  const parsed = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
  const root = parsed.documentElement;
  const targetW = CONFIG.width * 2;
  const targetH = CONFIG.height * 2;
  root.setAttribute('width', `${targetW}`);
  root.setAttribute('height', `${targetH}`);
  if (!root.getAttribute('viewBox')) {
    root.setAttribute('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`);
  }
  const svgData = serializer.serializeToString(root);

  const img = new Image();
  const buffer = document.createElement('canvas');
  buffer.width = targetW;
  buffer.height = targetH;
  const ctx = buffer.getContext('2d');

  img.onload = () => {
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const link = document.createElement('a');
    link.download = `${base}.png`;
    link.href = buffer.toDataURL('image/png');
    link.click();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveAsSvg();
  } else if (key === 'p' || key === 'P') {
    saveAsPng();
  } else if (key === 'r' || key === 'R') {
    regenerate(Math.floor(Math.random() * 1_000_000_000), 0);
  } else if (key === ' ') {
    regenerate(currentSeed, downtownSpin + 1);
  }
}
