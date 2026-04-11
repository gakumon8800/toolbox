(function () {
  const categories = Array.isArray(window.CATEGORY_DEFINITIONS) ? window.CATEGORY_DEFINITIONS : [];
  const rawTools = Array.isArray(window.TOOLS_DATA) ? window.TOOLS_DATA : [];
  const navRoot = document.getElementById("category-nav");
  const categoriesRoot = document.getElementById("categories-root");
  const feedbackRoot = document.getElementById("tools-feedback");

  function setFeedback(message, type) {
    if (!feedbackRoot) {
      return;
    }

    feedbackRoot.hidden = false;
    feedbackRoot.textContent = message;
    feedbackRoot.className = `tools-feedback is-${type}`;
  }

  function clearFeedback() {
    if (!feedbackRoot) {
      return;
    }

    feedbackRoot.hidden = true;
    feedbackRoot.textContent = "";
    feedbackRoot.className = "tools-feedback";
  }

  if (!navRoot || !categoriesRoot) {
    console.error("Tool list root elements are missing.", {
      hasNavRoot: Boolean(navRoot),
      hasCategoriesRoot: Boolean(categoriesRoot)
    });
    return;
  }

  if (categories.length === 0) {
    console.error("CATEGORY_DEFINITIONS is empty or invalid.", window.CATEGORY_DEFINITIONS);
    setFeedback("カテゴリ定義の読み込みに失敗しました。", "error");
    return;
  }

  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  function normalizeTool(tool, index) {
    if (!tool || typeof tool !== "object") {
      throw new Error("ツール定義がオブジェクトではありません。");
    }

    const title = typeof tool.title === "string" && tool.title.trim() !== ""
      ? tool.title.trim()
      : typeof tool.name === "string" && tool.name.trim() !== ""
        ? tool.name.trim()
        : "";
    const path = typeof tool.path === "string" && tool.path.trim() !== ""
      ? tool.path.trim()
      : typeof tool.url === "string" && tool.url.trim() !== ""
        ? tool.url.trim()
        : "";
    const description = typeof tool.description === "string" ? tool.description.trim() : "";
    const category = typeof tool.category === "string" ? tool.category.trim() : "";
    const tags = Array.isArray(tool.tags)
      ? tool.tags.filter((tag) => typeof tag === "string" && tag.trim() !== "").map((tag) => tag.trim())
      : [];

    if (!title) {
      throw new Error("title または name が不足しています。");
    }
    if (!path) {
      throw new Error("path または url が不足しています。");
    }
    if (!description) {
      throw new Error("description が不足しています。");
    }
    if (!category) {
      throw new Error("category が不足しています。");
    }
    if (!categoryMap.has(category)) {
      throw new Error(`未定義の category です: ${category}`);
    }

    return {
      title,
      path,
      description,
      category,
      tags,
      status: tool.status === "coming_soon" ? "coming_soon" : "published",
      order: Number(tool.order) || index + 1
    };
  }

  const tools = [];
  const invalidTools = [];

  rawTools.forEach((tool, index) => {
    try {
      tools.push(normalizeTool(tool, index));
    } catch (error) {
      const contextLabel = tool && typeof tool === "object"
        ? tool.title || tool.name || tool.path || tool.url || `index:${index}`
        : `index:${index}`;
      console.error(`Tool entry validation failed: ${contextLabel}`, {
        tool,
        error: error instanceof Error ? error.message : error
      });
      invalidTools.push(contextLabel);
    }
  });

  if (tools.length === 0) {
    console.error("No valid tool entries were found.", rawTools);
    setFeedback("ツール一覧の読み込みに失敗しました。", "error");
    return;
  }

  if (invalidTools.length > 0) {
    setFeedback(`一部のツール定義に不備があります。詳細はコンソールを確認してください。 (${invalidTools.length}件)`, "warning");
  } else {
    clearFeedback();
  }

  function getToolsByCategory(categoryId) {
    return tools
      .filter((tool) => tool.category === categoryId)
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title, "ja"));
  }

  function createNavLink(category) {
    const link = document.createElement("a");
    link.className = "category-pill";
    link.href = `#category-${category.id}`;
    link.dataset.categoryTarget = category.id;
    link.textContent = category.label;
    return link;
  }

  function createTag(tag) {
    const item = document.createElement("li");
    item.className = "tool-tag";
    item.textContent = tag;
    return item;
  }

  function isComingSoon(tool) {
    return tool.status === "coming_soon";
  }

  function createAction(tool) {
    const action = document.createElement(isComingSoon(tool) ? "span" : "a");
    action.className = `tool-action${isComingSoon(tool) ? " is-disabled" : ""}`;
    action.textContent = isComingSoon(tool) ? "公開準備中" : "開く";

    if (!isComingSoon(tool)) {
      action.href = tool.path;
      action.setAttribute("aria-label", `${tool.title}を開く`);
    }

    return action;
  }

  function createToolCard(tool) {
    const article = document.createElement("article");
    article.className = `tool-card${isComingSoon(tool) ? " is-soon" : ""}`;

    const title = document.createElement("h3");
    title.textContent = tool.title;

    const description = document.createElement("p");
    description.textContent = tool.description;

    article.append(title, description);

    if (tool.tags.length > 0) {
      const tags = document.createElement("ul");
      tags.className = "tool-tags";
      tags.setAttribute("aria-label", "タグ");
      tool.tags.forEach((tag) => tags.appendChild(createTag(tag)));
      article.appendChild(tags);
    }

    const footer = document.createElement("div");
    footer.className = "tool-footer";
    footer.appendChild(createAction(tool));

    if (isComingSoon(tool)) {
      const status = document.createElement("span");
      status.className = "tool-status";
      status.textContent = "公開準備中";
      footer.appendChild(status);
    }

    article.appendChild(footer);
    return article;
  }

  function createCategorySection(category) {
    const items = getToolsByCategory(category.id);
    const section = document.createElement("section");
    section.className = "category-section";
    section.id = `category-${category.id}`;
    section.dataset.categorySection = category.id;

    const header = document.createElement("div");
    header.className = "category-header";

    const headingWrap = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Category";

    const title = document.createElement("h2");
    title.textContent = category.label;

    const description = document.createElement("p");
    description.textContent = category.description;

    headingWrap.append(eyebrow, title, description);

    const count = document.createElement("p");
    count.className = "category-count";
    count.textContent = `${items.length}件`;

    header.append(headingWrap, count);
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "tools-grid";

    items.forEach((tool) => {
      try {
        grid.appendChild(createToolCard(tool));
      } catch (error) {
        console.error(`Tool card render failed: ${tool.title}`, {
          tool,
          error: error instanceof Error ? error.message : error
        });
      }
    });

    if (grid.childElementCount === 0) {
      const empty = document.createElement("p");
      empty.className = "category-empty";
      empty.textContent = "このカテゴリのツールはまだありません。";
      section.appendChild(empty);
    } else {
      section.appendChild(grid);
    }

    return section;
  }

  categories.forEach((category) => {
    navRoot.appendChild(createNavLink(category));
    categoriesRoot.appendChild(createCategorySection(category));
  });

  const navLinks = Array.from(document.querySelectorAll("[data-category-target]"));
  const sectionElements = Array.from(document.querySelectorAll("[data-category-section]"));

  function setActiveCategory(categoryId) {
    navLinks.forEach((link) => {
      const isActive = link.dataset.categoryTarget === categoryId;
      link.classList.toggle("is-active", isActive);
      link.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  setActiveCategory(categories[0].id);

  if (!("IntersectionObserver" in window) || sectionElements.length === 0) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

      if (visible.length > 0) {
        setActiveCategory(visible[0].target.dataset.categorySection);
      }
    },
    {
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0.2, 0.45, 0.7]
    }
  );

  sectionElements.forEach((section) => observer.observe(section));
})();
