const pdfjsLibGlobal = window.pdfjsLib;

pdfjsLibGlobal.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const elements = {
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("pdfFileInput"),
  fileSummary: document.getElementById("fileSummary"),
  fileNameText: document.getElementById("fileNameText"),
  pageCountText: document.getElementById("pageCountText"),
  pageCountInline: document.getElementById("pageCountInline"),
  formatSelect: document.getElementById("formatSelect"),
  scaleSelect: document.getElementById("scaleSelect"),
  jpegQualityField: document.getElementById("jpegQualityField"),
  qualityRange: document.getElementById("qualityRange"),
  qualityValue: document.getElementById("qualityValue"),
  previewButton: document.getElementById("previewButton"),
  zipButton: document.getElementById("zipButton"),
  resetButton: document.getElementById("resetButton"),
  statusBox: document.getElementById("statusBox"),
  errorBox: document.getElementById("errorBox"),
  loadingCard: document.getElementById("loadingCard"),
  loadingTitle: document.getElementById("loadingTitle"),
  loadingText: document.getElementById("loadingText"),
  previewGrid: document.getElementById("previewGrid"),
  emptyState: document.getElementById("emptyState")
};

const state = {
  file: null,
  pdfDoc: null,
  pageCount: 0,
  baseName: "",
  previewRunId: 0,
  busy: false
};

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

function setLoading(visible, title = "処理中です", text = "") {
  elements.loadingCard.hidden = !visible;
  elements.loadingCard.setAttribute("aria-hidden", String(!visible));
  elements.loadingTitle.textContent = title;
  elements.loadingText.textContent = text;
}

function updateQualityVisibility() {
  const isJpeg = elements.formatSelect.value === "jpeg";
  elements.jpegQualityField.hidden = !isJpeg;
}

function updateQualityLabel() {
  elements.qualityValue.textContent = `${elements.qualityRange.value}%`;
}

function updateActionButtons() {
  const hasPdf = Boolean(state.pdfDoc);
  const disabled = !hasPdf || state.busy;

  elements.previewButton.disabled = disabled;
  elements.zipButton.disabled = disabled;
}

function setBusy(isBusy) {
  state.busy = isBusy;
  updateActionButtons();
}

function formatPageLabel(pageNumber) {
  return `ページ ${String(pageNumber).padStart(2, "0")}`;
}

function getBaseName(fileName) {
  return fileName.replace(/\.pdf$/i, "") || "document";
}

function createEmptyState() {
  elements.previewGrid.innerHTML = "";
  elements.previewGrid.appendChild(elements.emptyState);
}

function resetPreviewArea() {
  elements.previewGrid.innerHTML = "";
  elements.emptyState.hidden = false;
  elements.previewGrid.appendChild(elements.emptyState);
  elements.pageCountInline.textContent = "0";
}

async function cleanupPdfDocument() {
  if (!state.pdfDoc) {
    return;
  }

  try {
    await state.pdfDoc.destroy();
  } catch (error) {
    console.warn("PDFの解放中にエラーが発生しました。", error);
  }

  state.pdfDoc = null;
}

async function resetApp() {
  state.previewRunId += 1;
  setBusy(false);
  clearError();
  await cleanupPdfDocument();

  state.file = null;
  state.pageCount = 0;
  state.baseName = "";

  elements.fileInput.value = "";
  elements.fileSummary.hidden = true;
  elements.fileNameText.textContent = "-";
  elements.pageCountText.textContent = "-";
  updateQualityVisibility();
  updateQualityLabel();
  resetPreviewArea();
  updateActionButtons();
  setLoading(false);
  setStatus("PDFを選択すると、ここに処理状況を表示します。");
}

function getOutputOptions() {
  const format = elements.formatSelect.value;
  const scale = Number(elements.scaleSelect.value);
  const quality = Number(elements.qualityRange.value) / 100;

  return {
    format,
    scale,
    quality,
    mimeType: format === "jpeg" ? "image/jpeg" : "image/png",
    extension: format === "jpeg" ? "jpg" : "png"
  };
}

