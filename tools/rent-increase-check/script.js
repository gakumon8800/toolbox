const form = document.getElementById('risk-form');
const badge = document.getElementById('badge');
const scoreValue = document.getElementById('scoreValue');
const scoreText = document.getElementById('scoreText');
const increaseRate = document.getElementById('increaseRate');
const marketGap = document.getElementById('marketGap');
const positiveCount = document.getElementById('positiveCount');
const negativeCount = document.getElementById('negativeCount');
const reasonList = document.getElementById('reasonList');
const meter = document.getElementById('meter');
const lead = document.getElementById('lead');
const formError = document.getElementById('formError');
const increaseRateCard = increaseRate.closest('.mini');

const fieldRules = {
  currentRent: {
    label: '現在賃料',
    required: true,
    min: 10000
  },
  proposedRent: {
    label: '提示後賃料',
    required: true,
    min: 10000
  },
  marketRent: {
    label: '近傍同種の相場',
    required: true,
    min: 10000
  },
  yearsSinceReview: {
    label: '前回改定からの年数',
    required: true,
    min: 0,
    max: 50
  }
};

function formatYen(value) {
  return new Intl.NumberFormat('ja-JP').format(Math.round(value)) + '円';
}

function setFieldError(name, message = '') {
  const field = form.querySelector(`[name="${name}"]`)?.closest('.field');
  const error = document.getElementById(`${name}Error`);
  if (!field || !error) {
    return;
  }

  field.classList.toggle('invalid', Boolean(message));
  error.textContent = message;
}

function clearErrors() {
  Object.keys(fieldRules).forEach((name) => setFieldError(name, ''));
  formError.textContent = '';
  formError.classList.remove('visible');
}

function validateForm(values) {
  const errors = {};

  Object.entries(fieldRules).forEach(([name, rule]) => {
    const rawValue = (values[name] ?? '').toString().trim();

    if (!rawValue) {
      errors[name] = `${rule.label}を入力してください。`;
      return;
    }

    const number = Number(rawValue);
    if (!Number.isFinite(number)) {
      errors[name] = `${rule.label}は数字で入力してください。`;
      return;
    }

    if (rule.min !== undefined && number < rule.min) {
      errors[name] = `${rule.label}は${rule.min.toLocaleString('ja-JP')}以上で入力してください。`;
      return;
    }

    if (rule.max !== undefined && number > rule.max) {
      errors[name] = `${rule.label}は${rule.max.toLocaleString('ja-JP')}以下で入力してください。`;
    }
  });

  if (!errors.currentRent && !errors.proposedRent) {
    const currentRent = Number(values.currentRent);
    const proposedRent = Number(values.proposedRent);
    if (proposedRent < currentRent) {
      errors.proposedRent = '提示後賃料は現在賃料以上を入力してください。';
    }
  }

  return errors;
}

