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

const shareLabel = document.getElementById('shareLabel');
const shareScore = document.getElementById('shareScore');
const shareHeadline = document.getElementById('shareHeadline');
const shareSubline = document.getElementById('shareSubline');
const shareGapAmount = document.getElementById('shareGapAmount');
const shareGapCaption = document.getElementById('shareGapCaption');
const shareProposedRent = document.getElementById('shareProposedRent');
const shareCurrentRent = document.getElementById('shareCurrentRent');
const shareIncreaseRate = document.getElementById('shareIncreaseRate');
const shareVerdict = document.getElementById('shareVerdict');
const shareOnX = document.getElementById('shareOnX');
const downloadCard = document.getElementById('downloadCard');
const copyShareText = document.getElementById('copyShareText');
const shareCopyFeedback = document.getElementById('shareCopyFeedback');
const shareCanvas = document.getElementById('shareCanvas');

let latestShareState = null;

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

function formatCompactYen(value) {
  return '¥' + new Intl.NumberFormat('ja-JP').format(Math.round(value));
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
    currentRent,
    proposedRent,
    marketRent,
    requestedIncreaseRate,
    marketDifference,
    reasons,
    positives,
    negatives
  };
}

function buildShareData(result) {
  const marketGapAbs = Math.abs(result.marketDifference);
  const unfairnessScoreBase = (result.marketDifference / result.marketRent) * 100;
  const increaseShock = Math.max(0, result.requestedIncreaseRate - 5) * 2.2;
  const legalPushback = Math.max(0, 70 - result.score) * 0.55;
  const unfairnessScore = Math.max(0, Math.min(100, Math.round(unfairnessScoreBase * 3.6 + increaseShock + legalPushback)));

  let label = '相場どおり';
  let headline = 'この値上げ、まだ普通';
  let subline = '数字上は大きな違和感が少なく、感情的な引っかかりは強くありません。';
  let verdict = '相場から大きく外れていないため、Xでの反応は「妥当寄り」になりそうです。';

  if (result.marketDifference >= result.marketRent * 0.12 || result.requestedIncreaseRate >= 18) {
    label = 'かなり高すぎる';
    headline = 'この値上げ、正直かなり強気';
    subline = '相場より大きく高く、見た人が「それは高い」と反応しやすいラインです。';
    verdict = '「これ本当に普通？」と聞きたくなる水準。共感が集まりやすいカードです。';
  } else if (result.marketDifference >= result.marketRent * 0.05 || result.requestedIncreaseRate >= 10) {
    label = 'ちょい高い';
    headline = 'この値上げ、ちょっと高くない？';
    subline = '相場より上に出ており、納得感よりモヤモヤが先に来やすい結果です。';
    verdict = '高すぎるとまでは言い切れなくても、「モヤる」投稿として広がりやすい帯です。';
  } else if (result.marketDifference <= -result.marketRent * 0.1) {
    label = '意外と安い';
    headline = 'この値上げ、むしろ相場より安い';
    subline = '驚くほど強気ではなく、見た人が「それなら意外」と感じやすい結果です。';
    verdict = '炎上よりも「想像より安い」の驚きでシェアされやすいカードです。';
  } else if (result.marketDifference <= 0) {
    label = '相場内';
    headline = 'この値上げ、相場の中';
    subline = '相場と大きくズレておらず、感情よりも条件整理に向いた結果です。';
    verdict = '過度に煽らず、冷静な比較材料として見せやすいカードです。';
  }

  const shareText = [
    `家賃値上げモヤモヤ診断`,
    `${headline}`,
    `提示家賃 ${formatYen(result.proposedRent)} / 現在家賃 ${formatYen(result.currentRent)}`,
    `相場との差 ${result.marketDifference >= 0 ? '+' : '-'}${formatYen(marketGapAbs)} ・ 値上げ率 ${Math.max(0, result.requestedIncreaseRate).toFixed(1)}%`,
    `理不尽度 ${unfairnessScore}/100`,
    '#家賃 #賃貸 #不動産`
  ].join('\n');

  return {
    unfairnessScore,
    label,
    headline,
    subline,
    verdict,
    shareText
  };
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillRoundedRect(ctx, x, y, width, height, radius, color) {
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = color;
  ctx.fill();
}

function wrapText(ctx, text, maxWidth) {
  const chars = Array.from(text);
  const lines = [];
  let line = '';

  chars.forEach((char) => {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function renderShareCanvas(result, shareData) {
  const ctx = shareCanvas.getContext('2d');
  const width = shareCanvas.width;
  const height = shareCanvas.height;

  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#111827');
  gradient.addColorStop(0.55, '#7c2d12');
  gradient.addColorStop(1, '#f97316');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(width - 110, 110, 160, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(120, height - 70, 120, 0, Math.PI * 2);
  ctx.fill();

  fillRoundedRect(ctx, 56, 54, 250, 50, 25, 'rgba(255,255,255,0.12)');
  ctx.fillStyle = '#fff7ed';
  ctx.font = '700 24px "Yu Gothic", sans-serif';
  ctx.fillText(shareData.label, 82, 87);

  ctx.font = '800 26px "Yu Gothic", sans-serif';
  ctx.fillStyle = '#ffe7cf';
  ctx.fillText(`理不尽度 ${shareData.unfairnessScore} / 100`, width - 360, 86);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 60px "Yu Gothic", sans-serif';
  wrapText(ctx, shareData.headline, 820).slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, 72, 185 + index * 70);
  });

  ctx.font = '700 96px "Yu Gothic", sans-serif';
  ctx.fillStyle = '#fff7ed';
  ctx.fillText(
    `${result.marketDifference >= 0 ? '+' : '-'}${formatCompactYen(Math.abs(result.marketDifference)).replace('¥', '')}`,
    72,
    366
  );

  ctx.font = '700 28px "Yu Gothic", sans-serif';
  ctx.fillStyle = 'rgba(255,247,237,0.84)';
  ctx.fillText('相場との差額', 76, 405);

  fillRoundedRect(ctx, 70, 448, 300, 110, 22, 'rgba(17,24,39,0.22)');
  fillRoundedRect(ctx, 392, 448, 300, 110, 22, 'rgba(17,24,39,0.22)');
  fillRoundedRect(ctx, 714, 448, 300, 110, 22, 'rgba(17,24,39,0.22)');

  ctx.fillStyle = 'rgba(255,247,237,0.72)';
  ctx.font = '700 20px "Yu Gothic", sans-serif';
  ctx.fillText('提示家賃', 96, 484);
  ctx.fillText('現在家賃', 418, 484);
  ctx.fillText('値上げ率', 740, 484);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px "Yu Gothic", sans-serif';
  ctx.fillText(formatCompactYen(result.proposedRent), 96, 533);
  ctx.fillText(formatCompactYen(result.currentRent), 418, 533);
  ctx.fillText(`${Math.max(0, result.requestedIncreaseRate).toFixed(1)}%`, 740, 533);

  ctx.fillStyle = 'rgba(255,247,237,0.82)';
  ctx.font = '700 22px "Yu Gothic", sans-serif';
  wrapText(ctx, shareData.verdict, 1030).slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, 72, 604 + index * 28);
  });
}

