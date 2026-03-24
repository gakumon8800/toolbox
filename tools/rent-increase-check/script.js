(function () {
  'use strict';

  var form = document.getElementById('risk-form');
  if (!form) {
    return;
  }

  var badge = document.getElementById('badge');
  var scoreValue = document.getElementById('scoreValue');
  var scoreText = document.getElementById('scoreText');
  var increaseRate = document.getElementById('increaseRate');
  var marketGap = document.getElementById('marketGap');
  var positiveCount = document.getElementById('positiveCount');
  var negativeCount = document.getElementById('negativeCount');
  var reasonList = document.getElementById('reasonList');
  var meter = document.getElementById('meter');
  var lead = document.getElementById('lead');
  var formError = document.getElementById('formError');
  var increaseRateCard = increaseRate ? increaseRate.closest('.mini') : null;

  var shareLabel = document.getElementById('shareLabel');
  var shareScore = document.getElementById('shareScore');
  var shareHeadline = document.getElementById('shareHeadline');
  var shareSubline = document.getElementById('shareSubline');
  var shareGapAmount = document.getElementById('shareGapAmount');
  var shareGapCaption = document.getElementById('shareGapCaption');
  var shareProposedRent = document.getElementById('shareProposedRent');
  var shareCurrentRent = document.getElementById('shareCurrentRent');
  var shareIncreaseRate = document.getElementById('shareIncreaseRate');
  var shareVerdict = document.getElementById('shareVerdict');
  var shareOnX = document.getElementById('shareOnX');
  var downloadCard = document.getElementById('downloadCard');
  var copyShareText = document.getElementById('copyShareText');
  var shareCopyFeedback = document.getElementById('shareCopyFeedback');
  var shareCanvas = document.getElementById('shareCanvas');

  var latestShareState = null;

  var fieldRules = {
    currentRent: { label: '現在賃料', min: 10000, max: null },
    proposedRent: { label: '提示後賃料', min: 10000, max: null },
    marketRent: { label: '近傍同種の相場', min: 10000, max: null },
    yearsSinceReview: { label: '前回改定からの年数', min: 0, max: 50 }
  };

  function formatYen(value) {
    return new Intl.NumberFormat('ja-JP').format(Math.round(value)) + '円';
  }

  function formatCompactYen(value) {
    return '¥' + new Intl.NumberFormat('ja-JP').format(Math.round(value));
  }

  function getFieldElement(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function setFieldError(name, message) {
    var fieldInput = getFieldElement(name);
    var field = fieldInput ? fieldInput.closest('.field') : null;
    var error = document.getElementById(name + 'Error');

    if (!field || !error) {
      return;
    }

    field.classList.toggle('invalid', Boolean(message));
    error.textContent = message || '';
  }

  function clearErrors() {
    var names = Object.keys(fieldRules);
    var i;
    for (i = 0; i < names.length; i += 1) {
      setFieldError(names[i], '');
    }

    if (formError) {
      formError.textContent = '';
      formError.classList.remove('visible');
    }
  }

  function validateForm(values) {
    var errors = {};
    var names = Object.keys(fieldRules);
    var i;

    for (i = 0; i < names.length; i += 1) {
      var name = names[i];
      var rule = fieldRules[name];
      var rawValue = (values[name] || '').toString().trim();

      if (!rawValue) {
        errors[name] = rule.label + 'を入力してください。';
        continue;
      }

      var number = Number(rawValue);
      if (!isFinite(number)) {
        errors[name] = rule.label + 'は数字で入力してください。';
        continue;
      }

      if (rule.min !== null && number < rule.min) {
        errors[name] = rule.label + 'は' + rule.min.toLocaleString('ja-JP') + '以上で入力してください。';
        continue;
      }

      if (rule.max !== null && number > rule.max) {
        errors[name] = rule.label + 'は' + rule.max.toLocaleString('ja-JP') + '以下で入力してください。';
      }
    }

    if (!errors.currentRent && !errors.proposedRent) {
      var currentRent = Number(values.currentRent);
      var proposedRent = Number(values.proposedRent);

      if (proposedRent < currentRent) {
        errors.proposedRent = '提示後賃料は現在賃料以上を入力してください。';
      }
    }

    return errors;
  }

  function evaluateRisk(values) {
    var currentRent = Number(values.currentRent);
    var proposedRent = Number(values.proposedRent);
    var marketRent = Number(values.marketRent);
    var yearsSinceReview = Number(values.yearsSinceReview);
    var requestedIncreaseRate = ((proposedRent - currentRent) / currentRent) * 100;
    var marketDifference = proposedRent - marketRent;

    var score = 35;
    var reasons = [];
    var positives = 0;
    var negatives = 0;

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
        var delta = Math.abs(marketDifference);
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

    ['taxBurden', 'economicShift', 'improvement', 'specialClause', 'tenantHardship'].forEach(function (key) {
      var value = Number(values[key]);
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

    var level = '低め';
    var tone = 'low';
    var message = '現時点では、直ちに強い値上げ根拠があるとは言いにくい水準です。';

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
      score: score,
      level: level,
      tone: tone,
      message: message,
      currentRent: currentRent,
      proposedRent: proposedRent,
      marketRent: marketRent,
      requestedIncreaseRate: requestedIncreaseRate,
      marketDifference: marketDifference,
      reasons: reasons,
      positives: positives,
      negatives: negatives
    };
  }

  function buildShareData(result) {
    var marketGapAbs = Math.abs(result.marketDifference);
    var unfairnessScoreBase = (result.marketDifference / result.marketRent) * 100;
    var increaseShock = Math.max(0, result.requestedIncreaseRate - 5) * 2.2;
    var legalPushback = Math.max(0, 70 - result.score) * 0.55;
    var unfairnessScore = Math.max(0, Math.min(100, Math.round(unfairnessScoreBase * 3.6 + increaseShock + legalPushback)));

    var label = '相場どおり';
    var headline = 'この値上げ、まだ普通';
    var subline = '数字上は大きな違和感が少なく、感情的な引っかかりは強くありません。';
    var verdict = '相場から大きく外れていないため、Xでの反応は「妥当寄り」になりそうです。';

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

    var shareText = [
      '家賃値上げモヤモヤ診断',
      headline,
      '提示家賃 ' + formatYen(result.proposedRent) + ' / 現在家賃 ' + formatYen(result.currentRent),
      '相場との差 ' + (result.marketDifference >= 0 ? '+' : '-') + formatYen(marketGapAbs) + ' ・ 値上げ率 ' + Math.max(0, result.requestedIncreaseRate).toFixed(1) + '%',
      '理不尽度 ' + unfairnessScore + '/100',
      '#家賃 #賃貸 #不動産'
    ].join('\n');

    return {
      unfairnessScore: unfairnessScore,
      label: label,
      headline: headline,
      subline: subline,
      verdict: verdict,
      shareText: shareText
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
    var chars = text.split('');
    var lines = [];
    var line = '';

    chars.forEach(function (char) {
      var testLine = line + char;
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
    if (!shareCanvas) {
      return true;
    }

    var ctx = shareCanvas.getContext('2d');
    if (!ctx) {
      return false;
    }

    var width = shareCanvas.width;
    var height = shareCanvas.height;

    ctx.clearRect(0, 0, width, height);

    var gradient = ctx.createLinearGradient(0, 0, width, height);
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
    ctx.fillText('理不尽度 ' + shareData.unfairnessScore + ' / 100', width - 360, 86);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 60px "Yu Gothic", sans-serif';
    wrapText(ctx, shareData.headline, 820).slice(0, 2).forEach(function (line, index) {
      ctx.fillText(line, 72, 185 + index * 70);
    });

    ctx.font = '700 96px "Yu Gothic", sans-serif';
    ctx.fillStyle = '#fff7ed';
    ctx.fillText((result.marketDifference >= 0 ? '+' : '-') + formatCompactYen(Math.abs(result.marketDifference)).replace('¥', ''), 72, 366);

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
    ctx.fillText(Math.max(0, result.requestedIncreaseRate).toFixed(1) + '%', 740, 533);

    ctx.fillStyle = 'rgba(255,247,237,0.82)';
    ctx.font = '700 22px "Yu Gothic", sans-serif';
    wrapText(ctx, shareData.verdict, 1030).slice(0, 2).forEach(function (line, index) {
      ctx.fillText(line, 72, 604 + index * 28);
    });

    return true;
  }

  function updateShareUi(result) {
    var shareData = buildShareData(result);
    latestShareState = {
      result: result,
      shareData: shareData
    };

    if (shareLabel) {
      shareLabel.textContent = shareData.label;
    }
    if (shareScore) {
      shareScore.textContent = '理不尽度 ' + shareData.unfairnessScore + ' / 100';
    }
    if (shareHeadline) {
      shareHeadline.textContent = shareData.headline;
    }
    if (shareSubline) {
      shareSubline.textContent = shareData.subline;
    }
    if (shareGapAmount) {
      shareGapAmount.textContent = (result.marketDifference >= 0 ? '+' : '-') + formatYen(Math.abs(result.marketDifference));
    }
    if (shareGapCaption) {
      shareGapCaption.textContent = result.marketDifference >= 0 ? '相場より高い金額' : '相場より安い金額';
    }
    if (shareProposedRent) {
      shareProposedRent.textContent = formatYen(result.proposedRent);
    }
    if (shareCurrentRent) {
      shareCurrentRent.textContent = formatYen(result.currentRent);
    }
    if (shareIncreaseRate) {
      shareIncreaseRate.textContent = Math.max(0, result.requestedIncreaseRate).toFixed(1) + '%';
    }
    if (shareVerdict) {
      shareVerdict.textContent = shareData.verdict;
    }
    if (shareOnX) {
      shareOnX.setAttribute('href', 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareData.shareText));
    }
    if (shareCopyFeedback) {
      shareCopyFeedback.textContent = '';
    }

    return renderShareCanvas(result, shareData);
  }

  function render(result) {
    if (badge) {
      badge.textContent = result.level;
      badge.className = 'badge ' + result.tone;
    }
    if (scoreValue) {
      scoreValue.textContent = String(result.score);
    }
    if (scoreText) {
      scoreText.textContent = result.message;
    }
    if (increaseRate) {
      increaseRate.textContent = result.requestedIncreaseRate > 0 ? result.requestedIncreaseRate.toFixed(1) + '%' : '0%';
    }
    if (increaseRateCard) {
      increaseRateCard.classList.toggle('warn', result.requestedIncreaseRate > 10);
    }
    if (marketGap) {
      marketGap.textContent = (result.marketDifference >= 0 ? '+' : '-') + formatYen(Math.abs(result.marketDifference));
    }
    if (positiveCount) {
      positiveCount.textContent = result.positives + '件';
    }
    if (negativeCount) {
      negativeCount.textContent = result.negatives + '件';
    }
    if (meter) {
      meter.style.setProperty('--meter-position', result.score + '%');
    }
    if (lead) {
      lead.textContent = '値上げが認められやすいほどスコアが高くなります。';
    }
    if (reasonList) {
      reasonList.innerHTML = '';
      result.reasons.forEach(function (reason) {
        var item = document.createElement('li');
        item.textContent = reason;
        reasonList.appendChild(item);
      });
    }

    return updateShareUi(result);
  }

  function collectValues() {
    var values = {};
    var formData = new FormData(form);

    formData.forEach(function (value, key) {
      values[key] = value;
    });

    return values;
  }

  function submitCalculation() {
    var values = collectValues();
    var errors = validateForm(values);
    var firstErrorName = Object.keys(errors)[0];

    clearErrors();

    if (firstErrorName) {
      Object.keys(errors).forEach(function (name) {
        setFieldError(name, errors[name]);
      });

      if (formError) {
        formError.textContent = '未入力または入力内容に誤りがあります。赤字の項目を確認してください。';
        formError.classList.add('visible');
      }

      var firstField = getFieldElement(firstErrorName);
      if (firstField) {
        firstField.focus();
      }
      return false;
    }

    return render(evaluateRisk(values));
  }

  function copyViaExecCommand(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  function copyShareTextToClipboard() {
    if (!latestShareState || !shareCopyFeedback) {
      return;
    }

    var text = latestShareState.shareData.shareText;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        shareCopyFeedback.textContent = '投稿文をコピーしました。';
      }).catch(function () {
        shareCopyFeedback.textContent = copyViaExecCommand(text)
          ? '投稿文をコピーしました。'
          : 'コピーに失敗しました。手動でXボタンから投稿してください。';
      });
      return;
    }

    shareCopyFeedback.textContent = copyViaExecCommand(text)
      ? '投稿文をコピーしました。'
      : 'コピーに失敗しました。手動でXボタンから投稿してください。';
  }

  function downloadShareCard() {
    if (!latestShareState || !shareCanvas || !shareCopyFeedback) {
      return;
    }

    var canvasReady = renderShareCanvas(latestShareState.result, latestShareState.shareData);
    if (!canvasReady) {
      shareCopyFeedback.textContent = 'この環境では画像保存用のcanvasを初期化できませんでした。';
      return;
    }

    try {
      var link = document.createElement('a');
      link.href = shareCanvas.toDataURL('image/png');
      link.download = 'rent-increase-share-card.png';
      link.click();
      shareCopyFeedback.textContent = '画像保存を開始しました。';
    } catch (error) {
      shareCopyFeedback.textContent = '画像保存に失敗しました。ブラウザの制限で保存できない可能性があります。';
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    submitCalculation();
  });

  Array.prototype.slice.call(form.elements).forEach(function (element) {
    if (!element.name) {
      return;
    }

    var eventName = element.tagName === 'SELECT' ? 'change' : 'input';
    element.addEventListener(eventName, function () {
      submitCalculation();
    });
  });

  if (downloadCard) {
    downloadCard.addEventListener('click', downloadShareCard);
  }
  if (copyShareText) {
    copyShareText.addEventListener('click', copyShareTextToClipboard);
  }

  submitCalculation();
})();