function evaluateRisk(values) {
  const currentRent = Number(values.currentRent);
  const proposedRent = Number(values.proposedRent);
  const marketRent = Number(values.marketRent);
  const yearsSinceReview = Number(values.yearsSinceReview);
  const requestedIncreaseRate = ((proposedRent - currentRent) / currentRent) * 100;
  const marketDifference = proposedRent - marketRent;

  let score = 35;
  const reasons = [];
  let positives = 0;
  let negatives = 0;

  if (requestedIncreaseRate <= 0) {
    score = 5;
    reasons.push('提示後賃料が現在賃料を上回っていないため、値上げリスクはほぼありません。');
  } else {
    if (requestedIncreaseRate <= 5) {
      score += 8;
      positives += 1;
      reasons.push('増額率が小さく、交渉上は比較的穏当な水準です。');
    } else if (requestedIncreaseRate <= 10) {
      score += 3;
      reasons.push('増額率は中間帯で、他の事情の裏付けが重要です。');
    } else if (requestedIncreaseRate <= 15) {
      score -= 8;
      negatives += 1;
      reasons.push('増額率がやや大きく、客観資料が弱いと争われやすい水準です。');
    } else {
      score -= 18;
      negatives += 1;
      reasons.push('増額率が大きく、相場や負担増の明確な根拠がないと通りにくい傾向です。');
    }

    if (marketDifference <= 0) {
      const delta = Math.abs(marketDifference);
      if (delta >= currentRent * 0.1) {
        score += 18;
        positives += 1;
        reasons.push('提示額が近傍相場を大きく下回っており、相場是正の理由が立ちやすいです。');
      } else {
        score += 10;
        positives += 1;
        reasons.push('提示額が近傍相場の範囲内で、相場比較上の説明がしやすいです。');
      }
    } else if (marketDifference <= currentRent * 0.05) {
      score -= 6;
      negatives += 1;
      reasons.push('提示額が相場を少し上回っており、比較物件の出し方が争点になります。');
    } else {
      score -= 16;
      negatives += 1;
      reasons.push('提示額が近傍相場を大きく上回っており、32条ロジック上は不利です。');
    }

    if (yearsSinceReview >= 5) {
      score += 12;
      positives += 1;
      reasons.push('前回改定から長期間が経過しており、見直しの必要性を主張しやすいです。');
    } else if (yearsSinceReview >= 2) {
      score += 5;
      reasons.push('一定の経過期間があり、改定の話を出す余地があります。');
    } else {
      score -= 8;
      negatives += 1;
      reasons.push('前回改定から短期間で、値上げの必要性を丁寧に補強する必要があります。');
    }
  }

  ['taxBurden', 'economicShift', 'improvement', 'specialClause', 'tenantHardship'].forEach((key) => {
    const value = Number(values[key]);
    score += value;
    if (value > 0) {
      positives += 1;
    } else if (value < 0) {
      negatives += 1;
    }
  });

  if (Number(values.taxBurden) >= 8) {
    reasons.push('固定資産税や維持費の増加は、値上げ事情として説明しやすい材料です。');
  }
  if (Number(values.economicShift) >= 7) {
    reasons.push('周辺の地価・賃料水準の上昇は、経済事情の変動として補強要素になります。');
  }
  if (Number(values.improvement) >= 6) {
    reasons.push('修繕や設備更新が大きいほど、賃料見直しの必要性を示しやすくなります。');
  }
  if (Number(values.specialClause) <= -10) {
    reasons.push('据置や増額制限の特約があると、請求自体はできても結論に大きく影響します。');
  }
  if (Number(values.tenantHardship) <= -6) {
    reasons.push('賃借人側の事情は裁判所の斟酌要素になり得るため、交渉では軽視できません。');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level = '低め';
  let tone = 'low';
  let message = '現時点では、直ちに強い値上げ根拠があるとは言いにくい水準です。';
  if (score >= 70) {
    level = '高め';
    tone = 'high';
    message = '客観事情がそろっており、値上げ請求が認められるリスクは比較的高めです。';
  } else if (score >= 45) {
    level = '中くらい';
    tone = 'mid';
    message = '有利な事情もある一方で、相場資料や特約の内容次第で結論がぶれやすい水準です。';
  }

  return {
    score,
    level,
    tone,
    message,
    requestedIncreaseRate,
    marketDifference,
    reasons,
    positives,
    negatives
  };
}

function render(result) {
  badge.textContent = result.level;
  badge.className = 'badge ' + result.tone;
  scoreValue.textContent = result.score;
  scoreText.textContent = result.message;
  increaseRate.textContent = result.requestedIncreaseRate > 0
    ? result.requestedIncreaseRate.toFixed(1) + '%'
    : '0%';
  increaseRateCard.classList.toggle('warn', result.requestedIncreaseRate > 10);
  marketGap.textContent = (result.marketDifference >= 0 ? '+' : '-') + formatYen(Math.abs(result.marketDifference));
  positiveCount.textContent = result.positives + '件';
  negativeCount.textContent = result.negatives + '件';
  meter.style.setProperty('--meter-position', result.score + '%');
  lead.textContent = '値上げが認められやすいほどスコアが高くなります。';

  reasonList.innerHTML = '';
  result.reasons.forEach((reason) => {
    const item = document.createElement('li');
    item.textContent = reason;
    reasonList.appendChild(item);
  });
}

function submitCalculation() {
  const values = Object.fromEntries(new FormData(form).entries());
  const errors = validateForm(values);

  clearErrors();

  const firstError = Object.entries(errors)[0];
  if (firstError) {
    Object.entries(errors).forEach(([name, message]) => setFieldError(name, message));
    formError.textContent = '未入力または入力内容に誤りがあります。赤字の項目を確認してください。';
    formError.classList.add('visible');
    form.querySelector(`[name="${firstError[0]}"]`)?.focus();
    return;
  }

  render(evaluateRisk(values));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitCalculation();
});

Object.keys(fieldRules).forEach((name) => {
  form.querySelector(`[name="${name}"]`)?.addEventListener('input', () => {
    if (form.querySelector(`.field.invalid`)) {
      submitCalculation();
    }
  });
});

submitCalculation();
