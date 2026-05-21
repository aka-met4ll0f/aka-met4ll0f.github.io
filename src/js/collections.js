const pageLang = document.documentElement.lang === "en" ? "en" : "es";
const isEnglish = pageLang === "en";
const locale = isEnglish ? "en-US" : "es-CO";
const contentPath = isEnglish ? "/src/data/content.en.json" : "/src/data/content.json";
const githubApiBase = "https://api.github.com/repos/";

function parseGitHubRepo(url) {
  if (!url || !url.includes("github.com")) {
    return null;
  }

  const clean = url.replace(/\.git$/, "").replace(/\/+$/, "");
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (!match) {
    return null;
  }

  return `${match[1]}/${match[2]}`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function createTag(tag) {
  const pill = document.createElement("span");
  pill.className = "tag-pill";
  pill.textContent = tag;
  return pill;
}

function createBadge(text, type = "default") {
  const badge = document.createElement("span");
  badge.className = `meta-badge meta-badge--${type}`;
  badge.textContent = text;
  return badge;
}

function buildCard(item, pageType) {
  const article = document.createElement("article");
  article.className = "entry-card reveal";

  const title = document.createElement("h3");
  title.className = "entry-title";
  title.textContent = item.title;

  const meta = document.createElement("p");
  meta.className = "entry-meta";
  const metaLeft = item.date || item.level || item.language || "";
  const metaRight = item.platform || item.type || item.status || "";
  meta.textContent = [metaLeft, metaRight].filter(Boolean).join(" · ");

  const badges = document.createElement("div");
  badges.className = "badge-list";
  if (item.language) {
    badges.appendChild(createBadge(item.language, "language"));
  }
  if (item.type) {
    badges.appendChild(createBadge(item.type, "type"));
  }
  if (item.updatedAtFormatted) {
    badges.appendChild(
      createBadge(`${isEnglish ? "Updated" : "Actualizado"}: ${item.updatedAtFormatted}`, "updated")
    );
  }

  const summary = document.createElement("p");
  summary.className = "entry-summary";
  summary.textContent = item.summary;

  const tags = document.createElement("div");
  tags.className = "tag-list";
  (item.tags || []).forEach((tag) => tags.appendChild(createTag(tag)));

  const actions = document.createElement("div");
  actions.className = "entry-actions";
  if (item.url && pageType === "scripts") {
    const code = document.createElement("a");
    code.className = "entry-link";
    code.href = item.url;
    code.target = "_blank";
    code.rel = "noreferrer noopener";
    code.textContent = isEnglish ? "View code" : "Ver código";
    actions.appendChild(code);

    if (item.readmeUrl) {
      const readme = document.createElement("a");
      readme.className = "entry-link entry-link--alt";
      readme.href = item.readmeUrl;
      readme.target = "_blank";
      readme.rel = "noreferrer noopener";
      readme.textContent = isEnglish ? "View README" : "Ver README";
      actions.appendChild(readme);
    }
  } else if (item.url) {
    const link = document.createElement("a");
    link.className = "entry-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent =
      pageType === "writeups"
        ? isEnglish
          ? "View writeup"
          : "Ver writeup"
        : isEnglish
          ? "Open resource"
          : "Abrir recurso";
    actions.appendChild(link);
  }

  article.append(title, meta, badges, summary, tags, actions);
  return article;
}

function mountCards(root, data, pageType) {
  root.innerHTML = "";
  root.classList.add("entry-grid");
  root.classList.remove("collection-groups");

  if (!data || data.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = isEnglish
      ? "No content has been published in this section yet."
      : "Aún no hay contenido publicado en esta sección.";
    root.appendChild(empty);
    return;
  }

  data.forEach((item) => root.appendChild(buildCard(item, pageType)));
}

function mountGroupedWriteups(root, data) {
  root.innerHTML = "";
  root.classList.remove("entry-grid");
  root.classList.add("collection-groups");

  if (!data || data.length === 0) {
    mountCards(root, data, "writeups");
    return;
  }

  const groups = [
    { title: "Windows Machines", items: data.filter((item) => item.os === "Windows") },
    { title: "Linux Machines", items: data.filter((item) => item.os === "Linux") }
  ];

  groups.forEach((group) => {
    if (group.items.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "collection-group";

    const title = document.createElement("h2");
    title.className = "collection-group-title";
    title.textContent = group.title;

    const grid = document.createElement("div");
    grid.className = "entry-grid";
    group.items.forEach((item) => grid.appendChild(buildCard(item, "writeups")));

    section.append(title, grid);
    root.appendChild(section);
  });
}

function setupSearch(allItems, pageType, root) {
  const input = document.getElementById("search-input");
  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase().trim();
    const filtered = allItems.filter((item) => {
      const text = [
        item.title,
        item.summary,
        item.language,
        item.type,
        item.platform,
        ...(item.tags || [])
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
    if (pageType === "writeups") {
      mountGroupedWriteups(root, filtered);
    } else {
      mountCards(root, filtered, pageType);
    }
    revealEntries();
  });
}

function revealEntries() {
  const items = document.querySelectorAll(".entry-card.reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

async function fetchScriptMeta(items) {
  const enriched = await Promise.all(
    items.map(async (item) => {
      const repo = parseGitHubRepo(item.url);
      if (!repo) {
        return item;
      }

      try {
        const response = await fetch(`${githubApiBase}${repo}`);
        if (!response.ok) {
          return item;
        }

        const repoData = await response.json();
        const updatedAt = repoData.pushed_at || repoData.updated_at || null;
        const readmeUrl = `${item.url.replace(/\/+$/, "")}/blob/${repoData.default_branch || "main"}/README.md`;

        return {
          ...item,
          language: item.language || repoData.language || "N/A",
          updatedAt,
          updatedAtFormatted: formatDate(updatedAt),
          readmeUrl
        };
      } catch {
        return item;
      }
    })
  );

  return enriched.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}

async function loadCollections() {
  const pageType = document.body.dataset.page;
  const root = document.getElementById("content-grid");
  if (!pageType || !root) {
    return;
  }

  const response = await fetch(contentPath);
  if (!response.ok) {
    throw new Error(
      isEnglish
        ? "Could not load the content library."
        : "No fue posible cargar la biblioteca de contenidos."
    );
  }

  const content = await response.json();
  let sectionData = content[pageType] || [];

  if (pageType === "scripts") {
    sectionData = await fetchScriptMeta(sectionData);
  }

  if (pageType === "writeups") {
    mountGroupedWriteups(root, sectionData);
  } else {
    mountCards(root, sectionData, pageType);
  }
  setupSearch(sectionData, pageType, root);
  revealEntries();
}

loadCollections().catch((error) => {
  const root = document.getElementById("content-grid");
  if (root) {
    root.innerHTML = `<p class="empty-note">${error.message}</p>`;
  }
});