function updateShareUi(result) {
  const shareData = buildShareData(result);
  latestShareState = {
    result,
    shareData
  };

  shareLabel.textContent = shareData.label;
  shareScore.textContent = `理不尽度 ${shareData.unfairnessScore} / 100`;
  shareHeadline.textContent = shareData.headline;
  shareSubline.textContent = shareData.subline;
  shareGapAmount.textContent = `${result.marketDifference >= 0 ? '+' : '-'}${formatYen(Math.abs(result.marketDifference))}`;
  shareGapCaption.textContent = result.marketDifference >= 0 ? '相場より高い金額' : '相場より安い金額';
  shareProposedRent.textContent = formatYen(result.proposedRent);
  shareCurrentRent.textContent = formatYen(result.currentRent);
  shareIncreaseRate.textContent = `${Math.max(0, result.requestedIncreaseRate).toFixed(1)}%`;
  shareVerdict.textContent = shareData.verdict;
  shareOnX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.shareText)}`;

  renderShareCanvas(result, shareData);
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

  updateShareUi(result);
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

async function copyShareTextToClipboard() {
  if (!latestShareState) {
    return;
  }

  try {
    await navigator.clipboard.writeText(latestShareState.shareData.shareText);
    shareCopyFeedback.textContent = '投稿文をコピーしました。';
  } catch (error) {
    shareCopyFeedback.textContent = 'コピーに失敗しました。手動でXボタンから投稿してください。';
  }
}

function downloadShareCard() {
  if (!latestShareState) {
    return;
  }

  const link = document.createElement('a');
  link.href = shareCanvas.toDataURL('image/png');
  link.download = 'rent-increase-share-card.png';
  link.click();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitCalculation();
});

Object.keys(fieldRules).forEach((name) => {
  form.querySelector(`[name="${name}"]`)?.addEventListener('input', () => {
    if (form.querySelector('.field.invalid')) {
      submitCalculation();
    }
  });
});

downloadCard.addEventListener('click', downloadShareCard);
copyShareText.addEventListener('click', copyShareTextToClipboard);

submitCalculation();
