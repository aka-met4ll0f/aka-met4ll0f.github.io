import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://labs.hackthebox.com/api/v4";
const dataFile = path.resolve("./src/data/htb.json");
const userId = process.env.HTB_USER_ID || "886162";
const token = process.env.HTB_API_TOKEN;

const headers = {
  Accept: "application/json",
  Authorization: token ? `Bearer ${token}` : ""
};

function tryNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function findFirst(obj, keys) {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      return obj[key];
    }
  }

  for (const value of Object.values(obj)) {
    const nested = findFirst(value, keys);
    if (nested !== null && nested !== undefined) {
      return nested;
    }
  }

  return null;
}

async function safeGet(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} @ ${url}`);
  }
  return response.json();
}

async function loadCurrentData() {
  try {
    const raw = await readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function resolvePayload() {
  const candidates = [
    `${API_BASE}/user/profile/basic/${userId}`,
    `${API_BASE}/user/profile/progress/${userId}`,
    `${API_BASE}/user/profile/content/${userId}`,
    `${API_BASE}/user/profile/activity/${userId}`
  ];

  const payloads = [];
  const errors = [];

  for (const endpoint of candidates) {
    try {
      const data = await safeGet(endpoint);
      payloads.push(data);
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (payloads.length === 0) {
    throw new Error(`No fue posible obtener datos HTB. ${errors.join(" | ")}`);
  }

  return payloads;
}

function mapData(payloads, previous) {
  const merged = Object.assign({}, ...payloads);

  const username =
    findFirst(merged, ["name", "username", "user_name"]) || previous.username || "Hack The Box User";

  const rankingGlobal = tryNumber(findFirst(merged, ["ranking", "global_rank", "rank"]));
  const points = tryNumber(findFirst(merged, ["points", "respects"]));
  const level = tryNumber(findFirst(merged, ["level", "hacker_level"]));
  const userOwns = tryNumber(findFirst(merged, ["user_owns", "userOwns", "owns"]));
  const rootOwns = tryNumber(findFirst(merged, ["system_owns", "root_owns", "rootOwns"]));
  const challengesSolved = tryNumber(findFirst(merged, ["challenges_solved", "challenge_owns", "challengeOwns"]));

  return {
    source: "htb-api",
    username,
    rankingGlobal: rankingGlobal ?? previous.rankingGlobal ?? null,
    points: points ?? previous.points ?? null,
    level: level ?? previous.level ?? null,
    userOwns: userOwns ?? previous.userOwns ?? null,
    rootOwns: rootOwns ?? previous.rootOwns ?? null,
    challengesSolved: challengesSolved ?? previous.challengesSolved ?? null,
    updatedAt: new Date().toISOString(),
    note: "Datos sincronizados de HTB vía job server-side. Sin exponer tokens en frontend.",
    warning: false
  };
}

async function main() {
  const previous = await loadCurrentData();

  if (previous && previous.manualLocked) {
    console.log("HTB manual lock activo. No se sobrescriben datos.");
    return;
  }

  if (!token) {
    const fallback = {
      ...previous,
      source: "manual-fallback",
      updatedAt: new Date().toISOString(),
      note: "No se detectó HTB_API_TOKEN. Conservando datos actuales.",
      warning: true
    };
    await writeFile(dataFile, JSON.stringify(fallback, null, 2) + "\n", "utf8");
    console.warn("HTB_API_TOKEN no definido. Se guardó fallback seguro.");
    return;
  }

  try {
    const payloads = await resolvePayload();
    const normalized = mapData(payloads, previous);
    await writeFile(dataFile, JSON.stringify(normalized, null, 2) + "\n", "utf8");
    console.log("Sincronización HTB completada.");
  } catch (error) {
    const fallback = {
      ...previous,
      source: "htb-sync-error",
      updatedAt: new Date().toISOString(),
      note: "Falló la sincronización HTB. Se conservaron datos previos.",
      warning: true,
      error: error.message
    };
    await writeFile(dataFile, JSON.stringify(fallback, null, 2) + "\n", "utf8");
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
