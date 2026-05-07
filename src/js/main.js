const profileUrl = "./src/data/profile.json";
const htbUrl = "./src/data/htb.json";

const byId = (id) => document.getElementById(id);

const safeText = (value, fallback = "No disponible") => (value ? String(value) : fallback);

const formatNumber = (value) => new Intl.NumberFormat("es-CO").format(value);

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
  const yearNode = document.querySelector(".js-year");
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}

function createStatCard(label, value, animate = false) {
  const node = document.createElement("div");
  node.className = "stat";

  const title = document.createElement("span");
  title.className = "stat-label";
  title.textContent = label;

  const number = document.createElement("span");
  number.className = "stat-value";

  if (typeof value === "number" && Number.isFinite(value)) {
    number.textContent = animate ? "0" : formatNumber(value);
    if (animate) {
      node.dataset.loading = "true";
      animateNumber(number, value, () => {
        node.dataset.loading = "false";
      });
    }
  } else {
    number.textContent = safeText(value, "-");
  }

  node.append(title, number);
  return node;
}

function animateNumber(element, targetValue, onFinish) {
  const duration = 900;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const current = Math.floor(progress * targetValue);
    element.textContent = formatNumber(current);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = formatNumber(targetValue);
      if (onFinish) {
        onFinish();
      }
    }
  };

  window.requestAnimationFrame(step);
}

function runTerminalTicker(messages) {
  const terminal = byId("terminal-text");
  if (!terminal || messages.length === 0) {
    return;
  }

  let messageIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const currentMessage = messages[messageIndex];

    if (!deleting) {
      charIndex += 1;
      terminal.textContent = currentMessage.slice(0, charIndex);

      if (charIndex === currentMessage.length) {
        deleting = true;
        window.setTimeout(tick, 1450);
        return;
      }

      window.setTimeout(tick, 38);
      return;
    }

    charIndex -= 1;
    terminal.textContent = currentMessage.slice(0, charIndex);

    if (charIndex === 0) {
      deleting = false;
      messageIndex = (messageIndex + 1) % messages.length;
    }

    window.setTimeout(tick, 20);
  };

  tick();
}

function setHero(profile) {
  byId("name").textContent = safeText(profile.name);
  byId("headline").textContent = safeText(profile.headline);
  byId("location").textContent = `${safeText(profile.location)} — ${safeText(profile.availability)}`;

  const githubLink = byId("github-link");
  githubLink.href = profile.contact?.github || "#";

  const linkedinLink = byId("linkedin-link");
  linkedinLink.href = profile.contact?.linkedin || "#";

  const htbLink = byId("htb-link");
  htbLink.href = profile.contact?.hackTheBox || "#";

  byId("summary").textContent = safeText(profile.summary);

  runTerminalTicker([
    "Iniciando evaluación de superficie de ataque...",
    "Correlacionando hallazgos técnicos y riesgo de negocio...",
    "Diseñando estrategias de remediación en TI/TO...",
    "Listo para operaciones de seguridad ofensiva."
  ]);
}

function renderSimpleList(id, values) {
  const root = byId(id);
  if (!root) {
    return;
  }
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
    meta.textContent = `${job.period} — ${job.modality}`;

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

function renderCareerMetrics(profile) {
  const root = byId("career-metrics");
  root.innerHTML = "";

  const currentYear = new Date().getFullYear();
  const firstYears = (profile.experience || [])
    .map((job) => {
      const match = String(job.period || "").match(/(19|20)\d{2}/);
      return match ? Number(match[0]) : null;
    })
    .filter((year) => typeof year === "number");

  const earliestYear = firstYears.length > 0 ? Math.min(...firstYears) : currentYear;
  const yearsOfExperience = Math.max(currentYear - earliestYear, 1);

  const metrics = [
    { label: "Años de experiencia", value: yearsOfExperience },
    { label: "Certificaciones clave", value: (profile.certifications || []).length },
    { label: "Roles profesionales", value: (profile.experience || []).length },
    { label: "Disponibilidad", value: "Remoto global" }
  ];

  metrics.forEach((metric) => {
    root.appendChild(createStatCard(metric.label, metric.value, typeof metric.value === "number"));
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
  const syncDate = byId("htb-sync-date");
  const note = byId("htb-note");

  if (!cards || !syncDate || !note) {
    return;
  }

  cards.innerHTML = "";

  const fields = [
    { label: "Ranking Global", value: htb.rankingGlobal },
    { label: "Puntos", value: htb.points },
    { label: "Nivel", value: htb.level },
    { label: "Máquinas User", value: htb.userOwns },
    { label: "Máquinas Root", value: htb.rootOwns },
    { label: "Retos Resueltos", value: htb.challengesSolved }
  ];

  fields.forEach((field) => {
    cards.appendChild(createStatCard(field.label, field.value, typeof field.value === "number"));
  });

  syncDate.textContent = htb.updatedAt
    ? `Actualizado: ${new Date(htb.updatedAt).toLocaleString("es-CO")}`
    : "Sincronización pendiente";

  note.textContent = safeText(htb.note, "Datos obtenidos por sincronización segura del lado del servidor.");
  note.classList.toggle("warning", Boolean(htb.warning));
}

function enableRevealAnimations() {
  const items = document.querySelectorAll(".hero, .panel");
  items.forEach((item) => item.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  items.forEach((item) => observer.observe(item));
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
    renderCareerMetrics(profile);
    renderSimpleList("focus-list", profile.professionalFocus || []);
    renderSimpleList("cert-list", profile.certifications || []);
    renderSimpleList("education-list", profile.education || []);
    renderExperience(profile.experience || []);
    renderSkills(profile.skills || []);
    renderHtb(htb || {});
    enableRevealAnimations();
  } catch (error) {
    byId("summary").textContent = "Error cargando el contenido del perfil.";
    const htbNote = byId("htb-note");
    if (htbNote) {
      htbNote.textContent = error.message;
      htbNote.classList.add("warning");
    }
  }

  setActiveNav();
  setFooterYear();
}

bootstrap();
