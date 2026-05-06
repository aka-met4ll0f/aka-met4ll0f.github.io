const contentFile = "./src/data/content.json";

function createMiniCard(item, ctaLabel) {
  const card = document.createElement("article");
  card.className = "entry-card reveal";

  const title = document.createElement("h3");
  title.className = "entry-title";
  title.textContent = item.title;

  const meta = document.createElement("p");
  meta.className = "entry-meta";
  meta.textContent = [item.date, item.platform || item.type || item.language].filter(Boolean).join(" · ");

  const summary = document.createElement("p");
  summary.className = "entry-summary";
  summary.textContent = item.summary;

  const action = document.createElement("a");
  action.className = "entry-link";
  action.href = item.url || "#";
  action.target = "_blank";
  action.rel = "noreferrer noopener";
  action.textContent = ctaLabel;

  card.append(title, meta, summary, action);
  return card;
}

function mountPreview(targetId, list, ctaLabel) {
  const root = document.getElementById(targetId);
  if (!root) {
    return;
  }
  root.innerHTML = "";
  list.slice(0, 3).forEach((item) => root.appendChild(createMiniCard(item, ctaLabel)));
}

function revealCards() {
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

async function loadPreview() {
  const response = await fetch(contentFile);
  if (!response.ok) {
    return;
  }
  const data = await response.json();
  mountPreview("writeups-preview", data.writeups || [], "Abrir writeup");
  mountPreview("scripts-preview", data.scripts || [], "Ver script");
  revealCards();
}

loadPreview();
