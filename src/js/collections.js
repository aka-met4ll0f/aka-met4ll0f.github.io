const contentPath = "./src/data/content.json";

function createTag(tag) {
  const pill = document.createElement("span");
  pill.className = "tag-pill";
  pill.textContent = tag;
  return pill;
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

  const summary = document.createElement("p");
  summary.className = "entry-summary";
  summary.textContent = item.summary;

  const tags = document.createElement("div");
  tags.className = "tag-list";
  (item.tags || []).forEach((tag) => tags.appendChild(createTag(tag)));

  const actions = document.createElement("div");
  actions.className = "entry-actions";
  if (item.url) {
    const link = document.createElement("a");
    link.className = "entry-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent = pageType === "writeups" ? "Ver writeup" : "Abrir recurso";
    actions.appendChild(link);
  }

  article.append(title, meta, summary, tags, actions);
  return article;
}

function mountCards(root, data, pageType) {
  root.innerHTML = "";
  if (!data || data.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "Aún no hay contenido publicado en esta sección.";
    root.appendChild(empty);
    return;
  }

  data.forEach((item) => root.appendChild(buildCard(item, pageType)));
}

function setupSearch(allItems, pageType, root) {
  const input = document.getElementById("search-input");
  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase().trim();
    const filtered = allItems.filter((item) => {
      const text = [item.title, item.summary, ...(item.tags || [])].join(" ").toLowerCase();
      return text.includes(term);
    });
    mountCards(root, filtered, pageType);
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

async function loadCollections() {
  const pageType = document.body.dataset.page;
  const root = document.getElementById("content-grid");
  if (!pageType || !root) {
    return;
  }

  const response = await fetch(contentPath);
  if (!response.ok) {
    throw new Error("No fue posible cargar la biblioteca de contenidos.");
  }

  const content = await response.json();
  const sectionData = content[pageType] || [];
  mountCards(root, sectionData, pageType);
  setupSearch(sectionData, pageType, root);
  revealEntries();
}

loadCollections().catch((error) => {
  const root = document.getElementById("content-grid");
  if (root) {
    root.innerHTML = `<p class="empty-note">${error.message}</p>`;
  }
});
