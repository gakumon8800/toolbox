const SAMPLE_NAMES = ["印鑑", "田辺", "太田"];

const DEFAULT_SETTINGS = {
  name: "印鑑",
  frameMode: "frame",
  colorMode: "normal",
  fontScale: 94,
  fontWeight: 700,
  letterGap: 0,
  strokeWidth: 10,
  distress: 4,
  padding: 18,
  offsetX: 0,
  offsetY: 0,
  inkColor: "#c6382f"
};

const ui = {
  nameInput: document.getElementById("nameInput"),
  frameMode: document.getElementById("frameMode"),
  colorMode: document.getElementById("colorMode"),
  fontScale: document.getElementById("fontScale"),
  fontWeight: document.getElementById("fontWeight"),
  letterGap: document.getElementById("letterGap"),
  strokeWidth: document.getElementById("strokeWidth"),
  distress: document.getElementById("distress"),
  padding: document.getElementById("padding"),
  offsetX: document.getElementById("offsetX"),
  offsetY: document.getElementById("offsetY"),
  inkColor: document.getElementById("inkColor"),
  downloadButton: document.getElementById("downloadButton"),
  download2xButton: document.getElementById("download2xButton"),
  resetButton: document.getElementById("resetButton"),
  previewCanvas: document.getElementById("previewCanvas"),
  statusText: document.getElementById("statusText"),
  fontScaleValue: document.getElementById("fontScaleValue"),
  fontWeightValue: document.getElementById("fontWeightValue"),
  letterGapValue: document.getElementById("letterGapValue"),
  strokeWidthValue: document.getElementById("strokeWidthValue"),
  distressValue: document.getElementById("distressValue"),
  paddingValue: document.getElementById("paddingValue"),
  offsetXValue: document.getElementById("offsetXValue"),
  offsetYValue: document.getElementById("offsetYValue")
};

const settings = { ...DEFAULT_SETTINGS };

function createSeededRandom(seedText) {
  let seed = 0;

  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }

  if (seed === 0) {
    seed = 123456789;
  }

  return function seededRandom() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function segmentText(text) {
  if (window.Intl && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (entry) => entry.segment);
  }

  return Array.from(text);
}

function getActiveName() {
  const trimmed = settings.name.trim();
  return trimmed || SAMPLE_NAMES[0];
}

function getColors() {
  if (settings.colorMode === "inverse") {
    return {
      background: settings.inkColor,
      foreground: "#ffffff"
    };
  }

  return {
    background: "#ffffff",
    foreground: settings.inkColor
  };
}

function updateLabels() {
  ui.fontScaleValue.textContent = `${settings.fontScale}%`;
  ui.fontWeightValue.textContent = `${settings.fontWeight}`;
  ui.letterGapValue.textContent = `${settings.letterGap}%`;
  ui.strokeWidthValue.textContent = `${settings.strokeWidth} px`;
  ui.distressValue.textContent = `${settings.distress}`;
  ui.paddingValue.textContent = `${settings.padding}%`;
  ui.offsetXValue.textContent = `${settings.offsetX}%`;
  ui.offsetYValue.textContent = `${settings.offsetY}%`;
}

function syncControls() {
  ui.nameInput.value = settings.name;
  ui.frameMode.value = settings.frameMode;
  ui.colorMode.value = settings.colorMode;
  ui.fontScale.value = String(settings.fontScale);
  ui.fontWeight.value = String(settings.fontWeight);
  ui.letterGap.value = String(settings.letterGap);
  ui.strokeWidth.value = String(settings.strokeWidth);
  ui.distress.value = String(settings.distress);
  ui.padding.value = String(settings.padding);
  ui.offsetX.value = String(settings.offsetX);
  ui.offsetY.value = String(settings.offsetY);
  ui.inkColor.value = settings.inkColor;
  updateLabels();
}

function setStatus(message) {
  ui.statusText.textContent = message;
}

