const profilePath = "./src/data/profile.json";

async function loadProfile() {
  const response = await fetch(profilePath);
  if (!response.ok) {
    throw new Error("No fue posible cargar la información del perfil.");
  }
  return response.json();
}

function setText(selector, value) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    element.textContent = value;
  });
}

function setLink(selector, href) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    element.href = href;
  });
}

function setActiveNav() {
  const page = document.body.dataset.page;
  if (!page) {
    return;
  }
  const active = document.querySelector(`[data-nav="${page}"]`);
  if (active) {
    active.setAttribute("aria-current", "page");
  }
}

function setFooterYear() {
  const year = new Date().getFullYear();
  setText(".js-year", String(year));
}

async function bootstrapSite() {
  try {
    const profile = await loadProfile();
    setText(".js-name", profile.name || "");
    setText(".js-headline", profile.headline || "");
    setText(".js-location", `${profile.location || ""} — ${profile.availability || ""}`);
    setLink(".js-github", profile.contact?.github || "#");
    setLink(".js-linkedin", profile.contact?.linkedin || "#");
    setLink(".js-htb", profile.contact?.hackTheBox || "#");
  } catch (error) {
    setText(".js-name", "Perfil no disponible");
    setText(".js-headline", error.message);
  }

  setActiveNav();
  setFooterYear();
}

bootstrapSite();
