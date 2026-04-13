const STORAGE_KEY = "toolbox_inheritance_family_tree_v6";
const DEFAULT_CONSULTATION_URL = "https://example.com/contact";
const DEFAULT_TAB = "family";
const OWNERSHIP_COLORS = ["#2f6f9f", "#5c86ac", "#7d99b4", "#7f76a7", "#5d8377", "#8b9960"];

const elements = {
  peopleList: document.getElementById("peopleList"),
  decedentSelect: document.getElementById("decedentSelect"),
  propertyName: document.getElementById("propertyName"),
  propertyMemo: document.getElementById("propertyMemo"),
  propertyTargetShare: document.getElementById("propertyTargetShare"),
  propertyOwnerShare: document.getElementById("propertyOwnerShare"),
  consultationUrl: document.getElementById("consultationUrl"),
  familyTree: document.getElementById("familyTree"),
  heirCandidatesBody: document.getElementById("heirCandidatesBody"),
  shareTableBody: document.getElementById("shareTableBody"),
  shareSummary: document.getElementById("shareSummary"),
  ownershipBefore: document.getElementById("ownershipBefore"),
  ownershipBar: document.getElementById("ownershipBar"),
  ownershipCards: document.getElementById("ownershipCards"),
  ownershipNotice: document.getElementById("ownershipNotice"),
  noteList: document.getElementById("noteList"),
  consultationLink: document.getElementById("consultationLink"),
  statusArea: document.getElementById("statusArea"),
  errorArea: document.getElementById("errorArea"),
  addPersonButton: document.getElementById("addPersonButton"),
  runSimulationButton: document.getElementById("runSimulationButton"),
  sampleBasicButton: document.getElementById("sampleBasicButton"),
  sampleRepresentationButton: document.getElementById("sampleRepresentationButton"),
  resetButton: document.getElementById("resetButton"),
  exportJsonButton: document.getElementById("exportJsonButton"),
  importJsonInput: document.getElementById("importJsonInput"),
  printButton: document.getElementById("printButton"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel"))
};

const state = {
  people: [],
  nextId: 1,
  decedentId: "",
  estate: {
    propertyName: "",
    propertyMemo: "",
    targetSharePercent: 100,
    ownerSharePercent: 100
  },
  consultationUrl: DEFAULT_CONSULTATION_URL,
  activeTab: DEFAULT_TAB,
  lastSimulation: null
};

let saveTimerId = 0;

init();

function init() {
  bindStaticEvents();
  loadPersistedState();

  if (!state.people.length) {
    restoreState(buildSampleState("basic"));
    showStatus("サンプル1を初期表示しました。");
  }

  renderInitialView();
}

function bindStaticEvents() {
  elements.addPersonButton.addEventListener("click", () => {
    addPerson();
    renderPeopleList();
    renderDecedentSelect();
    queuePersist();
    showStatus("人物カードを追加しました。");
  });

  elements.runSimulationButton.addEventListener("click", () => {
    simulateAndRender(true);
  });

  elements.sampleBasicButton.addEventListener("click", () => {
    restoreState(buildSampleState("basic"));
    renderInitialView();
    showStatus("サンプル1を読み込みました。");
  });

  elements.sampleRepresentationButton.addEventListener("click", () => {
    restoreState(buildSampleState("representation"));
    renderInitialView();
    showStatus("サンプル2を読み込みました。");
  });

  elements.resetButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    restoreState(buildSampleState("basic"));
    renderInitialView();
    showStatus("入力内容をリセットしました。");
  });

  elements.exportJsonButton.addEventListener("click", exportJson);
  elements.importJsonInput.addEventListener("change", importJson);
  elements.printButton.addEventListener("click", () => window.print());

  elements.decedentSelect.addEventListener("change", (event) => {
    state.decedentId = String(event.target.value || "");
    queuePersist();
  });

  [
    elements.propertyName,
    elements.propertyMemo,
    elements.propertyTargetShare,
    elements.propertyOwnerShare,
    elements.consultationUrl
  ].forEach((input) => {
    input.addEventListener("input", syncEstateFromInputs);
    input.addEventListener("change", syncEstateFromInputs);
  });

  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveTab(button.dataset.tab);
    });
  });
}

function renderInitialView() {
  clearMessages();
  renderPeopleList();
  renderDecedentSelect();
  fillEstateInputs();
  renderResultPlaceholder("シミュレーション実行時に結果を表示します。");
  renderNotes(null);
  setActiveTab(state.activeTab || DEFAULT_TAB);
}

function renderPeopleList() {
  if (!state.people.length) {
    elements.peopleList.innerHTML = '<div class="empty-state">人物がありません。「人物を追加」またはサンプル読込から始めてください。</div>';
    return;
  }

  const cards = state.people.map((person) => createPersonCard(person));
  elements.peopleList.replaceChildren(...cards);
}

