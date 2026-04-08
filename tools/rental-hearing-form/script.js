const STORAGE_KEY = "toolbox:rental-hearing-form";

const STEP_DEFINITIONS = [
  { id: 1, label: "基本条件" },
  { id: 2, label: "こだわり条件" },
  { id: 3, label: "入居者属性" },
  { id: 4, label: "優先順位" },
  { id: 5, label: "確認・出力" }
];

const BASIC_FIELDS = [
  { key: "customerName", label: "お名前", type: "text", placeholder: "例：山田 花子" },
  { key: "preferredArea", label: "希望エリア", type: "text", placeholder: "例：横浜駅周辺、東横線沿線", required: true },
  { key: "preferredStation", label: "最寄り希望駅", type: "text", placeholder: "例：横浜駅、武蔵小杉駅" },
  { key: "rentUpper", label: "賃料上限", type: "number", placeholder: "例：95000", required: true, suffix: "円" },
  { key: "rentWithFeeUpper", label: "管理費込み上限", type: "number", placeholder: "例：100000", suffix: "円" },
  { key: "layout", label: "希望間取り", type: "text", placeholder: "例：1LDK、2DK以上" },
  { key: "areaSize", label: "希望面積", type: "text", placeholder: "例：30㎡以上" },
  { key: "moveInTiming", label: "入居希望時期", type: "text", placeholder: "例：6月上旬まで、なるべく早め", required: true },
  { key: "destination", label: "通勤先・通学先", type: "text", placeholder: "例：品川駅、○○大学" },
  { key: "commuteTolerance", label: "通勤時間の許容", type: "text", placeholder: "例：片道30分以内" },
  { key: "moveReason", label: "引越し理由", type: "textarea", full: true, placeholder: "例：更新前に住み替えたい、在宅勤務が増えた" }
];

const PREFERENCE_ITEMS = [
  "駅徒歩10分以内",
  "2階以上",
  "最上階",
  "バス・トイレ別",
  "独立洗面台",
  "室内洗濯機置場",
  "追焚機能",
  "浴室乾燥機",
  "オートロック",
  "TVモニターホン",
  "宅配ボックス",
  "エレベーター",
  "バルコニー",
  "南向き",
  "角部屋",
  "エアコン",
  "システムキッチン",
  "2口コンロ以上",
  "都市ガス",
  "インターネット無料",
  "ペット可",
  "楽器可",
  "駐車場",
  "駐輪場",
  "バイク置場",
  "事務所利用相談",
  "法人契約可",
  "外国籍相談",
  "二人入居可",
  "高齢者相談",
  "定期借家不可"
];

const PREFERENCE_LEVELS = [
  { value: "must", label: "必須" },
  { value: "wish", label: "希望" },
  { value: "flexible", label: "こだわらない" }
];

const LIFESTYLE_FIELDS = [
  { key: "occupants", label: "入居予定人数", type: "text", placeholder: "例：1人、2人" },
  { key: "householdType", label: "同居者属性", type: "select", options: ["", "単身", "夫婦", "カップル", "家族", "ルームシェア", "その他"] },
  { key: "ageRange", label: "年齢帯", type: "text", placeholder: "例：20代後半、30代前半夫婦" },
  { key: "job", label: "職業", type: "text", placeholder: "例：会社員、学生" },
  { key: "employmentType", label: "雇用形態", type: "select", options: ["", "正社員", "契約社員", "派遣社員", "公務員", "自営業", "学生", "その他"] },
  { key: "yearsEmployed", label: "勤続年数", type: "text", placeholder: "例：3年、半年" },
  { key: "incomeRange", label: "年収帯", type: "text", placeholder: "例：400万円台、世帯年収700万円台" },
  { key: "remoteWork", label: "在宅勤務の有無", type: "select", options: ["", "あり", "なし", "一部あり"] },
  { key: "car", label: "車の有無", type: "select", options: ["", "あり", "なし", "今後購入予定"] },
  { key: "bicycle", label: "自転車の有無", type: "select", options: ["", "あり", "なし"] },
  { key: "children", label: "子どもの有無", type: "select", options: ["", "あり", "なし", "出産予定"] },
  { key: "petPlan", label: "ペット飼育予定", type: "select", options: ["", "あり", "なし", "検討中"] },
  { key: "smoking", label: "喫煙の有無", type: "select", options: ["", "あり", "なし"] },
  { key: "nightShift", label: "夜勤の有無", type: "select", options: ["", "あり", "なし"] },
  { key: "soundSensitive", label: "音に敏感か", type: "select", options: ["", "はい", "いいえ", "やや気になる"] },
  { key: "sunlightPriority", label: "日当たり重視か", type: "select", options: ["", "はい", "いいえ", "できれば"] },
  { key: "firstFloorOk", label: "1階でも問題ないか", type: "select", options: ["", "問題ない", "できれば避けたい", "不可"] },
  { key: "shortTermRisk", label: "短期解約の可能性", type: "select", options: ["", "あり", "なし", "未定"] },
  { key: "lifestyleNotes", label: "その他補足", type: "textarea", full: true, placeholder: "例：在宅会議が多い、楽器は電子ピアノのみ" }
];

