const pdfjsLibGlobal = window.pdfjsLib;

pdfjsLibGlobal.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const PREVIEW_LONG_EDGE = 1100;
const THUMBNAIL_LONG_EDGE = 220;
const HANDLE_SIZE = 12;
const ROTATE_HANDLE_OFFSET = 34;
const MIN_OVERLAY_SIZE = 24;

const elements = {
  pdfDropzone: document.getElementById("pdfDropzone"),
  pdfFileInput: document.getElementById("pdfFileInput"),
  overlayDropzone: document.getElementById("overlayDropzone"),
  overlayFileInput: document.getElementById("overlayFileInput"),
  fileSummary: document.getElementById("fileSummary"),
  fileNameText: document.getElementById("fileNameText"),
  pageCountText: document.getElementById("pageCountText"),
  opacityRange: document.getElementById("opacityRange"),
  opacityValue: document.getElementById("opacityValue"),
  rotationRange: document.getElementById("rotationRange"),
  rotationValue: document.getElementById("rotationValue"),
  bringForwardButton: document.getElementById("bringForwardButton"),
  sendBackwardButton: document.getElementById("sendBackwardButton"),
  removeOverlayButton: document.getElementById("removeOverlayButton"),
  exportScaleSelect: document.getElementById("exportScaleSelect"),
  saveCurrentButton: document.getElementById("saveCurrentButton"),
  resetPageButton: document.getElementById("resetPageButton"),
  resetAllButton: document.getElementById("resetAllButton"),
  statusBox: document.getElementById("statusBox"),
  errorBox: document.getElementById("errorBox"),
  loadingCard: document.getElementById("loadingCard"),
  loadingTitle: document.getElementById("loadingTitle"),
  loadingText: document.getElementById("loadingText"),
  currentPageText: document.getElementById("currentPageText"),
  overlayCountText: document.getElementById("overlayCountText"),
  editorCanvas: document.getElementById("editorCanvas"),
  editorEmpty: document.getElementById("editorEmpty"),
  pageList: document.getElementById("pageList"),
  pageListEmpty: document.getElementById("pageListEmpty")
};

const state = {
  file: null,
  baseName: "",
  pdfDoc: null,
  pages: [],
  selectedPageIndex: -1,
  selectedOverlayId: null,
  drag: null,
  busy: false
};

const editorContext = elements.editorCanvas.getContext("2d");

function setStatus(message) {
  elements.statusBox.textContent = message;
}

function showError(message) {
  elements.errorBox.hidden = false;
  elements.errorBox.textContent = message;
}

function clearError() {
  elements.errorBox.hidden = true;
  elements.errorBox.textContent = "";
}

function setLoading(visible, title = "読み込み中です", text = "") {
  elements.loadingCard.hidden = !visible;
  elements.loadingTitle.textContent = title;
  elements.loadingText.textContent = text;
}

function setBusy(isBusy) {
  state.busy = isBusy;
  updateButtons();
}

function formatPageLabel(pageNumber) {
  return `ページ ${String(pageNumber).padStart(2, "0")}`;
}

function getBaseName(fileName) {
  return fileName.replace(/\.pdf$/i, "") || "document";
}

function getCurrentPageState() {
  return state.pages[state.selectedPageIndex] || null;
}

function getSelectedOverlay() {
  const pageState = getCurrentPageState();

  if (!pageState) {
    return null;
  }

  return pageState.overlays.find((overlay) => overlay.id === state.selectedOverlayId) || null;
}

function updateButtons() {
  const hasPage = Boolean(getCurrentPageState());
  const hasOverlay = Boolean(getSelectedOverlay());
  const disabled = state.busy || !state.pdfDoc;

  elements.saveCurrentButton.disabled = disabled || !hasPage;
  elements.resetPageButton.disabled = disabled || !hasPage;
  elements.opacityRange.disabled = disabled || !hasOverlay;
  elements.rotationRange.disabled = disabled || !hasOverlay;
  elements.bringForwardButton.disabled = disabled || !hasOverlay;
  elements.sendBackwardButton.disabled = disabled || !hasOverlay;
  elements.removeOverlayButton.disabled = disabled || !hasOverlay;
}

