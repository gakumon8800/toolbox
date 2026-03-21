const form = document.getElementById("calculator-form");
const formError = document.getElementById("form-error");
const addExtraCostButton = document.getElementById("add-extra-cost");
const extraCostsContainer = document.getElementById("extra-costs");
const extraCostTemplate = document.getElementById("extra-cost-template");

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

function render(values) {
  const otherCosts = values.extraCosts.reduce((sum, item) => {
    return sum + (Number.isFinite(item.amount) ? item.amount : 0);
  }, 0);
  const totalCosts = values.brokerageFee + values.registrationCost + values.loanFees + values.taxAdjustment + values.reformCost + otherCosts;
  const totalInitialCost = values.propertyPrice + totalCosts;
  const requiredCash = totalInitialCost - values.loanAmount;
  const difference = values.ownFunds - requiredCash;
  const monthlyPayment = calculateMonthlyPayment(values.loanAmount, values.annualInterestRate, values.loanYears);

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

amountFieldIds.forEach((id) => attachAmountFormatter(getAmountInput(id)));

form.querySelectorAll('input[name="loanAmountMode"], input[name="brokerageFeeMode"]').forEach((input) => {
  input.addEventListener("change", calculateAndRender);
});

document.getElementById("annualInterestRate").addEventListener("input", calculateAndRender);
document.getElementById("loanYears").addEventListener("input", calculateAndRender);

addExtraCostButton.addEventListener("click", () => addExtraCostRow("", 0));
form.addEventListener("submit", (event) => event.preventDefault());

addExtraCostRow("火災保険", 120000);
calculateAndRender();