function getPageFileName(pageNumber, extension) {
  return `${state.baseName}.page-${String(pageNumber).padStart(2, "0")}.${extension}`;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function renderPageToCanvas(pageNumber, scale) {
  const page = await state.pdfDoc.getPage(pageNumber);
  return renderLoadedPageToCanvas(page, scale);
}

async function renderLoadedPageToCanvas(page, scale) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();

  await page.render({
    canvasContext: context,
    viewport
  }).promise;

  return canvas;
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("画像データの生成に失敗しました。"));
        return;
      }

      resolve(blob);
    }, mimeType, quality);
  });
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

async function saveSinglePage(pageNumber, button) {
  if (!state.pdfDoc || state.busy) {
    return;
  }

  const originalText = button.textContent;
  const options = getOutputOptions();

  button.disabled = true;
  button.classList.add("is-saving");
  button.textContent = "保存中...";

  try {
    clearError();
    setStatus(`${formatPageLabel(pageNumber)} を画像化しています。`);

    const canvas = await renderPageToCanvas(pageNumber, options.scale);
    const blob = await canvasToBlob(canvas, options.mimeType, options.quality);
    downloadBlob(blob, getPageFileName(pageNumber, options.extension));

    setStatus(`${formatPageLabel(pageNumber)} を保存しました。`);
  } catch (error) {
    console.error("[pdf-to-image] 個別保存エラー", error);
    showError("ページ画像の保存に失敗しました。PDFが破損していないか確認してください。");
    setStatus("保存中にエラーが発生しました。");
  } finally {
    button.disabled = false;
    button.classList.remove("is-saving");
    button.textContent = originalText;
  }
}

function createPreviewCard(pageNumber, canvas) {
  const card = document.createElement("article");
  card.className = "card preview-card";

  const header = document.createElement("div");
  header.className = "preview-card-header";

  const pageLabel = document.createElement("h3");
  pageLabel.className = "page-label";
  pageLabel.textContent = formatPageLabel(pageNumber);

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "save-button";
  saveButton.textContent = "このページを保存";
  saveButton.addEventListener("click", () => {
    void saveSinglePage(pageNumber, saveButton);
  });

  header.append(pageLabel, saveButton);

  const imageWrap = document.createElement("div");
  imageWrap.className = "preview-image-wrap";
  imageWrap.appendChild(canvas);

  const description = document.createElement("p");
  description.textContent = "保存時には現在の画像形式・倍率設定が反映されます。";

  card.append(header, imageWrap, description);
  return card;
}

async function buildPreviews() {
  if (!state.pdfDoc || state.busy) {
    return;
  }

  const runId = ++state.previewRunId;

  clearError();
  setBusy(true);
  setLoading(true, "プレビュー生成中", "PDFページを順番に読み込んでいます。");
  elements.previewGrid.innerHTML = "";
  elements.pageCountInline.textContent = String(state.pageCount);

  try {
    for (let pageNumber = 1; pageNumber <= state.pageCount; pageNumber += 1) {
      if (runId !== state.previewRunId) {
        return;
      }

      const page = await state.pdfDoc.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const previewScale = Math.min(1.1, 220 / baseViewport.width);
      const canvas = await renderLoadedPageToCanvas(page, previewScale);

      elements.previewGrid.appendChild(createPreviewCard(pageNumber, canvas));

      setLoading(
        true,
        "プレビュー生成中",
        `${pageNumber} / ${state.pageCount} ページを処理しました。`
      );
      setStatus(`プレビューを生成中です（${pageNumber} / ${state.pageCount} ページ）。`);
      await waitForNextFrame();
    }

    if (state.pageCount === 0) {
      createEmptyState();
    }

    setStatus(`プレビューを生成しました。全 ${state.pageCount} ページです。`);
  } catch (error) {
    console.error("[pdf-to-image] プレビュー生成エラー", error);
    resetPreviewArea();
    showError("プレビュー生成に失敗しました。別のPDFで再度お試しください。");
    setStatus("プレビュー生成中にエラーが発生しました。");
  } finally {
    setBusy(false);
    setLoading(false);
    console.debug("[pdf-to-image] プレビュー生成処理を終了しました。");
  }
}

