const MODE_DEFINITIONS = {
  home: {
    id: "home",
    label: "自宅入力モード",
    shortLabel: "自宅入力",
    description: "売主ご本人が自宅で入力する想定です。やさしい表現で、専門用語には補足を添えています。",
    points: [
      "わからない項目は「不明」のままで進められます",
      "専門用語に補足説明を表示します",
      "出力はサマリー画像のみです"
    ],
    allowCsv: false,
    showStoreFields: false,
    showInternalMemo: false,
    toneMessage: "わからない項目は“不明”のままで大丈夫です。あとで確認が必要な項目は、まとめて表示されます。",
    supportMessage: "この画面は、売却相談前の整理用です。正式な確認は、登記資料や契約書類などで別途ご確認ください。",
    unknownMessage: "不明な内容は空欄でも進められます。入力しやすい範囲だけで大丈夫です。",
    privacyNotice: false,
    inactivityLimitMs: 0
  },
  storeStaff: {
    id: "storeStaff",
    label: "店頭同席入力モード",
    shortLabel: "店頭同席",
    description: "営業担当が売主と一緒に画面を見ながら入力する想定です。実務向けに簡潔な文言です。",
    points: [
      "不明項目は不明で入力できます",
      "画像出力とCSV出力に対応します",
      "社内メモ欄を表示します"
    ],
    allowCsv: true,
    showStoreFields: true,
    showInternalMemo: true,
    toneMessage: "不明項目は不明で入力してください。確認前提の項目は要確認事項に自動整理されます。",
    supportMessage: "店頭での初回面談整理用です。重要論点は、登記・管理資料・告知書で必ず再確認してください。",
    unknownMessage: "未確定事項は空欄または不明で構いません。出力後は必要に応じて内容を消去してください。",
    privacyNotice: false,
    inactivityLimitMs: 0
  },
  storeLoan: {
    id: "storeLoan",
    label: "店頭端末貸出モード",
    shortLabel: "端末貸出",
    description: "会社端末を一時的に貸し出して入力してもらう想定です。やややさしい文言で、消去案内を強めています。",
    points: [
      "入力後は内容を消去してください",
      "画像出力とCSV出力に対応します",
      "10分間操作がない場合は自動で初期化します"
    ],
    allowCsv: true,
    showStoreFields: true,
    showInternalMemo: true,
    toneMessage: "入力後は内容を消去してください。わからない項目は不明で問題ありません。",
    supportMessage: "端末に情報を残しにくい設計です。入力後は出力を確認し、最後に消去してください。",
    unknownMessage: "不明な項目は無理に入力しなくて大丈夫です。あとで確認する内容は自動で一覧に出ます。",
    privacyNotice: true,
    inactivityLimitMs: 10 * 60 * 1000
  }
};

const TRISTATE_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "はい", label: "はい" },
  { value: "いいえ", label: "いいえ" },
  { value: "不明", label: "不明" }
];

