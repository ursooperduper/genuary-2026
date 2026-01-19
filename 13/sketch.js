let video;
let faceMesh;
let faces = [];
let lastLogTime = 0;
let loggedFaceShape = false;
let loggedAnnotations = false;
let shapeMode = 'square';
const FACE_SCALE = 1.0;
const BLOCK_SIZE = 10;
// const FACE_SMOOTHING = 0.7;
const FACE_SMOOTHING = 0.15;
const FACE_HOLD_MS = 300;
const FACE_CENTER_ON_CANVAS = true;
let freezeFrame = false;
let frozenPoints = null;
let frozenAnnotations = null;
const FACE_COLORS = {
  background: '#000000',
  face: '#ffffff',
  nose: '#ff1313',
  eyebrows: '#ff1313',
  lips: '#ff1313',
  sclera: '#000000',
  irises: '#ff1313',
  pupils: '#000000'
};
const FEATURE_INDICES = {
  nose: [1, 2, 4, 5, 6, 19, 94, 97, 98, 168, 195, 197],
  leftEyebrow: [46, 52, 53, 55, 63, 65, 66, 70, 105, 107],
  rightEyebrow: [276, 282, 283, 285, 293, 295, 296, 300, 334, 336],
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  rightEye: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
  lips: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78]
};
const faceMeshOptions = { maxFaces: 1, refineLandmarks: true, flipped: false };
let smoothedPoints = null;
let lastFaceTime = 0;

function preload() {
  if (typeof ml5.faceMesh !== 'function') {
    console.error('FaceMesh API not found on ml5. Available keys:', Object.keys(ml5));
    return;
  }

  faceMesh = ml5.faceMesh(faceMeshOptions, () => {
    console.log('✅ FaceMesh model loaded');
  });
}

function setup() {
  createCanvas(540, 675);

  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  if (faceMesh && typeof faceMesh.detectStart === 'function') {
    faceMesh.detectStart(video, gotFaces);
  } else {
    console.error('FaceMesh detectStart not available. FaceMesh keys:', Object.keys(faceMesh || {}));
  }
}

function gotFaces(results) {
  faces = results;
  if (faces && faces.length > 0) {
    lastFaceTime = millis();
  }
}

