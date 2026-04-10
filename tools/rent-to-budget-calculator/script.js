const form = document.getElementById("calculator-form");
const formMessage = document.getElementById("form-message");
const sampleButton = document.getElementById("sample-button");
const resetButton = document.getElementById("reset-button");
const bonusField = document.getElementById("bonus-field");
const bonusResultCard = document.getElementById("bonus-result-card");
const interestComparisonBody = document.getElementById("interest-comparison-body");
const yearsComparisonBody = document.getElementById("years-comparison-body");

const amountFieldIds = [
  "currentRent", "currentParking", "currentCommonFee", "renewalFee", "currentOtherCost",
  "downPayment", "bonusAnnual", "managementFee", "repairReserve", "afterParking",
  "propertyTaxAnnual", "fireInsuranceAnnual", "afterOtherCost"
];
const decimalFieldIds = ["annualRate", "insuranceRate"];
const integerFieldIds = ["loanYears"];
const yearComparisonOptions = [30, 35, 40];
const interestDiffOptions = [-0.2, 0, 0.2];

const defaultValues = {
  currentRent: 0,
  currentParking: 0,
  currentCommonFee: 0,
  renewalFee: 0,
  currentOtherCost: 0,
  annualRate: 0.875,
  insuranceRate: 0,
  loanYears: 35,
  downPayment: 0,
  bonusEnabled: "no",
  bonusAnnual: 0,
  managementFee: 0,
  repairReserve: 0,
  afterParking: 0,
  propertyTaxAnnual: 0,
  fireInsuranceAnnual: 0,
  afterOtherCost: 0
};

const sampleValues = {
  currentRent: 120000,
  currentParking: 10000,
  currentCommonFee: 5000,
  renewalFee: 120000,
  currentOtherCost: 0,
  annualRate: 0.875,
  insuranceRate: 0,
  loanYears: 35,
  downPayment: 3000000,
  bonusEnabled: "no",
  bonusAnnual: 0,
  managementFee: 12000,
  repairReserve: 15000,
  afterParking: 15000,
  propertyTaxAnnual: 120000,
  fireInsuranceAnnual: 20000,
  afterOtherCost: 0
};

function parseNumber(value) {
  const normalized = String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeAmountInput(input) {
  const value = input.value.replace(/[^\d]/g, "");
  input.value = value ? formatAmount(value) : "";
}

function sanitizeDecimalInput(input) {
  let value = input.value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) value = `${parts[0]}.${parts.slice(1).join("")}`;
  input.value = value;
}

function sanitizeIntegerInput(input) {
  input.value = input.value.replace(/[^\d]/g, "");
}

function formatAmount(value) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(Number(value) || 0));
}

function formatYen(value) {
  return `${formatAmount(value)}円`;
}

function formatSignedYen(value) {
  const rounded = Math.round(Number(value) || 0);
  if (rounded > 0) return `+${formatAmount(rounded)}円`;
  if (rounded < 0) return `-${formatAmount(Math.abs(rounded))}円`;
  return "±0円";
}

function formatRate(value) {
  return `${(Number(value) || 0).toFixed(3)}%`;
}

function setText(id, value) {
  const target = document.getElementById(id);
  if (target) target.textContent = value;
}

function setAmountInputValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = formatAmount(value);
}

function setRawInputValue(id, value) {
  const field = document.getElementById(id);
  if (field) field.value = String(value);
}

function getBonusEnabled() {
  return form.querySelector('input[name="bonusEnabled"]:checked')?.value || "no";
}

function toggleBonusField() {
  const enabled = getBonusEnabled() === "yes";
  bonusField.classList.toggle("is-disabled", !enabled);
  bonusField.querySelector("input").disabled = !enabled;
}

function clampYears(years) {
  return Math.min(50, Math.max(20, Math.round(years || 0) || 35));
}

function collectValues() {
  return {
    currentRent: parseNumber(document.getElementById("currentRent").value),
    currentParking: parseNumber(document.getElementById("currentParking").value),
    currentCommonFee: parseNumber(document.getElementById("currentCommonFee").value),
    renewalFee: parseNumber(document.getElementById("renewalFee").value),
    currentOtherCost: parseNumber(document.getElementById("currentOtherCost").value),
    annualRate: parseNumber(document.getElementById("annualRate").value),
    insuranceRate: parseNumber(document.getElementById("insuranceRate").value),
    loanYears: parseNumber(document.getElementById("loanYears").value),
    downPayment: parseNumber(document.getElementById("downPayment").value),
    bonusEnabled: getBonusEnabled(),
    bonusAnnual: parseNumber(document.getElementById("bonusAnnual").value),
    managementFee: parseNumber(document.getElementById("managementFee").value),
    repairReserve: parseNumber(document.getElementById("repairReserve").value),
    afterParking: parseNumber(document.getElementById("afterParking").value),
    propertyTaxAnnual: parseNumber(document.getElementById("propertyTaxAnnual").value),
    fireInsuranceAnnual: parseNumber(document.getElementById("fireInsuranceAnnual").value),
    afterOtherCost: parseNumber(document.getElementById("afterOtherCost").value)
  };
}