const CATEGORY_DEFINITIONS = [
  {
    id: "basic",
    title: "A. 基本情報",
    stepLabel: "基本情報",
    description: "連絡先や物件の基本情報を整理します。",
    fields: [
      { key: "inputDate", label: "入力日", type: "date", default: () => getTodayString() },
      { key: "propertyName", label: "物件名", type: "text", placeholder: "例：○○マンション 305号室", note: "戸建の場合は空欄でも構いません。" },
      { key: "propertyAddress", label: "物件所在地", type: "text", placeholder: "例：東京都○○区..." },
      { key: "ownerName", label: "所有者名", type: "text", placeholder: "例：山田 太郎" },
      { key: "phone", label: "電話番号", type: "tel", placeholder: "例：090-1234-5678" },
      { key: "email", label: "メールアドレス", type: "email", placeholder: "例：sample@example.com" },
      { key: "staffName", label: "担当者名", type: "text", placeholder: "例：田中", storeOnly: true },
      { key: "meetingPlace", label: "面談場所", type: "text", placeholder: "例：店頭", storeOnly: true, default: () => "店頭" }
    ]
  },
  {
    id: "intention",
    title: "B. 売却意向",
    stepLabel: "売却意向",
    description: "売却の背景やスケジュール感を確認します。",
    fields: [
      { key: "saleReason", label: "売却理由", type: "textarea", full: true, placeholder: "例：住み替え、相続、資産整理など" },
      { key: "desiredPrice", label: "希望価格", type: "text", placeholder: "例：3,480万円" },
      { key: "desiredTiming", label: "希望時期", type: "text", placeholder: "例：3か月以内、年内" },
      { key: "nextResidence", label: "売却後の住まい予定", type: "textarea", full: true, placeholder: "例：賃貸へ住み替え、実家へ戻る予定" },
      {
        key: "viewingAvailability",
        label: "内見対応の可否",
        type: "select",
        options: TRISTATE_OPTIONS,
        helpHome: "内見は、購入希望者が室内を見学することです。"
      },
      { key: "otherRequests", label: "その他希望事項", type: "textarea", full: true, placeholder: "例：近隣に知られたくない、土日のみ希望 など" }
    ]
  },
  {
    id: "legal",
    title: "C. 権利・法務",
    stepLabel: "権利関係",
    description: "共有や相続、残債など、売却前に確認が必要な論点を整理します。",
    fields: [
      { key: "ownerOnly", label: "所有者は本人のみか", type: "select", options: TRISTATE_OPTIONS, helpHome: "共有名義やご家族名義がある場合は「いいえ」を選んでください。" },
      { key: "hasCoOwner", label: "共有者の有無", type: "select", options: TRISTATE_OPTIONS },
      { key: "inheritancePending", label: "相続未了の有無", type: "select", options: TRISTATE_OPTIONS, helpHome: "相続登記がまだ済んでいない場合です。" },
      { key: "hasMortgage", label: "住宅ローン残債の有無", type: "select", options: TRISTATE_OPTIONS },
      { key: "hasLegalIssue", label: "差押え・裁判関係の有無", type: "select", options: TRISTATE_OPTIONS, helpHome: "差押え、訴訟、仮差押えなどがある場合です。" },
      { key: "boundaryClarity", label: "境界の明確さ", type: "select", options: TRISTATE_OPTIONS, helpHome: "隣地との境界標や測量資料がわかるかどうかです。" },
      { key: "encroachment", label: "越境の有無", type: "select", options: TRISTATE_OPTIONS, helpHome: "塀、樹木、配管などが敷地境界を越えていないかです。" },
      { key: "privateRoad", label: "前面道路が私道か", type: "select", options: TRISTATE_OPTIONS },
      { key: "legalNotes", label: "備考", type: "textarea", full: true, placeholder: "登記や書類の状況など" }
    ]
  },
  {
    id: "condition",
    title: "D. 物件状態",
    stepLabel: "物件状態",
    description: "不具合や告知事項など、現況に関する情報を確認します。",
    fields: [
      { key: "leakHistory", label: "雨漏り・水漏れ履歴", type: "select", options: TRISTATE_OPTIONS },
      { key: "buildingIssue", label: "建物の傾き・不具合の認識", type: "select", options: TRISTATE_OPTIONS },
      { key: "pestIssue", label: "シロアリ・害虫被害", type: "select", options: TRISTATE_OPTIONS },
      { key: "repairHistory", label: "修繕・リフォーム履歴", type: "textarea", full: true, placeholder: "例：2020年キッチン交換" },
      { key: "neighborTrouble", label: "近隣トラブル", type: "select", options: TRISTATE_OPTIONS },
      { key: "disclosureIssue", label: "事故・告知事項", type: "select", options: TRISTATE_OPTIONS, helpHome: "過去の事故や心理的告知事項などがある場合です。" },
      { key: "conditionNotes", label: "備考", type: "textarea", full: true, placeholder: "現況の補足事項" }
    ]
  },
  {
    id: "management",
    title: "E. 管理・運用",
    stepLabel: "管理運用",
    description: "管理費や賃貸状況など、運用面の確認事項を整理します。",
    fields: [
      {
        key: "propertyType",
        label: "マンションか戸建か",
        type: "select",
        options: [
          { value: "", label: "選択してください" },
          { value: "マンション", label: "マンション" },
          { value: "戸建", label: "戸建" },
          { value: "その他", label: "その他" },
          { value: "不明", label: "不明" }
        ]
      },
      { key: "managementFee", label: "管理費", type: "text", placeholder: "例：月額 12,000円" },
      { key: "repairReserve", label: "修繕積立金", type: "text", placeholder: "例：月額 8,000円", helpHome: "マンションの場合に毎月積み立てる費用です。" },
      { key: "arrears", label: "滞納の有無", type: "select", options: TRISTATE_OPTIONS },
      { key: "majorRepairPlan", label: "大規模修繕予定", type: "text", placeholder: "例：2027年予定、不明でも可" },
      { key: "isRented", label: "賃貸中か", type: "select", options: TRISTATE_OPTIONS },
      { key: "rentAmount", label: "家賃", type: "text", placeholder: "例：月額 120,000円" },
      { key: "rentalTrouble", label: "滞納・トラブル履歴", type: "textarea", full: true, placeholder: "入居者の滞納や苦情履歴など" },
      { key: "managementNotes", label: "備考", type: "textarea", full: true, placeholder: "管理状況の補足事項" }
    ]
  },
  {
    id: "free",
    title: "F. 自由記述",
    stepLabel: "自由記述",
    description: "気になる点や補足事項を自由に記入できます。",
    fields: [
      { key: "concerns", label: "気になる点", type: "textarea", full: true, placeholder: "売却にあたり気になっている点" },
      { key: "supplement", label: "補足事項", type: "textarea", full: true, placeholder: "そのほか伝えておきたい事項" }
    ]
  },
  {
    id: "memo",
    title: "G. 店頭モードのみの社内メモ",
    stepLabel: "社内メモ",
    description: "店頭運用時の社内管理用メモです。",
    storeOnly: true,
    fields: [
      {
        key: "temperature",
        label: "温度感",
        type: "select",
        options: [
          { value: "", label: "選択してください" },
          { value: "高い", label: "高い" },
          { value: "普通", label: "普通" },
          { value: "低い", label: "低い" }
        ]
      },
      {
        key: "priority",
        label: "優先度",
        type: "select",
        options: [
          { value: "", label: "選択してください" },
          { value: "高", label: "高" },
          { value: "中", label: "中" },
          { value: "低", label: "低" }
        ]
      },
      { key: "nextAction", label: "次回アクション", type: "textarea", full: true, placeholder: "例：登記簿確認、査定訪問調整" },
      { key: "followUpDate", label: "追客予定", type: "text", placeholder: "例：4月上旬に再連絡" },
      { key: "staffMemo", label: "担当メモ", type: "textarea", full: true, placeholder: "社内共有メモ" }
    ]
  }
];