function createPersonCard(person) {
  const card = document.createElement("article");
  card.className = "person-card";
  card.dataset.personId = person.id;

  card.innerHTML = `
    <div class="person-card-header">
      <div class="person-card-title">
        <div class="person-meta">
          <span class="relation-badge">人物ID: ${escapeHtml(person.id)}</span>
          <span class="state-badge ${person.alive ? "" : "is-deceased"}" data-role="alive-badge">${person.alive ? "生存" : "死亡"}</span>
        </div>
        <h3 data-role="name-label">${escapeHtml(person.name.trim() || "氏名未入力")}</h3>
        <p class="mini-help" data-role="hint-label">${escapeHtml(buildPersonHint(person))}</p>
      </div>
      <button type="button" class="danger-button" data-action="delete-person">削除</button>
    </div>
    <div class="form-grid">
      <div class="field">
        <label for="person-name-${person.id}">氏名</label>
        <input id="person-name-${person.id}" type="text" data-field="name" value="${escapeHtml(person.name)}" placeholder="例: 山田 太郎">
      </div>
      <div class="field">
        <label for="person-gender-${person.id}">性別（任意）</label>
        <select id="person-gender-${person.id}" data-field="gender"></select>
      </div>
      <div class="field">
        <label for="person-alive-${person.id}">生存状況</label>
        <select id="person-alive-${person.id}" data-field="alive"></select>
      </div>
      <div class="field">
        <label for="person-spouse-${person.id}">配偶者</label>
        <select id="person-spouse-${person.id}" data-field="spouseId"></select>
      </div>
      <div class="field">
        <label for="person-father-${person.id}">父ID</label>
        <select id="person-father-${person.id}" data-field="fatherId"></select>
      </div>
      <div class="field">
        <label for="person-mother-${person.id}">母ID</label>
        <select id="person-mother-${person.id}" data-field="motherId"></select>
      </div>
      <div class="field full">
        <label for="person-notes-${person.id}">備考（任意）</label>
        <textarea id="person-notes-${person.id}" data-field="notes" placeholder="例: 被相続人より先に死亡">${escapeHtml(person.notes)}</textarea>
      </div>
    </div>
  `;

  refreshPersonCardOptions(card, person);
  bindPersonCardEvents(card);
  return card;
}

function bindPersonCardEvents(card) {
  const personId = card.dataset.personId;
  const nameInput = card.querySelector('[data-field="name"]');
  const notesInput = card.querySelector('[data-field="notes"]');
  const genderSelect = card.querySelector('[data-field="gender"]');
  const aliveSelect = card.querySelector('[data-field="alive"]');

  card.querySelector('[data-action="delete-person"]').addEventListener("click", () => {
    removePerson(personId);
    renderPeopleList();
    renderDecedentSelect();
    queuePersist();
    showStatus("人物カードを削除しました。");
  });

  nameInput.addEventListener("input", (event) => {
    updatePersonText(personId, "name", event.target.value);
    updatePersonCardMeta(card, findPerson(personId));
  });

  notesInput.addEventListener("input", (event) => {
    updatePersonText(personId, "notes", event.target.value);
  });

  genderSelect.addEventListener("change", (event) => {
    updatePersonText(personId, "gender", event.target.value);
    updatePersonCardMeta(card, findPerson(personId));
    queuePersist();
  });

  aliveSelect.addEventListener("change", (event) => {
    updatePersonRelation(personId, "alive", event.target.value === "alive");
  });

  ["fatherId", "motherId", "spouseId"].forEach((fieldName) => {
    card.querySelector(`[data-field="${fieldName}"]`).addEventListener("change", (event) => {
      updatePersonRelation(personId, fieldName, event.target.value);
    });
  });
}

function updatePersonText(personId, fieldName, value) {
  const person = findPerson(personId);
  if (!person) {
    return;
  }
  person[fieldName] = String(value || "");
  queuePersist();
}

function updatePersonRelation(personId, fieldName, value) {
  const person = findPerson(personId);
  if (!person) {
    return;
  }

  if (fieldName === "alive") {
    person.alive = Boolean(value);
  } else {
    person[fieldName] = String(value || "");
  }

  normalizePerson(person);
  maintainSpouseIntegrity(personId, fieldName);
  refreshAllCardOptions();
  renderDecedentSelect();
  queuePersist();
}

function refreshAllCardOptions() {
  elements.peopleList.querySelectorAll(".person-card").forEach((card) => {
    const person = findPerson(card.dataset.personId);
    if (!person) {
      return;
    }
    refreshPersonCardOptions(card, person);
    updatePersonCardMeta(card, person);
  });
}

function refreshPersonCardOptions(card, person) {
  const genderSelect = card.querySelector('[data-field="gender"]');
  const aliveSelect = card.querySelector('[data-field="alive"]');
  const fatherSelect = card.querySelector('[data-field="fatherId"]');
  const motherSelect = card.querySelector('[data-field="motherId"]');
  const spouseSelect = card.querySelector('[data-field="spouseId"]');

  setSelectOptions(
    genderSelect,
    [
      { value: "", label: "未選択" },
      { value: "male", label: "男性" },
      { value: "female", label: "女性" },
      { value: "other", label: "その他" }
    ],
    person.gender
  );

  setSelectOptions(
    aliveSelect,
    [
      { value: "alive", label: "生存" },
      { value: "deceased", label: "死亡" }
    ],
    person.alive ? "alive" : "deceased"
  );

  setSelectOptions(fatherSelect, buildPeopleOptionList(person.id, "父を選択"), person.fatherId);
  setSelectOptions(motherSelect, buildPeopleOptionList(person.id, "母を選択"), person.motherId);
  setSelectOptions(spouseSelect, buildPeopleOptionList(person.id, "配偶者を選択"), person.spouseId);
}

function setSelectOptions(select, options, selectedValue) {
  const currentValue = String(selectedValue || "");
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
  select.value = options.some((option) => option.value === currentValue) ? currentValue : "";
}

function renderDecedentSelect() {
  const options = [{ value: "", label: "被相続人を選択してください" }]
    .concat(state.people.map((person) => ({ value: person.id, label: formatPersonLabel(person) })));
  setSelectOptions(elements.decedentSelect, options, state.decedentId);
}