function validate(values) {
  const messages = [];
  if (values.currentRent < 0) messages.push("現在の家賃は0円以上で入力してください。");
  if (values.annualRate < 0 || values.insuranceRate < 0) messages.push("金利は0%以上で入力してください。");
  if (values.loanYears <= 0) messages.push("返済年数は1年以上で入力してください。");

  const nonNegativeKeys = [
    "currentParking", "currentCommonFee", "renewalFee", "currentOtherCost", "downPayment",
    "bonusAnnual", "managementFee", "repairReserve", "afterParking",
    "propertyTaxAnnual", "fireInsuranceAnnual", "afterOtherCost"
  ];
  if (nonNegativeKeys.some((key) => values[key] < 0)) messages.push("金額項目は0円以上で入力してください。");
  return messages;
}

function principalFromPayment(paymentPerPeriod, periodicRate, periods) {
  if (paymentPerPeriod <= 0 || periods <= 0) return 0;
  if (periodicRate === 0) return paymentPerPeriod * periods;
  const factor = Math.pow(1 + periodicRate, periods);
  return paymentPerPeriod * ((factor - 1) / (periodicRate * factor));
}

function calculateScenario(baseValues, overrides = {}) {
  const values = { ...baseValues, ...overrides };
  const loanYears = clampYears(values.loanYears);
  const appliedRate = Math.max(0, values.annualRate + values.insuranceRate);
  const totalMonths = loanYears * 12;
  const monthlyRate = appliedRate / 100 / 12;
  const renewalMonthly = Math.max(0, values.renewalFee) / 24;
  const propertyTaxMonthly = Math.max(0, values.propertyTaxAnnual) / 12;
  const fireInsuranceMonthly = Math.max(0, values.fireInsuranceAnnual) / 12;

  const currentMonthlyCost =
    Math.max(0, values.currentRent) +
    Math.max(0, values.currentParking) +
    Math.max(0, values.currentCommonFee) +
    renewalMonthly +
    Math.max(0, values.currentOtherCost);

  const afterFixedMonthlyCost =
    Math.max(0, values.managementFee) +
    Math.max(0, values.repairReserve) +
    Math.max(0, values.afterParking) +
    propertyTaxMonthly +
    fireInsuranceMonthly +
    Math.max(0, values.afterOtherCost);

  const monthlyLoanBudget = Math.max(0, currentMonthlyCost - afterFixedMonthlyCost);
  const bonusAnnualRequested = values.bonusEnabled === "yes" ? Math.max(0, values.bonusAnnual) : 0;

  // ボーナス返済は簡易反映として、年額分を差し引いた月払い枠と半期払い枠に分けて逆算します。
  const annualRepaymentCapacity = monthlyLoanBudget * 12 + bonusAnnualRequested;
  const bonusAnnualUsed = Math.min(annualRepaymentCapacity, bonusAnnualRequested);
  const monthlyPaymentCapacity = Math.max(0, (annualRepaymentCapacity - bonusAnnualUsed) / 12);
  const monthlyPrincipal = principalFromPayment(monthlyPaymentCapacity, monthlyRate, totalMonths);

  let bonusPrincipal = 0;
  if (bonusAnnualUsed > 0) {
    const bonusPeriods = loanYears * 2;
    const bonusRate = appliedRate / 100 / 2;
    const bonusPaymentEach = bonusAnnualUsed / 2;
    bonusPrincipal = principalFromPayment(bonusPaymentEach, bonusRate, bonusPeriods);
  }

  const borrowingAmount = monthlyPrincipal + bonusPrincipal;
  const purchaseCapacity = borrowingAmount + Math.max(0, values.downPayment);
  const afterMonthlyCost = afterFixedMonthlyCost + monthlyPaymentCapacity;

  return {
    loanYears,
    appliedRate,
    renewalMonthly,
    propertyTaxMonthly,
    fireInsuranceMonthly,
    currentMonthlyCost,
    afterFixedMonthlyCost,
    monthlyLoanBudget,
    monthlyPaymentCapacity,
    bonusAnnualUsed,
    borrowingAmount,
    purchaseCapacity,
    afterMonthlyCost,
    monthlyDifference: afterMonthlyCost - currentMonthlyCost
  };
}

function renderInterestComparison(values) {
  const rows = interestDiffOptions.map((diff) => {
    const rate = Math.max(0, values.annualRate + diff);
    return { diff, scenario: calculateScenario(values, { annualRate: rate }) };
  });

  interestComparisonBody.innerHTML = rows.map((row) => {
    const totalRate = row.scenario.appliedRate;
    const label = row.diff === 0
      ? `現在金利 (${formatRate(totalRate)})`
      : `金利 ${row.diff > 0 ? "+0.2%" : "-0.2%"} (${formatRate(totalRate)})`;
    return `
      <tr class="${row.diff === 0 ? "current" : ""}">
        <td>${label}</td>
        <td>${formatYen(row.scenario.borrowingAmount)}</td>
        <td>${formatYen(row.scenario.purchaseCapacity)}</td>
      </tr>
    `;
  }).join("");
}

