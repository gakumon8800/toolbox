(function () {
  'use strict';

  var form = document.getElementById('calculator-form');
  if (!form) {
    return;
  }

  var fixedAssetTaxInput = document.getElementById('fixedAssetTax');
  var cityPlanningTaxInput = document.getElementById('cityPlanningTax');
  var baseDateInput = document.getElementById('baseDate');
  var deliveryDateInput = document.getElementById('deliveryDate');
  var sampleButton = document.getElementById('sample-button');
  var resetButton = document.getElementById('reset-button');
  var printButton = document.getElementById('print-button');
  var formError = document.getElementById('form-error');
  var emptyState = document.getElementById('empty-state');
  var resultContent = document.getElementById('result-content');
  var breakdownBody = document.getElementById('breakdown-body');
  var formulaList = document.getElementById('formula-list');
  var periodSummary = document.getElementById('periodSummary');
  var defaultYear = new Date().getFullYear();

  var summaryElements = {
    totalBuyerAmount: document.getElementById('totalBuyerAmount'),
    sellerDays: document.getElementById('sellerDays'),
    buyerDays: document.getElementById('buyerDays'),
    appliedYearDays: document.getElementById('appliedYearDays')
  };

  var sampleState = {
    fixedAssetTax: 80000,
    cityPlanningTax: 20000,
    baseDate: createDateString(defaultYear, 1, 1),
    deliveryDate: createDateString(defaultYear, 6, 30),
    prorationRule: 'buyer_includes_delivery',
    yearDaysMode: 'auto',
    roundingMode: 'floor'
  };

  function createDateString(year, month, day) {
    return String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  function parseLocalDate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }

    var parts = value.split('-');
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);
    var date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() + 1 !== month ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function getYearEnd(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
  }

  function getDateOffset(date, offsetDays) {
    return new Date(date.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  }

  function getDayDiffInclusive(startDate, endDate) {
    var msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function getCheckedValue(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  function getAppliedYearDays(mode, year) {
    if (mode === '365' || mode === '366') {
      return Number(mode);
    }
    return isLeapYear(year) ? 366 : 365;
  }

  function toNumber(value) {
    var normalized = String(value || '')
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
      .trim();

    if (!normalized) {
      return 0;
    }

    var parsed = Number(normalized);
    return isFinite(parsed) ? parsed : NaN;
  }

  function formatInteger(value) {
    return new Intl.NumberFormat('ja-JP').format(Number(value) || 0);
  }

  function formatYen(value) {
    return formatInteger(value) + '円';
  }

  function formatDecimal(value) {
    return new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatDate(date) {
    return String(date.getUTCFullYear()) + '年' + (date.getUTCMonth() + 1) + '月' + date.getUTCDate() + '日';
  }

  function roundAmount(value, mode) {
    if (mode === 'ceil') {
      return Math.ceil(value);
    }
    if (mode === 'round') {
      return Math.round(value);
    }
    return Math.floor(value);
  }

  function setAmountInputValue(input, value) {
    input.value = formatInteger(value);
  }

  function attachAmountFormatter(input) {
    input.addEventListener('input', function () {
      var digits = input.value.replace(/[^\d]/g, '');
      input.value = digits ? formatInteger(Number(digits)) : '';
    });

    input.addEventListener('blur', function () {
      if (!input.value) {
        return;
      }
      input.value = formatInteger(toNumber(input.value));
    });
  }

  function syncChoiceCards() {
    Array.prototype.slice.call(form.querySelectorAll('.choice-card')).forEach(function (card) {
      var input = card.querySelector('input');
      card.classList.toggle('is-selected', Boolean(input && input.checked));
    });
  }

  function showError(message) {
    formError.hidden = false;
    formError.textContent = message;
    resultContent.hidden = true;
    emptyState.hidden = false;
  }

  function clearError() {
    formError.hidden = true;
    formError.textContent = '';
  }

  function collectValues() {
    return {
      fixedAssetTax: toNumber(fixedAssetTaxInput.value),
      cityPlanningTax: toNumber(cityPlanningTaxInput.value),
      baseDate: parseLocalDate(baseDateInput.value),
      deliveryDate: parseLocalDate(deliveryDateInput.value),
      prorationRule: getCheckedValue('prorationRule'),
      yearDaysMode: getCheckedValue('yearDaysMode'),
      roundingMode: getCheckedValue('roundingMode')
    };
  }

  function validate(values) {
    if (!isFinite(values.fixedAssetTax) || values.fixedAssetTax < 0) {
      return '固定資産税 年額は0円以上の数値で入力してください。';
    }

    if (!isFinite(values.cityPlanningTax) || values.cityPlanningTax < 0) {
      return '都市計画税 年額は0円以上の数値で入力してください。';
    }

    if (!values.baseDate) {
      return '起算日を入力してください。';
    }

    if (!values.deliveryDate) {
      return '引渡日を入力してください。';
    }

    if (values.deliveryDate.getTime() < values.baseDate.getTime()) {
      return '引渡日は起算日以後の日付を入力してください。';
    }

    if (values.deliveryDate.getUTCFullYear() !== values.baseDate.getUTCFullYear()) {
      return '起算日と引渡日は同一年内の日付で入力してください。';
    }

    return '';
  }

  function calculateDayCounts(values) {
    var yearEnd = getYearEnd(values.baseDate);
    var totalTargetDays = getDayDiffInclusive(values.baseDate, yearEnd);
    var sellerDays;

    if (values.prorationRule === 'seller_includes_delivery') {
      sellerDays = getDayDiffInclusive(values.baseDate, values.deliveryDate);
    } else {
      sellerDays = getDayDiffInclusive(values.baseDate, getDateOffset(values.deliveryDate, -1));
      sellerDays = Math.max(0, sellerDays);
    }

    return {
      yearEnd: yearEnd,
      totalTargetDays: totalTargetDays,
      sellerDays: sellerDays,
      buyerDays: totalTargetDays - sellerDays
    };
  }

  function buildTaxLine(label, annualAmount, dayCounts, appliedYearDays, roundingMode) {
    var dailyAmount = annualAmount / appliedYearDays;
    return {
      label: label,
      annualAmount: annualAmount,
      dailyAmount: dailyAmount,
      sellerAmount: roundAmount(dailyAmount * dayCounts.sellerDays, roundingMode),
      buyerAmount: roundAmount(dailyAmount * dayCounts.buyerDays, roundingMode)
    };
  }

  function calculate(values) {
    var dayCounts = calculateDayCounts(values);
    var appliedYearDays = getAppliedYearDays(values.yearDaysMode, values.baseDate.getUTCFullYear());
    var lines = [
      buildTaxLine('固定資産税', values.fixedAssetTax, dayCounts, appliedYearDays, values.roundingMode),
      buildTaxLine('都市計画税', values.cityPlanningTax, dayCounts, appliedYearDays, values.roundingMode)
    ];

    return {
      appliedYearDays: appliedYearDays,
      dayCounts: dayCounts,
      lines: lines,
      totals: {
        annualAmount: lines[0].annualAmount + lines[1].annualAmount,
        dailyAmount: lines[0].dailyAmount + lines[1].dailyAmount,
        sellerAmount: lines[0].sellerAmount + lines[1].sellerAmount,
        buyerAmount: lines[0].buyerAmount + lines[1].buyerAmount
      }
    };
  }

  function renderSummary(result) {
    summaryElements.totalBuyerAmount.textContent = formatYen(result.totals.buyerAmount);
    summaryElements.sellerDays.textContent = formatInteger(result.dayCounts.sellerDays) + '日';
    summaryElements.buyerDays.textContent = formatInteger(result.dayCounts.buyerDays) + '日';
    summaryElements.appliedYearDays.textContent = formatInteger(result.appliedYearDays) + '日';
  }

  function renderTable(result) {
    var rows = result.lines.map(function (line) {
      return '<tr>' +
        '<td>' + line.label + '</td>' +
        '<td class="number-cell">' + formatYen(line.annualAmount) + '</td>' +
        '<td class="number-cell">' + formatDecimal(line.dailyAmount) + '円</td>' +
        '<td class="number-cell">' + formatYen(line.sellerAmount) + '</td>' +
        '<td class="number-cell">' + formatYen(line.buyerAmount) + '</td>' +
      '</tr>';
    });

    rows.push('<tr>' +
      '<td>合計</td>' +
      '<td class="number-cell">' + formatYen(result.totals.annualAmount) + '</td>' +
      '<td class="number-cell">' + formatDecimal(result.totals.dailyAmount) + '円</td>' +
      '<td class="number-cell">' + formatYen(result.totals.sellerAmount) + '</td>' +
      '<td class="number-cell">' + formatYen(result.totals.buyerAmount) + '</td>' +
    '</tr>');

    breakdownBody.innerHTML = rows.join('');
  }

  function renderFormulas(values, result) {
    formulaList.innerHTML = result.lines.map(function (line) {
      return '<article class="formula-card">' +
        '<h4>' + line.label + '</h4>' +
        '<p>' + line.label + '年額 ' + formatYen(line.annualAmount) + ' ÷ ' + formatInteger(result.appliedYearDays) + '日 = 1日あたり' + formatDecimal(line.dailyAmount) + '円</p>' +
        '<p>売主負担日数 ' + formatInteger(result.dayCounts.sellerDays) + '日 × 1日あたり' + formatDecimal(line.dailyAmount) + '円 = ' + formatYen(line.sellerAmount) + '</p>' +
        '<p>買主負担日数 ' + formatInteger(result.dayCounts.buyerDays) + '日 × 1日あたり' + formatDecimal(line.dailyAmount) + '円 = ' + formatYen(line.buyerAmount) + '</p>' +
      '</article>';
    }).join('') +
    '<article class="formula-card">' +
      '<h4>合計精算額</h4>' +
      '<p>買主負担額の合計 = 固定資産税 ' + formatYen(result.lines[0].buyerAmount) + ' + 都市計画税 ' + formatYen(result.lines[1].buyerAmount) + '</p>' +
      '<p>買主が売主へ支払う精算額 合計 = ' + formatYen(result.totals.buyerAmount) + '</p>' +
    '</article>';

    periodSummary.textContent =
      '起算日 ' + formatDate(values.baseDate) +
      ' から ' + formatDate(result.dayCounts.yearEnd) +
      ' までを基準期間として計算しています。';
  }

  function renderResult(values, result) {
    clearError();
    emptyState.hidden = true;
    resultContent.hidden = false;
    renderSummary(result);
    renderTable(result);
    renderFormulas(values, result);
  }

  function setState(state) {
    setAmountInputValue(fixedAssetTaxInput, state.fixedAssetTax);
    setAmountInputValue(cityPlanningTaxInput, state.cityPlanningTax);
    baseDateInput.value = state.baseDate;
    deliveryDateInput.value = state.deliveryDate;
    form.querySelector('input[name="prorationRule"][value="' + state.prorationRule + '"]').checked = true;
    form.querySelector('input[name="yearDaysMode"][value="' + state.yearDaysMode + '"]').checked = true;
    form.querySelector('input[name="roundingMode"][value="' + state.roundingMode + '"]').checked = true;
    syncChoiceCards();
  }

  function resetToDefault() {
    setState({
      fixedAssetTax: 0,
      cityPlanningTax: 0,
      baseDate: createDateString(defaultYear, 1, 1),
      deliveryDate: '',
      prorationRule: 'seller_includes_delivery',
      yearDaysMode: 'auto',
      roundingMode: 'floor'
    });
    clearError();
    resultContent.hidden = true;
    emptyState.hidden = false;
    breakdownBody.innerHTML = '';
    formulaList.innerHTML = '';
    periodSummary.textContent = '';
  }

  function handleCalculate() {
    var values = collectValues();
    var errorMessage = validate(values);

    syncChoiceCards();

    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    renderResult(values, calculate(values));
  }

  attachAmountFormatter(fixedAssetTaxInput);
  attachAmountFormatter(cityPlanningTaxInput);

  Array.prototype.slice.call(form.querySelectorAll('input[type="radio"]')).forEach(function (input) {
    input.addEventListener('change', syncChoiceCards);
  });

  sampleButton.addEventListener('click', function () {
    setState(sampleState);
    handleCalculate();
  });

  resetButton.addEventListener('click', resetToDefault);

  printButton.addEventListener('click', function () {
    window.print();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleCalculate();
  });

  resetToDefault();
})();