function fillEstateInputs() {
  elements.propertyName.value = state.estate.propertyName;
  elements.propertyMemo.value = state.estate.propertyMemo;
  elements.propertyTargetShare.value = state.estate.targetSharePercent;
  elements.propertyOwnerShare.value = state.estate.ownerSharePercent;
  elements.consultationUrl.value = state.consultationUrl;
}

function syncEstateFromInputs() {
  state.estate.propertyName = elements.propertyName.value.trim();
  state.estate.propertyMemo = elements.propertyMemo.value.trim();
  state.estate.targetSharePercent = clampPercent(elements.propertyTargetShare.value, 100);
  state.estate.ownerSharePercent = clampPercent(elements.propertyOwnerShare.value, 100);
  state.consultationUrl = elements.consultationUrl.value.trim() || DEFAULT_CONSULTATION_URL;
  queuePersist();
}

function simulateAndRender(showStatusMessage) {
  clearMessages();
  syncEstateFromInputs();

  const errors = validateForSimulation();
  if (errors.length) {
    showErrors(errors);
    state.lastSimulation = null;
    renderResultPlaceholder("入力内容を確認すると結果を表示できます。");
    renderNotes(null);
    setActiveTab(state.activeTab);
    return;
  }

  const simulation = buildSimulationResult();
  state.lastSimulation = simulation;
  renderFamilyTree(simulation);
  renderHeirCandidates(simulation);
  renderShareTable(simulation);
  renderOwnership(simulation);
  renderNotes(simulation);
  setActiveTab(state.activeTab);
  persistStateNow();

  if (showStatusMessage) {
    showStatus("シミュレーション結果を更新しました。");
  }
}

function validateForSimulation() {
  const errors = [];
  const idSet = new Set(state.people.map((person) => person.id));

  state.people.forEach((person) => {
    if (!person.name.trim()) {
      errors.push(`人物ID ${person.id}: 氏名を入力してください。`);
    }

    ["fatherId", "motherId", "spouseId"].forEach((fieldName) => {
      if (!person[fieldName]) {
        return;
      }
      if (!idSet.has(person[fieldName])) {
        errors.push(`${person.name || `人物ID ${person.id}`}: ${fieldLabel(fieldName)}に存在しない人物IDが設定されています。`);
      }
      if (person[fieldName] === person.id) {
        errors.push(`${person.name || `人物ID ${person.id}`}: 自分自身を${fieldLabel(fieldName)}に設定できません。`);
      }
    });

    if (person.fatherId && person.fatherId === person.motherId) {
      errors.push(`${person.name || `人物ID ${person.id}`}: 父IDと母IDに同じ人物は設定できません。`);
    }

    if (hasAncestorLoop(person.id)) {
      errors.push(`${person.name || `人物ID ${person.id}`}: 親子関係に循環があります。`);
    }
  });

  if (!state.decedentId) {
    errors.push("被相続人を選択してください。");
  } else {
    const decedent = findPerson(state.decedentId);
    if (!decedent) {
      errors.push("選択された被相続人が人物一覧に存在しません。");
    } else if (decedent.alive) {
      errors.push("被相続人は死亡として設定してください。");
    }
  }

  if (state.estate.targetSharePercent <= 0 || state.estate.ownerSharePercent <= 0) {
    errors.push("相続対象持分と被相続人の持分は0より大きい値を入力してください。");
  }

  return [...new Set(errors)];
}

function buildSimulationResult() {
  const decedent = findPerson(state.decedentId);
  const spouse = getLivingSpouse(decedent.id);
  const descendantBranches = getDescendantBranches(decedent.id);
  const parents = getParents(decedent.id).filter((person) => person.alive);
  const siblingBranches = getSiblingBranches(decedent.id);

  let group = "none";
  let explanation = "このケースでは一般的な相続順位を整理できませんでした。個別事情の確認が必要です。";
  let shareDrafts = [];

  if (descendantBranches.length) {
    group = "descendants";
    shareDrafts = buildDescendantShares(descendantBranches, spouse);
    explanation = spouse
      ? "このケースでは、配偶者と子系統が相続人候補となるため、配偶者1/2、子系統全体で1/2が目安です。"
      : "このケースでは、子系統のみが相続人候補となるため、子系統で均等または代襲枝ごとに按分するのが目安です。";
  } else if (parents.length) {
    group = "parents";
    shareDrafts = buildParentShares(parents, spouse);
    explanation = spouse
      ? "このケースでは、配偶者と直系尊属が相続人候補となるため、配偶者2/3、直系尊属全体で1/3が目安です。"
      : "このケースでは、直系尊属のみが相続人候補となるため、直系尊属で均等に分けるのが目安です。";
  } else if (siblingBranches.length) {
    group = "siblings";
    shareDrafts = buildSiblingShares(siblingBranches, spouse);
    explanation = spouse
      ? "このケースでは、配偶者と兄弟姉妹が相続人候補となるため、配偶者3/4、兄弟姉妹全体で1/4が目安です。"
      : "このケースでは、兄弟姉妹のみが相続人候補となるため、兄弟姉妹で均等に分けるのが目安です。";
  } else if (spouse) {
    group = "spouseOnly";
    shareDrafts = [
      {
        personId: spouse.id,
        relation: "配偶者",
        detail: "配偶者のみ",
        fraction: createFraction(1, 1)
      }
    ];
    explanation = "このケースでは、配偶者のみが相続人候補となるため、配偶者1/1が目安です。";
  }

  const transferFraction = multiplyFraction(
    createFraction(state.estate.targetSharePercent, 100),
    createFraction(state.estate.ownerSharePercent, 100)
  );

  const shares = shareDrafts.map((draft) => {
    const person = findPerson(draft.personId);
    return {
      ...draft,
      person,
      propertyFraction: multiplyFraction(draft.fraction, transferFraction)
    };
  });

  return {
    decedent,
    spouse,
    group,
    explanation,
    transferFraction,
    shares,
    candidates: buildCandidateRows(decedent, spouse, descendantBranches, parents, siblingBranches, shares)
  };
}

