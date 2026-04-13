const STORAGE_KEY = "toolbox_inheritance_family_tree_v4";
const DEFAULT_CONSULTATION_URL = "https://example.com/contact";
const TAB_ORDER = ["family", "heirs", "shares", "ownership", "notes"];
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
  activeTab: TAB_ORDER[0]
};

startApp();

function startApp() {
  try {
    bindStaticEvents();
    loadPersistedState();

    if (!state.people.length) {
      loadSampleData("basic");
      showStatus("サンプル1を初期表示しました。");
      return;
    }

    fullRender();
  } catch (error) {
    console.error(error);
    showErrors(["初期化中に問題が発生しました。ページを再読み込みしても改善しない場合はリセットをお試しください。"]);
    renderResultPlaceholder("初期化エラーにより結果を表示できません。");
  }
}

function bindStaticEvents() {
  elements.addPersonButton.addEventListener("click", handleAddPerson);
  elements.runSimulationButton.addEventListener("click", () => simulateAndRender(true));
  elements.sampleBasicButton.addEventListener("click", () => loadSampleData("basic"));
  elements.sampleRepresentationButton.addEventListener("click", () => loadSampleData("representation"));
  elements.resetButton.addEventListener("click", handleReset);
  elements.exportJsonButton.addEventListener("click", handleExportJson);
  elements.importJsonInput.addEventListener("change", handleImportJson);
  elements.printButton.addEventListener("click", () => window.print());

  elements.decedentSelect.addEventListener("change", (event) => {
    state.decedentId = event.target.value;
    persistState();
  });

  [elements.propertyName, elements.propertyMemo, elements.propertyTargetShare, elements.propertyOwnerShare, elements.consultationUrl]
    .forEach((input) => {
      input.addEventListener("input", () => {
        syncEstateFromInputs();
        persistState();
      });
    });

  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveTab(button.dataset.tab);
    });
  });
}

function handleAddPerson() {
  addPerson();
  preserveViewport(() => {
    renderPeopleSection();
    renderDecedentSelect();
  });
  persistState();
  showStatus("人物カードを追加しました。");
}

function handleReset() {
  localStorage.removeItem(STORAGE_KEY);
  loadSampleData("basic");
  showStatus("入力内容をリセットし、サンプル1を再読み込みしました。");
}

function handleExportJson() {
  persistState();
  const payload = JSON.stringify(serializeState(), null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `inheritance-family-tree-${getTodayString()}.json`);
  URL.revokeObjectURL(url);
  showStatus("JSONをエクスポートしました。");
}

function handleImportJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      restoreState(JSON.parse(String(reader.result || "{}")));
      fullRender();
      showStatus("JSONを読み込みました。");
    } catch (error) {
      console.error(error);
      showErrors(["JSONの読み込みに失敗しました。ファイル形式を確認してください。"]);
    } finally {
      elements.importJsonInput.value = "";
    }
  };
  reader.readAsText(file);
}

function fullRender() {
  renderPeopleSection();
  renderDecedentSelect();
  fillEstateInputs();
  setActiveTab(state.activeTab);
  simulateAndRender(false);
}

function renderPeopleSection() {
  if (!state.people.length) {
    elements.peopleList.innerHTML = '<div class="empty-state">人物が未登録です。「人物を追加」またはサンプル読込から始めてください。</div>';
    return;
  }

  elements.peopleList.innerHTML = state.people.map((person) => buildPersonCardHtml(person)).join("");
  elements.peopleList.querySelectorAll("[data-person-id]").forEach((card) => bindPersonCardEvents(card));
}