const CHECK_RULES = [
  { key: "inheritancePending", values: ["はい"], message: "相続関係の確認が必要", level: "risk" },
  { key: "hasMortgage", values: ["はい"], message: "残債確認・抹消準備が必要", level: "risk" },
  { key: "boundaryClarity", values: ["いいえ", "不明"], message: "境界資料・測量関係の確認が必要", level: "warn" },
  { key: "encroachment", values: ["はい"], message: "越境内容の確認が必要", level: "risk" },
  { key: "leakHistory", values: ["はい"], message: "修繕履歴・現況確認が必要", level: "risk" },
  { key: "neighborTrouble", values: ["はい"], message: "近隣トラブル内容の確認が必要", level: "risk" },
  { key: "isRented", values: ["はい"], message: "賃貸条件・入居状況の確認が必要", level: "warn" },
  { key: "arrears", values: ["はい"], message: "管理費等の滞納確認が必要", level: "risk" },
  { key: "hasCoOwner", values: ["はい"], message: "共有者の意思確認と書類準備が必要", level: "risk" },
  { key: "hasLegalIssue", values: ["はい"], message: "差押え・裁判関係の詳細確認が必要", level: "risk" },
  { key: "disclosureIssue", values: ["はい"], message: "告知事項の内容整理と説明準備が必要", level: "risk" },
  { key: "privateRoad", values: ["はい", "不明"], message: "私道負担・通行掘削承諾の確認が必要", level: "warn" },
  { key: "buildingIssue", values: ["はい"], message: "建物不具合の現況確認が必要", level: "warn" }
];

const RISK_RULES = [
  { key: "hasCoOwner", values: ["はい"], label: "共有者あり" },
  { key: "inheritancePending", values: ["はい"], label: "相続未了あり" },
  { key: "hasMortgage", values: ["はい"], label: "ローン残債あり" },
  { key: "hasLegalIssue", values: ["はい"], label: "差押え・裁判関係あり" },
  { key: "boundaryClarity", values: ["いいえ", "不明"], label: "境界不明" },
  { key: "encroachment", values: ["はい"], label: "越境あり" },
  { key: "leakHistory", values: ["はい"], label: "雨漏りあり" },
  { key: "neighborTrouble", values: ["はい"], label: "近隣トラブルあり" },
  { key: "isRented", values: ["はい"], label: "賃貸中" },
  { key: "arrears", values: ["はい"], label: "滞納あり" },
  { key: "disclosureIssue", values: ["はい"], label: "告知事項あり" }
];

const CSV_COLUMNS = [
  { key: "modeLabel", label: "入力モード" },
  { key: "inputDate", label: "入力日" },
  { key: "propertyName", label: "物件名" },
  { key: "propertyAddress", label: "物件所在地" },
  { key: "ownerName", label: "所有者名" },
  { key: "phone", label: "電話番号" },
  { key: "email", label: "メールアドレス" },
  { key: "staffName", label: "担当者名" },
  { key: "saleReason", label: "売却理由" },
  { key: "desiredPrice", label: "希望価格" },
  { key: "desiredTiming", label: "希望時期" },
  { key: "nextResidence", label: "売却後の住まい予定" },
  { key: "viewingAvailability", label: "内見対応" },
  { key: "ownerOnly", label: "所有者本人のみ" },
  { key: "hasCoOwner", label: "共有者有無" },
  { key: "inheritancePending", label: "相続未了" },
  { key: "hasMortgage", label: "住宅ローン残債" },
  { key: "hasLegalIssue", label: "差押え裁判関係" },
  { key: "boundaryClarity", label: "境界の明確さ" },
  { key: "encroachment", label: "越境" },
  { key: "privateRoad", label: "私道" },
  { key: "leakHistory", label: "雨漏り水漏れ" },
  { key: "buildingIssue", label: "傾き不具合" },
  { key: "pestIssue", label: "シロアリ害虫" },
  { key: "repairHistory", label: "修繕リフォーム履歴" },
  { key: "neighborTrouble", label: "近隣トラブル" },
  { key: "disclosureIssue", label: "告知事項" },
  { key: "propertyType", label: "物件種別" },
  { key: "managementFee", label: "管理費" },
  { key: "repairReserve", label: "修繕積立金" },
  { key: "arrears", label: "滞納" },
  { key: "majorRepairPlan", label: "大規模修繕予定" },
  { key: "isRented", label: "賃貸中" },
  { key: "rentAmount", label: "家賃" },
  { key: "rentalTrouble", label: "賃貸トラブル履歴" },
  { key: "concerns", label: "気になる点" },
  { key: "supplement", label: "補足事項" },
  { key: "temperature", label: "温度感" },
  { key: "priority", label: "優先度" },
  { key: "nextAction", label: "次回アクション" },
  { key: "followUpDate", label: "追客予定" },
  { key: "staffMemo", label: "担当メモ" },
  { key: "checkItemsText", label: "自動生成された要確認事項" }
];

const state = {
  currentMode: null,
  currentView: "mode",
  values: {},
  lastDownloads: [],
  inactivityTimerId: null
};