async function saveAllPagesAsZip() {
  if (!state.pdfDoc || state.busy) {
    return;
  }

  const options = getOutputOptions();
  const zip = new JSZip();

  clearError();
  setBusy(true);
  setLoading(true, "ZIP作成中", "ページを順番に画像化しています。");

  try {
    for (let pageNumber = 1; pageNumber <= state.pageCount; pageNumber += 1) {
      const canvas = await renderPageToCanvas(pageNumber, options.scale);
      const blob = await canvasToBlob(canvas, options.mimeType, options.quality);

      zip.file(getPageFileName(pageNumber, options.extension), blob);

      setLoading(
        true,
        "ZIP作成中",
        `${pageNumber} / ${state.pageCount} ページをZIPに追加しました。`
      );
      setStatus(`ZIP用に画像化しています（${pageNumber} / ${state.pageCount} ページ）。`);
      await waitForNextFrame();
    }

    setLoading(true, "ZIP作成中", "ZIPファイルを書き出しています。");
    const zipBlob = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }
    );

    downloadBlob(zipBlob, `${state.baseName}.images.zip`);
    setStatus("全ページのZIP保存が完了しました。");
  } catch (error) {
    console.error("[pdf-to-image] ZIP保存エラー", error);
    showError("ZIP保存に失敗しました。ページ数が多い場合は、個別保存もお試しください。");
    setStatus("ZIP保存中にエラーが発生しました。");
  } finally {
    setBusy(false);
    setLoading(false);
  }
}

async function loadPdfFile(file) {
  if (!file) {
    return;
  }

  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    showError("PDFファイルを選択してください。");
    setStatus("PDF以外のファイルは読み込めません。");
    return;
  }

  state.previewRunId += 1;
  clearError();
  setBusy(true);
  setLoading(true, "PDF読込中", "ファイルを確認しています。");

  try {
    await cleanupPdfDocument();

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLibGlobal.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    state.file = file;
    state.pdfDoc = pdfDoc;
    state.pageCount = pdfDoc.numPages;
    state.baseName = getBaseName(file.name);

    elements.fileSummary.hidden = false;
    elements.fileNameText.textContent = file.name;
    elements.pageCountText.textContent = `${state.pageCount}ページ`;
    elements.pageCountInline.textContent = String(state.pageCount);

    setStatus(`PDFを読み込みました。全 ${state.pageCount} ページのプレビューを生成します。`);
  } catch (error) {
    console.error("[pdf-to-image] PDF読み込みエラー", error);
    await resetApp();
    showError("PDFの読み込みに失敗しました。ファイルが破損していないか確認してください。");
    setStatus("PDFを読み込めませんでした。");
    return;
  } finally {
    setBusy(false);
    setLoading(false);
    updateActionButtons();
  }

  await buildPreviews();
}

function handleDropzoneKeydown(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.fileInput.click();
  }
}

function handleDragEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

function handleDragEnter() {
  elements.dropzone.classList.add("is-dragover");
}

function handleDragLeave(event) {
  if (!elements.dropzone.contains(event.relatedTarget)) {
    elements.dropzone.classList.remove("is-dragover");
  }
}

async function handleDrop(event) {
  handleDragEvent(event);
  elements.dropzone.classList.remove("is-dragover");

  const [file] = event.dataTransfer.files;
  await loadPdfFile(file);
}

elements.fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  await loadPdfFile(file);
});

elements.dropzone.addEventListener("keydown", handleDropzoneKeydown);
elements.dropzone.addEventListener("dragenter", (event) => {
  handleDragEvent(event);
  handleDragEnter();
});
elements.dropzone.addEventListener("dragover", (event) => {
  handleDragEvent(event);
  handleDragEnter();
});
elements.dropzone.addEventListener("dragleave", handleDragLeave);
elements.dropzone.addEventListener("drop", (event) => {
  void handleDrop(event);
});

elements.formatSelect.addEventListener("change", updateQualityVisibility);
elements.qualityRange.addEventListener("input", updateQualityLabel);
elements.previewButton.addEventListener("click", () => {
  void buildPreviews();
});
elements.zipButton.addEventListener("click", () => {
  void saveAllPagesAsZip();
});
elements.resetButton.addEventListener("click", () => {
  void resetApp();
});

void resetApp();
