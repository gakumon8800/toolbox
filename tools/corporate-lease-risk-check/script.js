(function () {
  'use strict';

  var TOOL_NAME = '法人賃貸借契約リスク判定ツール';
  var SCORE_MIN = -25;
  var SCORE_MAX = 31;
  var DEFAULT_ACTION = '各項目を選択すると、判定帯に応じた推奨アクションを表示します。';
  var DEFAULT_CAPTION = '全13項目の入力後に、より精度の高い判断がしやすくなります。';

  var categories = [
    {
      id: 'company-scale',
      label: 'カテゴリ1',
      title: '企業規模・信用力',
      description: '企業の基本属性から、継続性や信用力の目安を確認します。',
      questions: [
        {
          id: 'employeeCount',
          label: '従業員数',
          options: [
            { value: '100名以上', score: 3 },
            { value: '30〜99名', score: 0 },
            { value: '30名未満', score: -2 }
          ]
        },
        {
          id: 'listingStatus',
          label: '上場・非上場',
          options: [
            { value: '上場', score: 4 },
            { value: '非上場', score: 0 }
          ]
        },
        {
          id: 'capital',
          label: '資本金',
          options: [
            { value: '1億円以上', score: 2 },
            { value: '1千万円〜1億円', score: 0 },
            { value: '1千万円未満', score: -2 }
          ]
        },
        {
          id: 'businessYears',
          label: '設立年数',
          options: [
            { value: '10年以上', score: 2 },
            { value: '3〜9年', score: 0 },
            { value: '3年未満', score: -2 }
          ]
        }
      ]
    },
    {
      id: 'finance-credit',
      label: 'カテゴリ2',
      title: '財務・信用情報',
      description: '提出資料や外部信用情報から、支払能力と透明性を確認します。',
      questions: [
        {
          id: 'tdbScore',
          label: '帝国DB評点',
          options: [
            { value: '50点以上', score: 3 },
            { value: '40〜49点', score: 0 },
            { value: '39点以下 / 不明', score: -2 }
          ]
        },
        {
          id: 'financialStatement',
          label: '決算書の提出',
          options: [
            { value: '2期・黒字', score: 2 },
            { value: '1期 / トントン', score: 0 },
            { value: '拒否 / 赤字', score: -3 }
          ]
        },
        {
          id: 'bankRelationship',
          label: '取引銀行',
          options: [
            { value: 'メガバンク・地銀', score: 1 },
            { value: 'その他', score: 0 }
          ]
        }
      ]
    },
    {
      id: 'contract-fit',
      label: 'カテゴリ3',
      title: '契約条件・物件適性',
      description: '賃料負担感や業種特性、預かり条件から契約適性を見ます。',
      questions: [
        {
          id: 'rentToSalesRatio',
          label: '賃料の月商比率',
          options: [
            { value: '3%以下', score: 2 },
            { value: '3〜5%', score: 0 },
            { value: '5%超 / 不明', score: -2 }
          ]
        },
        {
          id: 'industryRisk',
          label: '業種リスク',
          options: [
            { value: '一般事務所等', score: 2 },
            { value: '飲食・サービス', score: 0 },
            { value: 'リスク業種', score: -5 }
          ]
        },
        {
          id: 'deposit',
          label: '敷金・保証金',
          options: [
            { value: '6ヶ月以上', score: 3 },
            { value: '3〜5ヶ月', score: 1 },
            { value: '3ヶ月未満', score: 0 }
          ]
        }
      ]
    },
    {
      id: 'track-record',
      label: 'カテゴリ4',
      title: '取引実績・担保補完',
      description: '既存取引や保証補完の有無を確認し、リスクの下支えを見ます。',
      questions: [
        {
          id: 'previousDeal',
          label: '自社取引実績',
          options: [
            { value: 'あり', score: 2 },
            { value: 'なし', score: 0 }
          ]
        },
        {
          id: 'representativeGuarantee',
          label: '代表者個人保証・実印',
          options: [
            { value: '取得済み', score: 3 },
            { value: '取得不可', score: 0 }
          ]
        },
        {
          id: 'thirdPartyGuarantor',
          label: '連帯保証人（第三者）',
          options: [
            { value: 'あり', score: 2 },
            { value: 'なし', score: 0 }
          ]
        }
      ]
    }
  ];

  var judgmentRules = [
    {
      key: 'excellent',
      min: 18,
      max: Infinity,
      label: '保証会社なしで契約可',
      action: '保証会社なしでの契約を検討しやすい水準です。ただし、最終判断は物件特性・業種・社内基準も踏まえて行ってください。',
      caption: '信用力と補完条件が比較的そろっているため、社内基準に沿って前向きに検討しやすい帯です。',
      className: 'is-excellent'
    },
    {
      key: 'good',
      min: 10,
      max: 17,
      label: '条件付き可（敷金積み増し・代表者保証等）',
      action: '契約は可能性がありますが、条件面の補完を前提に判断してください。敷金積み増し、代表者保証、追加書類の取得などを検討してください。',
      caption: '一定の評価はありますが、そのまま進めるより条件補完を付ける前提での検討が適しています。',
      className: 'is-good'
    },
    {
      key: 'caution',
      min: 2,
      max: 9,
      label: '慎重判断（上長・オーナー相談必須）',
      action: 'リスク要素が一定数あります。担当者判断で進めず、上長・オーナーへの相談を前提に再確認してください。',
      caption: '見落としのない確認と承認判断が必要な帯です。単独判断での進行は避けてください。',
      className: 'is-caution'
    },
    {
      key: 'risk',
      min: -Infinity,
      max: 1,
      label: '契約不推奨（保証会社利用または見直し）',
      action: '現時点では保証会社なしでの契約は推奨しません。保証会社利用、条件見直し、追加担保の確保を前提に再検討してください。',
      caption: '保証補完なしで進めるにはリスクが高めです。条件の見直しを先に検討してください。',
      className: 'is-risk'
    }
  ];

  var allQuestions = categories.reduce(function (items, category) {
    return items.concat(category.questions);
  }, []);

  var form = document.getElementById('riskForm');
  var scoreValue = document.getElementById('scoreValue');
  var judgmentText = document.getElementById('judgmentText');
  var judgmentCaption = document.getElementById('judgmentCaption');
  var actionText = document.getElementById('actionText');
  var pendingCount = document.getElementById('pendingCount');
  var completionText = document.getElementById('completionText');
  var meterFill = document.getElementById('meterFill');
  var meterMarker = document.getElementById('meterMarker');
  var meterPositionLabel = document.getElementById('meterPositionLabel');
  var statusPanel = document.getElementById('statusPanel');
  var inputSummaryList = document.getElementById('inputSummaryList');
  var copyButton = document.getElementById('copyButton');
  var printButton = document.getElementById('printButton');
  var resetButton = document.getElementById('resetButton');
  var copyFeedback = document.getElementById('copyFeedback');

  function createOptionMarkup(question, option, index) {
    var inputId = question.id + '-' + index;
    var pointLabel = option.score > 0 ? '+' + option.score : String(option.score);

    return [
      '<div class="choice-option">',
      '<input class="choice-input" type="radio" id="' + inputId + '" name="' + question.id + '" value="' + index + '">',
      '<label class="choice-label" for="' + inputId + '">',
      '<span class="choice-text">' + option.value + '</span>',
      '<span class="choice-points">' + pointLabel + '点</span>',
      '</label>',
      '</div>'
    ].join('');
  }

  function renderQuestions() {
    var questionNumber = 0;

    form.innerHTML = categories.map(function (category) {
      var questionsHtml = category.questions.map(function (question, questionIndex) {
        questionNumber += 1;

        return [
          '<fieldset class="question-block">',
          '<div class="question-title-row">',
          '<legend class="question-title">' + questionNumber + '. ' + question.label + '</legend>',
          '</div>',
          '<p class="question-help">選択肢の点数を見ながら、該当する内容を1つ選択してください。</p>',
          '<div class="choice-group">',
          question.options.map(function (option, optionIndex) {
            return createOptionMarkup(question, option, optionIndex);
          }).join(''),
          '</div>',
          '</fieldset>'
        ].join('');
      }).join('');

      return [
        '<section class="card category-card">',
        '<div class="category-head">',
        '<span class="category-tag">' + category.label + '</span>',
        '<h2>' + category.title + '</h2>',
        '<p class="category-description">' + category.description + '</p>',
        '</div>',
        '<div class="question-list">',
        questionsHtml,
        '</div>',
        '</section>'
      ].join('');
    }).join('');
  }

  function getSelectedOption(question) {
    var checked = form.querySelector('input[name="' + question.id + '"]:checked');
    if (!checked) {
      return null;
    }

    return question.options[Number(checked.value)];
  }

  function collectState() {
    return allQuestions.reduce(function (state, question) {
      var selected = getSelectedOption(question);
      state.answers[question.id] = selected;

      if (!selected) {
        state.pending += 1;
        return state;
      }

      state.score += selected.score;
      return state;
    }, {
      score: 0,
      pending: 0,
      answers: {}
    });
  }

  function getJudgment(score) {
    return judgmentRules.find(function (rule) {
      return score >= rule.min && score <= rule.max;
    }) || judgmentRules[judgmentRules.length - 1];
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function renderInputSummary(answers) {
    inputSummaryList.innerHTML = allQuestions.map(function (question) {
      var selected = answers[question.id];
      var selectedText = selected ? selected.value + '（' + (selected.score > 0 ? '+' : '') + selected.score + '点）' : '未選択';
      var emptyClass = selected ? '' : ' is-empty';

      return [
        '<div class="summary-item">',
        '<span class="summary-item-label">' + question.label + '</span>',
        '<div class="summary-item-value' + emptyClass + '">' + selectedText + '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  function updateMeter(score) {
    var progress = ((clamp(score, SCORE_MIN, SCORE_MAX) - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
    meterFill.style.width = progress + '%';
    meterMarker.style.left = progress + '%';
    meterPositionLabel.textContent = score + ' / ' + SCORE_MAX;
  }

  function updateSummary(state) {
    var judgment = getJudgment(state.score);
    var completed = allQuestions.length - state.pending;
    var isInitial = state.pending === allQuestions.length;
    var statusMessage = state.pending > 0
      ? '未入力項目が' + state.pending + '件あります。判定は暫定表示です。'
      : judgment.caption;

    scoreValue.textContent = String(state.score);
    judgmentText.textContent = isInitial ? '入力待ち' : (state.pending > 0 ? '暫定：' + judgment.label : judgment.label);
    judgmentCaption.textContent = isInitial ? DEFAULT_CAPTION : statusMessage;
    actionText.textContent = isInitial ? DEFAULT_ACTION : (state.pending > 0
      ? judgment.action + ' なお、未入力項目の確認後に最終判断してください。'
      : judgment.action);
    pendingCount.textContent = state.pending + '件';
    completionText.textContent = state.pending === 0
      ? completed + ' / ' + allQuestions.length + '件入力済み（全項目入力完了）'
      : completed + ' / ' + allQuestions.length + '件入力済み';

    statusPanel.className = isInitial ? 'status-panel' : 'status-panel ' + judgment.className;
    updateMeter(state.score);
    renderInputSummary(state.answers);
  }

  function buildCopyText(state) {
    var judgment = getJudgment(state.score);
    var lines = [
      TOOL_NAME,
      '',
      '【入力内容】'
    ];

    allQuestions.forEach(function (question) {
      var selected = state.answers[question.id];
      lines.push(
        question.label + '：' + (selected ? selected.value + '（' + (selected.score > 0 ? '+' : '') + selected.score + '点）' : '未入力')
      );
    });

    lines.push('');
    lines.push('合計スコア：' + state.score + '点');
    lines.push('判定結果：' + judgment.label);
    lines.push('推奨アクション：' + (state.pending > 0
      ? judgment.action + ' 未入力項目を確認したうえで最終判断してください。'
      : judgment.action));
    lines.push('未入力項目数：' + state.pending + '件');

    return lines.join('\n');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        var copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (copied) {
          resolve();
          return;
        }
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
        return;
      }

      reject(new Error('copy failed'));
    });
  }

  function showCopyFeedback(message) {
    copyFeedback.textContent = message;
    window.clearTimeout(showCopyFeedback.timerId);
    showCopyFeedback.timerId = window.setTimeout(function () {
      copyFeedback.textContent = '';
    }, 2500);
  }

  function resetForm() {
    var checkedInputs = form.querySelectorAll('input[type="radio"]:checked');
    checkedInputs.forEach(function (input) {
      input.checked = false;
    });
    refresh();
  }

  function refresh() {
    var state = collectState();
    updateSummary(state);
    return state;
  }

  renderQuestions();
  refresh();

  form.addEventListener('change', function () {
    refresh();
  });

  copyButton.addEventListener('click', function () {
    var state = refresh();
    copyText(buildCopyText(state)).then(function () {
      showCopyFeedback('コピーしました');
    }).catch(function () {
      showCopyFeedback('コピーに失敗しました');
    });
  });

  printButton.addEventListener('click', function () {
    window.print();
  });

  resetButton.addEventListener('click', function () {
    resetForm();
    showCopyFeedback('入力をリセットしました');
  });
})();