const elements = {
  modeGrid: document.getElementById("modeGrid"),
  modeView: document.getElementById("modeView"),
  formView: document.getElementById("formView"),
  previewView: document.getElementById("previewView"),
  outputView: document.getElementById("outputView"),
  stickyBar: document.getElementById("stickyBar"),
  modeChip: document.getElementById("modeChip"),
  modeCaption: document.getElementById("modeCaption"),
  privacyBanner: document.getElementById("privacyBanner"),
  stepNav: document.getElementById("stepNav"),
  stepList: document.getElementById("stepList"),
  formLead: document.getElementById("formLead"),
  modeMessage: document.getElementById("modeMessage"),
  unknownMessage: document.getElementById("unknownMessage"),
  sectionJump: document.getElementById("sectionJump"),
  formSections: document.getElementById("formSections"),
  hearingForm: document.getElementById("hearingForm"),
  checkItemsList: document.getElementById("checkItemsList"),
  riskItemsList: document.getElementById("riskItemsList"),
  supportText: document.getElementById("supportText"),
  previewSummary: document.getElementById("previewSummary"),
  previewCheckItems: document.getElementById("previewCheckItems"),
  outputStatus: document.getElementById("outputStatus"),
  downloadList: document.getElementById("downloadList"),
  outputLead: document.getElementById("outputLead"),
  csvExportButton: document.getElementById("csvExportButton"),
  exportCsvAgainButton: document.getElementById("exportCsvAgainButton")
};

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  renderModeCards();
  renderSteps();
  attachEventListeners();
  resetFormValues();
  updateLiveAssistants();
}

function attachEventListeners() {
  document.getElementById("backToModeButton").addEventListener("click", () => {
    if (confirm("モードを変更すると現在の入力内容は初期化されます。よろしいですか。")) {
      resetApp();
    }
  });

  document.getElementById("fillDemoButton").addEventListener("click", fillDemoData);
  document.getElementById("toPreviewButton").addEventListener("click", handlePreviewMove);
  document.getElementById("editButton").addEventListener("click", () => setView("form"));
  document.getElementById("clearButton").addEventListener("click", () => {
    if (confirm("入力内容をすべて消去します。よろしいですか。")) {
      resetApp();
    }
  });
  document.getElementById("imageExportButton").addEventListener("click", exportSummaryImages);
  document.getElementById("csvExportButton").addEventListener("click", exportCsv);
  document.getElementById("backToPreviewButton").addEventListener("click", () => setView("preview"));
  document.getElementById("exportAgainButton").addEventListener("click", exportSummaryImages);
  document.getElementById("exportCsvAgainButton").addEventListener("click", exportCsv);
  document.getElementById("resetAfterExportButton").addEventListener("click", () => {
    if (confirm("入力内容を消去して初期画面へ戻ります。よろしいですか。")) {
      resetApp();
    }
  });

  elements.hearingForm.addEventListener("input", handleFormInput);
  elements.hearingForm.addEventListener("change", handleFormInput);

  ["click", "keydown", "pointerdown", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, refreshInactivityTimer, { passive: true });
  });
}

function renderModeCards() {
  elements.modeGrid.innerHTML = "";

  Object.values(MODE_DEFINITIONS).forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-card";
    button.innerHTML = `
      <div>
        <span class="mini-badge">利用シーン別</span>
      </div>
      <div>
        <strong>${escapeHtml(mode.label)}</strong>
        <p class="mode-description">${escapeHtml(mode.description)}</p>
      </div>
      <ul class="mode-points">
        ${mode.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
      </ul>
    `;
    button.addEventListener("click", () => selectMode(mode.id));
    elements.modeGrid.appendChild(button);
  });
}

function renderSteps() {
  const steps = [
    "モード選択",
    ...CATEGORY_DEFINITIONS.filter((category) => !category.storeOnly).map((category) => category.stepLabel)
  ];

  elements.stepList.innerHTML = steps
    .map((step, index) => `<li class="step-item" data-step-index="${index}">${escapeHtml(step)}</li>`)
    .join("");
}

function selectMode(modeId) {
  state.currentMode = modeId;
  resetFormValues();
  renderForm();
  updateModeHeader();
  updateStepState();
  updateLiveAssistants();
  setView("form");
  refreshInactivityTimer();
}

function renderForm() {
  const mode = getCurrentMode();
  elements.formSections.innerHTML = "";
  elements.sectionJump.innerHTML = "";
  elements.formLead.textContent = mode.showStoreFields
    ? "売主情報と確認事項を整理し、確認画面から画像やCSVを出力できます。"
    : "入力しやすい範囲だけで構いません。確認画面からサマリー画像を保存できます。";
  elements.modeMessage.textContent = mode.toneMessage;
  elements.unknownMessage.textContent = mode.unknownMessage;
  elements.supportText.textContent = mode.supportMessage;

  getVisibleCategories().forEach((category) => {
    const jump = document.createElement("a");
    jump.className = "jump-link";
    jump.href = `#section-${category.id}`;
    jump.textContent = category.stepLabel;
    elements.sectionJump.appendChild(jump);

    const section = document.createElement("section");
    section.className = "form-section";
    section.id = `section-${category.id}`;

    const fieldsHtml = category.fields
      .filter((field) => isFieldVisible(field, mode))
      .map((field) => createFieldHtml(field, mode))
      .join("");

    section.innerHTML = `
      <div class="form-section-header">
        <h3>${escapeHtml(category.title)}</h3>
        <p>${escapeHtml(category.description)}</p>
      </div>
      <div class="form-grid">
        ${fieldsHtml}
      </div>
    `;

    elements.formSections.appendChild(section);
  });

  syncFormValues();
}