function buildPersonCardHtml(person) {
  return `
    <article class="person-card" data-person-id="${person.id}">
      <div class="person-card-header">
        <div class="person-card-title">
          <div class="person-meta">
            <span class="relation-badge">人物ID: ${escapeHtml(person.id)}</span>
            <span class="state-badge ${person.alive ? "" : "is-deceased"}">${person.alive ? "生存" : "死亡"}</span>
          </div>
          <h3>${escapeHtml(person.name || "氏名未入力")}</h3>
          <p class="mini-help">${escapeHtml(buildPersonHint(person))}</p>
        </div>
        <button type="button" class="danger-button" data-action="delete-person">削除</button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="person-name-${person.id}">氏名</label>
          <input id="person-name-${person.id}" type="text" data-field="name" value="${escapeHtml(person.name)}" placeholder="例：山田 太郎">
        </div>
        <div class="field">
          <label for="person-gender-${person.id}">性別（任意）</label>
          <select id="person-gender-${person.id}" data-field="gender">${buildOptionHtml([
            { value: "", label: "未選択" },
            { value: "male", label: "男性" },
            { value: "female", label: "女性" },
            { value: "other", label: "その他" }
          ], person.gender)}</select>
        </div>
        <div class="field">
          <label for="person-alive-${person.id}">生存状況</label>
          <select id="person-alive-${person.id}" data-field="alive">${buildOptionHtml([
            { value: "alive", label: "生存" },
            { value: "deceased", label: "死亡" }
          ], person.alive ? "alive" : "deceased")}</select>
        </div>
        <div class="field">
          <label for="person-spouse-${person.id}">配偶者</label>
          <select id="person-spouse-${person.id}" data-field="spouseId">${buildPeopleSelectOptions(person.id, person.spouseId, "選択しない")}</select>
        </div>
        <div class="field">
          <label for="person-father-${person.id}">父ID</label>
          <select id="person-father-${person.id}" data-field="fatherId">${buildPeopleSelectOptions(person.id, person.fatherId, "未設定")}</select>
        </div>
        <div class="field">
          <label for="person-mother-${person.id}">母ID</label>
          <select id="person-mother-${person.id}" data-field="motherId">${buildPeopleSelectOptions(person.id, person.motherId, "未設定")}</select>
        </div>
        <div class="field full">
          <label for="person-notes-${person.id}">備考（任意）</label>
          <textarea id="person-notes-${person.id}" data-field="notes" placeholder="例：父より先に死亡">${escapeHtml(person.notes)}</textarea>
        </div>
      </div>
    </article>
  `;
}

function bindPersonCardEvents(card) {
  const personId = card.dataset.personId;
  card.querySelector('[data-action="delete-person"]').addEventListener("click", () => removePerson(personId));

  card.querySelectorAll("[data-field]").forEach((field) => {
    if (field.tagName === "INPUT" || field.tagName === "TEXTAREA") {
      field.addEventListener("input", (event) => updatePersonTextField(personId, event.target.dataset.field, event.target.value, card));
    } else {
      field.addEventListener("change", (event) => updatePersonRelationshipField(personId, event.target.dataset.field, event.target.value));
    }
  });
}

function updatePersonTextField(personId, fieldName, value, card) {
  const person = findPerson(personId);
  if (!person) {
    return;
  }

  person[fieldName] = String(value || "");
  persistState();
  if (fieldName === "name") {
    card.dataset.personNameDraft = person.name;
  }
}

function updatePersonCardHeader(card, person) {
  const title = card.querySelector("h3");
  const hint = card.querySelector(".mini-help");
  if (title) {
    title.textContent = person.name.trim() || "氏名未入力";
  }
  if (hint) {
    hint.textContent = buildPersonHint(person);
  }
}

function updatePersonRelationshipField(personId, fieldName, value) {
  const person = findPerson(personId);
  if (!person) {
    return;
  }

  if (fieldName === "alive") {
    person.alive = value === "alive";
  } else {
    person[fieldName] = String(value || "");
  }

  normalizePerson(person);
  maintainSpouseIntegrity(personId, fieldName);
  persistState();
  preserveViewport(() => {
    renderPeopleSection();
    renderDecedentSelect();
  });
}

function renderDecedentSelect() {
  const options = ['<option value="">被相続人を選択してください</option>']
    .concat(state.people.map((person) => `<option value="${person.id}" ${person.id === state.decedentId ? "selected" : ""}>${escapeHtml(formatPersonLabel(person))}</option>`));
  elements.decedentSelect.innerHTML = options.join("");
}