function getFontSizeByTextLength(textLength, radius, blockScale = 1) {
  const baseFont = radius * (settings.fontScale / 100) * blockScale;

  if (textLength <= 1) {
    return baseFont * 0.72;
  }

  if (textLength === 2) {
    return baseFont * 0.58;
  }

  if (textLength === 3) {
    return baseFont * 0.42;
  }

  return baseFont * 0.36;
}

function getLayoutByTextLength(textLength, radius, gapFactor = 1, blockScale = 1) {
  if (textLength <= 1) {
    return [{ x: 0, y: 0 }];
  }

  if (textLength === 2) {
    const y = radius * 0.42 * gapFactor * blockScale;
    return [
      { x: 0, y: -y },
      { x: 0, y: y }
    ];
  }

  if (textLength === 3) {
    const leftX = radius * 0.22 * blockScale;
    const rightX = radius * 0.30 * blockScale;
    const y = radius * 0.30 * gapFactor * blockScale;
    return [
      { x: -leftX, y: -y },
      { x: -leftX, y: y },
      { x: rightX, y: 0 }
    ];
  }

  const x = radius * 0.28 * blockScale;
  const y = radius * 0.28 * gapFactor * blockScale;
  return [
    { x: -x, y: -y },
    { x: x, y: -y },
    { x: -x, y: y },
    { x: x, y: y }
  ];
}