const PRIORITY_OPTIONS = [
  "家賃",
  "初期費用",
  "広さ",
  "間取り",
  "築年数",
  "駅距離",
  "通勤利便性",
  "設備",
  "建物のきれいさ",
  "周辺環境",
  "日当たり",
  "音環境",
  "セキュリティ",
  "入居時期"
];

const PRIORITY_TEXT_FIELDS = [
  { key: "nonNegotiables", label: "絶対に譲れない条件", type: "textarea", full: true, placeholder: "例：家賃10万円以内、独立洗面台、横浜駅まで30分以内" },
  { key: "ideals", label: "できれば叶えたい条件", type: "textarea", full: true, placeholder: "例：築浅、オートロック、駅徒歩7分以内" },
  { key: "flexibles", label: "妥協できる条件", type: "textarea", full: true, placeholder: "例：築年数、バルコニーの有無、駅徒歩は15分まで可" }
];

const PRESETS = {
  single: {
    label: "単身向け",
    values: {
      occupants: "1人",
      householdType: "単身",
      layout: "1R〜1LDK",
      priorityOrder: ["家賃", "通勤利便性", "設備"],
      preferences: {
        "バス・トイレ別": "must",
        "室内洗濯機置場": "must",
        "エアコン": "must",
        "独立洗面台": "wish",
        "オートロック": "wish",
        "宅配ボックス": "wish"
      }
    }
  },
  couple: {
    label: "カップル向け",
    values: {
      occupants: "2人",
      householdType: "カップル",
      layout: "1LDK〜2LDK",
      priorityOrder: ["家賃", "広さ", "通勤利便性"],
      preferences: {
        "二人入居可": "must",
        "バス・トイレ別": "must",
        "独立洗面台": "must",
        "2口コンロ以上": "must",
        "追焚機能": "wish",
        "オートロック": "wish"
      }
    }
  },
  family: {
    label: "ファミリー向け",
    values: {
      occupants: "3人以上",
      householdType: "家族",
      layout: "2LDK〜3LDK",
      priorityOrder: ["広さ", "周辺環境", "家賃"],
      preferences: {
        "二人入居可": "must",
        "2口コンロ以上": "must",
        "室内洗濯機置場": "must",
        "駐輪場": "wish",
        "追焚機能": "wish",
        "角部屋": "wish"
      }
    }
  }
};

const state = {
  currentStep: 1,
  values: {},
  preferences: {},
  priorityOrder: []
};

const elements = {};

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  cacheElements();
  buildDefaultState();
  renderStepList();
  renderPresetButtons();
  renderFields(elements.basicFields, BASIC_FIELDS);
  renderPreferenceCards();
  renderFields(elements.lifestyleFields, LIFESTYLE_FIELDS);
  renderFields(elements.priorityTextFields, PRIORITY_TEXT_FIELDS);
  restoreState();
  attachEventListeners();
  updateView();
}

function cacheElements() {
  elements.form = document.getElementById("hearingForm");
  elements.basicFields = document.getElementById("basicFields");
  elements.lifestyleFields = document.getElementById("lifestyleFields");
  elements.priorityTextFields = document.getElementById("priorityTextFields");
  elements.preferenceGrid = document.getElementById("preferenceGrid");
  elements.priorityPool = document.getElementById("priorityPool");
  elements.prioritySelected = document.getElementById("prioritySelected");
  elements.summaryBlock = document.getElementById("summaryBlock");
  elements.tagGroups = document.getElementById("tagGroups");
  elements.staffSummary = document.getElementById("staffSummary");
  elements.internalMemo = document.getElementById("internalMemo");
  elements.customerMessage = document.getElementById("customerMessage");
  elements.jsonOutput = document.getElementById("jsonOutput");
  elements.stepList = document.getElementById("stepList");
  elements.progressFill = document.getElementById("progressFill");
  elements.progressLabel = document.getElementById("progressLabel");
  elements.progressStepName = document.getElementById("progressStepName");
  elements.prevButton = document.getElementById("prevButton");
  elements.nextButton = document.getElementById("nextButton");
  elements.formMessage = document.getElementById("formMessage");
  elements.completionList = document.getElementById("completionList");
  elements.mustTagList = document.getElementById("mustTagList");
  elements.wishTagList = document.getElementById("wishTagList");
  elements.supportText = document.getElementById("supportText");
  elements.presetActions = document.getElementById("presetActions");
  elements.downloadCsvButton = document.getElementById("downloadCsvButton");
  elements.printButton = document.getElementById("printButton");
  elements.resetButton = document.getElementById("resetButton");
}