function renderYearComparison(values) {
  yearsComparisonBody.innerHTML = yearComparisonOptions.map((years) => {
    const scenario = calculateScenario(values, { loanYears: years });
    return `
      <tr class="${years === clampYears(values.loanYears) ? "current" : ""}">
        <td>${years}年</td>
        <td>${formatYen(scenario.borrowingAmount)}</td>
        <td>${formatYen(scenario.purchaseCapacity)}</td>
      </tr>
    `;
  }).join("");
}

function renderBreakdowns(values, scenario) {
  setText("currentRentValue", formatYen(values.currentRent));
  setText("currentParkingValue", formatYen(values.currentParking));
  setText("currentCommonFeeValue", formatYen(values.currentCommonFee));
  setText("renewalMonthlyValue", formatYen(scenario.renewalMonthly));
  setText("currentOtherValue", formatYen(values.currentOtherCost));
  setText("currentTotalValue", formatYen(scenario.currentMonthlyCost));
  setText("currentBreakdownTotal", formatYen(scenario.currentMonthlyCost));

  setText("afterMonthlyPaymentValue", formatYen(scenario.monthlyPaymentCapacity));
  setText("afterManagementFeeValue", formatYen(values.managementFee));
  setText("afterRepairReserveValue", formatYen(values.repairReserve));
  setText("afterParkingValue", formatYen(values.afterParking));
  setText("afterTaxMonthlyValue", formatYen(scenario.propertyTaxMonthly));
  setText("afterFireMonthlyValue", formatYen(scenario.fireInsuranceMonthly));
  setText("afterOtherValue", formatYen(values.afterOtherCost));
  setText("afterTotalValue", formatYen(scenario.afterMonthlyCost));
  setText("afterBreakdownTotal", formatYen(scenario.afterMonthlyCost));
}

function renderResults(values, scenario) {
  setText("resultBorrowingAmount", formatYen(scenario.borrowingAmount));
  setText("resultPurchaseCapacity", formatYen(scenario.purchaseCapacity));
  setText("resultCurrentMonthlyCost", formatYen(scenario.currentMonthlyCost));
  setText("resultMonthlyLoanBudget", formatYen(scenario.monthlyLoanBudget));
  setText("resultMonthlyPayment", formatYen(scenario.monthlyPaymentCapacity));
  setText("resultBonusPayment", formatYen(scenario.bonusAnnualUsed));
  setText("resultAfterMonthlyCost", formatYen(scenario.afterMonthlyCost));
  setText("resultAppliedRate", formatRate(scenario.appliedRate));
  setText("resultCurrentComparison", formatYen(scenario.currentMonthlyCost));
  setText("resultAfterComparison", formatYen(scenario.afterMonthlyCost));
  setText("resultDifference", formatSignedYen(scenario.monthlyDifference));
  bonusResultCard.classList.toggle("is-hidden", !(values.bonusEnabled === "yes" && scenario.bonusAnnualUsed > 0));

  renderBreakdowns(values, scenario);
  renderInterestComparison(values);
  renderYearComparison(values);
}

function calculateAndRender() {
  const values = collectValues();
  const messages = validate(values);
  if (messages.length) {
    formMessage.textContent = messages[0];
    formMessage.classList.add("visible");
    return;
  }

  formMessage.textContent = "";
  formMessage.classList.remove("visible");
  renderResults(values, calculateScenario(values));
}

function fillForm(values) {
  amountFieldIds.forEach((id) => setAmountInputValue(id, values[id]));
  decimalFieldIds.forEach((id) => setRawInputValue(id, values[id]));
  integerFieldIds.forEach((id) => setRawInputValue(id, values[id]));
  form.querySelector(`input[name="bonusEnabled"][value="${values.bonusEnabled}"]`).checked = true;
  toggleBonusField();
  calculateAndRender();
}

function bindInputEvents() {
  amountFieldIds.forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("input", () => {
      sanitizeAmountInput(input);
      calculateAndRender();
    });
  });

  decimalFieldIds.forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("input", () => {
      sanitizeDecimalInput(input);
      calculateAndRender();
    });
  });

  integerFieldIds.forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("input", () => {
      sanitizeIntegerInput(input);
      calculateAndRender();
    });
  });

  form.querySelectorAll('input[name="bonusEnabled"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      toggleBonusField();
      calculateAndRender();
    });
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateAndRender();
});

sampleButton.addEventListener("click", () => fillForm(sampleValues));
resetButton.addEventListener("click", () => fillForm(defaultValues));

toggleBonusField();
bindInputEvents();
fillForm(defaultValues);
