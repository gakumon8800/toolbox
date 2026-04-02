const SAMPLE_NAMES = ["印鑑", "田辺", "太田"];

const DEFAULT_SETTINGS = {
  name: "印鑑",
  frameMode: "frame",
  colorMode: "normal",
  fontScale: 94,
  strokeWidth: 10,
  padding: 18,
  inkColor: "#c6382f"
};

const ui = {
  nameInput: document.getElementById("nameInput"),
  frameMode: document.getElementById("frameMode"),
  colorMode: document.getElementById("colorMode"),
  fontScale: document.getElementById("fontScale"),
  strokeWidth: document.getElementById("strokeWidth"),
  padding: document.getElementById("padding"),
  inkColor: document.getElementById("inkColor"),
  downloadButton: document.getElementById("downloadButton"),
  download2xButton: document.getElementById("download2xButton"),
  resetButton: document.getElementById("resetButton"),
  previewCanvas: document.getElementById("previewCanvas"),
  statusText: document.getElementById("statusText"),
  fontScaleValue: document.getElementById("fontScaleValue"),
  strokeWidthValue: document.getElementById("strokeWidthValue"),
  paddingValue: document.getElementById("paddingValue")
};

const settings = { ...DEFAULT_SETTINGS };

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
  ui.strokeWidthValue.textContent = `${settings.strokeWidth} px`;
  ui.paddingValue.textContent = `${settings.padding}%`;
}

function syncControls() {
  ui.nameInput.value = settings.name;
  ui.frameMode.value = settings.frameMode;
  ui.colorMode.value = settings.colorMode;
  ui.fontScale.value = String(settings.fontScale);
  ui.strokeWidth.value = String(settings.strokeWidth);
  ui.padding.value = String(settings.padding);
  ui.inkColor.value = settings.inkColor;
  updateLabels();
}

function setStatus(message) {
  ui.statusText.textContent = message;
}

function getLayoutByTextLength(textLength, sealSize) {
  const base = sealSize * (settings.fontScale / 100);

  if (textLength <= 1) {
    return {
      fontSize: base * 0.5,
      positions: [{ x: 0, y: 0 }]
    };
  }

  if (textLength === 2) {
    return {
      fontSize: base * 0.38,
      positions: [
        { x: 0, y: -sealSize * 0.15 },
        { x: 0, y: sealSize * 0.15 }
      ]
    };
  }

  if (textLength === 3) {
    return {
      fontSize: base * 0.3,
      positions: [
        { x: -sealSize * 0.12, y: -sealSize * 0.17 },
        { x: -sealSize * 0.12, y: sealSize * 0.12 },
        { x: sealSize * 0.16, y: -sealSize * 0.02 }
      ]
    };
  }

  return {
    fontSize: base * 0.27,
    positions: [
      { x: -sealSize * 0.15, y: -sealSize * 0.15 },
      { x: sealSize * 0.15, y: -sealSize * 0.15 },
      { x: -sealSize * 0.15, y: sealSize * 0.15 },
      { x: sealSize * 0.15, y: sealSize * 0.15 }
    ]
  };
}

function drawCircleSeal(targetCanvas, scale = 1) {
  const canvasSize = Math.round(640 * scale);
  const ctx = targetCanvas.getContext("2d");
  const text = segmentText(getActiveName()).slice(0, 4);
  const colors = getColors();
  const sealSize = canvasSize * (1 - settings.padding / 100 * 2);
  const center = canvasSize / 2;
  const radius = sealSize / 2;
  const layout = getLayoutByTextLength(text.length, sealSize);

  targetCanvas.width = canvasSize;
  targetCanvas.height = canvasSize;

  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors.background;
  ctx.fillRect(center - radius, center - radius, sealSize, sealSize);
  ctx.restore();

  if (settings.frameMode === "frame") {
    ctx.save();
    ctx.strokeStyle = colors.foreground;
    ctx.lineWidth = settings.strokeWidth * scale;
    ctx.beginPath();
    ctx.arc(center, center, radius - settings.strokeWidth * scale * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = colors.foreground;
  ctx.font = `700 ${layout.fontSize * scale}px "Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  text.forEach((glyph, index) => {
    const position = layout.positions[index];
    ctx.fillText(glyph, center + position.x * scale, center + position.y * scale);
  });

  ctx.restore();
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
    case "strokeWidth":
      settings.strokeWidth = Number(value);
      break;
    case "padding":
      settings.padding = Number(value);
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
    ui.strokeWidth,
    ui.padding,
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
