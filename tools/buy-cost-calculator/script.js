const form = document.getElementById("calculator-form");
const formError = document.getElementById("form-error");
const addExtraCostButton = document.getElementById("add-extra-cost");
const extraCostsContainer = document.getElementById("extra-costs");
const extraCostTemplate = document.getElementById("extra-cost-template");
const printPdfButton = document.getElementById("print-pdf-button");
const pdfCanvasButton = document.getElementById("pdf-canvas-button");
const jpgExportButton = document.getElementById("jpg-export-button");
const exportStatus = document.getElementById("export-status");
const submissionSheet = document.getElementById("submission-sheet");
const docBreakdownBody = document.getElementById("docBreakdownBody");

const amountFieldIds = [
  "propertyPrice",
  "ownFunds",
  "loanAmount",
  "brokerageFee",
  "registrationCost",
  "loanFees",
  "taxAdjustment",
  "reformCost"
];

const requiredRules = {
  propertyPrice: { label: "物件価格", min: 1 },
  ownFunds: { label: "自己資金", min: 0 },
  loanAmount: { label: "借入額", min: 0 },
  brokerageFee: { label: "仲介手数料", min: 0 },
  registrationCost: { label: "登記費用", min: 0 },
  loanFees: { label: "ローン費用", min: 0 },
  taxAdjustment: { label: "税金清算金", min: 0 },
  reformCost: { label: "リフォーム費用", min: 0 },
  annualInterestRate: { label: "金利", min: 0, max: 20 },
  loanYears: { label: "返済期間", min: 1, max: 50 }
};

const outputMap = {
  displayPropertyPrice: "propertyPrice",
  displayLoanAmount: "loanAmount",
  displayBrokerageFee: "brokerageFee",
  displayRegistrationCost: "registrationCost",
  displayLoanFees: "loanFees",
  displayTaxAdjustment: "taxAdjustment",
  displayReformCost: "reformCost"
};

let latestComputedResult = null;

function parseAmount(value) {
  if (typeof value !== "string") {
    return Number(value);
  }

  const normalized = value.replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}

function formatAmount(value) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(value));
}