function draw() {
  background(FACE_COLORS.background);

  const hasFace = faces && faces.length > 0;
  const showFace =
    (freezeFrame && frozenPoints && frozenPoints.length > 0) ||
    hasFace ||
    (millis() - lastFaceTime < FACE_HOLD_MS);

  if (showFace) {
    const f = hasFace ? faces[0] : null;
    const rawPts = f ? (f.keypoints || f.scaledMesh || f.mesh || []) : [];
    if (!freezeFrame) {
      if (!smoothedPoints || smoothedPoints.length !== rawPts.length) {
        smoothedPoints = rawPts.map((p) =>
          Array.isArray(p) ? [p[0], p[1], p[2]] : { x: p.x, y: p.y, z: p.z }
        );
      } else if (hasFace) {
        for (let i = 0; i < rawPts.length; i++) {
          const p = rawPts[i];
          if (Array.isArray(p)) {
            smoothedPoints[i][0] = lerp(smoothedPoints[i][0], p[0], FACE_SMOOTHING);
            smoothedPoints[i][1] = lerp(smoothedPoints[i][1], p[1], FACE_SMOOTHING);
            smoothedPoints[i][2] = lerp(smoothedPoints[i][2], p[2], FACE_SMOOTHING);
          } else {
            smoothedPoints[i].x = lerp(smoothedPoints[i].x, p.x, FACE_SMOOTHING);
            smoothedPoints[i].y = lerp(smoothedPoints[i].y, p.y, FACE_SMOOTHING);
            smoothedPoints[i].z = lerp(smoothedPoints[i].z, p.z, FACE_SMOOTHING);
          }
        }
      }
    }

    const pts = freezeFrame ? frozenPoints : (smoothedPoints || rawPts);
    const blockSize = BLOCK_SIZE;
    const annotations = freezeFrame ? (frozenAnnotations || {}) : (f ? (f.annotations || {}) : {});
    const faceCenter = getCentroid(pts);
    const drawCenter = FACE_CENTER_ON_CANVAS
      ? { x: width / 2, y: height / 2 }
      : faceCenter;

    noStroke();

    // Base face layer
    setFill('face');
    drawSquares(pts, blockSize, faceCenter, drawCenter);

    // Nose layer
    setFill('nose');
    drawSquares(
      getFeaturePoints(annotations, pts, [
        'noseTip',
        'noseBridge',
        'noseLeftCorner',
        'noseRightCorner',
        'noseBottom'
      ], FEATURE_INDICES.nose),
      blockSize,
      faceCenter,
      drawCenter
    );

    // Eyebrows layer
    setFill('eyebrows');
    drawSquares(
      getFeaturePoints(
        annotations,
        pts,
        ['leftEyebrow', 'rightEyebrow'],
        FEATURE_INDICES.leftEyebrow.concat(FEATURE_INDICES.rightEyebrow)
      ),
      blockSize,
      faceCenter,
      drawCenter
    );

    // Mouth/lips layer
    setFill('lips');
    drawSquares(
      getFeaturePoints(annotations, pts, [
        'lipsUpperOuter',
        'lipsLowerOuter',
        'lipsUpperInner',
        'lipsLowerInner'
      ], FEATURE_INDICES.lips),
      blockSize,
      faceCenter,
      drawCenter
    );

    // Eyes (sclera) layer
    setFill('sclera');
    drawSquares(
      getFeaturePoints(
        annotations,
        pts,
        ['leftEye', 'rightEye'],
        FEATURE_INDICES.leftEye.concat(FEATURE_INDICES.rightEye)
      ),
      blockSize,
      faceCenter,
      drawCenter
    );

    // Irises layer
    setFill('irises');
    const leftIris =
      annotations.leftEyeIris || getPointsByIndex(pts, [468, 469, 470, 471]);
    const rightIris =
      annotations.rightEyeIris || getPointsByIndex(pts, [473, 474, 475, 476]);
    drawSquares(leftIris, blockSize, faceCenter, drawCenter);
    drawSquares(rightIris, blockSize, faceCenter, drawCenter);

    // Pupils layer
    setFill('pupils');
    const leftIrisCenter = getCentroid(leftIris);
    const rightIrisCenter = getCentroid(rightIris);
    drawSquares(
      [
        leftIrisCenter ? [leftIrisCenter.x, leftIrisCenter.y] : null,
        rightIrisCenter ? [rightIrisCenter.x, rightIrisCenter.y] : null
      ],
      blockSize,
      faceCenter,
      drawCenter
    );
  }

  if (millis() - lastLogTime > 500) {
    lastLogTime = millis();

    if (faces && faces.length > 0) {
      const f = faces[0];

      if (!loggedFaceShape) {
        console.log(f);
        loggedFaceShape = true;
      }

      console.log('Face object keys:', Object.keys(f));

      const pts = f.keypoints || f.scaledMesh || f.mesh || [];

      console.log('Faces detected:', faces.length);
      console.log('Landmarks detected:', pts.length);

      for (let i = 0; i < Math.min(10, pts.length); i++) {
        const p = pts[i];
        const x = Array.isArray(p) ? p[0] : p.x;
        const y = Array.isArray(p) ? p[1] : p.y;
        const z = Array.isArray(p) ? p[2] : p.z;
        const xf = typeof x === 'number' ? x.toFixed(2) : x;
        const yf = typeof y === 'number' ? y.toFixed(2) : y;
        const zf = typeof z === 'number' ? z.toFixed(2) : z;
        console.log(`pt[${i}] = x:${xf}, y:${yf}, z:${zf}`);
      }

      if (f.annotations) {
        console.log('Annotations keys:', Object.keys(f.annotations));
      }
    } else {
      console.log('No face detected');
    }
  }
}

function getCentroid(points) {
  if (!points || points.length === 0) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = Array.isArray(p) ? p[0] : p.x;
    const y = Array.isArray(p) ? p[1] : p.y;
    if (typeof x !== 'number' || typeof y !== 'number') {
      continue;
    }
    sumX += x;
    sumY += y;
    count += 1;
  }

  if (count === 0) {
    return null;
  }

  return { x: sumX / count, y: sumY / count };
}

