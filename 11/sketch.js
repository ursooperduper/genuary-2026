const WIDTH = 540;
const HEIGHT = 675;
const SPACES_PER_INDENT = 2;
const MARGIN = 24;
const MIN_CELL = 6;
const MAX_CELL = 24;
// const BACKGROUND_COLOR = "#000000ff";
// const TOKEN_FILL = "#000000ff";
// const TOKEN_STROKE = null;
// const UNKNOWN_TOKEN_KEY = "unknown";
// const PNG_SCALE = 2;
// // const TOKEN_TYPE_COLORS = {
// //   kw: "#ff6f61",
// //   id: "#000000ff",
// //   num: "#ffd166",
// //   op: "#6ea8ff",
// //   p: "#c7c7c7",
// //   st: "#9ad1ff",
// //   ws: "#4d4d4d",
// //   unknown: null,
// // };

// const TOKEN_TYPE_COLORS = {
//   kw: "#8eff77ff",
//   id: "#323232ff",
//   num: "#959595ff",
//   op: "#5c5c5cff",
//   p: "#9c3bd5ff",
//   st: "#3f3f3fff",
//   ws: "#4d4d4d",
//   unknown: null,
// };



// const BACKGROUND_COLOR = "#000000ff";
// const TOKEN_FILL = "#090909ff";
// const TOKEN_STROKE = null;
// const UNKNOWN_TOKEN_KEY = "unknown";
// const PNG_SCALE = 2;

// const TOKEN_TYPE_COLORS = {
//   kw: "#ffd93fff",
//   id: "#323232ff",
//   num: "#959595ff",
//   op: "#5c5c5cff",
//   p: "#9c3bd5ff",
//   st: "#3f3f3fff",
//   ws: "#ea4242ff",
//   unknown: "#FFFFFF",
// };


const BACKGROUND_COLOR = "#ddddddff";
const TOKEN_FILL = "#090909ff";
const TOKEN_STROKE = null;
const UNKNOWN_TOKEN_KEY = "unknown";
const PNG_SCALE = 2;

const TOKEN_TYPE_COLORS = {
  kw: null,
  id: null,
  num: null,
  op: null,
  p: null,
  st: null,
  ws: null,
  unknown: null,
};






let cell = 12;
let cols = 0;
let rows = 0;
let maxTokens = 0;

let sourceLines = [];
let sourceText = "";
let tokens = [];

let SHOW_GRID = false;
let SHOW_LEGEND = true;

// Base path
const TOKENS_DIR = "assets/tokens";

// Main mapping table: tokenKey -> filepath
const TOKEN_SVGS = {};

// ---- auto-generated: identifiers a-z ----
for (let c = 97; c <= 122; c++) {
  const ch = String.fromCharCode(c); // a..z
  TOKEN_SVGS[`id:${ch}`] = `${TOKENS_DIR}/id-${ch}.svg`;
}

// ---- auto-generated: numbers 0-9 ----
for (let n = 0; n <= 9; n++) {
  TOKEN_SVGS[`num:${n}`] = `${TOKENS_DIR}/num-${n}.svg`;
}

// ---- keywords (explicit) ----
["const", "function", "let", "return"].forEach((kw) => {
  TOKEN_SVGS[`kw:${kw}`] = `${TOKENS_DIR}/kw-${kw}.svg`;
});

// ---- operators (explicit: symbol -> filename) ----
const OP_FILES = {
  "+": "op-plus.svg",
  "-": "op-minus.svg",
  "*": "op-multiply.svg",
  "/": "op-divide.svg",
  "=": "op-equals.svg",
};
Object.entries(OP_FILES).forEach(([op, file]) => {
  TOKEN_SVGS[`op:${op}`] = `${TOKENS_DIR}/${file}`;
});

// ---- punctuation ----
const P_FILES = {
  ",": "p-comma.svg",
  ".": "p-period.svg",
  ";": "p-semicolon.svg",
};
Object.entries(P_FILES).forEach(([p, file]) => {
  TOKEN_SVGS[`p:${p}`] = `${TOKENS_DIR}/${file}`;
});

// ---- structural tokens ----
const ST_FILES = {
  "{": "st-leftcurlybrace.svg",
  "}": "st-rightcurlybrace.svg",
  "[": "st-leftsquarebrace.svg",
  "]": "st-rightsquarebrace.svg",
  "(": "st-leftparenthesis.svg",
  ")": "st-rightparenthesis.svg",
};
Object.entries(ST_FILES).forEach(([s, file]) => {
  TOKEN_SVGS[`st:${s}`] = `${TOKENS_DIR}/${file}`;
});

