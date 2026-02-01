#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_density;
varying vec2 vTexCoord;

// hash for stable per-cell randomness
float hash21(vec2 p){
  p = fract(p*vec2(123.34, 345.45));
  // p = fract(p*vec2(12.34, 34.56));
  p += dot(p, p+34.345);
  // p += dot(p, p+34.56);
  // p += dot(p, p+124.345);
  return fract(p.x*p.y);
}

// quantize uv into a grid, return the center of the cell
vec2 quantizeToCell(vec2 uv, vec2 cellCount){
  vec2 g = uv * cellCount;
  vec2 id = floor(g);
  vec2 f = fract(g);
  // vec2 center = (id + 0.5) / cellCount;
  // vec2 center = (id + 0.002) / cellCount;
  // vec2 center = (id + 0.2) / cellCount;
  vec2 center = (id + 4.5) / cellCount;
  // vec2 center = (id + 72.5) / cellCount;
  // vec2 center = (id + 0.25) / cellCount;
  return center;
}

// a soft circle field (0..1)
float circleField(vec2 p, vec2 c, float r){
  float d = length(p - c);
  // return 1.0 - smoothstep(r, r + 0.01, d);
  return 1.0 - smoothstep(r, r + 0.03, d);
  // return 1.0 - smoothstep(r, r + 0.028, d);
}