function createFieldHtml(field, mode) {
  const inputId = `field-${field.key}`;
  const helpText = mode.id === "home" || mode.id === "storeLoan"
    ? field.helpHome || field.help
    : field.help;
  const noteText = field.note || "";
  const value = getValue(field.key);
  const wrapperClass = field.full ? "field full" : "field";
  const riskBadge = isRiskFieldHighlighted(field.key, value)
    ? '<span class="warning-badge">要注意</span>'
    : "";

  let controlHtml = "";
  if (field.type === "textarea") {
    controlHtml = `
      <textarea id="${inputId}" name="${field.key}" placeholder="${escapeHtml(field.placeholder || "")}">${escapeHtml(value)}</textarea>
    `;
  } else if (field.type === "select") {
    controlHtml = `
      <select id="${inputId}" name="${field.key}">
        ${field.options.map((option) => `
          <option value="${escapeHtml(option.value)}" ${option.value === value ? "selected" : ""}>
            ${escapeHtml(option.label)}
          </option>
        `).join("")}
      </select>
    `;
  } else {
    controlHtml = `
      <input
        id="${inputId}"
        name="${field.key}"
        type="${field.type}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(field.placeholder || "")}"
        autocomplete="off"
        inputmode="${getInputMode(field.type)}"
      >
    `;
  }

  return `
    <div class="${wrapperClass}">
      <label for="${inputId}">
        <span class="label-row">
          <span>${escapeHtml(field.label)}</span>
          ${riskBadge}
        </span>
      </label>
      ${controlHtml}
      ${helpText ? `<p class="field-help">${escapeHtml(helpText)}</p>` : ""}
      ${noteText ? `<p class="field-note">${escapeHtml(noteText)}</p>` : ""}
    </div>
  `;
}

function handleFormInput(event) {
  const target = event.target;
  if (!target.name) {
    return;
  }

  state.values[target.name] = normalizeValue(target.value);
  updateFieldWarnings();
  updateLiveAssistants();
}

function handlePreviewMove() {
  buildPreview();
  setView("preview");
}

function buildPreview() {
  const riskSet = new Set(generateRiskItems().map((item) => item.label));
  const previewCategories = getVisibleCategories();

  elements.previewSummary.innerHTML = previewCategories
    .map((category) => {
      const items = category.fields
        .filter((field) => isFieldVisible(field, getCurrentMode()))
        .map((field) => {
          const value = formatPreviewValue(field.key);
          const isRisk = riskSet.has(getRiskLabelForField(field.key));
          return `
            <div class="preview-item">
              <span class="preview-item-label">${escapeHtml(field.label)}</span>
              <span class="preview-item-value ${value === "未入力" ? "is-empty" : ""}">${escapeHtml(value)}</span>
              ${isRisk ? '<span class="preview-item-risk">要注意項目</span>' : ""}
            </div>
          `;
        })
        .join("");

      return `
        <section class="preview-card">
          <h3>${escapeHtml(category.title)}</h3>
          <div class="preview-grid">${items}</div>
        </section>
      `;
    })
    .join("");

  renderStatusList(elements.previewCheckItems, generateCheckItems(), "現在、自動で抽出された要確認事項はありません。");
}

function setView(viewName) {
  state.currentView = viewName;
  elements.modeView.hidden = viewName !== "mode";
  elements.formView.hidden = viewName !== "form";
  elements.previewView.hidden = viewName !== "preview";
  elements.outputView.hidden = viewName !== "output";

  const needsHeader = viewName !== "mode";
  elements.stickyBar.hidden = !needsHeader;
  elements.stepNav.hidden = !needsHeader;
  updateStepState();
}

function updateModeHeader() {
  const mode = getCurrentMode();
  if (!mode) {
    elements.modeChip.textContent = "モード未選択";
    elements.modeCaption.textContent = "利用モードを選択してください。";
    elements.privacyBanner.hidden = true;
    return;
  }

  elements.modeChip.textContent = mode.label;
  elements.modeCaption.textContent = mode.description;
  elements.privacyBanner.hidden = !mode.privacyNotice;
  elements.csvExportButton.hidden = !mode.allowCsv;
  elements.exportCsvAgainButton.hidden = !mode.allowCsv;
  elements.outputLead.textContent = mode.privacyNotice
    ? "出力後は内容を消去してください。一定時間操作がない場合は自動で初期化します。"
    : "出力が完了したら、必要に応じて入力内容を消去できます。";
}

function updateStepState() {
  const stepItems = Array.from(elements.stepList.querySelectorAll(".step-item"));
  const visibleCategories = getVisibleCategories().filter((category) => !category.storeOnly);

  let activeIndex = 0;
  if (state.currentView === "form") {
    activeIndex = 1;
  } else if (state.currentView === "preview" || state.currentView === "output") {
    activeIndex = stepItems.length - 1;
  }

  stepItems.forEach((item, index) => {
    item.classList.toggle("is-active", index === activeIndex);
    item.classList.toggle("is-done", index < activeIndex);
  });

  if (!state.currentMode) {
    stepItems.forEach((item, index) => {
      item.classList.toggle("is-active", index === 0);
      item.classList.toggle("is-done", false);
    });
  }

  if (visibleCategories.length < stepItems.length - 1) {
    stepItems.forEach((item, index) => {
      item.hidden = index > visibleCategories.length;
    });
  } else {
    stepItems.forEach((item) => {
      item.hidden = false;
    });
  }
}

function updateLiveAssistants() {
  renderStatusList(elements.checkItemsList, generateCheckItems(), "現在の入力では、大きな要確認事項はまだ抽出されていません。");
  renderStatusList(elements.riskItemsList, generateRiskItems(), "現在の入力では、要注意項目はまだありません。");
}