function simulateAndRender(showStatusMessage) {
  clearMessages();
  syncEstateFromInputs();

  const errors = validateForSimulation();
  if (errors.length) {
    showErrors(errors);
    renderResultPlaceholder("入力内容を整えると結果を表示できます。");
    renderNotesSection(null);
    return;
  }

  const simulation = buildSimulationResult();
  renderFamilyTree(simulation);
  renderHeirCandidates(simulation);
  renderShareTable(simulation);
  renderOwnershipSection(simulation);
  renderNotesSection(simulation);
  persistState();

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

    ["fatherId", "motherId", "spouseId"].forEach((key) => {
      if (person[key] && !idSet.has(person[key])) {
        errors.push(`${person.name || `人物ID ${person.id}`}: ${fieldLabel(key)}に存在しないIDは設定できません。`);
      }
      if (person[key] && person[key] === person.id) {
        errors.push(`${person.name || `人物ID ${person.id}`}: 自分自身を${fieldLabel(key)}に設定できません。`);
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
      errors.push("被相続人は死亡として登録してください。");
    }
  }

  if (state.estate.targetSharePercent <= 0 || state.estate.ownerSharePercent <= 0) {
    errors.push("持分割合は0より大きい値を入力してください。");
  }

  return [...new Set(errors)];
}

function buildSimulationResult() {
  const decedent = findPerson(state.decedentId);
  const spouse = getLivingSpouse(decedent.id);
  const descendantBranches = getDescendantBranches(decedent.id);
  const livingParents = getParents(decedent.id).filter((person) => person.alive);
  const siblingBranches = getSiblingBranches(decedent.id);

  let group = "none";
  let explanation = "この簡易ルールでは相続分の目安を算出できませんでした。";
  let drafts = [];

  if (descendantBranches.length) {
    group = "descendants";
    drafts = buildDescendantShareDrafts(descendantBranches, spouse);
    explanation = spouse
      ? "このケースでは、配偶者と子系統が相続人候補となるため、配偶者1/2、子系統全体で1/2が目安です。死亡した子の枝は孫が均等に承継する簡易計算です。"
      : "このケースでは、子系統のみが相続人候補となるため、子系統で均等に整理しています。死亡した子の枝は孫が均等に承継する簡易計算です。";
  } else if (livingParents.length) {
    group = "parents";
    drafts = buildParentShareDrafts(livingParents, spouse);
    explanation = spouse
      ? "このケースでは、配偶者と直系尊属が相続人候補となるため、配偶者2/3、直系尊属全体で1/3が目安です。"
      : "このケースでは、直系尊属のみが相続人候補となるため、直系尊属で均等に整理しています。";
  } else if (siblingBranches.length) {
    group = "siblings";
    drafts = buildSiblingShareDrafts(siblingBranches, spouse);
    explanation = spouse
      ? "このケースでは、配偶者と兄弟姉妹が相続人候補となるため、配偶者3/4、兄弟姉妹全体で1/4が目安です。"
      : "このケースでは、兄弟姉妹のみが相続人候補となるため、兄弟姉妹で均等に整理しています。";
  } else if (spouse) {
    group = "spouseOnly";
    drafts = [{ personId: spouse.id, relation: "配偶者", detail: "配偶者のみ", fraction: createFraction(1, 1) }];
    explanation = "このケースでは、配偶者のみが相続人候補となるため、配偶者1/1が目安です。";
  }

  const transferFraction = multiplyFraction(
    createFraction(state.estate.ownerSharePercent, 100),
    createFraction(state.estate.targetSharePercent, 100)
  );

  const shares = drafts.map((draft) => ({
    ...draft,
    person: findPerson(draft.personId),
    propertyFraction: multiplyFraction(draft.fraction, transferFraction)
  }));

  return {
    decedent,
    spouse,
    group,
    explanation,
    transferFraction,
    shares,
    candidates: buildCandidateRows(decedent, spouse, descendantBranches, livingParents, siblingBranches, shares)
  };
}

function buildCandidateRows(decedent, spouse, descendantBranches, livingParents, siblingBranches, shares) {
  const chosenIds = new Set(shares.map((share) => share.personId));
  return state.people
    .filter((person) => person.id !== decedent.id)
    .map((person) => ({
      name: person.name,
      relation: getRelationLabel(person.id, decedent.id),
      aliveLabel: person.alive ? "生存" : "死亡",
      candidateLabel: chosenIds.has(person.id) ? "候補" : "対象外",
      reason: getCandidateReason(person.id, spouse, descendantBranches, livingParents, siblingBranches)
    }));
}

function getCandidateReason(personId, spouse, descendantBranches, livingParents, siblingBranches) {
  if (spouse && spouse.id === personId) {
    return "配偶者";
  }
  if (descendantBranches.some((branch) => branch.heirs.some((heir) => heir.id === personId))) {
    return descendantBranches.some((branch) => branch.type === "representation" && branch.heirs.some((heir) => heir.id === personId))
      ? "死亡した子に代わる孫"
      : "子";
  }
  if (livingParents.some((parent) => parent.id === personId)) {
    return "直系尊属";
  }
  if (siblingBranches.some((branch) => branch.heirs.some((heir) => heir.id === personId))) {
    return siblingBranches.some((branch) => branch.type === "niece" && branch.heirs.some((heir) => heir.id === personId))
      ? "死亡した兄弟姉妹に代わる甥姪"
      : "兄弟姉妹";
  }
  return "今回の簡易ルールでは該当なし";
}

function renderFamilyTree(simulation) {
  const levels = [
    { label: "親世代", people: getParents(simulation.decedent.id) },
    { label: "本人世代", people: uniquePeople([simulation.decedent, ...(simulation.spouse ? [simulation.spouse] : []), ...getSiblings(simulation.decedent.id)]) },
    { label: "子世代", people: getChildren(simulation.decedent.id) },
    { label: "孫世代", people: uniquePeople(getChildren(simulation.decedent.id).flatMap((child) => getChildren(child.id))) }
  ].filter((level) => level.people.length);

  if (!levels.length) {
    elements.familyTree.innerHTML = '<div class="empty-state">家系図を表示する情報が不足しています。</div>';
    return;
  }

  elements.familyTree.innerHTML = levels.map((level) => `
    <section class="tree-level">
      <p class="tree-level-title">${escapeHtml(level.label)}</p>
      <div class="tree-row">
        ${level.people.map((person) => `
          <article class="tree-node ${person.id === simulation.decedent.id ? "is-decedent" : ""} ${person.alive ? "" : "is-deceased"}">
            <div class="tree-node-name">${escapeHtml(person.name)}</div>
            <div class="tree-node-meta">
              <span class="state-badge ${person.alive ? "" : "is-deceased"}">${person.alive ? "生存" : "死亡"}</span>
              <span class="relation-badge">${escapeHtml(getRelationLabel(person.id, simulation.decedent.id) === "本人" ? "被相続人" : getRelationLabel(person.id, simulation.decedent.id))}</span>
            </div>
            <p class="tree-node-text">${escapeHtml(person.notes || "備考なし")}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderHeirCandidates(simulation) {
  elements.heirCandidatesBody.innerHTML = simulation.candidates.length
    ? simulation.candidates.map((row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.relation)}</td>
        <td>${escapeHtml(row.aliveLabel)}</td>
        <td>${escapeHtml(row.candidateLabel)}</td>
        <td>${escapeHtml(row.reason)}</td>
      </tr>
    `).join("")
    : '<tr><td colspan="5">候補者情報がありません。</td></tr>';
}

function renderShareTable(simulation) {
  if (!simulation.shares.length) {
    elements.shareTableBody.innerHTML = '<tr><td colspan="5">この簡易ルールでは相続分の目安を算出できませんでした。</td></tr>';
    elements.shareSummary.textContent = simulation.explanation;
    return;
  }

  elements.shareTableBody.innerHTML = simulation.shares.map((share) => `
    <tr>
      <td>${escapeHtml(share.person.name)}</td>
      <td>${escapeHtml(share.relation)}</td>
      <td>${escapeHtml(formatFraction(share.fraction))}</td>
      <td>${escapeHtml(formatPercent(fractionToPercent(share.fraction)))}</td>
      <td>${escapeHtml(share.detail)}</td>
    </tr>
  `).join("");
  elements.shareSummary.textContent = simulation.explanation;
}

function renderOwnershipSection(simulation) {
  elements.ownershipBefore.innerHTML = `
    <strong>${escapeHtml(simulation.decedent.name)}</strong> ${escapeHtml(formatPercent(fractionToPercent(simulation.transferFraction)))}
    <div class="mini-help">${escapeHtml(state.estate.propertyName || "対象不動産")} における今回の計算対象持分です。</div>
  `;

  if (!simulation.shares.length) {
    elements.ownershipBar.innerHTML = '<div class="empty-state">共有持分イメージを表示できません。</div>';
    elements.ownershipCards.innerHTML = "";
    elements.ownershipNotice.textContent = "共有持分のイメージは、相続分の目安が出るケースで表示されます。";
    return;
  }

  elements.ownershipBar.innerHTML = simulation.shares.map((share, index) => {
    const percent = fractionToPercent(share.propertyFraction);
    const label = percent >= 12 ? escapeHtml(share.person.name) : "";
    return `
      <div class="ownership-segment" style="width:${percent}%;background:${OWNERSHIP_COLORS[index % OWNERSHIP_COLORS.length]};" title="${escapeHtml(share.person.name)} ${escapeHtml(formatPercent(percent))}">
        ${label}
      </div>
    `;
  }).join("");

  elements.ownershipCards.innerHTML = simulation.shares.map((share) => `
    <article class="ownership-card">
      <strong>${escapeHtml(share.person.name)}</strong>
      <div>${escapeHtml(share.relation)} / 法定相続分の目安 ${escapeHtml(formatFraction(share.fraction))}</div>
      <div>不動産上の持分イメージ ${escapeHtml(formatPercent(fractionToPercent(share.propertyFraction)))}</div>
    </article>
  `).join("");

  elements.ownershipNotice.textContent = simulation.shares.length > 1
    ? "相続後は複数名の共有状態となる想定です。売却・賃貸・管理・修繕等で意思決定が複雑になる場合があります。"
    : "今回の簡易シミュレーションでは単独承継の形です。遺産分割協議や遺言で結果が変わる可能性があります。";
}

function renderNotesSection(simulation) {
  const items = [
    "遺言の有無や内容で結果は変わる可能性があります。",
    "相続放棄、養子縁組、特別受益、寄与分、代襲の範囲など個別事情はこの簡易計算に反映していません。",
    "不動産が共有になると、売却・賃貸・管理で共有者間の調整が必要になることがあります。"
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
  elements.ownershipNotice.textContent = "共有持分のイメージは結果表示後に確認できます。";
}

function buildDescendantShareDrafts(branches, spouse) {
  const drafts = [];
  if (spouse) {
    drafts.push({ personId: spouse.id, relation: "配偶者", detail: "配偶者は1/2の目安", fraction: createFraction(1, 2) });
  }
  const total = spouse ? createFraction(1, 2) : createFraction(1, 1);
  const branchShare = divideFraction(total, branches.length);
  branches.forEach((branch) => {
    const each = divideFraction(branchShare, branch.heirs.length);
    branch.heirs.forEach((heir) => {
      drafts.push({
        personId: heir.id,
        relation: getRelationLabel(heir.id, state.decedentId),
        detail: branch.type === "representation" ? "死亡した子の枝を孫で均等配分" : "子の枝を均等配分",
        fraction: each
      });
    });
  });
  return drafts;
}

function buildParentShareDrafts(parents, spouse) {
  const drafts = [];
  if (spouse) {
    drafts.push({ personId: spouse.id, relation: "配偶者", detail: "配偶者は2/3の目安", fraction: createFraction(2, 3) });
  }
  const total = spouse ? createFraction(1, 3) : createFraction(1, 1);
  const each = divideFraction(total, parents.length);
  parents.forEach((parent) => {
    drafts.push({ personId: parent.id, relation: getRelationLabel(parent.id, state.decedentId), detail: "直系尊属で均等配分", fraction: each });
  });
  return drafts;
}

function buildSiblingShareDrafts(branches, spouse) {
  const drafts = [];
  if (spouse) {
    drafts.push({ personId: spouse.id, relation: "配偶者", detail: "配偶者は3/4の目安", fraction: createFraction(3, 4) });
  }
  const total = spouse ? createFraction(1, 4) : createFraction(1, 1);
  const branchShare = divideFraction(total, branches.length);
  branches.forEach((branch) => {
    const each = divideFraction(branchShare, branch.heirs.length);
    branch.heirs.forEach((heir) => {
      drafts.push({
        personId: heir.id,
        relation: getRelationLabel(heir.id, state.decedentId),
        detail: branch.type === "niece" ? "甥姪までの簡易代襲" : "兄弟姉妹で均等配分",
        fraction: each
      });
    });
  });
  return drafts;
}

function getLivingSpouse(personId) {
  const person = findPerson(personId);
  if (!person || !person.spouseId) {
    return null;
  }
  const spouse = findPerson(person.spouseId);
  return spouse && spouse.alive ? spouse : null;
}

function getChildren(personId) {
  return state.people.filter((person) => person.fatherId === personId || person.motherId === personId);
}

function getParents(personId) {
  const person = findPerson(personId);
  if (!person) {
    return [];
  }
  return [findPerson(person.fatherId), findPerson(person.motherId)].filter(Boolean);
}

function getSiblings(personId) {
  const person = findPerson(personId);
  if (!person) {
    return [];
  }
  return state.people.filter((candidate) => {
    if (candidate.id === person.id) {
      return false;
    }
    return (person.fatherId && candidate.fatherId === person.fatherId) || (person.motherId && candidate.motherId === person.motherId);
  });
}

function getDescendantBranches(personId) {
  return getChildren(personId).flatMap((child) => {
    if (child.alive) {
      return [{ type: "child", heirs: [child] }];
    }
    const livingGrandchildren = getChildren(child.id).filter((grandchild) => grandchild.alive);
    return livingGrandchildren.length ? [{ type: "representation", heirs: livingGrandchildren }] : [];
  });
}

function getSiblingBranches(personId) {
  return getSiblings(personId).flatMap((sibling) => {
    if (sibling.alive) {
      return [{ type: "sibling", heirs: [sibling] }];
    }
    const livingChildren = getChildren(sibling.id).filter((child) => child.alive);
    return livingChildren.length ? [{ type: "niece", heirs: livingChildren }] : [];
  });
}

function getRelationLabel(personId, decedentId) {
  if (personId === decedentId) {
    return "本人";
  }
  const decedent = findPerson(decedentId);
  if (!decedent) {
    return "関係未判定";
  }
  if (decedent.spouseId === personId) return "配偶者";
  if (decedent.fatherId === personId) return "父";
  if (decedent.motherId === personId) return "母";
  if (getChildren(decedentId).some((child) => child.id === personId)) return "子";
  if (getChildren(decedentId).some((child) => getChildren(child.id).some((grandchild) => grandchild.id === personId))) return "孫";
  if (getSiblings(decedentId).some((sibling) => sibling.id === personId)) return "兄弟姉妹";
  if (getSiblings(decedentId).some((sibling) => getChildren(sibling.id).some((child) => child.id === personId))) return "甥姪";
  return "親族";
}

function hasAncestorLoop(personId, visited = new Set()) {
  if (!personId) {
    return false;
  }
  if (visited.has(personId)) {
    return true;
  }
  const person = findPerson(personId);
  if (!person) {
    return false;
  }
  const nextVisited = new Set(visited);
  nextVisited.add(personId);
  return [person.fatherId, person.motherId].filter(Boolean).some((parentId) => hasAncestorLoop(parentId, nextVisited));
}

function addPerson(data = {}) {
  state.people.push(normalizePerson({
    id: String(state.nextId++),
    name: "",
    gender: "",
    alive: true,
    fatherId: "",
    motherId: "",
    spouseId: "",
    notes: "",
    ...data
  }));
  if (!state.decedentId && state.people[0]) {
    state.decedentId = state.people[0].id;
  }
}

function removePerson(personId) {
  state.people = state.people.filter((person) => person.id !== personId);
  state.people.forEach((person) => {
    if (person.fatherId === personId) person.fatherId = "";
    if (person.motherId === personId) person.motherId = "";
    if (person.spouseId === personId) person.spouseId = "";
  });
  if (state.decedentId === personId) {
    state.decedentId = state.people[0] ? state.people[0].id : "";
  }
  persistState();
  preserveViewport(() => {
    renderPeopleSection();
    renderDecedentSelect();
  });
}

function maintainSpouseIntegrity(personId, fieldName) {
  if (fieldName !== "spouseId") {
    return;
  }
  const source = findPerson(personId);
  if (!source) {
    return;
  }
  state.people.forEach((person) => {
    if (person.id !== source.id && person.spouseId === source.id && source.spouseId !== person.id) {
      person.spouseId = "";
    }
  });
  if (source.spouseId) {
    const spouse = findPerson(source.spouseId);
    if (spouse) {
      spouse.spouseId = source.id;
    }
  }
}

function normalizePerson(person) {
  person.id = String(person.id || "");
  person.name = String(person.name || "").trimStart();
  person.gender = String(person.gender || "");
  person.alive = Boolean(person.alive);
  person.fatherId = String(person.fatherId || "");
  person.motherId = String(person.motherId || "");
  person.spouseId = String(person.spouseId || "");
  person.notes = String(person.notes || "");
  return person;
}

function buildPeopleSelectOptions(currentId, selectedValue, emptyLabel) {
  return buildOptionHtml(
    [{ value: "", label: emptyLabel }].concat(
      state.people
        .filter((person) => person.id !== currentId)
        .map((person) => ({ value: person.id, label: formatPersonLabel(person) }))
    ),
    selectedValue
  );
}

function buildOptionHtml(options, selectedValue) {
  return options.map((option) => `
    <option value="${escapeHtml(option.value)}" ${option.value === selectedValue ? "selected" : ""}>${escapeHtml(option.label)}</option>
  `).join("");
}

function buildPersonHint(person) {
  const parts = [];
  if (person.fatherId) parts.push(`父: ${(findPerson(person.fatherId) || {}).name || person.fatherId}`);
  if (person.motherId) parts.push(`母: ${(findPerson(person.motherId) || {}).name || person.motherId}`);
  if (person.spouseId) parts.push(`配偶者: ${(findPerson(person.spouseId) || {}).name || person.spouseId}`);
  return parts.length ? parts.join(" / ") : "親子関係・配偶者関係は未設定です。";
}

function formatPersonLabel(person) {
  return `${person.name || `ID${person.id}`} (${person.alive ? "生存" : "死亡"})`;
}

function syncEstateFromInputs() {
  state.estate.propertyName = elements.propertyName.value.trim();
  state.estate.propertyMemo = elements.propertyMemo.value.trim();
  state.estate.targetSharePercent = clampPercent(elements.propertyTargetShare.value, 100);
  state.estate.ownerSharePercent = clampPercent(elements.propertyOwnerShare.value, 100);
  state.consultationUrl = elements.consultationUrl.value.trim() || DEFAULT_CONSULTATION_URL;
}

function fillEstateInputs() {
  elements.propertyName.value = state.estate.propertyName;
  elements.propertyMemo.value = state.estate.propertyMemo;
  elements.propertyTargetShare.value = state.estate.targetSharePercent;
  elements.propertyOwnerShare.value = state.estate.ownerSharePercent;
  elements.consultationUrl.value = state.consultationUrl;
}

function loadSampleData(type) {
  restoreState(type === "representation"
    ? {
      nextId: 6,
      decedentId: "1",
      consultationUrl: DEFAULT_CONSULTATION_URL,
      estate: {
        propertyName: "横浜市神奈川区サンプルマンション",
        propertyMemo: "被相続人持分を100%と仮定",
        targetSharePercent: 100,
        ownerSharePercent: 100
      },
      people: [
        { id: "1", name: "父", gender: "male", alive: false, spouseId: "2", fatherId: "", motherId: "", notes: "被相続人" },
        { id: "2", name: "母", gender: "female", alive: true, spouseId: "1", fatherId: "", motherId: "", notes: "" },
        { id: "3", name: "子A", gender: "male", alive: false, spouseId: "", fatherId: "1", motherId: "2", notes: "父より先に死亡" },
        { id: "4", name: "孫A1", gender: "female", alive: true, spouseId: "", fatherId: "3", motherId: "", notes: "" },
        { id: "5", name: "孫A2", gender: "male", alive: true, spouseId: "", fatherId: "3", motherId: "", notes: "" }
      ]
    }
    : {
      nextId: 5,
      decedentId: "1",
      consultationUrl: DEFAULT_CONSULTATION_URL,
      estate: {
        propertyName: "横浜市神奈川区○○マンション",
        propertyMemo: "相続整理用のサンプル",
        targetSharePercent: 100,
        ownerSharePercent: 100
      },
      people: [
        { id: "1", name: "父", gender: "male", alive: false, spouseId: "2", fatherId: "", motherId: "", notes: "被相続人" },
        { id: "2", name: "母", gender: "female", alive: true, spouseId: "1", fatherId: "", motherId: "", notes: "" },
        { id: "3", name: "子A", gender: "female", alive: true, spouseId: "", fatherId: "1", motherId: "2", notes: "" },
        { id: "4", name: "子B", gender: "male", alive: true, spouseId: "", fatherId: "1", motherId: "2", notes: "" }
      ]
    });

  fullRender();
}

function restoreState(data) {
  state.people = Array.isArray(data.people) ? data.people.map((person) => normalizePerson({ ...person })) : [];
  state.nextId = Number(data.nextId) || calculateNextId(state.people);
  state.decedentId = String(data.decedentId || "");
  state.estate = {
    propertyName: String(data.estate?.propertyName || ""),
    propertyMemo: String(data.estate?.propertyMemo || ""),
    targetSharePercent: clampPercent(data.estate?.targetSharePercent ?? 100, 100),
    ownerSharePercent: clampPercent(data.estate?.ownerSharePercent ?? 100, 100)
  };
  state.consultationUrl = String(data.consultationUrl || DEFAULT_CONSULTATION_URL);
  persistState();
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    restoreState(JSON.parse(raw));
  } catch (error) {
    console.error(error);
  }
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
  } catch (error) {
    console.error(error);
  }
}

function serializeState() {
  return {
    people: state.people,
    nextId: state.nextId,
    decedentId: state.decedentId,
    estate: state.estate,
    consultationUrl: state.consultationUrl
  };
}

function setActiveTab(tabId) {
  const availableTabs = elements.tabButtons.map((button) => button.dataset.tab).filter(Boolean);
  const fallbackTab = availableTabs[0] || TAB_ORDER[0];
  state.activeTab = availableTabs.includes(tabId) ? tabId : fallbackTab;
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === state.activeTab);
  });
  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === state.activeTab);
  });
}

function preserveViewport(callback) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  callback();
  window.scrollTo(scrollX, scrollY);
}

function createFraction(numerator, denominator) {
  const divisor = greatestCommonDivisor(Math.abs(numerator), Math.abs(denominator));
  return {
    numerator: numerator / divisor || 0,
    denominator: denominator / divisor || 1
  };
}

function multiplyFraction(left, right) {
  return createFraction(left.numerator * right.numerator, left.denominator * right.denominator);
}

function divideFraction(fraction, divisor) {
  return createFraction(fraction.numerator, fraction.denominator * divisor);
}

function fractionToPercent(fraction) {
  return (fraction.numerator / fraction.denominator) * 100;
}

function formatFraction(fraction) {
  return `${fraction.numerator}/${fraction.denominator}`;
}

function formatPercent(value) {
  return `${Number(value).toFixed(value >= 10 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1")}%`;
}

function greatestCommonDivisor(left, right) {
  return right ? greatestCommonDivisor(right, left % right) : (left || 1);
}

function clampPercent(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : fallback;
}

function calculateNextId(people) {
  return people.reduce((max, person) => Math.max(max, Number(person.id) || 0), 0) + 1;
}

function uniquePeople(people) {
  return people.filter((person, index, array) => person && array.findIndex((item) => item.id === person.id) === index);
}

function fieldLabel(key) {
  return { fatherId: "父ID", motherId: "母ID", spouseId: "配偶者ID" }[key] || key;
}

function findPerson(id) {
  return state.people.find((person) => person.id === String(id)) || null;
}

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "#";
  } catch (_error) {
    return "#";
  }
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function showStatus(message) {
  elements.statusArea.innerHTML = `<div class="status-message">${escapeHtml(message)}</div>`;
}

function showErrors(errors) {
  elements.errorArea.innerHTML = errors.map((error) => `<div class="error-message">${escapeHtml(error)}</div>`).join("");
}

function clearMessages() {
  elements.statusArea.innerHTML = "";
  elements.errorArea.innerHTML = "";
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