function formatYen(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}${formatAmount(Math.abs(value))}円`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function setAmountInputValue(input, value) {
  if (!input) {
    return;
  }

  if (!Number.isFinite(value)) {
    input.value = "";
    return;
  }

  input.value = formatAmount(value);
}

function setFieldError(name, message = "") {
  const field = form.querySelector(`[name="${name}"]`)?.closest(".field");
  const error = document.getElementById(`${name}-error`);
  if (!field || !error) {
    return;
  }

  field.classList.toggle("invalid", Boolean(message));
  error.textContent = message;
}

function clearErrors() {
  Object.keys(requiredRules).forEach((name) => setFieldError(name, ""));
  formError.textContent = "";
  formError.classList.remove("visible");
}

function getAmountInput(id) {
  return document.getElementById(id);
}

function getMode(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "auto";
}

function getTextValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function calculateAutoBrokerageFee(propertyPrice) {
  return Math.max(0, Math.round((propertyPrice * 0.03 + 60000) * 1.1));
}

function collectValues() {
  const values = {};

  amountFieldIds.forEach((id) => {
    values[id] = parseAmount(getAmountInput(id).value);
  });

  values.annualInterestRate = Number(document.getElementById("annualInterestRate").value);
  values.loanYears = Number(document.getElementById("loanYears").value);
  values.loanAmountMode = getMode("loanAmountMode");
  values.brokerageFeeMode = getMode("brokerageFeeMode");
  values.companyName = getTextValue("companyName");
  values.staffName = getTextValue("staffName");
  values.extraCosts = Array.from(extraCostsContainer.querySelectorAll(".extra-item")).map((item) => {
    const name = item.querySelector(".extra-cost-name")?.value.trim() || "その他費用";
    const amount = parseAmount(item.querySelector(".extra-cost-amount")?.value || "0");
    return {
      name,
      amount: Number.isFinite(amount) ? amount : Number.NaN
    };
  });

  return values;
}

function syncAutoFields(values) {
  if (Number.isFinite(values.propertyPrice) && Number.isFinite(values.ownFunds) && values.loanAmountMode === "auto") {
    const loanAmount = Math.max(0, Math.round(values.propertyPrice - values.ownFunds));
    values.loanAmount = loanAmount;
    setAmountInputValue(getAmountInput("loanAmount"), loanAmount);
  }

  if (Number.isFinite(values.propertyPrice) && values.brokerageFeeMode === "auto") {
    const brokerageFee = calculateAutoBrokerageFee(values.propertyPrice);
    values.brokerageFee = brokerageFee;
    setAmountInputValue(getAmountInput("brokerageFee"), brokerageFee);
  }
}

function updateReadonlyState() {
  const loanAmountInput = getAmountInput("loanAmount");
  const brokerageFeeInput = getAmountInput("brokerageFee");
  const loanReadonly = getMode("loanAmountMode") === "auto";
  const brokerageReadonly = getMode("brokerageFeeMode") === "auto";

  loanAmountInput.readOnly = loanReadonly;
  brokerageFeeInput.readOnly = brokerageReadonly;
  loanAmountInput.closest(".field")?.classList.toggle("readonly", loanReadonly);
  brokerageFeeInput.closest(".field")?.classList.toggle("readonly", brokerageReadonly);
}

function validate(values) {
  const errors = {};

  Object.entries(requiredRules).forEach(([name, rule]) => {
    const value = values[name];

    if (!Number.isFinite(value)) {
      errors[name] = `${rule.label}を入力してください。`;
      return;
    }

    if (rule.min !== undefined && value < rule.min) {
      errors[name] = `${rule.label}は${formatAmount(rule.min)}以上で入力してください。`;
      return;
    }

    if (rule.max !== undefined && value > rule.max) {
      errors[name] = `${rule.label}は${formatAmount(rule.max)}以下で入力してください。`;
    }
  });

  if (!errors.loanAmount && !errors.propertyPrice && values.loanAmount > values.propertyPrice) {
    errors.loanAmount = "借入額は物件価格以下で入力してください。";
  }

  if (!errors.ownFunds && !errors.propertyPrice && values.ownFunds > values.propertyPrice && values.loanAmountMode === "auto") {
    errors.ownFunds = "自己資金が物件価格を上回る場合は借入額を手入力に切り替えてください。";
  }

  const invalidExtra = values.extraCosts.find((item) => !Number.isFinite(item.amount) || item.amount < 0);
  if (invalidExtra) {
    errors.extraCosts = "その他費用に未入力または負の金額があります。";
  }

  return errors;
}

function calculateMonthlyPayment(principal, annualRate, years) {
  if (principal <= 0 || annualRate < 0 || years <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;
  const payments = years * 12;

  if (monthlyRate === 0) {
    return principal / payments;
  }

  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -payments));
}

function createBreakdownRows(values) {
  const rows = [
    { label: "仲介手数料", amount: values.brokerageFee },
    { label: "登記費用", amount: values.registrationCost },
    { label: "ローン費用", amount: values.loanFees },
    { label: "税金清算金", amount: values.taxAdjustment },
    { label: "リフォーム費用", amount: values.reformCost }
  ];

  values.extraCosts.forEach((item) => {
    rows.push({
      label: item.name || "その他費用",
      amount: Number.isFinite(item.amount) ? item.amount : 0
    });
  });

  return rows;
}

function setDocumentMetaRow(rowId, valueId, value) {
  const row = document.getElementById(rowId);
  const target = document.getElementById(valueId);
  if (!row || !target) {
    return;
  }

  const hasValue = Boolean(value);
  row.style.display = hasValue ? "flex" : "none";
  target.textContent = hasValue ? value : "-";
}

function renderDocument(result) {
  document.getElementById("docCreatedDate").textContent = formatDate(new Date());
  setDocumentMetaRow("docCompanyRow", "docCompanyName", result.values.companyName);
  setDocumentMetaRow("docStaffRow", "docStaffName", result.values.staffName);

  document.getElementById("docPropertyPrice").textContent = formatYen(result.values.propertyPrice);
  document.getElementById("docOwnFunds").textContent = formatYen(result.values.ownFunds);
  document.getElementById("docLoanAmount").textContent = formatYen(result.values.loanAmount);
  document.getElementById("docMonthlyPayment").textContent = formatYen(result.monthlyPayment);
  document.getElementById("docTotalCosts").textContent = formatYen(result.totalCosts);
  document.getElementById("docTotalInitialCost").textContent = formatYen(result.totalInitialCost);
  document.getElementById("docRequiredCash").textContent = formatYen(result.requiredCash);
  document.getElementById("docFundDifference").textContent = formatYen(result.difference);
  document.getElementById("docLoanSummary").textContent =
    `借入条件: ${formatYen(result.values.loanAmount)} / 金利 ${result.values.annualInterestRate.toFixed(3)}% / 返済期間 ${result.values.loanYears}年`;

  docBreakdownBody.innerHTML = "";
  result.breakdownRows.forEach((row) => {
    const tr = document.createElement("tr");
    const labelCell = document.createElement("td");
    const amountCell = document.createElement("td");
    labelCell.textContent = row.label;
    amountCell.textContent = formatYen(row.amount);
    tr.append(labelCell, amountCell);
    docBreakdownBody.appendChild(tr);
  });
}

function render(values) {
  const otherCosts = values.extraCosts.reduce((sum, item) => {
    return sum + (Number.isFinite(item.amount) ? item.amount : 0);
  }, 0);
  const totalCosts = values.brokerageFee + values.registrationCost + values.loanFees + values.taxAdjustment + values.reformCost + otherCosts;
  const totalInitialCost = values.propertyPrice + totalCosts;
  const requiredCash = totalInitialCost - values.loanAmount;
  const difference = values.ownFunds - requiredCash;
  const monthlyPayment = calculateMonthlyPayment(values.loanAmount, values.annualInterestRate, values.loanYears);
  const breakdownRows = createBreakdownRows(values);

  document.getElementById("totalCosts").textContent = formatYen(totalCosts);
  document.getElementById("totalInitialCost").textContent = formatYen(totalInitialCost);
  document.getElementById("requiredCash").textContent = formatYen(requiredCash);
  document.getElementById("fundDifference").textContent = formatYen(difference);
  document.getElementById("monthlyPayment").textContent = formatYen(monthlyPayment);
  document.getElementById("payment-note").textContent = `${formatYen(values.loanAmount)} / 金利 ${values.annualInterestRate.toFixed(3)}% / ${values.loanYears}年 で試算`;
  document.getElementById("displayOtherCosts").textContent = formatYen(otherCosts);

  Object.entries(outputMap).forEach(([elementId, valueKey]) => {
    document.getElementById(elementId).textContent = formatYen(values[valueKey]);
  });

  const differenceCard = document.getElementById("difference-card");
  const differenceNote = document.getElementById("difference-note");
  differenceCard.classList.remove("positive", "negative");
  differenceCard.classList.add(difference >= 0 ? "positive" : "negative");
  differenceNote.textContent = difference >= 0 ? "自己資金に余力があります。" : "自己資金が不足しています。";

  latestComputedResult = {
    values,
    otherCosts,
    totalCosts,
    totalInitialCost,
    requiredCash,
    difference,
    monthlyPayment,
    breakdownRows
  };

  renderDocument(latestComputedResult);
}

function calculateAndRender() {
  clearErrors();
  updateReadonlyState();

  const values = collectValues();
  syncAutoFields(values);
  const errors = validate(values);

  Object.entries(errors).forEach(([name, message]) => {
    if (name !== "extraCosts") {
      setFieldError(name, message);
    }
  });

  if (Object.keys(errors).length > 0) {
    formError.textContent = errors.extraCosts || "未入力または入力内容に誤りがあります。赤字の項目を確認してください。";
    formError.classList.add("visible");
    latestComputedResult = null;
    return;
  }

  render(values);
}

function attachAmountFormatter(input) {
  input.addEventListener("input", () => {
    const digits = input.value.replace(/[^\d]/g, "");
    input.value = digits ? formatAmount(Number(digits)) : "";
    calculateAndRender();
  });

  input.addEventListener("blur", () => {
    const amount = parseAmount(input.value);
    if (Number.isFinite(amount)) {
      input.value = formatAmount(amount);
    }
  });
}

function addExtraCostRow(name = "", amount = 0) {
  const fragment = extraCostTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".extra-item");
  const nameInput = fragment.querySelector(".extra-cost-name");
  const amountInput = fragment.querySelector(".extra-cost-amount");
  const removeButton = fragment.querySelector(".remove-button");

  nameInput.value = name;
  amountInput.value = formatAmount(amount);
  attachAmountFormatter(amountInput);

  nameInput.addEventListener("input", calculateAndRender);
  removeButton.addEventListener("click", () => {
    item.remove();
    calculateAndRender();
  });

  extraCostsContainer.appendChild(fragment);
  calculateAndRender();
}

function setExportStatus(message) {
  exportStatus.textContent = message;
}

function createExportFilename(extension) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `buy-cost-estimate-${y}${m}${d}.${extension}`;
}

async function captureSubmissionCanvas() {
  if (typeof window.html2canvas !== "function") {
    throw new Error("html2canvas is not loaded");
  }

  return window.html2canvas(submissionSheet, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true
  });
}

function ensureExportable() {
  calculateAndRender();

  if (!latestComputedResult) {
    throw new Error("出力前に入力エラーを解消してください。");
  }
}

async function exportPdfWithCanvas() {
  ensureExportable();

  if (!window.jspdf?.jsPDF) {
    throw new Error("jsPDF is not loaded");
  }

  setExportStatus("生成PDFを書き出しています...");
  const canvas = await captureSubmissionCanvas();
  const imageData = canvas.toDataURL("image/jpeg", 0.98);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight);
  pdf.save(createExportFilename("pdf"));
  setExportStatus("生成PDFを書き出しました。");
}

async function exportJpg() {
  ensureExportable();

  setExportStatus("JPGを書き出しています...");
  const canvas = await captureSubmissionCanvas();
  const imageData = canvas.toDataURL("image/jpeg", 0.95);
  const link = document.createElement("a");
  link.href = imageData;
  link.download = createExportFilename("jpg");
  link.click();
  setExportStatus("JPGを書き出しました。");
}

function printPdf() {
  ensureExportable();
  setExportStatus("印刷ダイアログを開いています...");
  window.print();
  setExportStatus("印刷ダイアログを開きました。ブラウザ側で PDF 保存を選択してください。");
}

amountFieldIds.forEach((id) => attachAmountFormatter(getAmountInput(id)));

form.querySelectorAll('input[name="loanAmountMode"], input[name="brokerageFeeMode"]').forEach((input) => {
  input.addEventListener("change", calculateAndRender);
});

document.getElementById("annualInterestRate").addEventListener("input", calculateAndRender);
document.getElementById("loanYears").addEventListener("input", calculateAndRender);
document.getElementById("companyName").addEventListener("input", calculateAndRender);
document.getElementById("staffName").addEventListener("input", calculateAndRender);

addExtraCostButton.addEventListener("click", () => addExtraCostRow("", 0));
form.addEventListener("submit", (event) => event.preventDefault());
printPdfButton.addEventListener("click", () => {
  try {
    printPdf();
  } catch (error) {
    setExportStatus(error.message);
  }
});
pdfCanvasButton.addEventListener("click", async () => {
  try {
    await exportPdfWithCanvas();
  } catch (error) {
    setExportStatus(error.message);
  }
});
jpgExportButton.addEventListener("click", async () => {
  try {
    await exportJpg();
  } catch (error) {
    setExportStatus(error.message);
  }
});

addExtraCostRow("火災保険", 120000);
calculateAndRender();