function drawSquares(points, size, center, targetCenter) {
  if (!points || points.length === 0) {
    return;
  }

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!p) {
      continue;
    }
    const x = Array.isArray(p) ? p[0] : p.x;
    const y = Array.isArray(p) ? p[1] : p.y;
    if (typeof x === 'number' && typeof y === 'number') {
      const pos = scalePoint(x, y, center, targetCenter);
      drawPointShape(pos.x, pos.y, size);
    }
  }
}

function scalePoint(x, y, center, targetCenter) {
  if (!center || !isFinite(center.x) || !isFinite(center.y)) {
    return { x, y };
  }
  const scaled = {
    x: center.x + (x - center.x) * FACE_SCALE,
    y: center.y + (y - center.y) * FACE_SCALE
  };
  if (!targetCenter || !isFinite(targetCenter.x) || !isFinite(targetCenter.y)) {
    return scaled;
  }
  return {
    x: scaled.x + (targetCenter.x - center.x),
    y: scaled.y + (targetCenter.y - center.y)
  };
}

function drawPointShape(x, y, size) {
  if (shapeMode === 'circle') {
    circle(x, y, size);
    return;
  }

  if (shapeMode === 'triangle') {
    const half = size / 2;
    triangle(x, y - half, x - half, y + half, x + half, y + half);
    return;
  }

  if (shapeMode === 'rect') {
    // const w = size * 1.3;
    const w = size * 12.3;
    // const h = size * 0.8;
    const h = size * 6.8;
    rect(x - w / 2, y - h / 2, w, h);
    return;
  }

  square(x - size / 2, y - size / 2, size);
}

function setFill(layer) {
  const color = FACE_COLORS[layer];
  if (!color) {
    return;
  }
  fill(color);
}

function getAnnotationPoints(annotations, keys) {
  if (!annotations || !keys || keys.length === 0) {
    return null;
  }

  const result = [];
  for (let i = 0; i < keys.length; i++) {
    const pts = annotations[keys[i]];
    if (!pts || pts.length === 0) {
      continue;
    }
    for (let j = 0; j < pts.length; j++) {
      result.push(pts[j]);
    }
  }

  return result.length ? result : null;
}

function getFeaturePoints(annotations, points, keys, fallbackIndices) {
  const annotationPts = getAnnotationPoints(annotations, keys);
  if (annotationPts && annotationPts.length) {
    return annotationPts;
  }
  return getPointsByIndex(points, fallbackIndices);
}

function getPointsByIndex(points, indices) {
  if (!points || points.length === 0) {
    return null;
  }

  const result = [];
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i];
    const p = points[idx];
    if (!p) {
      continue;
    }
    result.push(p);
  }

  return result.length ? result : null;
}

function clonePoints(points) {
  if (!points || points.length === 0) {
    return null;
  }

  return points.map((p) =>
    Array.isArray(p) ? [p[0], p[1], p[2]] : { x: p.x, y: p.y, z: p.z }
  );
}

function keyPressed() {
  if (key === ' ') {
    if (freezeFrame) {
      freezeFrame = false;
      frozenPoints = null;
      frozenAnnotations = null;
      return;
    }

    if (!faces || faces.length === 0) {
      console.log('No face to freeze');
      return;
    }

    const f = faces[0];
    const rawPts = f ? (f.keypoints || f.scaledMesh || f.mesh || []) : [];
    frozenPoints = clonePoints(smoothedPoints || rawPts);
    frozenAnnotations = f.annotations || {};
    if (frozenPoints && frozenPoints.length > 0) {
      freezeFrame = true;
    } else {
      console.log('No landmarks to freeze');
    }
    return;
  }

  if (key === 'c' || key === 'C') {
    shapeMode = 'circle';
    return;
  }

  if (key === 't' || key === 'T') {
    shapeMode = 'triangle';
    return;
  }

  if (key === 'r' || key === 'R') {
    shapeMode = 'rect';
    return;
  }

  if (key === 's' || key === 'S') {
    shapeMode = 'square';
    return;
  }

  if (key === 'a' || key === 'A') {
    if (!faces || faces.length === 0) {
      console.log('No face detected');
      return;
    }

    const f = faces[0];
    if (f.annotations) {
      if (!loggedAnnotations) {
        console.log('Annotations keys:', Object.keys(f.annotations));
        loggedAnnotations = true;
      } else {
        console.log('Annotations already logged');
      }
    } else {
      console.log('No annotations available on face object');
    }
  }
}