function updateControlValues() {
  const pageState = getCurrentPageState();
  const overlay = getSelectedOverlay();

  elements.currentPageText.textContent = pageState ? formatPageLabel(pageState.pageNumber) : "-";
  elements.overlayCountText.textContent = String(pageState ? pageState.overlays.length : 0);

  if (!overlay) {
    elements.opacityRange.value = "100";
    elements.opacityValue.textContent = "100%";
    elements.rotationRange.value = "0";
    elements.rotationValue.textContent = "0°";
    updateButtons();
    return;
  }

  const opacity = Math.round(overlay.opacity * 100);
  const rotation = Math.round(overlay.rotation);

  elements.opacityRange.value = String(opacity);
  elements.opacityValue.textContent = `${opacity}%`;
  elements.rotationRange.value = String(rotation);
  elements.rotationValue.textContent = `${rotation}°`;
  updateButtons();
}

function getPreviewScale(viewport) {
  return Math.min(1.6, PREVIEW_LONG_EDGE / Math.max(viewport.width, viewport.height));
}

function getThumbnailScale(viewport) {
  return Math.min(1, THUMBNAIL_LONG_EDGE / Math.max(viewport.width, viewport.height));
}

function getCanvasPoint(event) {
  const rect = elements.editorCanvas.getBoundingClientRect();
  const scaleX = elements.editorCanvas.width / rect.width;
  const scaleY = elements.editorCanvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function rotatePoint(x, y, angleDeg) {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos
  };
}

function inverseRotatePoint(x, y, angleDeg) {
  return rotatePoint(x, y, -angleDeg);
}

function getOverlayCenter(overlay) {
  return {
    x: overlay.x + overlay.width / 2,
    y: overlay.y + overlay.height / 2
  };
}

function getHandlePositions(overlay) {
  const center = getOverlayCenter(overlay);
  const left = -overlay.width / 2;
  const right = overlay.width / 2;
  const top = -overlay.height / 2;
  const bottom = overlay.height / 2;
  const definitions = [
    { name: "nw", x: left, y: top },
    { name: "n", x: 0, y: top },
    { name: "ne", x: right, y: top },
    { name: "e", x: right, y: 0 },
    { name: "se", x: right, y: bottom },
    { name: "s", x: 0, y: bottom },
    { name: "sw", x: left, y: bottom },
    { name: "w", x: left, y: 0 },
    { name: "rotate", x: 0, y: top - ROTATE_HANDLE_OFFSET }
  ];

  return definitions.map((item) => {
    const rotated = rotatePoint(item.x, item.y, overlay.rotation);

    return {
      name: item.name,
      x: center.x + rotated.x,
      y: center.y + rotated.y
    };
  });
}

function isPointInsideOverlay(point, overlay) {
  const center = getOverlayCenter(overlay);
  const local = inverseRotatePoint(point.x - center.x, point.y - center.y, overlay.rotation);

  return (
    Math.abs(local.x) <= overlay.width / 2 &&
    Math.abs(local.y) <= overlay.height / 2
  );
}

function getOverlayHit(point) {
  const pageState = getCurrentPageState();

  if (!pageState) {
    return null;
  }

  for (let index = pageState.overlays.length - 1; index >= 0; index -= 1) {
    const overlay = pageState.overlays[index];
    const handles = getHandlePositions(overlay);

    for (const handle of handles) {
      if (
        Math.abs(point.x - handle.x) <= HANDLE_SIZE &&
        Math.abs(point.y - handle.y) <= HANDLE_SIZE
      ) {
        return {
          overlay,
          mode: handle.name === "rotate" ? "rotate" : "resize",
          handle: handle.name
        };
      }
    }

    if (isPointInsideOverlay(point, overlay)) {
      return { overlay, mode: "move", handle: null };
    }
  }

  return null;
}

function getResizeCursor(handle) {
  const cursorMap = {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
    rotate: "grab"
  };

  return cursorMap[handle] || "move";
}

function clampOverlayToCanvas(overlay, width, height) {
  overlay.width = Math.max(MIN_OVERLAY_SIZE, overlay.width);
  overlay.height = Math.max(MIN_OVERLAY_SIZE, overlay.height);
  overlay.x = Math.min(Math.max(overlay.x, -overlay.width / 2), width - overlay.width / 2);
  overlay.y = Math.min(Math.max(overlay.y, -overlay.height / 2), height - overlay.height / 2);
}