// ---- whitespace control ----
["indent", "newline", "space"].forEach((ws) => {
  TOKEN_SVGS[`ws:${ws}`] = `${TOKENS_DIR}/ws-${ws}.svg`;
});

// ---- optional fallback for unknown tokens ----
TOKEN_SVGS[UNKNOWN_TOKEN_KEY] = `${TOKENS_DIR}/unknown.svg`;

const TOKEN_SVG = {};

function preload() {
  sourceLines = loadStrings("sketch.js");

  Object.entries(TOKEN_SVGS).forEach(([tokenKey, path]) => {
    TOKEN_SVG[tokenKey] = loadSVG(
      path,
      (svg) => {
        applySvgColors(svg, tokenKey);
      },
      () => {
        console.warn(`Missing token SVG: ${path}`);
        TOKEN_SVG[tokenKey] = TOKEN_SVG[UNKNOWN_TOKEN_KEY];
      }
    );
  });
}

function setup() {
  // Fall back to default renderer if the SVG plugin fails to load
  const renderer = typeof SVG === "undefined" ? undefined : SVG;
  const canvas = createCanvas(WIDTH, HEIGHT, renderer);
  canvas.parent("sketch-holder");
  pixelDensity(1);
  noLoop();

  sourceText = sourceLines.join("\n");
  tokens = tokenizeSource(sourceLines);
}

function draw() {
  background(BACKGROUND_COLOR);

  cols = Math.floor((width - MARGIN * 2) / cell);
  rows = Math.floor((height - MARGIN * 2) / cell);
  maxTokens = cols * rows;

  const count = Math.min(tokens.length, maxTokens);
  for (let i = 0; i < count; i += 1) {
    const tokenKey = tokens[i];
    const img = TOKEN_SVG[tokenKey] || TOKEN_SVG[UNKNOWN_TOKEN_KEY];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * cell;
    const y = MARGIN + row * cell;
    if (img) {
      image(img, x, y, cell, cell);
    }
  }

  if (SHOW_GRID) {
    drawGrid();
  }

  if (SHOW_LEGEND) {
    drawLegend();
  }
}

function saveAsSvg() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  save(`genuary-${timestamp}.svg`);
}

function saveAsPng() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `genuary-23-${timestamp}.png`;
  const svg = _renderer && _renderer.svg ? _renderer.svg : null;
  if (!svg) {
    save(filename);
    return;
  }
  const prevWidth = svg.getAttribute("width");
  const prevHeight = svg.getAttribute("height");
  svg.setAttribute("width", WIDTH * PNG_SCALE);
  svg.setAttribute("height", HEIGHT * PNG_SCALE);
  save(filename);
  if (prevWidth === null) {
    svg.removeAttribute("width");
  } else {
    svg.setAttribute("width", prevWidth);
  }
  if (prevHeight === null) {
    svg.removeAttribute("height");
  } else {
    svg.setAttribute("height", prevHeight);
  }
}

function keyPressed() {
  if (key === "s" || key === "S") {
    saveAsSvg();
  } else if (key === "p" || key === "P") {
    saveAsPng();
  } else if (key === "g" || key === "G") {
    SHOW_GRID = !SHOW_GRID;
    redraw();
  } else if (key === "l" || key === "L") {
    SHOW_LEGEND = !SHOW_LEGEND;
    redraw();
  } else if (key === "[") {
    cell = max(MIN_CELL, cell - 1);
    redraw();
  } else if (key === "]") {
    cell = min(MAX_CELL, cell + 1);
    redraw();
  }
}