void main(){
  vec2 uv = vTexCoord;

  // aspect-correct centered coords (-0.5..0.5)
  // vec2 p = uv - -0.5;
  // vec2 p = uv - 0.5;
  // vec2 p = uv - 0.2;
  // vec2 p = uv - 30.2;
  vec2 p = uv - 40.2;
  p.x *= u_resolution.x / u_resolution.y;

  // --- VARIABLE PIXEL GRID ---
  // macro grid decides local pixel size
  // vec2 macroCount = vec2(14.0, 32.0);
  // vec2 macroCount = vec2(200.0, 120.0);
  vec2 macroCount = vec2(24.0, 20.0);
  // vec2 macroCount = vec2(44.0, 120.0);
  // vec2 macroCount = vec2(40.0, 120.0);
  // vec2 macroCount = vec2(24.0, 80.0);
  // vec2 macroCount = vec2(100.0, 120.0);
  // vec2 macroCount = vec2(14.0, 18.0);
  // vec2 macroCount = vec2(120.0, 180.0);
  // vec2 macroCount = vec2(4.0, 4.0);
  // vec2 macroCount = vec2(1.0, 1.0);
  vec2 macroId = floor(uv * macroCount);
  float r = hash21(macroId);

  // choose a "pixel density" per macro cell (3 levels)
  // float density = (r < 0.33) ? 40.0 : (r < 0.66) ? 26.0 : 18.0;
  // float density = (r < 0.33) ? 40.0 : (r < 0.66) ? 26.0 : 24.0;
  // float density = (r < 0.33) ? 16.0 : (r < 0.66) ? 26.0 : 16.0;
  float density = (r < 0.33) ? 40.0 : (r < 0.66) ? 26.0 : 80.0;
  // float density = (r < 0.23) ? 8.0 : (r < 0.46) ? 24.0 : 60.0;
  // float density = (r < 0.23) ? 8.0 : (r < 0.46) ? 24.0 : 20.0;
  // float density = (r < 0.33) ? 8.0 : (r < 0.66) ? 24.0 : 32.0;
  density *= u_density;
  vec2 cellCount = vec2(density, density * (u_resolution.y / u_resolution.x));

  // quantized sample position (pixel center)
  vec2 qUv = quantizeToCell(uv, cellCount);
  // vec2 qp = qUv - 0.5;
  // vec2 qp = qUv - 0.4;
  // vec2 qp = qUv - 0.2;
  // vec2 qp = qUv - 120.4;
  vec2 qp = qUv - 24.4;
  qp.x *= u_resolution.x / u_resolution.y;

  // --- FORCES (big circles) ---
  // centers in qp space
  vec2 c1 = vec2(-0.30, 2.0);
  // vec2 c1 = vec2(0.08, 4.8);
  // vec2 c1 = vec2(-0.12, 0.05);
  vec2 c2 = vec2( 0.18,-0.10);
  // vec2 c2 = vec2( 0.02,-0.10);
  // vec2 c2 = vec2( 0.02,-3.10);
  // vec2 c2 = vec2( 0.04,-0.10);
  // float base = 0.0;
  // float base = 0.6;
  // float base = 0.238;
  float base = 0.24;
  // base += circleField(qp, c1, 0.20);
  // base += circleField(qp, c2, 0.14);

  base += circleField(qp, c1, 0.02);
  base += circleField(qp, c2, 0.04);

  // base += circleField(qp, c1, 0.72);
  // base += circleField(qp, c2, 0.80);
 
  // base += circleField(qp, c1, 2.32);
  // base += circleField(qp, c2, 1.48);

  base = clamp(base, 0.0, 1.0);
 

  // --- RIPPLE ---
  // ripple driven by distance to the nearest force center
  float d1 = length(qp - c1);
  float d2 = length(qp - c2);
  float d = min(d1, d2);

  // float ripple = 0.5 + 0.5 * sin(d * 38.0 - u_time * 4.0);
  // float ripple = 0.2 + 0.2 * sin(d * 8.0 - u_time * 6.0);
  float ripple = 0.8 + 0.8 * sin(d * 120.0 - u_time * 0.8);
  // float ripple = 0.2 + 2.8 * sin(d * 0.0 - u_time * 2.0);

  // make ripple only really visible where the force exists (or nearby)
  // float rippleMask = smoothstep(0.0, 0.8, base);
  // float rippleMask = smoothstep(0.0, 0.02, base);
  // float rippleMask = smoothstep(0.0, 0.08, base);
  float rippleMask = smoothstep(0.0, 0.2, base);
  float ink = clamp(base + (ripple - 0.5) * 0.55 * rippleMask, 0.0, 1.0);
  // float ink = clamp(base + (ripple - 0.5) * 0.8 * rippleMask, 0.0, 1.0);
  // float ink = clamp(base + (ripple - 0.5) * 0.58 * rippleMask, 0.0, 1.0);
  // float ink = clamp(base + (ripple - 1.2) * 0.28 * rippleMask, 0.0, 1.0);
  // float ink = clamp(base + (ripple - 0.5) * 0.55 * rippleMask, 0.0, 1.0);

  // --- CHROMATIC ABERRATION ---
  // offset direction radially from center for a lens-y split
  // vec2 dir = normalize(qp + 1e-6 * sign(qp));
  // vec2 dir = normalize(qp + 1e-6 * sign(qp));
  vec2 dir = normalize(qp + 1e-6);
  // float amt = 0.007; // keep tiny for print-ish vibe
  // float amt = 0.0007; // keep tiny for print-ish vibe
  // float amt = 2.0007; // keep tiny for print-ish vibe
  // float amt = 30.7; // keep tiny for print-ish vibe
  // float amt = 24.7; // keep tiny for print-ish vibe
  float amt = 4.0007; // keep tiny for print-ish vibe

  // sample "ink" three times with tiny offsets
  // (we recompute only the distance-based ripple cheaply using shifted qp)
  vec2 qpR = qp + dir * amt;
  vec2 qpB = qp - dir * amt;

  float dR = min(length(qpR - c1), length(qpR - c2));
  float dB = min(length(qpB - c1), length(qpB - c2));

  // float rippleR = 0.5 + 0.5 * sin(dR * 38.0 - u_time * 3.0);
  // float rippleB = 0.5 + 0.5 * sin(dB * 38.0 - u_time * 3.0);

  // float rippleR = 0.5 + 0.4 * sin(dR * 12.0 - u_time * 2.0);
  // float rippleB = 0.5 + 0.4 * sin(dB * 12.0 - u_time * 2.0);

  // float rippleR = 0.5 + 0.5 * sin(dR * 38.0 - u_time * 5.2);
  // float rippleB = 0.5 + 0.5 * sin(dB * 38.0 - u_time * 4.2);
  // float rippleR = 0.5 + 10.5 * sin(dR * 38.0 - u_time * 7.2);
  // float rippleR = 0.5 + 1.5 * sin(dR * 38.0 - u_time * 7.2);
  // float rippleR = 0.5 + 10.5 * sin(dR * 38.0 - u_time * 4.2);
  float rippleR = 0.5 + 10.5 * sin(dR * 12.0 - u_time * 2.2);
  float rippleB = 0.5 + 0.5 * sin(dB * 24.0 - u_time * 18.2);
  // float rippleB = 0.5 + 20.5 * sin(dB * 24.0 - u_time * 18.2);
  // float rippleB = 0.5 + 1.5 * sin(dB * 24.0 - u_time * 18.2);
  // float rippleB = 0.5 + 0.5 * sin(dB * 24.0 - u_time * 10.2);

  // float inkR = clamp(base + (rippleR - 0.5) * 0.55 * rippleMask, 0.0, 1.0);
  float inkR = clamp(base + (rippleR - 0.5) * 0.55 * rippleMask, 0.0, 10.0);
  float inkG = ink;
  float inkB = clamp(base + (rippleB - 0.5) * 0.55 * rippleMask, 0.0, 24.0);

  // palette: black background, "white" ink with RGB split
  vec3 col = vec3(0.0);
  // vec3 col = vec3(0.1529, 0.3059, 0.1686);
  col += vec3(inkR, inkG, inkB);

  // optional: clamp to keep it crisp
  // col = clamp(col, 0.0, 1.0);
  // col = clamp(col, 0.0, 4.0);
  col = clamp(col, 0.0, 40.0);
  // col = clamp(col, 0.0, 4.0);
  // col = clamp(col, 0.0, 10.0);

  // gl_FragColor = vec4(col, 2.0);
  // gl_FragColor = vec4(col, 2.0);
  gl_FragColor = vec4(col,10.0);
}
