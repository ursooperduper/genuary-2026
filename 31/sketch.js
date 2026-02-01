let sh;
const DENSITY = 0.6;

function preload() {
  sh = loadShader('shader.vert', 'shader.frag');
}

function setup() {
  createCanvas(540, 675, WEBGL);
  noStroke();
}

function draw() {
  renderTo(this, sh, width, height, millis() / 1000.0, mouseX, mouseY);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    savePNG();
  }
}

function renderTo(target, shaderRef, w, h, t, mx, my) {
  target.shader(shaderRef);
  shaderRef.setUniform('u_resolution', [w, h]);
  shaderRef.setUniform('u_time', t);
  shaderRef.setUniform('u_density', DENSITY);
  shaderRef.setUniform('u_mouse', [mx, my]);
  target.noStroke();
  target.rect(-w / 2, -h / 2, w, h);
}

function savePNG() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportWidth = 1080;
  const exportHeight = 1350;
  const pg = createGraphics(exportWidth, exportHeight, WEBGL);
  pg.noStroke();
  const shExport = sh.copyToContext(pg);
  renderTo(pg, shExport, exportWidth, exportHeight, millis() / 1000.0, mouseX * 2, mouseY * 2);

  pg.canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `genuary-31-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  setTimeout(() => {
    pg.remove();
  }, 0);
}