function tokenizeSource(lines) {
  const out = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = normalizeTabs(lines[lineIndex]);
    const trimmedLine = rawLine.replace(/\s+$/, "");
    const lowerLine = trimmedLine.toLowerCase();
    const leadingSpaces = countLeadingSpaces(trimmedLine);

    if (lineIndex > 0) {
      out.push("ws:newline");
      const indentCount = Math.floor(leadingSpaces / SPACES_PER_INDENT);
      for (let i = 0; i < indentCount; i += 1) {
        out.push("ws:indent");
      }
    }

    let i = leadingSpaces;
    while (i < lowerLine.length) {
      const ch = lowerLine[i];
      const originalChar = trimmedLine[i];

      if (ch === " ") {
        out.push("ws:space");
        i += 1;
        continue;
      }

      const keyword = matchKeyword(lowerLine, i);
      if (keyword) {
        out.push(`kw:${keyword}`);
        i += keyword.length;
        continue;
      }

      if (ST_FILES[ch]) {
        out.push(`st:${ch}`);
        i += 1;
        continue;
      }

      if (OP_FILES[ch]) {
        out.push(`op:${ch}`);
        i += 1;
        continue;
      }

      if (P_FILES[ch]) {
        out.push(`p:${ch}`);
        i += 1;
        continue;
      }

      if (ch >= "0" && ch <= "9") {
        out.push(`num:${ch}`);
        i += 1;
        continue;
      }

      if (ch >= "a" && ch <= "z") {
        out.push(`id:${ch}`);
        i += 1;
        continue;
      }

      console.warn(`Unknown token character: "${originalChar}" (line ${lineIndex + 1})`);
      out.push(UNKNOWN_TOKEN_KEY);
      i += 1;
    }
  }

  return out;
}

function matchKeyword(line, index) {
  const keywords = ["const", "function", "let", "return"];
  for (let i = 0; i < keywords.length; i += 1) {
    const kw = keywords[i];
    if (line.startsWith(kw, index)) {
      const before = index === 0 ? "" : line[index - 1];
      const after = line[index + kw.length] || "";
      const beforeIsLetter = before >= "a" && before <= "z";
      const afterIsLetter = after >= "a" && after <= "z";
      if (!beforeIsLetter && !afterIsLetter) {
        return kw;
      }
    }
  }
  return "";
}

function normalizeTabs(line) {
  if (line.indexOf("\t") === -1) {
    return line;
  }
  return line.replace(/\t/g, " ".repeat(SPACES_PER_INDENT));
}

function countLeadingSpaces(line) {
  const match = line.match(/^ +/);
  if (!match) {
    return 0;
  }
  return match[0].length;
}

function drawGrid() {
  stroke(0, 30);
  strokeWeight(1);
  noFill();
  const w = cols * cell;
  const h = rows * cell;
  for (let x = 0; x <= w; x += cell) {
    line(MARGIN + x, MARGIN, MARGIN + x, MARGIN + h);
  }
  for (let y = 0; y <= h; y += cell) {
    line(MARGIN, MARGIN + y, MARGIN + w, MARGIN + y);
  }
}

function applySvgColors(svg, tokenKey) {
  const fillColor = getTokenFill(tokenKey);
  if (!fillColor && !TOKEN_STROKE) {
    return;
  }
  const root = svg.elt || svg;
  if (!root || !root.querySelectorAll) {
    return;
  }
  if (fillColor) {
    root.setAttribute("fill", fillColor);
  }
  if (TOKEN_STROKE) {
    root.setAttribute("stroke", TOKEN_STROKE);
  }
  const nodes = root.querySelectorAll("*");
  nodes.forEach((node) => {
    if (fillColor && node.getAttribute("fill") !== "none") {
      node.setAttribute("fill", fillColor);
    }
    if (TOKEN_STROKE && node.getAttribute("stroke") !== "none") {
      node.setAttribute("stroke", TOKEN_STROKE);
    }
  });
}

function getTokenFill(tokenKey) {
  if (!tokenKey) {
    return TOKEN_FILL;
  }
  const type = tokenKey.split(":")[0];
  if (TOKEN_TYPE_COLORS[type]) {
    return TOKEN_TYPE_COLORS[type];
  }
  if (tokenKey === UNKNOWN_TOKEN_KEY && TOKEN_TYPE_COLORS.unknown) {
    return TOKEN_TYPE_COLORS.unknown;
  }
  return TOKEN_FILL;
}

function drawLegend() {
  const legendLines = [
    "This drawing encodes the complete source of the program that generated it.",
    "Each symbol corresponds to a unique token in the source.",
    "Newline and indentation are represented as symbols.",
    "The source may be reconstructed by reversing the mapping.",
  ];

  const legendSize = 8;
  const legendLeading = 10;
  textSize(legendSize);
  textLeading(legendLeading);
  textAlign(LEFT, TOP);
  noStroke();
  fill(0);

  const legendWidth = 240;
  const legendHeight = legendLines.length * legendLeading;
  const x = width - MARGIN - legendWidth;
  const y = height - MARGIN - legendHeight;

  for (let i = 0; i < legendLines.length; i += 1) {
    text(legendLines[i], x, y + i * legendLeading, legendWidth);
  }
}