function drawOverlay(overlay, isSelected) {
  const center = getOverlayCenter(overlay);

  editorContext.save();
  editorContext.translate(center.x, center.y);
  editorContext.rotate((overlay.rotation * Math.PI) / 180);
  editorContext.globalAlpha = overlay.opacity;
  editorContext.drawImage(
    overlay.image,
    -overlay.width / 2,
    -overlay.height / 2,
    overlay.width,
    overlay.height
  );
  editorContext.restore();

  if (!isSelected) {
    return;
  }

  editorContext.save();
  editorContext.translate(center.x, center.y);
  editorContext.rotate((overlay.rotation * Math.PI) / 180);
  editorContext.strokeStyle = "#008080";
  editorContext.lineWidth = 2;
  editorContext.setLineDash([8, 6]);
  editorContext.strokeRect(-overlay.width / 2, -overlay.height / 2, overlay.width, overlay.height);
  editorContext.restore();

  const handles = getHandlePositions(overlay);
  const rotateHandle = handles.find((handle) => handle.name === "rotate");
  const northHandle = handles.find((handle) => handle.name === "n");

  editorContext.save();
  editorContext.fillStyle = "#ffffff";
  editorContext.strokeStyle = "#008080";
  editorContext.lineWidth = 2;
  editorContext.setLineDash([]);

  if (rotateHandle && northHandle) {
    editorContext.beginPath();
    editorContext.moveTo(northHandle.x, northHandle.y);
    editorContext.lineTo(rotateHandle.x, rotateHandle.y);
    editorContext.stroke();
  }

  handles.forEach((handle) => {
    if (handle.name === "rotate") {
      editorContext.beginPath();
      editorContext.arc(handle.x, handle.y, HANDLE_SIZE / 1.6, 0, Math.PI * 2);
      editorContext.fill();
      editorContext.stroke();
      return;
    }

    editorContext.beginPath();
    editorContext.rect(
      handle.x - HANDLE_SIZE / 2,
      handle.y - HANDLE_SIZE / 2,
      HANDLE_SIZE,
      HANDLE_SIZE
    );
    editorContext.fill();
    editorContext.stroke();
  });

  editorContext.restore();
}

// Render the selected page and its overlays into the editor canvas.
function renderEditorCanvas() {
  const pageState = getCurrentPageState();

  if (!pageState) {
    elements.editorCanvas.hidden = true;
    elements.editorEmpty.hidden = false;
    updateControlValues();
    return;
  }

  elements.editorCanvas.hidden = false;
  elements.editorEmpty.hidden = true;
  elements.editorCanvas.width = pageState.previewCanvas.width;
  elements.editorCanvas.height = pageState.previewCanvas.height;
  editorContext.clearRect(0, 0, elements.editorCanvas.width, elements.editorCanvas.height);
  editorContext.drawImage(pageState.previewCanvas, 0, 0);

  pageState.overlays.forEach((overlay) => {
    drawOverlay(overlay, overlay.id === state.selectedOverlayId);
  });

  updateControlValues();
}

function syncThumbnailMeta(pageState) {
  if (!pageState.thumbnailInfo) {
    return;
  }

  pageState.thumbnailInfo.text.textContent = `${pageState.overlays.length}点の画像を配置`;
  pageState.thumbnailInfo.button.classList.toggle("is-active", state.selectedPageIndex === pageState.index);
}

function updateThumbnailStates() {
  state.pages.forEach((pageState) => {
    syncThumbnailMeta(pageState);
  });
}

function setSelectedPage(index) {
  if (index < 0 || index >= state.pages.length) {
    state.selectedPageIndex = -1;
    state.selectedOverlayId = null;
    renderEditorCanvas();
    updateThumbnailStates();
    return;
  }

  state.selectedPageIndex = index;
  const pageState = getCurrentPageState();
  state.selectedOverlayId = pageState.overlays.length
    ? pageState.overlays[pageState.overlays.length - 1].id
    : null;
  renderEditorCanvas();
  updateThumbnailStates();
}

