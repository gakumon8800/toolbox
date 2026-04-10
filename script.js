(function () {
  const categories = Array.isArray(window.CATEGORY_DEFINITIONS) ? window.CATEGORY_DEFINITIONS : [];
  const tools = Array.isArray(window.TOOLS_DATA) ? window.TOOLS_DATA : [];
  const navRoot = document.getElementById("category-nav");
  const categoriesRoot = document.getElementById("categories-root");

  if (!navRoot || !categoriesRoot || categories.length === 0) {
    return;
  }

  function normalizeTools(categoryId) {
    return tools
      .filter((tool) => tool.category === categoryId)
      .sort((left, right) => {
        const leftOrder = Number(left.order) || 9999;
        const rightOrder = Number(right.order) || 9999;
        return leftOrder - rightOrder || left.title.localeCompare(right.title, "ja");
      });
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

  function hasOpenPath(tool) {
    return typeof tool.path === "string" && tool.path.trim() !== "";
  }

  function createAction(tool) {
    const comingSoon = isComingSoon(tool);
    const openable = hasOpenPath(tool) && !comingSoon;
    const action = document.createElement(openable ? "a" : "span");
    action.className = `tool-action${openable ? "" : " is-disabled"}`;
    action.textContent = comingSoon ? "準備中" : openable ? "開く" : "未設定";

    if (openable) {
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

    const tags = document.createElement("ul");
    tags.className = "tool-tags";
    tags.setAttribute("aria-label", "タグ");
    (tool.tags || []).forEach((tag) => tags.appendChild(createTag(tag)));

    const footer = document.createElement("div");
    footer.className = "tool-footer";
    footer.appendChild(createAction(tool));

    if (isComingSoon(tool)) {
      const status = document.createElement("span");
      status.className = "tool-status";
      status.textContent = "公開準備中";
      footer.appendChild(status);
    }

    article.append(title, description);
    if ((tool.tags || []).length > 0) {
      article.appendChild(tags);
    }
    article.appendChild(footer);

    return article;
  }

  function createCategorySection(category) {
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

    const items = normalizeTools(category.id);
    const count = document.createElement("p");
    count.className = "category-count";
    count.textContent = `${items.length}件`;
    header.append(headingWrap, count);

    const grid = document.createElement("div");
    grid.className = "tools-grid";
    items.forEach((tool) => grid.appendChild(createToolCard(tool)));

    section.append(header, grid);
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

  if ("IntersectionObserver" in window && sectionElements.length > 0) {
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
  }
})();
