(function () {
  'use strict';

  var form = document.getElementById('calculator-form');
  if (!form) {
    return;
  }

  var otherCostList = document.getElementById('other-cost-list');
  var otherCostTemplate = document.getElementById('other-cost-template');
  var addOtherCostButton = document.getElementById('add-other-cost');
  var resetButton = document.getElementById('reset-button');
  var guaranteeUnit = document.getElementById('guaranteeUnit');
  var guaranteeHint = document.getElementById('guaranteeHint');
  var proratedRentField = document.getElementById('proratedRentField');
  var includeProratedRentInput = document.getElementById('includeProratedRent');

  var amountFieldIds = [
    'rent',
    'managementFee',
    'fireInsurance',
    'keyExchange',
    'supportFee',
    'adminFee',
    'proratedRent'
  ];

  var defaultState = {
    fields: {
      rent: 85000,
      managementFee: 5000,
      depositMonths: 1,
      keyMoneyMonths: 1,
      brokerageMonths: 1,
      advanceRentMonths: 1,
      guaranteeMode: 'percent',
      guaranteeValue: 50,
      fireInsurance: 18000,
      keyExchange: 22000,
      supportFee: 15000,
      adminFee: 10000,
      includeProratedRent: true,
      proratedRent: 27000,
      taxBrokerage: true,
      taxSupport: true,
      taxAdmin: true
    },
    otherCosts: [
      { name: '消毒費用', amount: 16500 }
    ]
  };

  var resultElements = {
    monthlyCard: document.getElementById('monthlyTotalCard'),
    initialCard: document.getElementById('initialSubtotalCard'),
    grandCard: document.getElementById('grandTotalCard'),
    rent: document.getElementById('resultRent'),
    managementFee: document.getElementById('resultManagementFee'),
    monthlyTotal: document.getElementById('resultMonthlyTotal'),
    deposit: document.getElementById('resultDeposit'),
    keyMoney: document.getElementById('resultKeyMoney'),
    brokerage: document.getElementById('resultBrokerage'),
    advanceRent: document.getElementById('resultAdvanceRent'),
    proratedRent: document.getElementById('resultProratedRent'),
    guarantee: document.getElementById('resultGuarantee'),
    fireInsurance: document.getElementById('resultFireInsurance'),
    keyExchange: document.getElementById('resultKeyExchange'),
    supportFee: document.getElementById('resultSupportFee'),
    adminFee: document.getElementById('resultAdminFee'),
    otherTotal: document.getElementById('resultOtherTotal'),
    initialSubtotal: document.getElementById('resultInitialSubtotal'),
    monthlyTotalAgain: document.getElementById('resultMonthlyTotalAgain'),
    initialSubtotalAgain: document.getElementById('resultInitialSubtotalAgain'),
    grandTotal: document.getElementById('resultGrandTotal'),
    otherBreakdown: document.getElementById('other-breakdown')
  };

  function toSafeNumber(value) {
    if (typeof value === 'number') {
      return isFinite(value) ? value : 0;
    }

    var normalized = String(value || '')
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
      .trim();

    if (!normalized) {
      return 0;
    }

    var parsed = Number(normalized);
    return isFinite(parsed) ? parsed : 0;
  }

  function toNonNegativeNumber(value) {
    return Math.max(0, toSafeNumber(value));
  }

  function roundYen(value) {
    return Math.round(toSafeNumber(value));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ja-JP').format(roundYen(value));
  }

  function formatYen(value) {
    return formatNumber(value) + '円';
  }

  function applyTax(amount, shouldTax) {
    return shouldTax ? amount * 1.1 : amount;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getField(id) {
    return document.getElementById(id);
  }

  function setAmountInputValue(input, value) {
    if (!input) {
      return;
    }

    input.value = formatNumber(value);
  }

  function attachAmountFormatter(input) {
    input.addEventListener('input', function () {
      var digits = input.value.replace(/[^\d]/g, '');
      input.value = digits ? formatNumber(Number(digits)) : '';
      updateCalculation();
    });

    input.addEventListener('blur', function () {
      var amount = toNonNegativeNumber(input.value);
      input.value = amount ? formatNumber(amount) : '';
    });
  }

  function getGuaranteeMode() {
    var checked = form.querySelector('input[name="guaranteeMode"]:checked');
    return checked ? checked.value : 'percent';
  }

  function syncChoiceCards() {
    Array.prototype.slice.call(form.querySelectorAll('.choice-card')).forEach(function (label) {
      var input = label.querySelector('input[type="radio"]');
      label.classList.toggle('selected', Boolean(input && input.checked));
    });
  }

  function collectOtherCosts() {
    return Array.prototype.slice.call(otherCostList.querySelectorAll('.other-item')).map(function (item) {
      var name = item.querySelector('.other-name');
      var amount = item.querySelector('.other-amount');
      return {
        name: name ? name.value.trim() : '',
        amount: toNonNegativeNumber(amount ? amount.value : 0)
      };
    });
  }

  function collectValues() {
    return {
      rent: toNonNegativeNumber(getField('rent').value),
      managementFee: toNonNegativeNumber(getField('managementFee').value),
      depositMonths: toNonNegativeNumber(getField('depositMonths').value),
      keyMoneyMonths: toNonNegativeNumber(getField('keyMoneyMonths').value),
      brokerageMonths: toNonNegativeNumber(getField('brokerageMonths').value),
      advanceRentMonths: toNonNegativeNumber(getField('advanceRentMonths').value),
      guaranteeMode: getGuaranteeMode(),
      guaranteeValue: toNonNegativeNumber(getField('guaranteeValue').value),
      fireInsurance: toNonNegativeNumber(getField('fireInsurance').value),
      keyExchange: toNonNegativeNumber(getField('keyExchange').value),
      supportFee: toNonNegativeNumber(getField('supportFee').value),
      adminFee: toNonNegativeNumber(getField('adminFee').value),
      includeProratedRent: Boolean(includeProratedRentInput.checked),
      proratedRent: toNonNegativeNumber(getField('proratedRent').value),
      taxBrokerage: Boolean(getField('taxBrokerage').checked),
      taxSupport: Boolean(getField('taxSupport').checked),
      taxAdmin: Boolean(getField('taxAdmin').checked),
      otherCosts: collectOtherCosts()
    };
  }

  function calculateBreakdown(values) {
    var rentOnlyBase = values.rent;
    var monthlyTotal = values.rent + values.managementFee;

    var deposit = rentOnlyBase * values.depositMonths;
    var keyMoney = rentOnlyBase * values.keyMoneyMonths;
    var brokerageBase = rentOnlyBase * values.brokerageMonths;
    var brokerage = applyTax(brokerageBase, values.taxBrokerage);
    var advanceRent = monthlyTotal * values.advanceRentMonths;
    var guarantee = values.guaranteeMode === 'percent'
      ? monthlyTotal * (values.guaranteeValue / 100)
      : values.guaranteeValue;
    var supportFee = applyTax(values.supportFee, values.taxSupport);
    var adminFee = applyTax(values.adminFee, values.taxAdmin);
    var proratedRent = values.includeProratedRent ? values.proratedRent : 0;

    var normalizedOtherCosts = values.otherCosts.map(function (item) {
      return {
        name: item.name || 'その他費用',
        amount: roundYen(item.amount)
      };
    });

    var otherTotal = normalizedOtherCosts.reduce(function (sum, item) {
      return sum + item.amount;
    }, 0);

    var initialSubtotal = roundYen(
      deposit +
      keyMoney +
      brokerage +
      advanceRent +
      proratedRent +
      guarantee +
      values.fireInsurance +
      values.keyExchange +
      supportFee +
      adminFee +
      otherTotal
    );

    return {
      monthly: {
        rent: roundYen(values.rent),
        managementFee: roundYen(values.managementFee),
        total: roundYen(monthlyTotal)
      },
      initial: {
        deposit: roundYen(deposit),
        keyMoney: roundYen(keyMoney),
        brokerage: roundYen(brokerage),
        advanceRent: roundYen(advanceRent),
        proratedRent: roundYen(proratedRent),
        guarantee: roundYen(guarantee),
        fireInsurance: roundYen(values.fireInsurance),
        keyExchange: roundYen(values.keyExchange),
        supportFee: roundYen(supportFee),
        adminFee: roundYen(adminFee),
        otherTotal: roundYen(otherTotal),
        subtotal: initialSubtotal,
        otherBreakdown: normalizedOtherCosts
      },
      total: {
        monthly: roundYen(monthlyTotal),
        initialSubtotal: initialSubtotal,
        grandTotal: roundYen(monthlyTotal + initialSubtotal)
      }
    };
  }

  function renderOtherBreakdown(items) {
    if (!items.length) {
      resultElements.otherBreakdown.innerHTML = '<p>その他費用の明細はありません。</p>';
      return;
    }

    resultElements.otherBreakdown.innerHTML = items.map(function (item) {
      return '<p>' + escapeHtml(item.name) + '：' + formatYen(item.amount) + '</p>';
    }).join('');
  }

  function renderResults(result) {
    resultElements.monthlyCard.textContent = formatYen(result.monthly.total);
    resultElements.initialCard.textContent = formatYen(result.initial.subtotal);
    resultElements.grandCard.textContent = formatYen(result.total.grandTotal);

    resultElements.rent.textContent = formatYen(result.monthly.rent);
    resultElements.managementFee.textContent = formatYen(result.monthly.managementFee);
    resultElements.monthlyTotal.textContent = formatYen(result.monthly.total);

    resultElements.deposit.textContent = formatYen(result.initial.deposit);
    resultElements.keyMoney.textContent = formatYen(result.initial.keyMoney);
    resultElements.brokerage.textContent = formatYen(result.initial.brokerage);
    resultElements.advanceRent.textContent = formatYen(result.initial.advanceRent);
    resultElements.proratedRent.textContent = formatYen(result.initial.proratedRent);
    resultElements.guarantee.textContent = formatYen(result.initial.guarantee);
    resultElements.fireInsurance.textContent = formatYen(result.initial.fireInsurance);
    resultElements.keyExchange.textContent = formatYen(result.initial.keyExchange);
    resultElements.supportFee.textContent = formatYen(result.initial.supportFee);
    resultElements.adminFee.textContent = formatYen(result.initial.adminFee);
    resultElements.otherTotal.textContent = formatYen(result.initial.otherTotal);
    resultElements.initialSubtotal.textContent = formatYen(result.initial.subtotal);

    resultElements.monthlyTotalAgain.textContent = formatYen(result.total.monthly);
    resultElements.initialSubtotalAgain.textContent = formatYen(result.total.initialSubtotal);
    resultElements.grandTotal.textContent = formatYen(result.total.grandTotal);

    renderOtherBreakdown(result.initial.otherBreakdown);
  }

  function updateGuaranteeUi() {
    var guaranteeMode = getGuaranteeMode();
    var guaranteeValueInput = getField('guaranteeValue');

    if (guaranteeMode === 'percent') {
      guaranteeValueInput.step = '0.1';
      guaranteeUnit.textContent = '%';
      guaranteeHint.textContent = '％指定の場合は「賃料＋管理費・共益費」に対して計算します。';
    } else {
      guaranteeValueInput.step = '1';
      guaranteeUnit.textContent = '円';
      guaranteeHint.textContent = '固定額指定の場合は、入力した金額をそのまま反映します。';
    }
  }

  function updateProratedUi() {
    proratedRentField.style.display = includeProratedRentInput.checked ? 'flex' : 'none';
  }

  function updateCalculation() {
    syncChoiceCards();
    updateGuaranteeUi();
    updateProratedUi();
    renderResults(calculateBreakdown(collectValues()));
  }

  function addOtherCostRow(item) {
    var fragment = otherCostTemplate.content.cloneNode(true);
    var row = fragment.querySelector('.other-item');
    var nameInput = fragment.querySelector('.other-name');
    var amountInput = fragment.querySelector('.other-amount');
    var removeButton = fragment.querySelector('.remove-button');

    nameInput.value = item && item.name ? item.name : '';
    amountInput.value = formatNumber(item && item.amount ? item.amount : 0);

    nameInput.addEventListener('input', updateCalculation);
    attachAmountFormatter(amountInput);
    removeButton.addEventListener('click', function () {
      row.remove();
      updateCalculation();
    });

    otherCostList.appendChild(fragment);
    updateCalculation();
  }

  function resetForm() {
    setAmountInputValue(getField('rent'), defaultState.fields.rent);
    setAmountInputValue(getField('managementFee'), defaultState.fields.managementFee);
    getField('depositMonths').value = String(defaultState.fields.depositMonths);
    getField('keyMoneyMonths').value = String(defaultState.fields.keyMoneyMonths);
    getField('brokerageMonths').value = String(defaultState.fields.brokerageMonths);
    getField('advanceRentMonths').value = String(defaultState.fields.advanceRentMonths);
    form.querySelector('input[name="guaranteeMode"][value="' + defaultState.fields.guaranteeMode + '"]').checked = true;
    getField('guaranteeValue').value = String(defaultState.fields.guaranteeValue);
    setAmountInputValue(getField('fireInsurance'), defaultState.fields.fireInsurance);
    setAmountInputValue(getField('keyExchange'), defaultState.fields.keyExchange);
    setAmountInputValue(getField('supportFee'), defaultState.fields.supportFee);
    setAmountInputValue(getField('adminFee'), defaultState.fields.adminFee);
    includeProratedRentInput.checked = defaultState.fields.includeProratedRent;
    setAmountInputValue(getField('proratedRent'), defaultState.fields.proratedRent);
    getField('taxBrokerage').checked = defaultState.fields.taxBrokerage;
    getField('taxSupport').checked = defaultState.fields.taxSupport;
    getField('taxAdmin').checked = defaultState.fields.taxAdmin;

    otherCostList.innerHTML = '';
    defaultState.otherCosts.forEach(function (item) {
      addOtherCostRow(item);
    });

    updateCalculation();
  }

  amountFieldIds.forEach(function (id) {
    attachAmountFormatter(getField(id));
  });

  Array.prototype.slice.call(form.querySelectorAll('input[type="number"], input[type="checkbox"], input[type="radio"]')).forEach(function (input) {
    input.addEventListener('input', updateCalculation);
    input.addEventListener('change', updateCalculation);
  });

  addOtherCostButton.addEventListener('click', function () {
    addOtherCostRow({ name: '', amount: 0 });
  });

  resetButton.addEventListener('click', resetForm);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
  });

  resetForm();
})();