function createOverlayId() {
  return `overlay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOverlayState(image, pageState) {
  const maxWidth = pageState.previewCanvas.width * 0.55;
  const maxHeight = pageState.previewCanvas.height * 0.55;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = Math.max(MIN_OVERLAY_SIZE, Math.round(image.width * scale));
  const height = Math.max(MIN_OVERLAY_SIZE, Math.round(image.height * scale));

  return {
    id: createOverlayId(),
    image,
    x: Math.round((pageState.previewCanvas.width - width) / 2),
    y: Math.round((pageState.previewCanvas.height - height) / 2),
    width,
    height,
    rotation: 0,
    opacity: 1
  };
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("画像データを展開できませんでした。"));
      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

async function addOverlayFiles(files) {
  const pageState = getCurrentPageState();

  if (!pageState) {
    showError("先にPDFを読み込み、編集するページを選択してください。");
    return;
  }

  clearError();

  try {
    // Keep uploaded overlays in per-page state.
    for (const file of files) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        throw new Error("重ね画像は PNG / JPG / WebP のみ対応しています。");
      }

      const image = await loadImageFile(file);
      const overlay = createOverlayState(image, pageState);
      pageState.overlays.push(overlay);
      state.selectedOverlayId = overlay.id;
    }

    renderEditorCanvas();
    syncThumbnailMeta(pageState);
    setStatus(`${formatPageLabel(pageState.pageNumber)} に画像を ${files.length} 点追加しました。`);
  } catch (error) {
    console.error("[pdf-overlay-export] overlay load error", error);
    showError(error.message || "重ね画像の読み込みに失敗しました。");
  } finally {
    elements.overlayFileInput.value = "";
  }
}

function updateSelectedOverlayOpacity() {
  const overlay = getSelectedOverlay();

  if (!overlay) {
    return;
  }

  overlay.opacity = Number(elements.opacityRange.value) / 100;
  elements.opacityValue.textContent = `${elements.opacityRange.value}%`;
  renderEditorCanvas();
}

function updateSelectedOverlayRotation() {
  const overlay = getSelectedOverlay();

  if (!overlay) {
    return;
  }

  overlay.rotation = Number(elements.rotationRange.value);
  elements.rotationValue.textContent = `${elements.rotationRange.value}°`;
  renderEditorCanvas();
}

function moveSelectedOverlay(direction) {
  const pageState = getCurrentPageState();
  const overlay = getSelectedOverlay();

  if (!pageState || !overlay) {
    return;
  }

  const index = pageState.overlays.findIndex((item) => item.id === overlay.id);
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= pageState.overlays.length) {
    return;
  }

  const [moved] = pageState.overlays.splice(index, 1);
  pageState.overlays.splice(nextIndex, 0, moved);
  renderEditorCanvas();
  syncThumbnailMeta(pageState);
}

function removeSelectedOverlay() {
  const pageState = getCurrentPageState();
  const overlay = getSelectedOverlay();

  if (!pageState || !overlay) {
    return;
  }

  pageState.overlays = pageState.overlays.filter((item) => item.id !== overlay.id);
  state.selectedOverlayId = pageState.overlays.length
    ? pageState.overlays[pageState.overlays.length - 1].id
    : null;
  renderEditorCanvas();
  syncThumbnailMeta(pageState);
  setStatus(`${formatPageLabel(pageState.pageNumber)} の選択画像を削除しました。`);
}

function startInteraction(event) {
  const pageState = getCurrentPageState();

  if (!pageState || state.busy) {
    return;
  }

  const point = getCanvasPoint(event);
  const hit = getOverlayHit(point);

  if (!hit) {
    state.selectedOverlayId = null;
    elements.editorCanvas.style.cursor = "default";
    renderEditorCanvas();
    return;
  }

  const overlay = hit.overlay;
  const center = getOverlayCenter(overlay);

  state.selectedOverlayId = overlay.id;
  state.drag = {
    mode: hit.mode,
    handle: hit.handle,
    pointerId: event.pointerId,
    startPoint: point,
    initialX: overlay.x,
    initialY: overlay.y,
    initialWidth: overlay.width,
    initialHeight: overlay.height,
    initialRotation: overlay.rotation,
    centerX: center.x,
    centerY: center.y
  };

  elements.editorCanvas.setPointerCapture(event.pointerId);
  elements.editorCanvas.style.cursor = hit.mode === "move" ? "grabbing" : getResizeCursor(hit.handle);
  renderEditorCanvas();
}

function updateResizeOverlay(overlay, dragState, point) {
  const center = {
    x: dragState.initialX + dragState.initialWidth / 2,
    y: dragState.initialY + dragState.initialHeight / 2
  };
  const local = inverseRotatePoint(point.x - center.x, point.y - center.y, overlay.rotation);
  const halfWidth = dragState.initialWidth / 2;
  const halfHeight = dragState.initialHeight / 2;

  if (dragState.handle.includes("e")) {
    overlay.width = Math.max(MIN_OVERLAY_SIZE, local.x + halfWidth);
  }
  if (dragState.handle.includes("w")) {
    const nextWidth = Math.max(MIN_OVERLAY_SIZE, halfWidth - local.x);
    overlay.x = dragState.initialX + (dragState.initialWidth - nextWidth);
    overlay.width = nextWidth;
  }
  if (dragState.handle.includes("s")) {
    overlay.height = Math.max(MIN_OVERLAY_SIZE, local.y + halfHeight);
  }
  if (dragState.handle.includes("n")) {
    const nextHeight = Math.max(MIN_OVERLAY_SIZE, halfHeight - local.y);
    overlay.y = dragState.initialY + (dragState.initialHeight - nextHeight);
    overlay.height = nextHeight;
  }
}

function continueInteraction(event) {
  const pageState = getCurrentPageState();

  if (!pageState) {
    return;
  }

  const point = getCanvasPoint(event);
  const overlay = getSelectedOverlay();

  if (!state.drag || !overlay) {
    const hoverHit = getOverlayHit(point);
    elements.editorCanvas.style.cursor = hoverHit
      ? hoverHit.mode === "move"
        ? "move"
        : getResizeCursor(hoverHit.handle)
      : "default";
    return;
  }

  if (state.drag.mode === "move") {
    overlay.x = state.drag.initialX + (point.x - state.drag.startPoint.x);
    overlay.y = state.drag.initialY + (point.y - state.drag.startPoint.y);
  } else if (state.drag.mode === "resize") {
    overlay.x = state.drag.initialX;
    overlay.y = state.drag.initialY;
    overlay.width = state.drag.initialWidth;
    overlay.height = state.drag.initialHeight;
    updateResizeOverlay(overlay, state.drag, point);
  } else if (state.drag.mode === "rotate") {
    const center = getOverlayCenter(overlay);
    const angle = Math.atan2(point.y - center.y, point.x - center.x);
    overlay.rotation = (angle * 180) / Math.PI + 90;
  }

  clampOverlayToCanvas(overlay, pageState.previewCanvas.width, pageState.previewCanvas.height);
  renderEditorCanvas();
}

function endInteraction(event) {
  if (state.drag && state.drag.pointerId === event.pointerId) {
    elements.editorCanvas.releasePointerCapture(event.pointerId);
  }

  state.drag = null;
  elements.editorCanvas.style.cursor = "default";
}

function createPageThumbnail(pageState) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "thumbnail-button";
  button.addEventListener("click", () => {
    setSelectedPage(pageState.index);
    setStatus(`${formatPageLabel(pageState.pageNumber)} を選択しました。`);
  });

  const preview = document.createElement("div");
  preview.className = "thumbnail-preview";
  preview.appendChild(pageState.thumbnailCanvas);

  const meta = document.createElement("div");
  meta.className = "thumbnail-meta";

  const title = document.createElement("div");
  title.className = "thumbnail-title";
  title.textContent = formatPageLabel(pageState.pageNumber);

  const text = document.createElement("div");
  text.className = "thumbnail-text";
  text.textContent = "0点の画像を配置";

  meta.append(title, text);
  button.append(preview, meta);
  pageState.thumbnailInfo = { button, text };

  return button;
}

function resetPageList() {
  elements.pageList.innerHTML = "";
  elements.pageList.appendChild(elements.pageListEmpty);
  elements.pageListEmpty.hidden = false;
}

async function cleanupPdfDocument() {
  if (!state.pdfDoc) {
    return;
  }

  try {
    await state.pdfDoc.destroy();
  } catch (error) {
    console.warn("[pdf-overlay-export] cleanup warning", error);
  }
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNGの生成に失敗しました。"));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

async function exportCurrentPage() {
  const pageState = getCurrentPageState();

  if (!pageState || !state.pdfDoc || state.busy) {
    return;
  }

  clearError();
  setBusy(true);
  setLoading(true, "PNG書き出し中", "高解像度でページを再描画しています。");

  try {
    // Re-render the PDF at export scale, then composite overlays.
    const page = await state.pdfDoc.getPage(pageState.pageNumber);
    const exportScale = Number(elements.exportScaleSelect.value);
    const viewport = page.getViewport({ scale: exportScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const ratioX = canvas.width / pageState.previewCanvas.width;
    const ratioY = canvas.height / pageState.previewCanvas.height;

    // Convert preview-space coordinates into export-space coordinates.
    pageState.overlays.forEach((overlay) => {
      const centerX = (overlay.x + overlay.width / 2) * ratioX;
      const centerY = (overlay.y + overlay.height / 2) * ratioY;
      const width = overlay.width * ratioX;
      const height = overlay.height * ratioY;

      context.save();
      context.translate(centerX, centerY);
      context.rotate((overlay.rotation * Math.PI) / 180);
      context.globalAlpha = overlay.opacity;
      context.drawImage(overlay.image, -width / 2, -height / 2, width, height);
      context.restore();
    });

    const blob = await canvasToBlob(canvas);
    const fileName = `${state.baseName}.page-${String(pageState.pageNumber).padStart(2, "0")}.overlay.png`;
    downloadBlob(blob, fileName);
    setStatus(`${formatPageLabel(pageState.pageNumber)} をPNG保存しました。`);
  } catch (error) {
    console.error("[pdf-overlay-export] export error", error);
    showError(error.message || "PNG保存に失敗しました。");
    setStatus("PNG保存中にエラーが発生しました。");
  } finally {
    setBusy(false);
    setLoading(false);
  }
}

function resetCurrentPage() {
  const pageState = getCurrentPageState();

  if (!pageState) {
    return;
  }

  pageState.overlays = [];
  state.selectedOverlayId = null;
  renderEditorCanvas();
  syncThumbnailMeta(pageState);
  setStatus(`${formatPageLabel(pageState.pageNumber)} の編集内容をリセットしました。`);
}

async function resetApp() {
  state.file = null;
  state.baseName = "";
  state.pages = [];
  state.selectedPageIndex = -1;
  state.selectedOverlayId = null;
  state.drag = null;

  await cleanupPdfDocument();
  state.pdfDoc = null;

  elements.pdfFileInput.value = "";
  elements.overlayFileInput.value = "";
  elements.fileSummary.hidden = true;
  elements.fileNameText.textContent = "-";
  elements.pageCountText.textContent = "-";

  resetPageList();
  renderEditorCanvas();
  clearError();
  setLoading(false);
  setBusy(false);
  setStatus("PDFを読み込むと、ここに作業状況を表示します。");
}

async function loadPdfFile(file) {
  if (!file) {
    return;
  }

  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    showError("PDFファイルを選択してください。");
    return;
  }

  clearError();
  setBusy(true);
  setLoading(true, "PDF読込中", "ページごとのプレビューを準備しています。");

  try {
    // Build page previews and reset per-page editing state.
    await cleanupPdfDocument();

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLibGlobal.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    state.pdfDoc = pdfDoc;
    state.file = file;
    state.baseName = getBaseName(file.name);
    state.pages = [];
    state.selectedPageIndex = -1;
    state.selectedOverlayId = null;
    state.drag = null;

    resetPageList();
    elements.pageList.innerHTML = "";

    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
      const pdfPage = await pdfDoc.getPage(pageNumber);
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const previewScale = getPreviewScale(baseViewport);
      const thumbnailScale = getThumbnailScale(baseViewport);

      const previewViewport = pdfPage.getViewport({ scale: previewScale });
      const previewCanvas = document.createElement("canvas");
      const previewContext = previewCanvas.getContext("2d", { alpha: false });
      previewCanvas.width = Math.floor(previewViewport.width);
      previewCanvas.height = Math.floor(previewViewport.height);
      previewContext.fillStyle = "#ffffff";
      previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      await pdfPage.render({ canvasContext: previewContext, viewport: previewViewport }).promise;

      const thumbnailViewport = pdfPage.getViewport({ scale: thumbnailScale });
      const thumbnailCanvas = document.createElement("canvas");
      const thumbnailContext = thumbnailCanvas.getContext("2d", { alpha: false });
      thumbnailCanvas.width = Math.floor(thumbnailViewport.width);
      thumbnailCanvas.height = Math.floor(thumbnailViewport.height);
      thumbnailContext.fillStyle = "#ffffff";
      thumbnailContext.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
      await pdfPage.render({ canvasContext: thumbnailContext, viewport: thumbnailViewport }).promise;

      const pageState = {
        index: pageNumber - 1,
        pageNumber,
        previewCanvas,
        thumbnailCanvas,
        overlays: [],
        thumbnailInfo: null
      };

      state.pages.push(pageState);
      elements.pageList.appendChild(createPageThumbnail(pageState));
      setLoading(true, "PDF読込中", `${pageNumber} / ${pdfDoc.numPages} ページを準備しています。`);
    }

    elements.fileSummary.hidden = false;
    elements.fileNameText.textContent = file.name;
    elements.pageCountText.textContent = `${pdfDoc.numPages}ページ`;
    elements.pageListEmpty.hidden = true;

    if (state.pages.length > 0) {
      setSelectedPage(0);
    }

    setStatus(`PDFを読み込みました。全${pdfDoc.numPages}ページを編集できます。`);
  } catch (error) {
    console.error("[pdf-overlay-export] pdf load error", error);
    await resetApp();
    showError("PDFの読み込みに失敗しました。破損ファイルでないか確認してください。");
    setStatus("PDFの読み込みに失敗しました。");
  } finally {
    setBusy(false);
    setLoading(false);
  }
}

function handleDropzoneKeydown(event, input) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    input.click();
  }
}

function handleDragEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

function bindDropzone(dropzone, input, onFiles) {
  dropzone.addEventListener("keydown", (event) => {
    handleDropzoneKeydown(event, input);
  });
  dropzone.addEventListener("dragenter", (event) => {
    handleDragEvent(event);
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragover", (event) => {
    handleDragEvent(event);
    dropzone.classList.add("is-dragover");
  });
  dropzone.addEventListener("dragleave", (event) => {
    handleDragEvent(event);
    if (!dropzone.contains(event.relatedTarget)) {
      dropzone.classList.remove("is-dragover");
    }
  });
  dropzone.addEventListener("drop", (event) => {
    handleDragEvent(event);
    dropzone.classList.remove("is-dragover");
    if (event.dataTransfer.files.length > 0) {
      void onFiles(Array.from(event.dataTransfer.files));
    }
  });
}

elements.pdfFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  await loadPdfFile(file);
});

elements.overlayFileInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files || []);
  await addOverlayFiles(files);
});

bindDropzone(elements.pdfDropzone, elements.pdfFileInput, async (files) => {
  await loadPdfFile(files[0]);
});

bindDropzone(elements.overlayDropzone, elements.overlayFileInput, async (files) => {
  await addOverlayFiles(files);
});

elements.opacityRange.addEventListener("input", updateSelectedOverlayOpacity);
elements.rotationRange.addEventListener("input", updateSelectedOverlayRotation);
elements.bringForwardButton.addEventListener("click", () => {
  moveSelectedOverlay(1);
});
elements.sendBackwardButton.addEventListener("click", () => {
  moveSelectedOverlay(-1);
});
elements.removeOverlayButton.addEventListener("click", removeSelectedOverlay);
elements.saveCurrentButton.addEventListener("click", () => {
  void exportCurrentPage();
});
elements.resetPageButton.addEventListener("click", resetCurrentPage);
elements.resetAllButton.addEventListener("click", () => {
  void resetApp();
});

elements.editorCanvas.addEventListener("pointerdown", startInteraction);
elements.editorCanvas.addEventListener("pointermove", continueInteraction);
elements.editorCanvas.addEventListener("pointerup", endInteraction);
elements.editorCanvas.addEventListener("pointercancel", endInteraction);
elements.editorCanvas.addEventListener("pointerleave", () => {
  if (!state.drag) {
    elements.editorCanvas.style.cursor = "default";
  }
});

void resetApp();