function renderStatusList(container, items, emptyMessage) {
  if (!items.length) {
    container.innerHTML = `
      <li class="status-item">
        <span class="status-bullet">i</span>
        <div>${escapeHtml(emptyMessage)}</div>
      </li>
    `;
    return;
  }

  container.innerHTML = items
    .map((item, index) => `
      <li class="status-item ${item.level === "risk" ? "is-risk" : item.level === "warn" ? "is-warn" : ""}">
        <span class="status-bullet">${index + 1}</span>
        <div>
          <strong>${escapeHtml(item.label || item.message)}</strong><br>
          ${escapeHtml(item.message || item.label)}
        </div>
      </li>
    `)
    .join("");
}

function generateCheckItems() {
  return CHECK_RULES
    .filter((rule) => rule.values.includes(getValue(rule.key)))
    .map((rule) => ({
      message: rule.message,
      level: rule.level || "warn"
    }));
}

function generateRiskItems() {
  return RISK_RULES
    .filter((rule) => rule.values.includes(getValue(rule.key)))
    .map((rule) => ({
      label: rule.label,
      message: `${getFieldLabel(rule.key)}: ${getValue(rule.key)}`,
      level: "risk"
    }));
}

function getRiskLabelForField(fieldKey) {
  const match = RISK_RULES.find((rule) => rule.key === fieldKey && rule.values.includes(getValue(fieldKey)));
  return match ? match.label : "";
}

function updateFieldWarnings() {
  if (!state.currentMode || state.currentView !== "form") {
    return;
  }

  getVisibleCategories().forEach((category) => {
    category.fields.forEach((field) => {
      const label = document.querySelector(`label[for="field-${field.key}"] .label-row`);
      if (!label) {
        return;
      }

      const existingBadge = label.querySelector(".warning-badge");
      const shouldShow = isRiskFieldHighlighted(field.key, getValue(field.key));

      if (shouldShow && !existingBadge) {
        label.insertAdjacentHTML("beforeend", '<span class="warning-badge">要注意</span>');
      }

      if (!shouldShow && existingBadge) {
        existingBadge.remove();
      }
    });
  });
}

function exportSummaryImages() {
  clearLastDownloadUrls();
  const pages = buildExportPages();
  const downloads = [];

  pages.forEach((page, index) => {
    const canvas = renderSummaryCanvas(page, index + 1, pages.length);
    const filename = buildFilename(`seller-hearing-summary-${index + 1}.png`);
    const url = canvas.toDataURL("image/png");
    triggerDownload(url, filename);
    downloads.push({
      type: "画像",
      name: filename,
      url,
      note: `サマリー ${index + 1} / ${pages.length}`
    });
  });

  state.lastDownloads = downloads;
  showOutputStatus(`画像を ${pages.length} 枚出力しました。`, downloads);
}