function buildDefaultState() {
  [...BASIC_FIELDS, ...LIFESTYLE_FIELDS, ...PRIORITY_TEXT_FIELDS].forEach((field) => {
    state.values[field.key] = "";
  });

  PREFERENCE_ITEMS.forEach((item) => {
    state.preferences[item] = "flexible";
  });
}

function renderStepList() {
  elements.stepList.innerHTML = STEP_DEFINITIONS.map((step) => `
    <li class="step-item" data-step-item="${step.id}">Step ${step.id}<br>${escapeHtml(step.label)}</li>
  `).join("");
}

function renderPresetButtons() {
  elements.presetActions.innerHTML = Object.entries(PRESETS).map(([key, preset]) => `
    <button type="button" class="preset-button" data-preset="${key}">${escapeHtml(preset.label)}</button>
  `).join("");
}

function renderFields(container, fields) {
  container.innerHTML = fields.map((field) => createFieldMarkup(field)).join("");
}

function createFieldMarkup(field) {
  const required = field.required ? '<span class="required-badge">必須</span>' : "";
  const fullClass = field.full ? " full" : "";
  const help = field.suffix ? `<p class="field-help">数値のみ入力してください。${escapeHtml(field.suffix)}として扱います。</p>` : "";
  const error = `<p class="field-error" id="error-${field.key}" hidden></p>`;

  if (field.type === "textarea") {
    return `
      <div class="field${fullClass}" data-field="${field.key}">
        <label for="field-${field.key}">${escapeHtml(field.label)}${required}</label>
        <textarea id="field-${field.key}" name="${field.key}" placeholder="${escapeHtml(field.placeholder || "")}"></textarea>
        ${help}
        ${error}
      </div>
    `;
  }

  if (field.type === "select") {
    return `
      <div class="field${fullClass}" data-field="${field.key}">
        <label for="field-${field.key}">${escapeHtml(field.label)}${required}</label>
        <select id="field-${field.key}" name="${field.key}">
          ${field.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option || "選択してください")}</option>`).join("")}
        </select>
        ${error}
      </div>
    `;
  }

  const inputMode = field.type === "number" ? "numeric" : "text";
  return `
    <div class="field${fullClass}" data-field="${field.key}">
      <label for="field-${field.key}">${escapeHtml(field.label)}${required}</label>
      <input
        id="field-${field.key}"
        name="${field.key}"
        type="${field.type === "number" ? "number" : "text"}"
        inputmode="${inputMode}"
        placeholder="${escapeHtml(field.placeholder || "")}"
        min="${field.type === "number" ? "0" : ""}"
      >
      ${help}
      ${error}
    </div>
  `;
}

function renderPreferenceCards() {
  elements.preferenceGrid.innerHTML = PREFERENCE_ITEMS.map((item, index) => `
    <section class="preference-card">
      <h3>${escapeHtml(item)}</h3>
      <div class="segmented">
        ${PREFERENCE_LEVELS.map((level) => {
          const inputId = `preference-${index}-${level.value}`;
          return `
            <div>
              <input type="radio" id="${inputId}" name="preference-${index}" value="${level.value}" ${level.value === "flexible" ? "checked" : ""}>
              <label for="${inputId}" data-preference="${escapeHtml(item)}" data-value="${level.value}">${escapeHtml(level.label)}</label>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");
}

function attachEventListeners() {
  elements.form.addEventListener("input", handleFieldInput);
  elements.form.addEventListener("change", handleFieldInput);

  elements.preferenceGrid.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "radio") {
      return;
    }

    const label = elements.preferenceGrid.querySelector(`label[for="${target.id}"]`);
    if (!label) {
      return;
    }

    state.preferences[label.dataset.preference] = target.value;
    syncPreferenceChecks();
    persistState();
    refreshDerivedContent();
  });

  elements.priorityPool.addEventListener("click", (event) => {
    const button = event.target.closest("[data-priority-add]");
    if (!button) {
      return;
    }
    addPriority(button.dataset.priorityAdd);
  });

  elements.prioritySelected.addEventListener("click", (event) => {
    const moveButton = event.target.closest("[data-priority-move]");
    if (moveButton) {
      movePriority(Number(moveButton.dataset.index), moveButton.dataset.priorityMove);
      return;
    }

    const removeButton = event.target.closest("[data-priority-remove]");
    if (removeButton) {
      removePriority(Number(removeButton.dataset.index));
    }
  });

  elements.prevButton.addEventListener("click", goToPreviousStep);
  elements.nextButton.addEventListener("click", goToNextStep);

  elements.presetActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) {
      return;
    }
    applyPreset(button.dataset.preset);
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => copyOutput(button.dataset.copyTarget));
  });

  elements.downloadCsvButton.addEventListener("click", downloadCsv);
  elements.printButton.addEventListener("click", () => window.print());
  elements.resetButton.addEventListener("click", resetForm);
}

function handleFieldInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return;
  }

  const { name, value } = target;
  if (!name) {
    return;
  }

  state.values[name] = value;
  clearFieldError(name);
  persistState();
  refreshDerivedContent();
}

function goToPreviousStep() {
  if (state.currentStep === 1) {
    return;
  }
  state.currentStep -= 1;
  persistState();
  hideMessage();
  updateView();
}

function goToNextStep() {
  if (!validateStep(state.currentStep)) {
    return;
  }

  if (state.currentStep < STEP_DEFINITIONS.length) {
    state.currentStep += 1;
    persistState();
    hideMessage();
    updateView();
    return;
  }

  refreshDerivedContent();
  showMessage("出力内容を更新しました。必要に応じてコピーやCSVダウンロードをご利用ください。");
}

function validateStep(step) {
  hideMessage();

  if (step !== 1) {
    return true;
  }

  const requiredFields = BASIC_FIELDS.filter((field) => field.required);
  const missing = requiredFields.filter((field) => !normalizeValue(state.values[field.key]));

  if (!missing.length) {
    return true;
  }

  missing.forEach((field) => {
    showFieldError(field.key, `${field.label}を入力してください。`);
  });

  showMessage("未入力の必須項目があります。やさしく埋められる範囲で入力してください。");
  const firstField = document.getElementById(`field-${missing[0].key}`);
  if (firstField) {
    firstField.focus();
  }
  return false;
}

function showFieldError(key, message) {
  const fieldWrap = document.querySelector(`[data-field="${key}"]`);
  const error = document.getElementById(`error-${key}`);
  if (fieldWrap) {
    fieldWrap.classList.add("is-invalid");
  }
  if (error) {
    error.hidden = false;
    error.textContent = message;
  }
}

function clearFieldError(key) {
  const fieldWrap = document.querySelector(`[data-field="${key}"]`);
  const error = document.getElementById(`error-${key}`);
  if (fieldWrap) {
    fieldWrap.classList.remove("is-invalid");
  }
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }
}

function updateView() {
  document.querySelectorAll(".step-panel").forEach((panel) => {
    panel.hidden = Number(panel.dataset.step) !== state.currentStep;
  });

  elements.prevButton.hidden = state.currentStep === 1;
  elements.nextButton.textContent = state.currentStep === STEP_DEFINITIONS.length ? "出力を更新" : "次へ";

  const progressPercent = (state.currentStep / STEP_DEFINITIONS.length) * 100;
  elements.progressFill.style.width = `${progressPercent}%`;
  elements.progressLabel.textContent = `Step ${state.currentStep} / ${STEP_DEFINITIONS.length}`;
  elements.progressStepName.textContent = STEP_DEFINITIONS[state.currentStep - 1].label;

  document.querySelectorAll("[data-step-item]").forEach((item) => {
    const step = Number(item.dataset.stepItem);
    item.classList.toggle("is-active", step === state.currentStep);
    item.classList.toggle("is-done", step < state.currentStep);
  });

  renderPriorityUi();
  refreshDerivedContent();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPriorityUi() {
  elements.priorityPool.innerHTML = PRIORITY_OPTIONS.map((item) => `
    <button
      type="button"
      class="chip-button ${state.priorityOrder.includes(item) ? "is-selected" : ""}"
      data-priority-add="${escapeHtml(item)}"
    >
      ${escapeHtml(item)}
    </button>
  `).join("");

  if (!state.priorityOrder.length) {
    elements.prioritySelected.innerHTML = '<div class="empty-state">まだ重視項目が選択されていません。候補から追加してください。</div>';
    return;
  }

  elements.prioritySelected.innerHTML = state.priorityOrder.map((item, index) => `
    <div class="priority-order-item">
      <div><strong>${index + 1}.</strong> ${escapeHtml(item)}</div>
      <div class="priority-actions">
        <button type="button" class="priority-mini-button" data-priority-move="up" data-index="${index}" aria-label="上へ">↑</button>
        <button type="button" class="priority-mini-button" data-priority-move="down" data-index="${index}" aria-label="下へ">↓</button>
        <button type="button" class="priority-mini-button" data-priority-remove="true" data-index="${index}" aria-label="削除">×</button>
      </div>
    </div>
  `).join("");
}

function addPriority(item) {
  if (!item || state.priorityOrder.includes(item)) {
    return;
  }
  state.priorityOrder.push(item);
  persistState();
  renderPriorityUi();
  refreshDerivedContent();
}

function movePriority(index, direction) {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= state.priorityOrder.length) {
    return;
  }
  [state.priorityOrder[index], state.priorityOrder[nextIndex]] = [state.priorityOrder[nextIndex], state.priorityOrder[index]];
  persistState();
  renderPriorityUi();
  refreshDerivedContent();
}

function removePriority(index) {
  state.priorityOrder.splice(index, 1);
  persistState();
  renderPriorityUi();
  refreshDerivedContent();
}

function applyPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (!preset) {
    return;
  }

  Object.entries(preset.values).forEach(([key, value]) => {
    if (key === "preferences") {
      Object.entries(value).forEach(([preferenceName, preferenceValue]) => {
        state.preferences[preferenceName] = preferenceValue;
      });
      return;
    }

    if (key === "priorityOrder") {
      state.priorityOrder = [...value];
      return;
    }

    state.values[key] = value;
  });

  syncInputs();
  syncPreferenceChecks();
  persistState();
  refreshDerivedContent();
  showMessage(`${preset.label}の初期値を反映しました。必要に応じてそのまま調整してください。`);
}

function syncInputs() {
  Object.entries(state.values).forEach(([key, value]) => {
    const field = elements.form.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function syncPreferenceChecks() {
  PREFERENCE_ITEMS.forEach((item, index) => {
    const selectedValue = state.preferences[item] || "flexible";
    const input = document.getElementById(`preference-${index}-${selectedValue}`);
    if (input) {
      input.checked = true;
    }
  });
}

function refreshDerivedContent() {
  renderCompletionList();
  renderTags();
  renderSupportText();
  renderSummary();
  renderOutputs();
}

function renderCompletionList() {
  const requiredFields = BASIC_FIELDS.filter((field) => field.required);
  const lines = requiredFields.map((field) => {
    const filled = Boolean(normalizeValue(state.values[field.key]));
    return `
      <li class="status-item">
        <strong>${filled ? "入力済み" : "未入力"}</strong><br>
        ${escapeHtml(field.label)}${filled ? `：${escapeHtml(formatValue(field.key))}` : "を確認してください。"}
      </li>
    `;
  });

  const priorityText = state.priorityOrder.length
    ? `重視順位：${escapeHtml(state.priorityOrder.slice(0, 3).join(" / "))}`
    : "重視順位はまだ未設定です。";

  elements.completionList.innerHTML = `${lines.join("")}
    <li class="status-item">
      <strong>${state.priorityOrder.length ? "設定済み" : "未設定"}</strong><br>
      ${priorityText}
    </li>
  `;
}

function renderTags() {
  const mustTags = getPreferenceTags("must");
  const wishTags = getPreferenceTags("wish");
  const flexibleTags = getPreferenceTags("flexible").slice(0, 8);

  elements.mustTagList.innerHTML = mustTags.length ? mustTags.map((tag) => renderTag(tag, "must")).join("") : '<p class="empty-text">まだ必須条件は選ばれていません。</p>';
  elements.wishTagList.innerHTML = wishTags.length ? wishTags.map((tag) => renderTag(tag, "wish")).join("") : '<p class="empty-text">まだ希望条件は選ばれていません。</p>';

  elements.tagGroups.innerHTML = `
    <div>
      <h4>必須</h4>
      <div class="tag-list">${mustTags.length ? mustTags.map((tag) => renderTag(tag, "must")).join("") : '<span class="tag soft">未設定</span>'}</div>
    </div>
    <div>
      <h4>希望</h4>
      <div class="tag-list">${wishTags.length ? wishTags.map((tag) => renderTag(tag, "wish")).join("") : '<span class="tag soft">未設定</span>'}</div>
    </div>
    <div>
      <h4>こだわらない</h4>
      <div class="tag-list">${flexibleTags.length ? flexibleTags.map((tag) => renderTag(tag, "soft")).join("") : '<span class="tag soft">未設定</span>'}</div>
    </div>
  `;
}

function renderTag(label, type) {
  return `<span class="tag ${type}">${escapeHtml(label)}</span>`;
}

function renderSupportText() {
  const topPriorities = state.priorityOrder.slice(0, 3);
  const mustTags = getPreferenceTags("must");
  const commuteAxis = joinExisting([
    state.values.destination ? `${state.values.destination}への移動を前提` : "",
    state.values.commuteTolerance ? `許容通勤時間は${state.values.commuteTolerance}` : ""
  ]);
  const budgetAxis = state.values.rentUpper ? `家賃上限は${formatCurrency(state.values.rentUpper)}が目安です。` : "家賃上限が未入力のため、提案幅が広くなりやすい状態です。";
  const focusAxis = topPriorities.length ? `優先順位の上位は${topPriorities.join("、")}です。` : "優先順位を入れると提案軸がさらに整理しやすくなります。";
  const mustAxis = mustTags.length ? `必須条件は${mustTags.slice(0, 4).join("、")}です。` : "必須条件はまだ少なめなので、譲れない条件だけ追加すると提案しやすくなります。";

  elements.supportText.textContent = [budgetAxis, commuteAxis, focusAxis, mustAxis].filter(Boolean).join(" ");
}

function renderSummary() {
  const summaryCards = [
    {
      title: "基本条件",
      rows: [
        ["お名前", formatValue("customerName", "未入力")],
        ["希望エリア", formatValue("preferredArea", "未入力")],
        ["希望駅", formatValue("preferredStation", "未入力")],
        ["賃料上限", formatCurrency(state.values.rentUpper, "未入力")],
        ["管理費込み上限", formatCurrency(state.values.rentWithFeeUpper, "未入力")],
        ["入居希望時期", formatValue("moveInTiming", "未入力")]
      ]
    },
    {
      title: "入居者属性",
      rows: [
        ["入居予定人数", formatValue("occupants", "未入力")],
        ["同居者属性", formatValue("householdType", "未入力")],
        ["職業", formatValue("job", "未入力")],
        ["雇用形態", formatValue("employmentType", "未入力")],
        ["年収帯", formatValue("incomeRange", "未入力")],
        ["その他補足", formatValue("lifestyleNotes", "特記事項なし")]
      ]
    }
  ];

  elements.summaryBlock.innerHTML = `
    <div class="summary-grid">
      ${summaryCards.map((card) => `
        <section class="summary-card">
          <h3>${escapeHtml(card.title)}</h3>
          <dl>
            ${card.rows.map((row) => `
              <div>
                <dt>${escapeHtml(row[0])}</dt>
                <dd>${escapeHtml(row[1])}</dd>
              </div>
            `).join("")}
          </dl>
        </section>
      `).join("")}
    </div>
  `;
}

function renderOutputs() {
  const outputs = buildOutputTexts();
  elements.staffSummary.textContent = outputs.staffSummary;
  elements.internalMemo.textContent = outputs.internalMemo;
  elements.customerMessage.textContent = outputs.customerMessage;
  elements.jsonOutput.textContent = JSON.stringify(buildExportPayload(outputs), null, 2);
}

function buildOutputTexts() {
  const mustTags = getPreferenceTags("must");
  const wishTags = getPreferenceTags("wish");
  const topPriorities = state.priorityOrder.slice(0, 3);
  const areaText = joinExisting([state.values.preferredArea, state.values.preferredStation ? `${state.values.preferredStation}を候補駅として希望` : ""]);
  const commuteText = joinExisting([
    state.values.destination ? `${state.values.destination}へのアクセスを想定` : "",
    state.values.commuteTolerance ? `${state.values.commuteTolerance}を目安` : ""
  ]);
  const budgetText = joinExisting([
    state.values.rentUpper ? `賃料上限は${formatCurrency(state.values.rentUpper)}` : "",
    state.values.rentWithFeeUpper ? `管理費込みでは${formatCurrency(state.values.rentWithFeeUpper)}までを想定` : ""
  ]);
  const layoutText = joinExisting([
    state.values.layout ? `間取りは${state.values.layout}` : "",
    state.values.areaSize ? `広さは${state.values.areaSize}` : ""
  ]);
  const moveTimingText = state.values.moveInTiming ? `入居希望時期は${state.values.moveInTiming}` : "";
  const priorityText = topPriorities.length ? `優先順位は${topPriorities.join("、")}の順で重視。` : "";
  const mustText = mustTags.length ? `${listToJapanese(mustTags, 4)}は必須条件。` : "";
  const wishText = wishTags.length ? `${listToJapanese(wishTags, 4)}は希望条件。` : "";
  const nonNegotiablesText = state.values.nonNegotiables ? `特に譲れない条件として「${cleanSentence(state.values.nonNegotiables)}」を確認済み。` : "";
  const idealsText = state.values.ideals ? `できれば叶えたい条件は「${cleanSentence(state.values.ideals)}」。` : "";
  const flexiblesText = state.values.flexibles ? `妥協可能な条件は「${cleanSentence(state.values.flexibles)}」。` : "";
  const attributeText = joinExisting([
    state.values.occupants ? `入居予定は${state.values.occupants}` : "",
    state.values.householdType ? state.values.householdType : "",
    state.values.job ? state.values.job : "",
    state.values.employmentType ? state.values.employmentType : ""
  ]);

  const staffSummary = sentenceJoin([
    areaText ? `${areaText}で検討。` : "",
    commuteText ? `${commuteText}。` : "",
    budgetText ? `${budgetText}。` : "",
    layoutText ? `${layoutText}を希望。` : "",
    moveTimingText ? `${moveTimingText}。` : "",
    priorityText,
    mustText,
    wishText
  ]);

  const internalMemo = sentenceJoin([
    `${state.values.customerName || "お客様"}の賃貸条件整理。`,
    areaText ? `希望エリアは${areaText}。` : "",
    budgetText ? `${budgetText}。` : "",
    layoutText ? `${layoutText}。` : "",
    commuteText ? `${commuteText}。` : "",
    attributeText ? `入居者属性は${attributeText}。` : "",
    state.values.moveReason ? `引越し理由は「${cleanSentence(state.values.moveReason)}」。` : "",
    mustText,
    wishText,
    priorityText,
    nonNegotiablesText,
    idealsText,
    flexiblesText,
    state.values.lifestyleNotes ? `補足として「${cleanSentence(state.values.lifestyleNotes)}」。` : ""
  ]);

  const customerMessage = sentenceJoin([
    `${state.values.customerName || "お客様"}のご希望条件を整理いたしました。`,
    areaText ? `ご希望エリアは${areaText}です。` : "",
    budgetText ? `${budgetText}です。` : "",
    layoutText ? `${layoutText}をご希望です。` : "",
    moveTimingText ? `${moveTimingText}でお探しです。` : "",
    commuteText ? `${commuteText}を基準に物件をお探しします。` : "",
    mustTags.length ? `特に重視されている条件は、${listToJapanese(mustTags, 5)}です。` : "",
    wishTags.length ? `あわせて、${listToJapanese(wishTags, 5)}も優先しながら確認いたします。` : "",
    state.values.ideals ? `できれば叶えたい条件として「${cleanSentence(state.values.ideals)}」も承っています。` : "",
    state.values.flexibles ? `一方で「${cleanSentence(state.values.flexibles)}」は調整可能との認識です。` : "",
    "条件の優先順位を踏まえて、合いそうな物件を順次ご提案いたします。"
  ]);

  return {
    staffSummary,
    internalMemo,
    customerMessage
  };
}

function buildExportPayload(outputs) {
  return {
    exportedAt: new Date().toISOString(),
    basic: collectValues(BASIC_FIELDS),
    preferences: state.preferences,
    lifestyle: collectValues(LIFESTYLE_FIELDS),
    priorities: {
      order: state.priorityOrder,
      nonNegotiables: state.values.nonNegotiables,
      ideals: state.values.ideals,
      flexibles: state.values.flexibles
    },
    outputs
  };
}

function collectValues(fields) {
  return fields.reduce((result, field) => {
    result[field.key] = normalizeValue(state.values[field.key]);
    return result;
  }, {});
}

function copyOutput(targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  const text = target.textContent || "";
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    showMessage("この環境では自動コピーに対応していません。お手数ですが手動でコピーしてください。");
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showMessage("クリップボードにコピーしました。");
  }).catch(() => {
    showMessage("コピーに失敗しました。お手数ですが手動でコピーしてください。");
  });
}

function downloadCsv() {
  const outputs = buildOutputTexts();
  const row = {
    お名前: state.values.customerName,
    希望エリア: state.values.preferredArea,
    最寄り希望駅: state.values.preferredStation,
    賃料上限: formatCurrency(state.values.rentUpper),
    管理費込み上限: formatCurrency(state.values.rentWithFeeUpper),
    希望間取り: state.values.layout,
    希望面積: state.values.areaSize,
    入居希望時期: state.values.moveInTiming,
    通勤先通学先: state.values.destination,
    通勤時間の許容: state.values.commuteTolerance,
    引越し理由: state.values.moveReason,
    必須条件: getPreferenceTags("must").join(" / "),
    希望条件: getPreferenceTags("wish").join(" / "),
    こだわらない条件: getPreferenceTags("flexible").join(" / "),
    入居予定人数: state.values.occupants,
    同居者属性: state.values.householdType,
    年齢帯: state.values.ageRange,
    職業: state.values.job,
    雇用形態: state.values.employmentType,
    勤続年数: state.values.yearsEmployed,
    年収帯: state.values.incomeRange,
    在宅勤務: state.values.remoteWork,
    車: state.values.car,
    自転車: state.values.bicycle,
    子ども: state.values.children,
    ペット飼育予定: state.values.petPlan,
    喫煙: state.values.smoking,
    夜勤: state.values.nightShift,
    音に敏感か: state.values.soundSensitive,
    日当たり重視か: state.values.sunlightPriority,
    1階でも問題ないか: state.values.firstFloorOk,
    短期解約の可能性: state.values.shortTermRisk,
    その他補足: state.values.lifestyleNotes,
    重視順位: state.priorityOrder.join(" > "),
    絶対に譲れない条件: state.values.nonNegotiables,
    できれば叶えたい条件: state.values.ideals,
    妥協できる条件: state.values.flexibles,
    担当者向け要約: outputs.staffSummary,
    社内共有メモ: outputs.internalMemo,
    お客様確認用文章: outputs.customerMessage
  };

  const headers = Object.keys(row);
  const values = headers.map((header) => csvEscape(row[header]));
  const csv = `\uFEFF${headers.map(csvEscape).join(",")}\n${values.join(",")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildCsvFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage("CSVをダウンロードしました。");
}

function buildCsvFilename() {
  const area = sanitizeFilename(state.values.preferredArea || "rental");
  const name = sanitizeFilename(state.values.customerName || "hearing");
  return `${area}_${name}_rental-hearing-form.csv`;
}

function resetForm() {
  if (!window.confirm("入力内容をリセットします。よろしいですか。")) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  state.currentStep = 1;
  state.priorityOrder = [];
  buildDefaultState();
  clearAllErrors();
  syncInputs();
  syncPreferenceChecks();
  updateView();
  showMessage("入力内容をリセットしました。");
}

function persistState() {
  const payload = {
    currentStep: state.currentStep,
    values: state.values,
    preferences: state.preferences,
    priorityOrder: state.priorityOrder
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    clearAllErrors();
    syncInputs();
    syncPreferenceChecks();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.currentStep = clampStep(parsed.currentStep);
    state.values = { ...state.values, ...(parsed.values || {}) };
    state.preferences = { ...state.preferences, ...(parsed.preferences || {}) };
    state.priorityOrder = Array.isArray(parsed.priorityOrder)
      ? parsed.priorityOrder.filter((item) => PRIORITY_OPTIONS.includes(item))
      : [];
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }

  clearAllErrors();
  syncInputs();
  syncPreferenceChecks();
}

function clampStep(step) {
  const value = Number(step) || 1;
  return Math.min(Math.max(value, 1), STEP_DEFINITIONS.length);
}

function getPreferenceTags(level) {
  return PREFERENCE_ITEMS.filter((item) => state.preferences[item] === level);
}

function formatValue(key, fallback = "") {
  const value = normalizeValue(state.values[key]);
  return value || fallback;
}

function formatCurrency(value, fallback = "") {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return fallback;
  }
  const number = Number(normalized);
  if (Number.isNaN(number)) {
    return normalized;
  }
  return `${number.toLocaleString("ja-JP")}円`;
}

function listToJapanese(items, limit) {
  const sliced = items.slice(0, limit);
  if (!sliced.length) {
    return "";
  }
  if (items.length > limit) {
    return `${sliced.join("、")}など`;
  }
  return sliced.join("、");
}

function cleanSentence(text) {
  return normalizeValue(text).replace(/[。]+$/g, "");
}

function joinExisting(items) {
  return items.filter(Boolean).join("、");
}

function sentenceJoin(parts) {
  return parts.filter(Boolean).join("");
}

function showMessage(message) {
  elements.formMessage.hidden = false;
  elements.formMessage.textContent = message;
}

function hideMessage() {
  elements.formMessage.hidden = true;
  elements.formMessage.textContent = "";
}

function clearAllErrors() {
  document.querySelectorAll(".field.is-invalid").forEach((field) => {
    field.classList.remove("is-invalid");
  });
  document.querySelectorAll(".field-error").forEach((error) => {
    error.hidden = true;
    error.textContent = "";
  });
}

function normalizeValue(value) {
  return value == null ? "" : String(value).trim();
}

function csvEscape(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function sanitizeFilename(value) {
  return String(value).replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
