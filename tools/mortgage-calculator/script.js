const form = document.getElementById("mortgage-form");
const formMessage = document.getElementById("form-message");
const scheduleBody = document.getElementById("scheduleBody");
const sampleButton = document.getElementById("sample-button");
const resetButton = document.getElementById("reset-button");

const amountFieldIds = [
  "propertyPrice",
  "downPayment",
  "loanAmount",
  "bonusPayment",
  "adminFee",
  "guaranteeFee",
  "managementFee",
  "repairReserve",
  "parkingFee",
  "propertyTaxAnnual",
  "fireInsuranceAnnual",
  "otherMonthlyCost"
];

const rateFieldIds = ["annualRate", "insuranceRate"];
const integerFieldIds = ["loanYears"];

const sampleValues = {
  propertyPrice: 39800000,
  downPayment: 3000000,
  loanAmount: 36800000,
  annualRate: 0.875,
  loanYears: 35,
  bonusPayment: 0,
  bonusFrequency: "0",
  insuranceRate: 0,
  adminFee: 0,
  guaranteeFee: 0,
  managementFee: 12000,
  repairReserve: 15000,
  parkingFee: 15000,
  propertyTaxAnnual: 120000,
  fireInsuranceAnnual: 20000,
  otherMonthlyCost: 0
};

function parseAmount(value) {
  const normalized = String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRate(value) {
  const normalized = String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(Number(value) || 0));
}

function formatYen(value) {
  return `${formatAmount(value)}円`;
}