function exportCsv() {
  const mode = getCurrentMode();
  if (!mode || !mode.allowCsv) {
    return;
  }

  clearLastDownloadUrls();
  const row = buildCsvRow();
  const bom = "\uFEFF";
  const csvText = `${CSV_COLUMNS.map((column) => escapeCsv(column.label)).join(",")}\n${CSV_COLUMNS.map((column) => escapeCsv(row[column.key] || "")).join(",")}`;
  const blob = new Blob([bom + csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const filename = buildFilename("seller-hearing-sheet.csv");
  triggerDownload(url, filename);

  const downloads = [
    {
      type: "CSV",
      name: filename,
      url,
      note: "Excelで開きやすいUTF-8 BOM付き"
    }
  ];

  state.lastDownloads = downloads;
  showOutputStatus("CSVを出力しました。", downloads);
}

function showOutputStatus(message, downloads) {
  elements.outputStatus.innerHTML = `
    <div class="output-card">
      <strong>${escapeHtml(message)}</strong>
      <p class="output-note">出力後の内容確認が終わったら、必要に応じて「入力内容を消去する」を実行してください。</p>
    </div>
  `;

  elements.downloadList.innerHTML = downloads
    .map((download) => `
      <div class="download-item">
        <div>
          <strong>${escapeHtml(download.name)}</strong>
          <span>${escapeHtml(download.type)} / ${escapeHtml(download.note)}</span>
        </div>
        <a class="download-link" href="${download.url}" download="${escapeHtml(download.name)}">再ダウンロード</a>
      </div>
    `)
    .join("");

  setView("output");
}

function buildCsvRow() {
  const row = {};
  CSV_COLUMNS.forEach((column) => {
    if (column.key === "modeLabel") {
      row[column.key] = getCurrentMode().label;
    } else if (column.key === "checkItemsText") {
      row[column.key] = generateCheckItems().map((item) => item.message).join(" / ");
    } else {
      row[column.key] = getValue(column.key);
    }
  });

  return row;
}

function buildExportPages() {
  const pageOneSections = [
    createExportSection("基本情報", [
      ["入力日", formatPreviewValue("inputDate")],
      ["物件名", formatPreviewValue("propertyName")],
      ["物件所在地", formatPreviewValue("propertyAddress")],
      ["所有者名", formatPreviewValue("ownerName")]
    ]),
    createExportSection("売却意向", [
      ["売却理由", formatPreviewValue("saleReason")],
      ["希望価格", formatPreviewValue("desiredPrice")],
      ["希望時期", formatPreviewValue("desiredTiming")],
      ["売却後の住まい", formatPreviewValue("nextResidence")],
      ["内見対応可否", formatPreviewValue("viewingAvailability")]
    ])
  ];

  const remainingBlocks = [
    createExportSection("権利・法務", collectCategoryPairs("legal")),
    createExportSection("物件状態", collectCategoryPairs("condition")),
    createExportSection("管理・運用", collectCategoryPairs("management")),
    createExportSection("自由記述", collectCategoryPairs("free"))
  ];

  if (getCurrentMode().showInternalMemo) {
    remainingBlocks.push(createExportSection("社内メモ", collectCategoryPairs("memo")));
  }

  remainingBlocks.push(
    createExportSection(
      "要確認事項まとめ",
      generateCheckItems().length
        ? generateCheckItems().map((item, index) => [`確認${index + 1}`, item.message])
        : [["確認事項", "現時点で大きな要確認事項はありません"]]
    )
  );

  const chunkedBlocks = chunkArray(remainingBlocks, 3);
  const pages = [
    {
      title: "売主ヒアリングシート",
      subtitle: `${getCurrentMode().label} / ${formatPreviewValue("propertyName")} ${formatPreviewValue("ownerName")}`,
      sections: pageOneSections,
      riskItems: generateRiskItems().map((item) => item.label)
    }
  ];

  chunkedBlocks.forEach((blocks) => {
    pages.push({
      title: "売主ヒアリングシート",
      subtitle: "詳細サマリー",
      sections: blocks,
      riskItems: generateRiskItems().map((item) => item.label)
    });
  });

  return pages;
}

function renderSummaryCanvas(page, pageNumber, totalPages) {
  const canvas = document.createElement("canvas");
  const width = 1400;
  const height = 1900;
  const padding = 80;
  let currentY = padding;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f4f8f9";
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, padding - 18, padding - 18, width - padding * 2 + 36, height - padding * 2 + 36, 28, "#ffffff", "#d8e1e5");

  ctx.fillStyle = "#0f5e63";
  ctx.font = "700 28px 'Noto Sans JP', sans-serif";
  ctx.fillText(page.title, padding, currentY);
  currentY += 48;

  ctx.fillStyle = "#5b6b76";
  ctx.font = "400 18px 'Noto Sans JP', sans-serif";
  wrapText(ctx, page.subtitle, padding, currentY, width - padding * 2, 30);
  currentY += 52;

  ctx.fillStyle = "#5b6b76";
  ctx.fillText(`ページ ${pageNumber} / ${totalPages}`, padding, currentY);
  currentY += 36;

  if (page.riskItems.length) {
    drawRoundedRect(ctx, padding, currentY, width - padding * 2, 76, 18, "#fff4f1", "#efc7bc");
    ctx.fillStyle = "#8f3f2f";
    ctx.font = "700 18px 'Noto Sans JP', sans-serif";
    ctx.fillText("要注意", padding + 20, currentY + 30);
    ctx.font = "400 16px 'Noto Sans JP', sans-serif";
    wrapText(ctx, page.riskItems.join(" / "), padding + 20, currentY + 56, width - padding * 2 - 40, 24);
    currentY += 108;
  }

  page.sections.forEach((section) => {
    const estimatedHeight = estimateSectionHeight(section);
    drawRoundedRect(ctx, padding, currentY, width - padding * 2, estimatedHeight, 20, "#fbfdfd", "#d8e1e5");

    ctx.fillStyle = "#0f5e63";
    ctx.font = "700 22px 'Noto Sans JP', sans-serif";
    ctx.fillText(section.title, padding + 22, currentY + 34);

    let rowY = currentY + 70;
    section.rows.forEach((row) => {
      ctx.fillStyle = "#5b6b76";
      ctx.font = "700 16px 'Noto Sans JP', sans-serif";
      ctx.fillText(row[0], padding + 22, rowY);

      ctx.fillStyle = "#24323d";
      ctx.font = "400 16px 'Noto Sans JP', sans-serif";
      const usedHeight = wrapText(ctx, row[1], padding + 180, rowY, width - padding * 2 - 202, 24);
      rowY += Math.max(usedHeight, 24) + 12;
    });

    currentY += estimatedHeight + 24;
  });

  return canvas;
}

function estimateSectionHeight(section) {
  const base = 88;
  const rowHeights = section.rows.reduce((sum, row) => sum + 44 + Math.max(0, Math.ceil((String(row[1]).length - 28) / 28) * 18), 0);
  return Math.max(150, base + rowHeights);
}

function createExportSection(title, rows) {
  const filteredRows = rows.filter((row) => row[1] && row[1] !== "未入力");
  return {
    title,
    rows: filteredRows.length ? filteredRows : [["内容", "特記事項なし"]]
  };
}

function collectCategoryPairs(categoryId) {
  const category = CATEGORY_DEFINITIONS.find((item) => item.id === categoryId);
  if (!category) {
    return [];
  }

  return category.fields
    .filter((field) => isFieldVisible(field, getCurrentMode()))
    .map((field) => [field.label, formatPreviewValue(field.key)]);
}

function fillDemoData() {
  const demoValues = {
    inputDate: getTodayString(),
    propertyName: "グリーンヒルズ目黒 402号室",
    propertyAddress: "東京都目黒区青葉台1-2-3",
    ownerName: "山田 太郎",
    phone: "090-1111-2222",
    email: "owner@example.com",
    staffName: "佐藤",
    meetingPlace: "店頭",
    saleReason: "住み替えのため。年内を目安に売却したい。",
    desiredPrice: "6,280万円",
    desiredTiming: "3か月以内",
    nextResidence: "近隣の賃貸へ住み替え予定",
    viewingAvailability: "はい",
    otherRequests: "近隣には売却を知られたくない。",
    ownerOnly: "いいえ",
    hasCoOwner: "はい",
    inheritancePending: "いいえ",
    hasMortgage: "はい",
    hasLegalIssue: "いいえ",
    boundaryClarity: "不明",
    encroachment: "いいえ",
    privateRoad: "不明",
    legalNotes: "ローンは○○銀行。完済予定額は未確認。",
    leakHistory: "はい",
    buildingIssue: "いいえ",
    pestIssue: "不明",
    repairHistory: "2021年に浴室交換、2024年に給湯器交換。",
    neighborTrouble: "いいえ",
    disclosureIssue: "いいえ",
    conditionNotes: "クロスの一部に汚れあり。",
    propertyType: "マンション",
    managementFee: "月額 12,500円",
    repairReserve: "月額 8,600円",
    arrears: "いいえ",
    majorRepairPlan: "2027年予定",
    isRented: "いいえ",
    rentAmount: "",
    rentalTrouble: "",
    managementNotes: "管理組合資料は後日持参予定。",
    concerns: "査定価格と売出価格の違いを知りたい。",
    supplement: "平日夜の連絡希望。",
    temperature: "高い",
    priority: "高",
    nextAction: "残債確認、管理資料確認、訪問査定日程調整",
    followUpDate: "今週末に再連絡",
    staffMemo: "売却意欲は高め。競合比較あり。"
  };

  state.values = { ...state.values, ...demoValues };
  syncFormValues();
  updateFieldWarnings();
  updateLiveAssistants();
}

function syncFormValues() {
  Object.entries(state.values).forEach(([key, value]) => {
    const field = elements.hearingForm.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  });
}

function resetApp() {
  clearLastDownloadUrls();
  state.currentMode = null;
  state.currentView = "mode";
  clearInactivityTimer();
  resetFormValues();
  elements.previewSummary.innerHTML = "";
  elements.previewCheckItems.innerHTML = "";
  elements.outputStatus.innerHTML = "";
  elements.downloadList.innerHTML = "";
  elements.stickyBar.hidden = true;
  elements.stepNav.hidden = true;
  setView("mode");
  updateModeHeader();
  updateLiveAssistants();
}

function resetFormValues() {
  state.values = {};
  CATEGORY_DEFINITIONS.forEach((category) => {
    category.fields.forEach((field) => {
      state.values[field.key] = typeof field.default === "function" ? field.default() : field.default || "";
    });
  });
  if (elements.hearingForm) {
    elements.hearingForm.reset();
  }
}

function refreshInactivityTimer() {
  const mode = getCurrentMode();
  if (!mode || !mode.inactivityLimitMs) {
    return;
  }

  clearInactivityTimer();
  state.inactivityTimerId = window.setTimeout(() => {
    alert("一定時間操作がなかったため、入力内容を初期化しました。");
    resetApp();
  }, mode.inactivityLimitMs);
}

function clearInactivityTimer() {
  if (state.inactivityTimerId) {
    window.clearTimeout(state.inactivityTimerId);
    state.inactivityTimerId = null;
  }
}

function clearLastDownloadUrls() {
  state.lastDownloads.forEach((download) => {
    if (download.url && download.url.startsWith("blob:")) {
      URL.revokeObjectURL(download.url);
    }
  });
  state.lastDownloads = [];
}

function getVisibleCategories() {
  const mode = getCurrentMode();
  return CATEGORY_DEFINITIONS.filter((category) => !category.storeOnly || (mode && mode.showInternalMemo));
}

function getCurrentMode() {
  return state.currentMode ? MODE_DEFINITIONS[state.currentMode] : null;
}

function isFieldVisible(field, mode) {
  if (!mode) {
    return false;
  }

  if (field.storeOnly && !mode.showStoreFields) {
    return false;
  }

  return true;
}

function getValue(key) {
  return normalizeValue(state.values[key]);
}

function formatPreviewValue(key) {
  const value = getValue(key);
  return value || "未入力";
}

function getFieldLabel(key) {
  for (const category of CATEGORY_DEFINITIONS) {
    const field = category.fields.find((item) => item.key === key);
    if (field) {
      return field.label;
    }
  }
  return key;
}

function isRiskFieldHighlighted(key, value) {
  return RISK_RULES.some((rule) => rule.key === key && rule.values.includes(value));
}

function getInputMode(type) {
  if (type === "tel") {
    return "tel";
  }
  if (type === "email") {
    return "email";
  }
  return "text";
}

function normalizeValue(value) {
  return value == null ? "" : String(value).trim();
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildFilename(suffix) {
  const safeDate = getValue("inputDate") || getTodayString();
  const property = sanitizeFilename(getValue("propertyName") || "property");
  return `${safeDate}_${property}_${suffix}`;
}

function sanitizeFilename(value) {
  return value.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
}

function escapeCsv(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function chunkArray(items, chunkSize) {
  const result = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    result.push(items.slice(index, index + chunkSize));
  }
  return result;
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor) {
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

  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const content = String(text || "未入力");
  const paragraphs = content.split("\n");
  let currentY = y;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const chars = paragraph.split("");
    let line = "";

    chars.forEach((char) => {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });

    ctx.fillText(line || " ", x, currentY);
    currentY += lineHeight;

    if (paragraphIndex < paragraphs.length - 1) {
      currentY += 4;
    }
  });

  return currentY - y;
}