function buildCandidateRows(decedent, spouse, descendantBranches, parents, siblingBranches, shares) {
  const shareIds = new Set(shares.map((share) => share.personId));

  return state.people
    .filter((person) => person.id !== decedent.id)
    .map((person) => ({
      name: person.name || `人物ID ${person.id}`,
      relation: getRelationLabel(person.id, decedent.id),
      alive: person.alive ? "生存" : "死亡",
      candidate: shareIds.has(person.id) ? "候補" : "対象外",
      reason: getCandidateReason(person.id, spouse, descendantBranches, parents, siblingBranches)
    }));
}

function getCandidateReason(personId, spouse, descendantBranches, parents, siblingBranches) {
  if (spouse && spouse.id === personId) {
    return "配偶者";
  }
  if (descendantBranches.some((branch) => branch.heirs.some((heir) => heir.id === personId))) {
    return descendantBranches.some((branch) => branch.type === "representation" && branch.heirs.some((heir) => heir.id === personId))
      ? "死亡した子に代わる孫"
      : "子";
  }
  if (parents.some((parent) => parent.id === personId)) {
    return "直系尊属";
  }
  if (siblingBranches.some((branch) => branch.heirs.some((heir) => heir.id === personId))) {
    return siblingBranches.some((branch) => branch.type === "niece-nephew" && branch.heirs.some((heir) => heir.id === personId))
      ? "死亡した兄弟姉妹に代わる甥姪"
      : "兄弟姉妹";
  }
  return "今回の簡易ルールでは対象外";
}

function renderFamilyTree(simulation) {
  const levels = [
    { label: "親世代", people: getParents(simulation.decedent.id) },
    { label: "本人世代", people: uniquePeople([simulation.decedent, ...(simulation.spouse ? [simulation.spouse] : []), ...getSiblings(simulation.decedent.id)]) },
    { label: "子世代", people: getChildren(simulation.decedent.id) },
    { label: "孫世代", people: uniquePeople(getChildren(simulation.decedent.id).flatMap((child) => getChildren(child.id))) }
  ].filter((level) => level.people.length);

  if (!levels.length) {
    elements.familyTree.innerHTML = '<div class="empty-state">表示できる家系情報がありません。</div>';
    return;
  }

  elements.familyTree.innerHTML = levels
    .map((level) => `
      <section class="tree-level">
        <p class="tree-level-title">${escapeHtml(level.label)}</p>
        <div class="tree-row">
          ${level.people
            .map((person) => `
              <article class="tree-node ${person.id === simulation.decedent.id ? "is-decedent" : ""} ${person.alive ? "" : "is-deceased"}">
                <div class="tree-node-name">${escapeHtml(person.name || `人物ID ${person.id}`)}</div>
                <div class="tree-node-meta">
                  <span class="state-badge ${person.alive ? "" : "is-deceased"}">${person.alive ? "生存" : "死亡"}</span>
                  <span class="relation-badge">${escapeHtml(person.id === simulation.decedent.id ? "被相続人" : getRelationLabel(person.id, simulation.decedent.id))}</span>
                </div>
                <p class="tree-node-text">${escapeHtml(person.notes || "備考なし")}</p>
              </article>
            `)
            .join("")}
        </div>
      </section>
    `)
    .join("");
}

