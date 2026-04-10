const form = document.getElementById("calculator-form");
const formMessage = document.getElementById("form-message");
const sampleButton = document.getElementById("sample-button");
const resetButton = document.getElementById("reset-button");
const comparisonBody = document.getElementById("comparison-body");
const ratioInput = document.getElementById("repaymentRatio");
const bonusField = document.getElementById("bonus-field");
const bonusResultCard = document.getElementById("bonus-result-card");

const amountFieldIds = ["ownFunds", "otherDebtAnnual", "bonusAnnual"];
const decimalFieldIds = ["annualIncome", "annualRate", "insuranceRate", "repaymentRatio"];
const integerFieldIds = ["loanYears"];
const comparisonRatios = [20, 25, 30, 35];

const defaultValues = {
  annualIncome: 0,
  loanYears: 35,
  annualRate: 0,
  insuranceRate: 0,
  ownFunds: 0,
  otherDebtAnnual: 0,
  bonusEnabled: "no",
  bonusAnnual: 0,
  repaymentRatio: 25
};

const sampleValues = {
  annualIncome: 500,
  loanYears: 35,
  annualRate: 1.0,
  insuranceRate: 0,
  ownFunds: 3000000,
  otherDebtAnnual: 0,
  bonusEnabled: "no",
  bonusAnnual: 0,
  repaymentRatio: 25
};

function parseNumber(value) {
  const normalized = String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!normalized) {
    return 0;
  }

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
  if (parts.length > 2) {
    value = `${parts[0]}.${parts.slice(1).join("")}`;
  }
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

function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function formatRate(value) {
  return `${(Number(value) || 0).toFixed(3)}%`;
}

function setText(id, value) {
  const target = document.getElementById(id);
  if (target) {
    target.textContent = value;
  }
}

function setAmountInputValue(id, value) {
  const field = document.getElementById(id);
  if (field) {
    field.value = formatAmount(value);
  }
}

function setRawInputValue(id, value) {
  const field = document.getElementById(id);
  if (field) {
    field.value = String(value);
  }
}

function getBonusEnabled() {
  return form.querySelector('input[name="bonusEnabled"]:checked')?.value || "no";
}

function toggleBonusField() {
  const enabled = getBonusEnabled() === "yes";
  bonusField.classList.toggle("is-disabled", !enabled);
  bonusField.querySelector("input").disabled = !enabled;
}

function collectValues() {
  return {
    annualIncome: parseNumber(document.getElementById("annualIncome").value),
    loanYears: parseNumber(document.getElementById("loanYears").value),
    annualRate: parseNumber(document.getElementById("annualRate").value),
    insuranceRate: parseNumber(document.getElementById("insuranceRate").value),
    ownFunds: parseNumber(document.getElementById("ownFunds").value),
    otherDebtAnnual: parseNumber(document.getElementById("otherDebtAnnual").value),
    bonusEnabled: getBonusEnabled(),
    bonusAnnual: parseNumber(document.getElementById("bonusAnnual").value),
    repaymentRatio: parseNumber(document.getElementById("repaymentRatio").value)
  };
}

function validate(values) {
  const messages = [];

  if (values.annualIncome < 0) {
    messages.push("年収は0以上で入力してください。");
  }

  if (values.loanYears <= 0) {
    messages.push("返済年数は1年以上で入力してください。");
  }

  if (values.annualRate < 0 || values.insuranceRate < 0) {
    messages.push("金利は0以上で入力してください。");
  }

  if (values.repaymentRatio < 0 || values.repaymentRatio > 100) {
    messages.push("返済比率は0〜100の範囲で入力してください。");
  }

  if (values.ownFunds < 0 || values.otherDebtAnnual < 0 || values.bonusAnnual < 0) {
    messages.push("金額は0以上で入力してください。");
  }

  return messages;
}

function principalFromPayment(paymentPerPeriod, periodicRate, periods) {
  if (paymentPerPeriod <= 0 || periods <= 0) {
    return 0;
  }

  if (periodicRate === 0) {
    return paymentPerPeriod * periods;
  }

  const factor = Math.pow(1 + periodicRate, periods);
  return paymentPerPeriod * ((factor - 1) / (periodicRate * factor));
}

function calculateScenario(baseValues, ratio) {
  const annualIncomeYen = Math.max(0, baseValues.annualIncome) * 10000;
  const annualCapacity = annualIncomeYen * (Math.max(0, ratio) / 100);
  const housingCapacityAnnual = Math.max(0, annualCapacity - Math.max(0, baseValues.otherDebtAnnual));
  const annualRate = Math.max(0, baseValues.annualRate + baseValues.insuranceRate);
  const totalMonths = Math.max(1, Math.round(baseValues.loanYears * 12));
  const monthlyRate = annualRate / 100 / 12;
  const bonusEnabled = baseValues.bonusEnabled === "yes";

  // ボーナス返済は簡易方式として、年額のうち指定分を年2回返済枠に分けて概算します。
  const bonusAnnualRequested = bonusEnabled ? Math.max(0, baseValues.bonusAnnual) : 0;
  const bonusAnnualUsed = Math.min(housingCapacityAnnual, bonusAnnualRequested);
  const monthlyCapacity = Math.max(0, (housingCapacityAnnual - bonusAnnualUsed) / 12);
  const monthlyPrincipal = principalFromPayment(monthlyCapacity, monthlyRate, totalMonths);

  let bonusPrincipal = 0;
  let bonusPaymentEach = 0;

  if (bonusEnabled && bonusAnnualUsed > 0) {
    const bonusPeriods = Math.max(1, Math.round(baseValues.loanYears * 2));
    const bonusRate = annualRate / 100 / 2;
    bonusPaymentEach = bonusAnnualUsed / 2;
    bonusPrincipal = principalFromPayment(bonusPaymentEach, bonusRate, bonusPeriods);
  }

  const borrowingAmount = monthlyPrincipal + bonusPrincipal;
  const purchaseCapacity = borrowingAmount + Math.max(0, baseValues.ownFunds);

  return {
    annualIncomeYen,
    ratio,
    annualCapacity,
    housingCapacityAnnual,
    annualRate,
    totalMonths,
    monthlyCapacity,
    bonusAnnualUsed,
    bonusPaymentEach,
    borrowingAmount,
    purchaseCapacity
  };
}

