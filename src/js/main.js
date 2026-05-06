const profileUrl = "./src/data/profile.json";
const htbUrl = "./src/data/htb.json";

const byId = (id) => document.getElementById(id);

const safeText = (value, fallback = "No disponible") => (value ? String(value) : fallback);

function setHero(profile) {
  byId("name").textContent = safeText(profile.name);
  byId("headline").textContent = safeText(profile.headline);
  byId("location").textContent = `${safeText(profile.location)} - ${safeText(profile.availability)}`;

  const linkedinLink = byId("linkedin-link");
  linkedinLink.href = profile.contact?.linkedin || "#";

  const htbLink = byId("htb-link");
  htbLink.href = profile.contact?.hackTheBox || "#";

  byId("summary").textContent = safeText(profile.summary);
}

function renderSimpleList(id, values) {
  const root = byId(id);
  root.innerHTML = "";
  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    root.appendChild(li);
  });
}

function renderExperience(experience) {
  const root = byId("experience-list");
  root.innerHTML = "";

  experience.forEach((job) => {
    const card = document.createElement("article");
    card.className = "timeline-item";

    const title = document.createElement("h3");
    title.textContent = `${job.role} | ${job.company}`;

    const meta = document.createElement("p");
    meta.className = "timeline-meta";
    meta.textContent = `${job.period} - ${job.modality}`;

    const bullets = document.createElement("ul");
    job.highlights.forEach((item) => {
      const bullet = document.createElement("li");
      bullet.textContent = item;
      bullets.appendChild(bullet);
    });

    card.append(title, meta, bullets);
    root.appendChild(card);
  });
}

function renderSkills(skills) {
  const root = byId("skills-list");
  root.innerHTML = "";
  skills.forEach((skill) => {
    const li = document.createElement("li");
    li.textContent = skill;
    root.appendChild(li);
  });
}

function renderHtb(htb) {
  const cards = byId("htb-cards");
  cards.innerHTML = "";

  const fields = [
    { label: "Ranking Global", value: htb.rankingGlobal },
    { label: "Puntos", value: htb.points },
    { label: "Nivel", value: htb.level },
    { label: "Maquinas User", value: htb.userOwns },
    { label: "Maquinas Root", value: htb.rootOwns },
    { label: "Retos Resueltos", value: htb.challengesSolved }
  ];

  fields.forEach((field) => {
    const node = document.createElement("div");
    node.className = "stat";
    node.innerHTML = `<span class="stat-label">${field.label}</span><span class="stat-value">${safeText(field.value, "-")}</span>`;
    cards.appendChild(node);
  });

  byId("htb-sync-date").textContent = htb.updatedAt
    ? `Actualizado: ${new Date(htb.updatedAt).toLocaleString("es-CO")}`
    : "Sincronizacion pendiente";

  const note = byId("htb-note");
  note.textContent = safeText(htb.note, "Datos obtenidos por sincronizacion segura server-side.");
  note.classList.toggle("warning", Boolean(htb.warning));
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  return response.json();
}

async function bootstrap() {
  try {
    const [profile, htb] = await Promise.all([loadJson(profileUrl), loadJson(htbUrl)]);
    setHero(profile);
    renderSimpleList("focus-list", profile.professionalFocus || []);
    renderSimpleList("cert-list", profile.certifications || []);
    renderSimpleList("education-list", profile.education || []);
    renderSimpleList("languages-list", profile.languages || []);
    renderExperience(profile.experience || []);
    renderSkills(profile.skills || []);
    renderHtb(htb || {});
  } catch (error) {
    byId("summary").textContent = "Error cargando contenido del perfil.";
    byId("htb-note").textContent = error.message;
    byId("htb-note").classList.add("warning");
  }
}

bootstrap();