function renderHeirCandidates(simulation) {
  elements.heirCandidatesBody.innerHTML = simulation.candidates.length
    ? simulation.candidates
        .map((row) => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.relation)}</td>
            <td>${escapeHtml(row.alive)}</td>
            <td>${escapeHtml(row.candidate)}</td>
            <td>${escapeHtml(row.reason)}</td>
          </tr>
        `)
        .join("")
    : '<tr><td colspan="5">相続人候補はありません。</td></tr>';
}

function renderShareTable(simulation) {
  if (!simulation.shares.length) {
    elements.shareTableBody.innerHTML = '<tr><td colspan="5">今回の簡易ルールでは相続分の目安を表示できません。</td></tr>';
    elements.shareSummary.textContent = simulation.explanation;
    return;
  }

  elements.shareTableBody.innerHTML = simulation.shares
    .map((share) => `
      <tr>
        <td>${escapeHtml(share.person.name || `人物ID ${share.person.id}`)}</td>
        <td>${escapeHtml(share.relation)}</td>
        <td>${escapeHtml(formatFraction(share.fraction))}</td>
        <td>${escapeHtml(formatPercent(fractionToPercent(share.fraction)))}</td>
        <td>${escapeHtml(share.detail)}</td>
      </tr>
    `)
    .join("");

  elements.shareSummary.textContent = simulation.explanation;
}

function renderOwnership(simulation) {
  const transferPercent = fractionToPercent(simulation.transferFraction);
  const propertyName = state.estate.propertyName || "対象不動産";

  elements.ownershipBefore.innerHTML = `
    <strong>${escapeHtml(simulation.decedent.name || `人物ID ${simulation.decedent.id}`)}</strong> ${escapeHtml(formatPercent(transferPercent))}
    <div class="mini-help">${escapeHtml(propertyName)} における被相続人の対象持分です。</div>
  `;

  if (!simulation.shares.length) {
    const empty = '<div class="empty-state">共有持分イメージを表示できません。</div>';
    elements.ownershipBar.innerHTML = empty;
    elements.ownershipCards.innerHTML = "";
    elements.ownershipNotice.textContent = "共有持分の表示には相続人候補と相続分の目安が必要です。";
    return;
  }

  elements.ownershipBar.innerHTML = simulation.shares
    .map((share, index) => {
      const percent = fractionToPercent(share.propertyFraction);
      const label = percent >= 14 ? escapeHtml(share.person.name || `人物ID ${share.person.id}`) : "";
      return `
        <div
          class="ownership-segment"
          style="width:${percent}%;background:${OWNERSHIP_COLORS[index % OWNERSHIP_COLORS.length]};"
          title="${escapeHtml(share.person.name || `人物ID ${share.person.id}`)} ${escapeHtml(formatPercent(percent))}"
        >${label}</div>
      `;
    })
    .join("");

  elements.ownershipCards.innerHTML = simulation.shares
    .map((share) => `
      <article class="ownership-card">
        <strong>${escapeHtml(share.person.name || `人物ID ${share.person.id}`)}</strong>
        <div>${escapeHtml(share.relation)} / 法定相続分の目安 ${escapeHtml(formatFraction(share.fraction))}</div>
        <div>不動産上の共有持分イメージ ${escapeHtml(formatPercent(fractionToPercent(share.propertyFraction)))}</div>
      </article>
    `)
    .join("");

  elements.ownershipNotice.textContent = simulation.shares.length > 1
    ? "相続後は複数名の共有状態となる想定です。売却・賃貸・管理・修繕等で意思決定が複雑になる場合があります。"
    : "このケースでは単独取得の目安です。実際の分け方は遺産分割協議や遺言で変わる可能性があります。";
}

function renderNotes(simulation) {
  const items = [
    "遺言の有無で結果は変わる可能性があります。",
    "相続放棄、養子縁組、特別受益、寄与分などの個別事情はこの参考表示に反映されません。",
    "不動産が共有になると、売却や管理で調整が必要になることがあります。"
  ];

  if (simulation && simulation.group === "siblings") {
    items.push("兄弟姉妹の代襲は甥姪までの簡易対応です。");
  }

  elements.noteList.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const href = sanitizeUrl(state.consultationUrl || DEFAULT_CONSULTATION_URL);
  elements.consultationLink.href = href;
  elements.consultationLink.textContent = href === "#" ? "相談先URLを入力してください" : "相談先を開く";
}

function renderResultPlaceholder(message) {
  const empty = `<div class="empty-state">${escapeHtml(message)}</div>`;
  elements.familyTree.innerHTML = empty;
  elements.heirCandidatesBody.innerHTML = '<tr><td colspan="5">結果はまだありません。</td></tr>';
  elements.shareTableBody.innerHTML = '<tr><td colspan="5">結果はまだありません。</td></tr>';
  elements.shareSummary.textContent = "シミュレーション実行時に結果を表示します。";
  elements.ownershipBefore.innerHTML = empty;
  elements.ownershipBar.innerHTML = empty;
  elements.ownershipCards.innerHTML = "";
  elements.ownershipNotice.textContent = "共有持分イメージはシミュレーション後に表示されます。";
}

function buildDescendantShares(branches, spouse) {
  const base = spouse ? createFraction(1, 2) : createFraction(1, 1);
  const branchFraction = divideFraction(base, branches.length);
  const shares = [];

  branches.forEach((branch) => {
    if (branch.type === "child") {
      shares.push({
        personId: branch.heirs[0].id,
        relation: "子",
        detail: "子として均等取得",
        fraction: branchFraction
      });
      return;
    }

    const perHeir = divideFraction(branchFraction, branch.heirs.length);
    branch.heirs.forEach((heir) => {
      shares.push({
        personId: heir.id,
        relation: "孫",
        detail: "死亡した子の持分を代襲",
        fraction: perHeir
      });
    });
  });

  if (spouse) {
    shares.unshift({
      personId: spouse.id,
      relation: "配偶者",
      detail: "配偶者として取得",
      fraction: createFraction(1, 2)
    });
  }

  return shares;
}

function buildParentShares(parents, spouse) {
  const base = spouse ? createFraction(1, 3) : createFraction(1, 1);
  const perParent = divideFraction(base, parents.length);
  const shares = parents.map((parent) => ({
    personId: parent.id,
    relation: "直系尊属",
    detail: "直系尊属で均等取得",
    fraction: perParent
  }));

  if (spouse) {
    shares.unshift({
      personId: spouse.id,
      relation: "配偶者",
      detail: "配偶者として取得",
      fraction: createFraction(2, 3)
    });
  }

  return shares;
}

function buildSiblingShares(branches, spouse) {
  const base = spouse ? createFraction(1, 4) : createFraction(1, 1);
  const branchFraction = divideFraction(base, branches.length);
  const shares = [];

  branches.forEach((branch) => {
    if (branch.type === "sibling") {
      shares.push({
        personId: branch.heirs[0].id,
        relation: "兄弟姉妹",
        detail: "兄弟姉妹として均等取得",
        fraction: branchFraction
      });
      return;
    }

    const perHeir = divideFraction(branchFraction, branch.heirs.length);
    branch.heirs.forEach((heir) => {
      shares.push({
        personId: heir.id,
        relation: "甥姪",
        detail: "死亡した兄弟姉妹の持分を簡易代襲",
        fraction: perHeir
      });
    });
  });

  if (spouse) {
    shares.unshift({
      personId: spouse.id,
      relation: "配偶者",
      detail: "配偶者として取得",
      fraction: createFraction(3, 4)
    });
  }

  return shares;
}

function getLivingSpouse(personId) {
  const person = findPerson(personId);
  if (!person || !person.spouseId) {
    return null;
  }
  const spouse = findPerson(person.spouseId);
  return spouse && spouse.alive ? spouse : null;
}

function getChildren(parentId) {
  return state.people.filter((person) => person.fatherId === parentId || person.motherId === parentId);
}

function getParents(personId) {
  const person = findPerson(personId);
  if (!person) {
    return [];
  }

  return [person.fatherId, person.motherId]
    .map((id) => findPerson(id))
    .filter(Boolean);
}

function getSiblings(personId) {
  const person = findPerson(personId);
  if (!person) {
    return [];
  }

  return state.people.filter((candidate) => {
    if (candidate.id === personId) {
      return false;
    }

    const sameFather = person.fatherId && candidate.fatherId && person.fatherId === candidate.fatherId;
    const sameMother = person.motherId && candidate.motherId && person.motherId === candidate.motherId;
    return sameFather || sameMother;
  });
}

function getDescendantBranches(personId) {
  return getChildren(personId).flatMap((child) => {
    if (child.alive) {
      return [{ type: "child", source: child, heirs: [child] }];
    }

    const livingGrandchildren = getChildren(child.id).filter((grandchild) => grandchild.alive);
    if (!livingGrandchildren.length) {
      return [];
    }

    return [{ type: "representation", source: child, heirs: livingGrandchildren }];
  });
}

function getSiblingBranches(personId) {
  return getSiblings(personId).flatMap((sibling) => {
    if (sibling.alive) {
      return [{ type: "sibling", source: sibling, heirs: [sibling] }];
    }

    const livingNieces = getChildren(sibling.id).filter((niece) => niece.alive);
    if (!livingNieces.length) {
      return [];
    }

    return [{ type: "niece-nephew", source: sibling, heirs: livingNieces }];
  });
}

function getRelationLabel(targetId, baseId) {
  if (targetId === baseId) {
    return "本人";
  }

  const target = findPerson(targetId);
  const base = findPerson(baseId);
  if (!target || !base) {
    return "関係不明";
  }

  if (base.spouseId === targetId || target.spouseId === baseId) {
    return "配偶者";
  }
  if (target.fatherId === baseId || target.motherId === baseId) {
    return "子";
  }
  if (base.fatherId === targetId || base.motherId === targetId) {
    return "父母";
  }
  if (getChildren(baseId).some((child) => child.id === target.fatherId || child.id === target.motherId)) {
    return "孫";
  }
  if (getChildren(targetId).some((child) => child.id === base.fatherId || child.id === base.motherId)) {
    return "祖父母";
  }
  if (getSiblings(baseId).some((sibling) => sibling.id === targetId)) {
    return "兄弟姉妹";
  }
  if (getSiblings(baseId).some((sibling) => getChildren(sibling.id).some((child) => child.id === targetId))) {
    return "甥姪";
  }

  return "関係不明";
}

function addPerson() {
  const person = createEmptyPerson(String(state.nextId));
  state.nextId += 1;
  state.people.push(person);
}

function removePerson(personId) {
  state.people = state.people.filter((person) => person.id !== personId);
  state.people.forEach((person) => {
    if (person.fatherId === personId) {
      person.fatherId = "";
    }
    if (person.motherId === personId) {
      person.motherId = "";
    }
    if (person.spouseId === personId) {
      person.spouseId = "";
    }
  });

  if (state.decedentId === personId) {
    state.decedentId = "";
  }

  if (state.lastSimulation && state.lastSimulation.decedent && state.lastSimulation.decedent.id === personId) {
    state.lastSimulation = null;
    renderResultPlaceholder("被相続人が削除されたため、再シミュレーションしてください。");
    renderNotes(null);
  }
}

function createEmptyPerson(id) {
  return {
    id,
    name: "",
    gender: "",
    alive: true,
    fatherId: "",
    motherId: "",
    spouseId: "",
    notes: ""
  };
}

function normalizePerson(person) {
  person.name = String(person.name || "");
  person.gender = String(person.gender || "");
  person.fatherId = String(person.fatherId || "");
  person.motherId = String(person.motherId || "");
  person.spouseId = String(person.spouseId || "");
  person.notes = String(person.notes || "");
  person.alive = Boolean(person.alive);

  if (person.fatherId === person.id) {
    person.fatherId = "";
  }
  if (person.motherId === person.id) {
    person.motherId = "";
  }
  if (person.spouseId === person.id) {
    person.spouseId = "";
  }
  if (person.fatherId && person.fatherId === person.motherId) {
    person.motherId = "";
  }
}

function maintainSpouseIntegrity(personId, fieldName) {
  if (fieldName !== "spouseId") {
    return;
  }

  const person = findPerson(personId);
  if (!person) {
    return;
  }

  state.people.forEach((candidate) => {
    if (candidate.id !== person.id && candidate.spouseId === person.id && candidate.id !== person.spouseId) {
      candidate.spouseId = "";
    }
  });

  if (!person.spouseId) {
    return;
  }

  const spouse = findPerson(person.spouseId);
  if (!spouse || spouse.id === person.id) {
    person.spouseId = "";
    return;
  }

  if (spouse.spouseId && spouse.spouseId !== person.id) {
    const oldSpouse = findPerson(spouse.spouseId);
    if (oldSpouse) {
      oldSpouse.spouseId = "";
    }
  }

  spouse.spouseId = person.id;
}

function buildPeopleOptionList(selfId, placeholder) {
  return [{ value: "", label: placeholder }].concat(
    state.people
      .filter((person) => person.id !== selfId)
      .map((person) => ({
        value: person.id,
        label: formatPersonLabel(person)
      }))
  );
}

function updatePersonCardMeta(card, person) {
  if (!card || !person) {
    return;
  }

  const nameLabel = card.querySelector('[data-role="name-label"]');
  const hintLabel = card.querySelector('[data-role="hint-label"]');
  const aliveBadge = card.querySelector('[data-role="alive-badge"]');

  if (nameLabel) {
    nameLabel.textContent = person.name.trim() || "氏名未入力";
  }
  if (hintLabel) {
    hintLabel.textContent = buildPersonHint(person);
  }
  if (aliveBadge) {
    aliveBadge.textContent = person.alive ? "生存" : "死亡";
    aliveBadge.classList.toggle("is-deceased", !person.alive);
  }
}

function buildPersonHint(person) {
  const pieces = [];

  if (person.gender === "male") {
    pieces.push("男性");
  } else if (person.gender === "female") {
    pieces.push("女性");
  } else if (person.gender === "other") {
    pieces.push("その他");
  }

  pieces.push(person.alive ? "生存" : "死亡");

  if (!person.alive && person.notes.trim()) {
    pieces.push("先死亡メモあり");
  }

  if (person.spouseId) {
    const spouse = findPerson(person.spouseId);
    pieces.push(`配偶者: ${spouse ? spouse.name || `人物ID ${spouse.id}` : "未設定"}`);
  }

  return pieces.join(" / ");
}

function buildSampleState(type) {
  if (type === "representation") {
    return {
      people: [
        { id: "1", name: "山田 太郎", gender: "male", alive: false, fatherId: "", motherId: "", spouseId: "2", notes: "被相続人" },
        { id: "2", name: "山田 花子", gender: "female", alive: true, fatherId: "", motherId: "", spouseId: "1", notes: "配偶者" },
        { id: "3", name: "山田 一郎", gender: "male", alive: true, fatherId: "1", motherId: "2", spouseId: "", notes: "長男" },
        { id: "4", name: "山田 次郎", gender: "male", alive: false, fatherId: "1", motherId: "2", spouseId: "", notes: "次男。被相続人より先に死亡" },
        { id: "5", name: "山田 さくら", gender: "female", alive: true, fatherId: "4", motherId: "", spouseId: "", notes: "次男の子" },
        { id: "6", name: "山田 ひなた", gender: "female", alive: true, fatherId: "4", motherId: "", spouseId: "", notes: "次男の子" }
      ],
      nextId: 7,
      decedentId: "1",
      estate: {
        propertyName: "横浜市神奈川区○○マンション",
        propertyMemo: "被相続人単独名義",
        targetSharePercent: 100,
        ownerSharePercent: 100
      },
      consultationUrl: DEFAULT_CONSULTATION_URL,
      activeTab: DEFAULT_TAB
    };
  }

  return {
    people: [
      { id: "1", name: "佐藤 一郎", gender: "male", alive: false, fatherId: "", motherId: "", spouseId: "2", notes: "被相続人" },
      { id: "2", name: "佐藤 和子", gender: "female", alive: true, fatherId: "", motherId: "", spouseId: "1", notes: "配偶者" },
      { id: "3", name: "佐藤 太郎", gender: "male", alive: true, fatherId: "1", motherId: "2", spouseId: "", notes: "長男" },
      { id: "4", name: "佐藤 花", gender: "female", alive: true, fatherId: "1", motherId: "2", spouseId: "", notes: "長女" }
    ],
    nextId: 5,
    decedentId: "1",
    estate: {
      propertyName: "横浜市神奈川区○○マンション",
      propertyMemo: "被相続人単独名義",
      targetSharePercent: 100,
      ownerSharePercent: 100
    },
    consultationUrl: DEFAULT_CONSULTATION_URL,
    activeTab: DEFAULT_TAB
  };
}

function restoreState(snapshot) {
  state.people = (snapshot.people || []).map((person) => {
    const normalized = createEmptyPerson(String(person.id || ""));
    Object.assign(normalized, person);
    normalized.id = String(normalized.id || "");
    normalizePerson(normalized);
    return normalized;
  });

  state.nextId = Number(snapshot.nextId || getNextId(state.people));
  state.decedentId = String(snapshot.decedentId || "");
  state.estate = {
    propertyName: String(snapshot.estate?.propertyName || ""),
    propertyMemo: String(snapshot.estate?.propertyMemo || ""),
    targetSharePercent: clampPercent(snapshot.estate?.targetSharePercent, 100),
    ownerSharePercent: clampPercent(snapshot.estate?.ownerSharePercent, 100)
  };
  state.consultationUrl = String(snapshot.consultationUrl || DEFAULT_CONSULTATION_URL);
  state.activeTab = isValidTab(snapshot.activeTab) ? snapshot.activeTab : DEFAULT_TAB;
  state.lastSimulation = null;
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    restoreState(parsed);
  } catch (error) {
    console.warn("Failed to load inheritance simulator state.", error);
    localStorage.removeItem(STORAGE_KEY);
  }
}

function queuePersist() {
  window.clearTimeout(saveTimerId);
  saveTimerId = window.setTimeout(() => {
    persistStateNow();
  }, 120);
}

function persistStateNow() {
  window.clearTimeout(saveTimerId);
  saveTimerId = 0;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
  } catch (error) {
    console.warn("Failed to persist inheritance simulator state.", error);
  }
}

function serializeState() {
  return {
    people: state.people.map((person) => ({
      id: person.id,
      name: person.name,
      gender: person.gender,
      alive: person.alive,
      fatherId: person.fatherId,
      motherId: person.motherId,
      spouseId: person.spouseId,
      notes: person.notes
    })),
    nextId: state.nextId,
    decedentId: state.decedentId,
    estate: {
      propertyName: state.estate.propertyName,
      propertyMemo: state.estate.propertyMemo,
      targetSharePercent: state.estate.targetSharePercent,
      ownerSharePercent: state.estate.ownerSharePercent
    },
    consultationUrl: state.consultationUrl,
    activeTab: state.activeTab
  };
}

function exportJson() {
  syncEstateFromInputs();
  persistStateNow();
  triggerDownload(
    `inheritance-family-tree-${getTodayString()}.json`,
    JSON.stringify(serializeState(), null, 2)
  );
  showStatus("JSONをエクスポートしました。");
}

function importJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      restoreState(parsed);
      renderInitialView();
      showStatus("JSONを読み込みました。");
    } catch (error) {
      showErrors(["JSONの読み込みに失敗しました。形式を確認してください。"]);
    } finally {
      elements.importJsonInput.value = "";
    }
  };
  reader.readAsText(file);
}

function setActiveTab(tabId) {
  const nextTab = isValidTab(tabId) ? tabId : DEFAULT_TAB;
  state.activeTab = nextTab;

  elements.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === nextTab);
  });

  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === nextTab);
  });

  queuePersist();
}

function isValidTab(tabId) {
  return elements.tabPanels.some((panel) => panel.dataset.panel === tabId);
}

function showStatus(message) {
  elements.statusArea.innerHTML = `<div class="status-message">${escapeHtml(message)}</div>`;
}

function showErrors(errors) {
  elements.errorArea.innerHTML = errors
    .map((message) => `<div class="error-message">${escapeHtml(message)}</div>`)
    .join("");
}

function clearMessages() {
  elements.statusArea.innerHTML = "";
  elements.errorArea.innerHTML = "";
}

function triggerDownload(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sanitizeUrl(url) {
  if (!url) {
    return "#";
  }
  try {
    const parsed = new URL(url);
    return /^https?:$/i.test(parsed.protocol) ? parsed.toString() : "#";
  } catch (error) {
    return "#";
  }
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function findPerson(personId) {
  return state.people.find((person) => person.id === String(personId || ""));
}

function uniquePeople(people) {
  const seen = new Set();
  return people.filter((person) => {
    if (!person || seen.has(person.id)) {
      return false;
    }
    seen.add(person.id);
    return true;
  });
}

function hasAncestorLoop(personId, visited = new Set()) {
  if (visited.has(personId)) {
    return true;
  }

  const person = findPerson(personId);
  if (!person) {
    return false;
  }

  const nextVisited = new Set(visited);
  nextVisited.add(personId);

  return [person.fatherId, person.motherId]
    .filter(Boolean)
    .some((parentId) => hasAncestorLoop(parentId, nextVisited));
}

function formatPersonLabel(person) {
  const name = person.name.trim() || `人物ID ${person.id}`;
  return `${name}（${person.alive ? "生存" : "死亡"}）`;
}

function fieldLabel(fieldName) {
  if (fieldName === "fatherId") return "父ID";
  if (fieldName === "motherId") return "母ID";
  if (fieldName === "spouseId") return "配偶者";
  return fieldName;
}

function getNextId(people) {
  return people.reduce((max, person) => Math.max(max, Number(person.id || 0)), 0) + 1;
}

function clampPercent(value, fallback) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, numberValue));
}

function createFraction(numerator, denominator) {
  const safeNumerator = Number(numerator);
  const safeDenominator = Number(denominator);

  if (!Number.isFinite(safeNumerator) || !Number.isFinite(safeDenominator) || safeDenominator === 0) {
    return { numerator: 0, denominator: 1 };
  }

  return reduceFraction({
    numerator: safeNumerator,
    denominator: safeDenominator
  });
}

function reduceFraction(fraction) {
  const sign = fraction.denominator < 0 ? -1 : 1;
  const numerator = fraction.numerator * sign;
  const denominator = fraction.denominator * sign;
  const divisor = gcd(Math.round(Math.abs(numerator)), Math.round(Math.abs(denominator))) || 1;
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  };
}

function divideFraction(fraction, divisor) {
  return reduceFraction({
    numerator: fraction.numerator,
    denominator: fraction.denominator * divisor
  });
}

function multiplyFraction(a, b) {
  return reduceFraction({
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator
  });
}

function fractionToPercent(fraction) {
  return (fraction.numerator / fraction.denominator) * 100;
}

function formatFraction(fraction) {
  if (!fraction || fraction.denominator === 0) {
    return "-";
  }
  if (fraction.numerator === 0) {
    return "0";
  }
  if (fraction.denominator === 1) {
    return `${fraction.numerator}`;
  }
  return `${fraction.numerator}/${fraction.denominator}`;
}

function formatPercent(value) {
  const rounded = Math.round(value * 100) / 100;
  const formatted = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted}%`;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y) {
    const temp = x % y;
    x = y;
    y = temp;
  }

  return x || 1;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