function renderComparison(baseValues, currentRatio) {
  const rows = comparisonRatios.map((ratio) => calculateScenario(baseValues, ratio));

  comparisonBody.innerHTML = rows
    .map((row) => `
      <tr class="${Math.abs(row.ratio - currentRatio) < 0.001 ? "current" : ""}">
        <td>${formatPercent(row.ratio)}</td>
        <td>${formatYen(row.annualCapacity)}</td>
        <td>${formatYen(row.borrowingAmount)}</td>
        <td>${formatYen(row.purchaseCapacity)}</td>
      </tr>
    `)
    .join("");
}

function renderInsights(values, scenario) {
  const otherDebtImpact = Math.min(scenario.annualCapacity, Math.max(0, values.otherDebtAnnual));
  const referenceLowRate = calculateScenario({ ...values, annualRate: 0.5, insuranceRate: 0 }, values.repaymentRatio);
  const referenceHighRate = calculateScenario({ ...values, annualRate: 2.0, insuranceRate: 0 }, values.repaymentRatio);

  setText(
    "insightOtherDebt",
    `他の借入の年間返済額 ${formatYen(values.otherDebtAnnual)} により、住宅ローンへ回せる返済枠は ${formatYen(otherDebtImpact)} 分小さくなっています。`
  );

  setText(
    "insightInterest",
    `同条件でも金利が高いほど借入可能額は下がります。参考として年利0.5%想定では ${formatYen(referenceLowRate.borrowingAmount)}、年利2.0%想定では ${formatYen(referenceHighRate.borrowingAmount)} が目安です。`
  );

  setText(
    "insightYears",
    `${values.loanYears}年返済で試算しています。返済年数を延ばすと借入可能額は増えやすい一方、総返済額は増えやすくなる点に注意が必要です。`
  );
}

function renderResults(values, scenario) {
  setText("resultAnnualIncome", formatYen(scenario.annualIncomeYen));
  setText("resultRatio", formatPercent(scenario.ratio));
  setText("resultAnnualCapacity", formatYen(scenario.annualCapacity));
  setText("resultHousingCapacity", formatYen(scenario.housingCapacityAnnual));
  setText("resultBorrowingAmount", formatYen(scenario.borrowingAmount));
  setText("resultPurchaseCapacity", formatYen(scenario.purchaseCapacity));
  setText("resultMonthlyPayment", formatYen(scenario.monthlyCapacity));
  setText("resultBonusPayment", formatYen(scenario.bonusAnnualUsed));
  setText("resultAppliedRate", formatRate(scenario.annualRate));

  const showBonus = values.bonusEnabled === "yes" && scenario.bonusAnnualUsed > 0;
  bonusResultCard.classList.toggle("is-hidden", !showBonus);

  renderComparison(values, values.repaymentRatio);
  renderInsights(values, scenario);
}

function updateRatioChips() {
  const currentRatio = parseNumber(ratioInput.value);
  document.querySelectorAll(".ratio-chip").forEach((button) => {
    const ratio = parseNumber(button.dataset.ratio);
    button.classList.toggle("is-active", Math.abs(ratio - currentRatio) < 0.001);
  });
}

function calculateAndRender() {
  const values = collectValues();
  const messages = validate(values);

  updateRatioChips();

  if (messages.length) {
    formMessage.textContent = messages[0];
    formMessage.classList.add("visible");
    return;
  }

  formMessage.textContent = "";
  formMessage.classList.remove("visible");

  const scenario = calculateScenario(values, values.repaymentRatio);
  renderResults(values, scenario);
}

function fillForm(values) {
  setRawInputValue("annualIncome", values.annualIncome);
  setRawInputValue("loanYears", values.loanYears);
  setRawInputValue("annualRate", values.annualRate);
  setRawInputValue("insuranceRate", values.insuranceRate);
  setAmountInputValue("ownFunds", values.ownFunds);
  setAmountInputValue("otherDebtAnnual", values.otherDebtAnnual);
  setAmountInputValue("bonusAnnual", values.bonusAnnual);
  setRawInputValue("repaymentRatio", values.repaymentRatio);

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

  document.querySelectorAll(".ratio-chip").forEach((button) => {
    button.addEventListener("click", () => {
      ratioInput.value = button.dataset.ratio;
      updateRatioChips();
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
