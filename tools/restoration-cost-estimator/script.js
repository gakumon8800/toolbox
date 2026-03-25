(function () {
  'use strict';

  var AREA_OPTIONS = [
    {
      value: 'wall',
      label: '壁・天井（クロス）',
      hint: '壁紙の汚れ、穴、破れ、ヤニなどを想定しています。',
      conditions: [
        { value: 'light-dirt', label: '軽い汚れ', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'sun-fade', label: '家具跡・日焼け跡', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'pin-hole', label: '画鋲穴', cost: 'low', liability: 'low', nature: 'minor' },
        { value: 'large-hole', label: '大きめの穴・破れ', cost: 'mid', liability: 'high', nature: 'damage' },
        { value: 'graffiti', label: '落書き', cost: 'mid', liability: 'high', nature: 'damage' },
        { value: 'smoke', label: 'タバコのヤニ・臭い', cost: 'high', liability: 'high', nature: 'smoke' }
      ]
    },
    {
      value: 'floor',
      label: '床（CF・フローリング）',
      hint: '床材の擦れ、へこみ、傷、水濡れなどを想定しています。',
      conditions: [
        { value: 'light-scratch', label: '軽い擦れ', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'furniture-dent', label: '家具によるへこみ', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'scratch', label: '傷', cost: 'mid', liability: 'mid', nature: 'damage' },
        { value: 'water-mark', label: '水濡れ跡', cost: 'mid', liability: 'high', nature: 'water' },
        { value: 'peeling', label: '剥がれ・めくれ', cost: 'high', liability: 'high', nature: 'damage' }
      ]
    },
    {
      value: 'fixture',
      label: '建具・扉',
      hint: 'ドア、引き戸、取っ手、クローゼット扉などを想定しています。',
      conditions: [
        { value: 'minor-scuff', label: '軽い擦れ・小さな汚れ', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'dent', label: 'へこみ・打痕', cost: 'mid', liability: 'mid', nature: 'damage' },
        { value: 'broken-part', label: '部材の破損', cost: 'mid', liability: 'high', nature: 'damage' },
        { value: 'cannot-close', label: '閉まりにくい・開閉不良', cost: 'mid', liability: 'mid', nature: 'unknown' },
        { value: 'sticker-mark', label: 'シール跡・強い粘着跡', cost: 'low', liability: 'mid', nature: 'damage' }
      ]
    },
    {
      value: 'equipment',
      label: '設備（エアコン・換気扇・照明など）',
      hint: '設備の故障、破損、紛失などを想定しています。',
      conditions: [
        { value: 'aging', label: '通常使用による劣化', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'malfunction', label: '動作不良', cost: 'mid', liability: 'mid', nature: 'unknown' },
        { value: 'breakage', label: '破損', cost: 'high', liability: 'high', nature: 'damage' },
        { value: 'missing', label: '紛失', cost: 'high', liability: 'high', nature: 'loss' }
      ]
    },
    {
      value: 'water',
      label: '水回り',
      hint: '浴室、洗面、キッチン、トイレまわりを想定しています。',
      conditions: [
        { value: 'mold', label: 'カビ', cost: 'mid', liability: 'mid', nature: 'cleaning' },
        { value: 'scale', label: '水垢・汚れ', cost: 'low', liability: 'mid', nature: 'cleaning' },
        { value: 'breakage', label: '破損', cost: 'high', liability: 'high', nature: 'damage' },
        { value: 'leak-mark', label: '水漏れ跡', cost: 'high', liability: 'high', nature: 'water' }
      ]
    },
    {
      value: 'glass',
      label: 'ガラス・鏡',
      hint: '窓ガラス、室内ガラス、洗面鏡などを想定しています。',
      conditions: [
        { value: 'crack', label: 'ひび', cost: 'mid', liability: 'high', nature: 'glass' },
        { value: 'shattered', label: '割れ', cost: 'high', liability: 'high', nature: 'glass' },
        { value: 'chip', label: '欠け', cost: 'mid', liability: 'mid', nature: 'glass' }
      ]
    },
    {
      value: 'key',
      label: '鍵・付属品',
      hint: '鍵本体、カードキー、リモコン、取扱説明書などを想定しています。',
      conditions: [
        { value: 'normal-use', label: '通常使用の範囲だと思う', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'lost-key', label: '鍵を紛失した', cost: 'mid', liability: 'high', nature: 'loss' },
        { value: 'missing-remote', label: 'リモコン・付属品を紛失した', cost: 'mid', liability: 'high', nature: 'loss' },
        { value: 'damaged-key', label: '鍵や付属品を破損した', cost: 'mid', liability: 'high', nature: 'damage' }
      ]
    },
    {
      value: 'cleaning',
      label: 'ハウスクリーニング',
      hint: '室内清掃、油汚れ、退去時クリーニング費用などを想定しています。',
      conditions: [
        { value: 'normal-cleaning', label: '通常の退去清掃レベル', cost: 'low', liability: 'mid', nature: 'cleaning' },
        { value: 'heavy-grease', label: '油汚れ・強い汚れが残っている', cost: 'mid', liability: 'mid', nature: 'cleaning' },
        { value: 'odor', label: '臭いが強く残っている', cost: 'mid', liability: 'mid', nature: 'cleaning' },
        { value: 'special-clause', label: '特約で費用負担がありそう', cost: 'mid', liability: 'high', nature: 'special' }
      ]
    },
    {
      value: 'other',
      label: 'その他',
      hint: '迷う場合は近い内容を選び、最終的には管理会社へ確認してください。',
      conditions: [
        { value: 'minor', label: '軽微な汚れ・使用感', cost: 'low', liability: 'low', nature: 'wear' },
        { value: 'damage', label: '破損・汚損がある', cost: 'mid', liability: 'mid', nature: 'damage' },
        { value: 'water', label: '水濡れ・漏水に関連しそう', cost: 'high', liability: 'high', nature: 'water' },
        { value: 'missing', label: '紛失・不足がある', cost: 'mid', liability: 'high', nature: 'loss' }
      ]
    }
  ];

  var PERIOD_RULES = {
    under1: { label: '1年未満', score: 2, text: '入居期間が短く、経年劣化として整理しにくい場面があります。' },
    '1to3': { label: '1年以上3年未満', score: 1, text: '入居期間は短中期で、原因や発生状況の確認が重要です。' },
    '3to6': { label: '3年以上6年未満', score: -1, text: '一定の使用年数があり、経年変化の考慮が出やすい期間です。' },
    '6plus': { label: '6年以上', score: -3, text: '長期入居のため、経年劣化として扱われる余地が比較的大きい可能性があります。' }
  };

  var CAUSE_RULES = {
    normal: { score: -3, label: '通常使用の範囲だと思う' },
    accident: { score: 3, label: 'うっかり破損した' },
    self: { score: 4, label: '自分または同居人がつけた' },
    family: { score: 4, label: '子ども・来客・ペットが原因' },
    unknown: { score: 1, label: 'よく分からない' }
  };

  var RANGE_LABELS = {
    low: '0円〜10,000円程度',
    mid: '10,000円〜50,000円程度',
    high: '状況によっては50,000円以上'
  };

  var LIABILITY_LABELS = {
    low: '借主負担となる可能性は低めです',
    mid: '内容によっては借主負担となる可能性があります',
    high: '借主負担となる可能性が高い項目です'
  };

  var CHECKLIST_ITEMS = [
    '契約書・特約を確認する',
    '破損箇所の写真を残す',
    'いつ・どのように発生したか整理する',
    '火災保険の証券・補償内容を確認する',
    '不明点は退去立会い前に管理会社へ相談する'
  ];

  var form = document.getElementById('estimator-form');
  var areaSelect = document.getElementById('area');
  var conditionSelect = document.getElementById('condition');
  var conditionHint = document.getElementById('conditionHint');
  var estimateRange = document.getElementById('estimateRange');
  var liabilityLevel = document.getElementById('liabilityLevel');
  var reasonText = document.getElementById('reasonText');
  var insuranceText = document.getElementById('insuranceText');
  var checklist = document.getElementById('checklist');

  function getAreaConfig(areaValue) {
    return AREA_OPTIONS.find(function (item) {
      return item.value === areaValue;
    }) || AREA_OPTIONS[0];
  }

  function getConditionConfig(areaValue, conditionValue) {
    var areaConfig = getAreaConfig(areaValue);
    return areaConfig.conditions.find(function (item) {
      return item.value === conditionValue;
    }) || areaConfig.conditions[0];
  }

  function fillSelectOptions() {
    areaSelect.innerHTML = AREA_OPTIONS.map(function (item) {
      return '<option value="' + item.value + '">' + item.label + '</option>';
    }).join('');
    updateConditionOptions();
  }

  function updateConditionOptions() {
    var areaConfig = getAreaConfig(areaSelect.value);
    conditionSelect.innerHTML = areaConfig.conditions.map(function (item) {
      return '<option value="' + item.value + '">' + item.label + '</option>';
    }).join('');
    conditionHint.textContent = areaConfig.hint;
  }

  function shiftLevel(level, steps) {
    var levels = ['low', 'mid', 'high'];
    var index = levels.indexOf(level);
    var nextIndex = Math.max(0, Math.min(levels.length - 1, index + steps));
    return levels[nextIndex];
  }

  function buildReason(values, areaConfig, conditionConfig) {
    var parts = [];
    var period = PERIOD_RULES[values.tenancyPeriod];

    parts.push(areaConfig.label + 'の「' + conditionConfig.label + '」を前提に整理しています。');

    if (conditionConfig.nature === 'wear') {
      parts.push('通常損耗や経年劣化に近い内容であれば、借主負担にならない場合があります。');
    } else if (conditionConfig.nature === 'minor') {
      parts.push('軽微な穴や小さな使用跡は、補修範囲や契約条件によって判断が分かれることがあります。');
    } else if (conditionConfig.nature === 'cleaning') {
      parts.push('清掃不足やカビ・汚れは、発生状況によって借主負担とされることがあります。');
    } else if (conditionConfig.nature === 'water') {
      parts.push('水濡れや水漏れ跡は、原因次第で補修範囲が広がりやすい項目です。');
    } else if (conditionConfig.nature === 'glass' || conditionConfig.nature === 'damage' || conditionConfig.nature === 'loss') {
      parts.push('破損・割れ・紛失は、故意過失や善管注意義務違反として借主負担になりやすい傾向があります。');
    } else if (conditionConfig.nature === 'smoke') {
      parts.push('タバコのヤニや臭いは、通常損耗として扱われにくく、借主負担となる可能性が高めです。');
    } else {
      parts.push('原因の確認が必要で、現地確認や管理会社の判断で結果が変わりやすい内容です。');
    }

    parts.push(period.text);

    if (values.cause === 'normal') {
      parts.push('ご自身の認識が通常使用寄りであるため、契約内容と経過年数の確認が特に重要です。');
    } else if (values.cause === 'unknown') {
      parts.push('原因がはっきりしないため、発生時期や状況を整理しておくと説明しやすくなります。');
    } else {
      parts.push('原因が借主側にある認識のため、借主負担として整理される可能性を見込んでおくと安心です。');
    }

    if (values.smoking === 'yes' && (areaConfig.value === 'wall' || areaConfig.value === 'cleaning')) {
      parts.push('喫煙ありのため、クロスの臭いや室内全体の清掃負担が重く見られることがあります。');
    }

    if (values.pet === 'yes' && (values.cause === 'family' || areaConfig.value === 'floor' || areaConfig.value === 'wall' || areaConfig.value === 'cleaning')) {
      parts.push('ペット飼育がある場合、傷や臭いの有無を個別に見られることがあります。');
    }

    if (values.specialClause === 'checked') {
      parts.push('特約を確認済みでも、記載内容によってはクリーニング費用や鍵関連費用の扱いが変わります。');
    } else {
      parts.push('特約を未確認または内容不明であれば、契約書の確認で見通しが変わる可能性があります。');
    }

    return parts.join(' ');
  }

  function buildInsuranceText(values, areaConfig, conditionConfig) {
    var strongCase = (
      conditionConfig.nature === 'glass' ||
      conditionConfig.nature === 'water' ||
      areaConfig.value === 'equipment' ||
      values.cause === 'accident' ||
      values.cause === 'family'
    );

    if (strongCase) {
      return '加入中の火災保険・家財保険で補償対象となる場合があります。保険証券や補償内容を確認し、必要に応じて保険会社または代理店へご相談ください。特にガラス割れ、水漏れ、設備破損、うっかり破損、子どもや来客による破損は早めの確認がおすすめです。';
    }

    if (conditionConfig.nature === 'smoke' || conditionConfig.nature === 'cleaning' || conditionConfig.nature === 'wear') {
      return '通常損耗、経年劣化、清掃不足、タバコのヤニなどは保険の対象外となることも多いため、まずは契約内容と請求項目の整理を優先してください。必要に応じて、加入中の火災保険・家財保険の補償範囲も確認しておくと安心です。';
    }

    return '加入中の火災保険・家財保険で補償対象となる場合があります。保険証券や補償内容を確認し、必要に応じて保険会社または代理店へご相談ください。補償対象かどうかは原因や事故状況で変わります。';
  }

  function evaluate(values) {
    var areaConfig = getAreaConfig(values.area);
    var conditionConfig = getConditionConfig(values.area, values.condition);
    var score = 0;
    var costLevel = conditionConfig.cost;
    var liabilityLevelValue = conditionConfig.liability;

    score += PERIOD_RULES[values.tenancyPeriod].score;
    score += CAUSE_RULES[values.cause].score;

    if (conditionConfig.liability === 'low') {
      score -= 2;
    } else if (conditionConfig.liability === 'high') {
      score += 3;
    }

    if (values.smoking === 'yes') {
      if (conditionConfig.nature === 'smoke') {
        score += 3;
      } else if (areaConfig.value === 'wall' || areaConfig.value === 'cleaning') {
        score += 1;
        costLevel = shiftLevel(costLevel, 1);
      }
    }

    if (values.pet === 'yes') {
      if (values.cause === 'family' || areaConfig.value === 'floor' || areaConfig.value === 'wall' || areaConfig.value === 'cleaning') {
        score += 1;
      }
    }

    if (values.specialClause === 'checked') {
      if (areaConfig.value === 'cleaning' || areaConfig.value === 'key') {
        score += 2;
        costLevel = shiftLevel(costLevel, 1);
        liabilityLevelValue = shiftLevel(liabilityLevelValue, 1);
      }
    } else if (values.specialClause === 'unclear') {
      score += 1;
    }

    if (values.cause === 'normal' && (conditionConfig.nature === 'wear' || conditionConfig.nature === 'minor')) {
      costLevel = shiftLevel(costLevel, -1);
      liabilityLevelValue = shiftLevel(liabilityLevelValue, -1);
    }

    if ((values.tenancyPeriod === '6plus' || values.tenancyPeriod === '3to6') && conditionConfig.nature === 'wear') {
      liabilityLevelValue = shiftLevel(liabilityLevelValue, -1);
    }

    if (score >= 5) {
      liabilityLevelValue = shiftLevel(liabilityLevelValue, 1);
    } else if (score <= -3) {
      liabilityLevelValue = shiftLevel(liabilityLevelValue, -1);
    }

    if (score >= 6 && costLevel !== 'high') {
      costLevel = shiftLevel(costLevel, 1);
    }

    return {
      areaConfig: areaConfig,
      conditionConfig: conditionConfig,
      rangeText: RANGE_LABELS[costLevel],
      liabilityText: LIABILITY_LABELS[liabilityLevelValue],
      reason: buildReason(values, areaConfig, conditionConfig),
      insurance: buildInsuranceText(values, areaConfig, conditionConfig)
    };
  }

  function renderChecklist() {
    checklist.innerHTML = CHECKLIST_ITEMS.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function collectValues() {
    return {
      tenancyPeriod: form.tenancyPeriod.value,
      area: form.area.value,
      condition: form.condition.value,
      cause: form.cause.value,
      smoking: form.smoking.value,
      pet: form.pet.value,
      specialClause: form.specialClause.value
    };
  }

  function renderResult() {
    var values = collectValues();
    var result = evaluate(values);

    estimateRange.textContent = result.rangeText;
    liabilityLevel.textContent = result.liabilityText;
    reasonText.textContent = result.reason;
    insuranceText.textContent = result.insurance;
  }

  if (!form || !areaSelect || !conditionSelect) {
    return;
  }

  fillSelectOptions();
  renderChecklist();
  renderResult();

  areaSelect.addEventListener('change', function () {
    updateConditionOptions();
    renderResult();
  });

  conditionSelect.addEventListener('change', renderResult);
  form.addEventListener('change', renderResult);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    renderResult();
  });
})();