function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(3)}%`;
}

function setText(id, value) {
  const target = document.getElementById(id);
  if (target) {
    target.textContent = value;
  }
}

function setAmountInputValue(id, value) {
  const input = document.getElementById(id);
  if (input) {
    input.value = formatAmount(value);
  }
}

function setRawInputValue(id, value) {
  const input = document.getElementById(id);
  if (input) {
    input.value = String(value);
  }
}

function getLoanMode() {
  return form.querySelector('input[name="loanMode"]:checked')?.value || "auto";
}

function updateLoanAmountState() {
  const isAuto = getLoanMode() === "auto";
  const loanAmountInput = document.getElementById("loanAmount");
  const loanAmountField = document.getElementById("loanAmountField");

  loanAmountInput.readOnly = isAuto;
  loanAmountField.classList.toggle("readonly", isAuto);
}

function syncAutoLoanAmount() {
  if (getLoanMode() !== "auto") {
    return;
  }

  const propertyPrice = parseAmount(document.getElementById("propertyPrice").value);
  const downPayment = parseAmount(document.getElementById("downPayment").value);
  const loanAmount = Math.max(0, propertyPrice - downPayment);
  setAmountInputValue("loanAmount", loanAmount);
}

function sanitizeIntegerInput(input) {
  input.value = input.value.replace(/[^\d]/g, "");
}

function sanitizeDecimalInput(input) {
  let value = input.value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const parts = value.split(".");
  if (parts.length > 2) {
    value = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  input.value = value;
}

function sanitizeAmountInput(input) {
  const value = input.value.replace(/[^\d]/g, "");
  input.value = value ? formatAmount(Number(value)) : "";
}

function collectValues() {
  const values = {};

  amountFieldIds.forEach((id) => {
    values[id] = parseAmount(document.getElementById(id).value);
  });

  rateFieldIds.forEach((id) => {
    values[id] = parseRate(document.getElementById(id).value);
  });

  integerFieldIds.forEach((id) => {
    values[id] = parseAmount(document.getElementById(id).value);
  });

  values.bonusFrequency = Number(document.getElementById("bonusFrequency").value || 0);
  values.loanMode = getLoanMode();

  if (values.loanMode === "auto") {
    values.loanAmount = Math.max(0, values.propertyPrice - values.downPayment);
  }

  return values;
}

function validate(values) {
  const messages = [];

  if (values.loanYears <= 0) {
    messages.push("返済年数は1年以上で入力してください。");
  }

  if (values.annualRate < 0 || values.insuranceRate < 0) {
    messages.push("金利は0以上で入力してください。");
  }

  if (values.downPayment < 0 || values.loanAmount < 0) {
    messages.push("自己資金と借入額は0以上で入力してください。");
  }

  if (values.bonusFrequency === 0 && values.bonusPayment > 0) {
    messages.push("ボーナス返済額を入力する場合は、ボーナス返済回数を年2回にしてください。");
  }

  return messages;
}

function calculatePayment(principal, periodicRate, periods) {
  if (principal <= 0 || periods <= 0) {
    return 0;
  }

  if (periodicRate === 0) {
    return principal / periods;
  }

  return principal * periodicRate / (1 - Math.pow(1 + periodicRate, -periods));
}

function calculateBonusPrincipal(bonusPayment, annualRate, loanYears, bonusFrequency, loanAmount) {
  if (bonusPayment <= 0 || bonusFrequency <= 0 || loanYears <= 0 || loanAmount <= 0) {
    return 0;
  }

  const periods = loanYears * bonusFrequency;
  const periodicRate = annualRate / 100 / bonusFrequency;

  if (periodicRate === 0) {
    return Math.min(loanAmount, bonusPayment * periods);
  }

  const presentValue = bonusPayment * (1 - Math.pow(1 + periodicRate, -periods)) / periodicRate;
  return Math.min(loanAmount, Math.max(0, presentValue));
}

function simulateSchedule(values) {
  const totalMonths = Math.max(1, Math.round(values.loanYears * 12));
  const annualRate = values.annualRate + values.insuranceRate;
  const monthlyRate = annualRate / 100 / 12;
  const bonusFrequency = values.bonusFrequency;
  const bonusRate = bonusFrequency > 0 ? annualRate / 100 / bonusFrequency : 0;

  // ボーナス返済は簡易方式として別枠の返済系列に分けて概算します。
  const bonusPrincipal = calculateBonusPrincipal(
    values.bonusPayment,
    annualRate,
    values.loanYears,
    bonusFrequency,
    values.loanAmount
  );
  const monthlyPrincipal = Math.max(0, values.loanAmount - bonusPrincipal);
  const monthlyPayment = calculatePayment(monthlyPrincipal, monthlyRate, totalMonths);

  let bonusBalance = bonusPrincipal;
  let monthlyBalance = monthlyPrincipal;
  let totalPayment = 0;
  const monthlyRows = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    let monthPayment = 0;
    let monthPrincipalPaid = 0;
    let monthInterestPaid = 0;

    if (monthlyBalance > 0) {
      const interest = monthlyRate === 0 ? 0 : monthlyBalance * monthlyRate;
      let principalPaid = monthlyPayment - interest;

      if (principalPaid > monthlyBalance) {
        principalPaid = monthlyBalance;
      }

      const actualPayment = principalPaid + interest;
      monthlyBalance = Math.max(0, monthlyBalance - principalPaid);
      monthPayment += actualPayment;
      monthPrincipalPaid += principalPaid;
      monthInterestPaid += interest;
    }

    const isBonusMonth = bonusFrequency === 2 && month % 6 === 0 && bonusBalance > 0;

    if (isBonusMonth) {
      const interest = bonusRate === 0 ? 0 : bonusBalance * bonusRate;
      let principalPaid = values.bonusPayment - interest;

      if (principalPaid < 0) {
        principalPaid = 0;
      }

      if (principalPaid > bonusBalance) {
        principalPaid = bonusBalance;
      }

      const actualPayment = principalPaid + interest;
      bonusBalance = Math.max(0, bonusBalance - principalPaid);
      monthPayment += actualPayment;
      monthPrincipalPaid += principalPaid;
      monthInterestPaid += interest;
    }

    totalPayment += monthPayment;

    monthlyRows.push({
      month,
      payment: monthPayment,
      principal: monthPrincipalPaid,
      interest: monthInterestPaid,
      balance: monthlyBalance + bonusBalance
    });
  }

  const yearlyRows = [];
  for (let year = 1; year <= values.loanYears; year += 1) {
    const start = (year - 1) * 12;
    const yearRows = monthlyRows.slice(start, start + 12);

    if (!yearRows.length) {
      continue;
    }

    yearlyRows.push({
      year,
      payment: yearRows.reduce((sum, row) => sum + row.payment, 0),
      principal: yearRows.reduce((sum, row) => sum + row.principal, 0),
      interest: yearRows.reduce((sum, row) => sum + row.interest, 0),
      balance: yearRows[yearRows.length - 1].balance
    });
  }

  return {
    annualRate,
    monthlyPayment,
    totalPayment,
    monthlyRows,
    yearlyRows
  };
}

function getBalanceAtMonth(monthlyRows, month) {
  if (month <= 0) {
    return monthlyRows[0]?.balance ?? 0;
  }

  const row = monthlyRows[Math.min(month, monthlyRows.length) - 1];
  return row ? row.balance : 0;
}

function calculateComparisonPayment(loanAmount, annualRate, loanYears) {
  const monthlyRate = annualRate / 100 / 12;
  const periods = Math.max(1, Math.round(loanYears * 12));
  return calculatePayment(loanAmount, monthlyRate, periods);
}

function renderSchedule(yearlyRows) {
  if (!yearlyRows.length || yearlyRows.every((row) => row.payment === 0 && row.balance === 0)) {
    scheduleBody.innerHTML = '<tr><td colspan="5" class="empty-row">条件を入力すると返済予定表を表示します。</td></tr>';
    return;
  }

  scheduleBody.innerHTML = yearlyRows
    .map((row) => `
      <tr>
        <td>${row.year}年目</td>
        <td>${formatYen(row.payment)}</td>
        <td>${formatYen(row.principal)}</td>
        <td>${formatYen(row.interest)}</td>
        <td>${formatYen(row.balance)}</td>
      </tr>
    `)
    .join("");
}

function renderResults(values, schedule) {
  const fees = values.adminFee + values.guaranteeFee;
  const initialCash = values.downPayment + fees;
  const propertyTaxMonthly = values.propertyTaxAnnual / 12;
  const fireInsuranceMonthly = values.fireInsuranceAnnual / 12;
  const monthlyHousingTotal =
    schedule.monthlyPayment +
    values.managementFee +
    values.repairReserve +
    values.parkingFee +
    propertyTaxMonthly +
    fireInsuranceMonthly +
    values.otherMonthlyCost;

  const firstMonth = schedule.monthlyRows[0] || { principal: 0, interest: 0 };
  const annualPayment = schedule.yearlyRows[0]?.payment || 0;
  const currentRate = schedule.annualRate;
  const lowRate = Math.max(0, currentRate - 0.2);
  const highRate = currentRate + 0.2;

  setText("resultLoanAmount", formatYen(values.loanAmount));
  setText("resultAppliedRate", formatPercent(currentRate));
  setText("resultMonthlyPayment", formatYen(schedule.monthlyPayment));
  setText("resultBonusPayment", formatYen(values.bonusFrequency > 0 ? values.bonusPayment : 0));
  setText("resultAnnualPayment", formatYen(annualPayment));
  setText("resultTotalPayment", formatYen(schedule.totalPayment));
  setText("resultFees", formatYen(fees));
  setText("resultInitialCash", formatYen(initialCash));

  setText("housingMonthlyPayment", formatYen(schedule.monthlyPayment));
  setText("housingManagementFee", formatYen(values.managementFee));
  setText("housingRepairReserve", formatYen(values.repairReserve));
  setText("housingParkingFee", formatYen(values.parkingFee));
  setText("housingTaxMonthly", formatYen(propertyTaxMonthly));
  setText("housingFireMonthly", formatYen(fireInsuranceMonthly));
  setText("housingOtherCost", formatYen(values.otherMonthlyCost));
  setText("resultMonthlyHousingTotal", formatYen(monthlyHousingTotal));

  setText("compareLowRateLabel", `金利 ${formatPercent(lowRate)}`);
  setText("compareCurrentRateLabel", `現在金利 ${formatPercent(currentRate)}`);
  setText("compareHighRateLabel", `金利 ${formatPercent(highRate)}`);
  setText("compareLowPayment", formatYen(calculateComparisonPayment(values.loanAmount, lowRate, values.loanYears)));
  setText("compareCurrentPayment", formatYen(calculateComparisonPayment(values.loanAmount, currentRate, values.loanYears)));
  setText("compareHighPayment", formatYen(calculateComparisonPayment(values.loanAmount, highRate, values.loanYears)));

  setText("breakdownFirstPrincipal", formatYen(firstMonth.principal));
  setText("breakdownFirstInterest", formatYen(firstMonth.interest));
  setText("balanceAfter1Year", formatYen(getBalanceAtMonth(schedule.monthlyRows, 12)));
  setText("balanceAfter5Years", formatYen(getBalanceAtMonth(schedule.monthlyRows, 60)));
  setText("balanceAfter10Years", formatYen(getBalanceAtMonth(schedule.monthlyRows, 120)));

  renderSchedule(schedule.yearlyRows);
}

function calculateAndRender() {
  syncAutoLoanAmount();
  const values = collectValues();
  const messages = validate(values);

  if (messages.length) {
    formMessage.textContent = messages[0];
    formMessage.classList.add("visible");
    return;
  }

  formMessage.textContent = "";
  formMessage.classList.remove("visible");
  renderResults(values, simulateSchedule(values));
}

function fillSampleValues() {
  Object.entries(sampleValues).forEach(([id, value]) => {
    if (amountFieldIds.includes(id)) {
      setAmountInputValue(id, value);
    } else if (rateFieldIds.includes(id) || integerFieldIds.includes(id)) {
      setRawInputValue(id, value);
    } else {
      const field = document.getElementById(id);
      if (field) {
        field.value = value;
      }
    }
  });

  form.querySelector('input[name="loanMode"][value="auto"]').checked = true;
  updateLoanAmountState();
  syncAutoLoanAmount();
  calculateAndRender();
}

function resetFormToDefaults() {
  form.reset();
  amountFieldIds.forEach((id) => setAmountInputValue(id, 0));
  setRawInputValue("annualRate", 0);
  setRawInputValue("insuranceRate", 0);
  setRawInputValue("loanYears", 35);
  document.getElementById("bonusFrequency").value = "0";
  form.querySelector('input[name="loanMode"][value="auto"]').checked = true;
  updateLoanAmountState();
  syncAutoLoanAmount();
  calculateAndRender();
}

function bindInputFormatting() {
  amountFieldIds.forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener("input", () => {
      sanitizeAmountInput(input);
      if (id === "propertyPrice" || id === "downPayment") {
        syncAutoLoanAmount();
      }
      calculateAndRender();
    });
  });

  rateFieldIds.forEach((id) => {
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

  document.getElementById("bonusFrequency").addEventListener("change", calculateAndRender);
  form.querySelectorAll('input[name="loanMode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      updateLoanAmountState();
      syncAutoLoanAmount();
      calculateAndRender();
    });
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateAndRender();
});

sampleButton.addEventListener("click", fillSampleValues);
resetButton.addEventListener("click", resetFormToDefaults);

updateLoanAmountState();
bindInputFormatting();
resetFormToDefaults();