function applyDistress(ctx, center, radius, amount, seedText) {
  if (amount <= 0) {
    return;
  }

  const random = createSeededRandom(seedText);
  const dotCount = Math.min(12, 2 + amount);
  const lineCount = Math.min(6, Math.floor(amount / 3));

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalCompositeOperation = "destination-out";

  for (let index = 0; index < dotCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = radius * (0.42 + random() * 0.42);
    const x = center + Math.cos(angle) * distance;
    const y = center + Math.sin(angle) * distance;
    const dotRadius = radius * (0.006 + random() * 0.008 + amount * 0.0007);

    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${0.22 + random() * 0.2})`;
    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineCap = "round";
  for (let index = 0; index < lineCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = radius * (0.48 + random() * 0.26);
    const x = center + Math.cos(angle) * distance;
    const y = center + Math.sin(angle) * distance;
    const length = radius * (0.035 + random() * 0.035);
    const tilt = angle + (random() - 0.5) * 0.8;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${0.12 + random() * 0.12})`;
    ctx.lineWidth = radius * (0.005 + random() * 0.003);
    ctx.moveTo(x - Math.cos(tilt) * length * 0.5, y - Math.sin(tilt) * length * 0.5);
    ctx.lineTo(x + Math.cos(tilt) * length * 0.5, y + Math.sin(tilt) * length * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCircleSeal(targetCanvas, scale = 1) {
  const canvasSize = Math.round(640 * scale);
  const ctx = targetCanvas.getContext("2d");
  const text = segmentText(getActiveName()).slice(0, 4);
  const colors = getColors();

  const frameSize = canvasSize * 0.78;
  const center = canvasSize / 2;
  const radius = frameSize / 2;

  // 枠の内側半径
  const innerFrameRadius = radius - settings.strokeWidth * scale * 0.9;

  // 文字間隔は letterGap のみで調整
  const gapFactor = 1 + settings.letterGap / 40;

  // 内側余白は「文字ブロック全体の占有率」に効かせる
  // 10% -> ほぼ等倍、30% -> やや縮む
  const paddingRatio = settings.padding / 100;
  const blockScale = Math.max(0.76, 1.08 - paddingRatio * 0.9);

  // 配置半径は枠の内側半径ベースで固定寄りにする
  const positions = getLayoutByTextLength(text.length, innerFrameRadius, gapFactor, blockScale);

  // 文字サイズも blockScale を少しだけ反映
  const fontSize = getFontSizeByTextLength(text.length, radius, blockScale);

  const offsetX = settings.offsetX * radius / 100;
  const offsetY = settings.offsetY * radius / 100;

  targetCanvas.width = canvasSize;
  targetCanvas.height = canvasSize;

  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // 印面背景
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors.background;
  ctx.fillRect(center - radius, center - radius, frameSize, frameSize);
  ctx.restore();

  // 枠
  if (settings.frameMode === "frame") {
    ctx.save();
    ctx.strokeStyle = colors.foreground;
    ctx.lineWidth = settings.strokeWidth * scale;
    ctx.beginPath();
    ctx.arc(center, center, radius - settings.strokeWidth * scale * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 文字描画
  ctx.save();
  ctx.fillStyle = colors.foreground;
  ctx.strokeStyle = colors.foreground;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${settings.fontWeight} ${fontSize * scale}px "Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif`;

  // 縁取りは常時太すぎないよう抑える
  const weightRatio = Math.max(0, (settings.fontWeight - 300) / 700); // 0 ～ 1
  const outlineWidth = fontSize * scale * (0.006 + weightRatio * 0.018);

  text.forEach((glyph, index) => {
    const position = positions[index];
    const x = center + position.x * scale + offsetX * scale;
    const y = center + position.y * scale + offsetY * scale;

    if (outlineWidth > 0.6) {
      ctx.lineWidth = outlineWidth;
      ctx.strokeText(glyph, x, y);
    }

    ctx.fillText(glyph, x, y);
  });

  ctx.restore();

  applyDistress(
    ctx,
    center,
    radius - settings.strokeWidth * scale * 0.6,
    settings.distress,
    `${getActiveName()}-${settings.frameMode}-${settings.colorMode}-${settings.distress}-${settings.fontWeight}-${settings.offsetX}-${settings.offsetY}-${settings.letterGap}-${settings.padding}-${settings.strokeWidth}`
  );
}

function render() {
  drawCircleSeal(ui.previewCanvas, 1);
  updateLabels();
}

function downloadPNG(scale) {
  const exportCanvas = document.createElement("canvas");
  drawCircleSeal(exportCanvas, scale);

  exportCanvas.toBlob((blob) => {
    if (!blob) {
      setStatus("PNG保存に失敗しました。");
      return;
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const fileName = `seal-${yyyy}-${mm}-${dd}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(scale === 2 ? "2x PNGを保存しました。" : "PNGを保存しました。");
  }, "image/png");
}

function resetSettings() {
  Object.assign(settings, DEFAULT_SETTINGS);
  syncControls();
  render();
  setStatus("初期設定に戻しました。");
}

function handleInput(event) {
  const { id, value } = event.target;

  switch (id) {
    case "nameInput":
      settings.name = value;
      break;
    case "frameMode":
      settings.frameMode = value;
      break;
    case "colorMode":
      settings.colorMode = value;
      break;
    case "fontScale":
      settings.fontScale = Number(value);
      break;
    case "fontWeight":
      settings.fontWeight = Number(value);
      break;
    case "letterGap":
      settings.letterGap = Number(value);
      break;
    case "strokeWidth":
      settings.strokeWidth = Number(value);
      break;
    case "distress":
      settings.distress = Number(value);
      break;
    case "padding":
      settings.padding = Number(value);
      break;
    case "offsetX":
      settings.offsetX = Number(value);
      break;
    case "offsetY":
      settings.offsetY = Number(value);
      break;
    case "inkColor":
      settings.inkColor = value;
      break;
    default:
      break;
  }

  render();
}

function registerEvents() {
  [
    ui.nameInput,
    ui.frameMode,
    ui.colorMode,
    ui.fontScale,
    ui.fontWeight,
    ui.letterGap,
    ui.strokeWidth,
    ui.distress,
    ui.padding,
    ui.offsetX,
    ui.offsetY,
    ui.inkColor
  ].forEach((control) => {
    control.addEventListener("input", handleInput);
    control.addEventListener("change", handleInput);
  });

  ui.downloadButton.addEventListener("click", () => downloadPNG(1));
  ui.download2xButton.addEventListener("click", () => downloadPNG(2));
  ui.resetButton.addEventListener("click", resetSettings);
}

syncControls();
registerEvents();
render();