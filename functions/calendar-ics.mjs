/**
 * LiczMat — czysty generator iCalendar.
 *
 * UWAGA: `assets/calendar-ics.js` jest przeglądarkową kopią tego pliku. Obie kopie
 * muszą zmieniać się razem; `scripts/test-calendar-ics.mjs` sprawdza ich zgodność.
 */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const encoder = new TextEncoder();

function validDay(value) {
  if (typeof value !== "string" || !DAY_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

/** Projekty widoczne jako otwarte, datowane terminy, w stabilnej kolejności. */
export function icsProjects(projects) {
  return (Array.isArray(projects) ? projects : []).filter((project) => project
    && validDay(project.dueDate)
    && !project.deletedAt
    && !project.archived
    && project.status !== "done"
    && project.status !== "cancelled")
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)
      || String(a.name || "").localeCompare(String(b.name || "")));
}

function text(value) {
  return String(value == null ? "" : value)
    .replace(/\r\n|\r/g, "\n")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function utcStamp(value, fallback) {
  const millis = Number(value);
  const date = new Date(Number.isFinite(millis) ? millis : fallback);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
    + `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function nextDay(day) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + 1));
  const pad = (number) => String(number).padStart(2, "0");
  return `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`;
}

/** Składa jedną logiczną linię do fizycznych linii po najwyżej 75 oktetów UTF-8. */
function fold(line) {
  const physical = [];
  let current = "";
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    const limit = physical.length ? 74 : 75; // spacja kontynuacji jest 75. oktetem
    if (current && bytes + size > limit) {
      physical.push(current);
      current = character;
      bytes = size;
    } else {
      current += character;
      bytes += size;
    }
  }
  physical.push(current);
  return physical.map((part, index) => (index ? ` ${part}` : part)).join("\r\n");
}

/** Buduje kompletny kalendarz; `now` jest jawne, aby wynik był deterministyczny. */
export function buildIcs(projects, { calName, clientsById = {}, now }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LiczMat//Terminarz//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${text(calName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const project of icsProjects(projects)) {
    const stamp = utcStamp(project.updatedAt ?? project.createdAt, now);
    const client = clientsById && clientsById[project.clientId];
    const clientName = typeof client === "string" ? client : client && client.name;
    const clientLocation = client && typeof client === "object"
      ? [client.street || client.address,
          [client.postalCode, client.city].filter(Boolean).join(" "), client.country]
        .filter((value) => value != null && String(value).trim() !== "").map(String).join(", ")
      : "";
    const description = [clientName, project.note].filter((value) => value != null && value !== "")
      .map(String).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${text(project.id ?? project.projectId)}@liczmat.com`,
      `DTSTAMP:${stamp}`,
      `LAST-MODIFIED:${stamp}`,
      `DTSTART;VALUE=DATE:${project.dueDate.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${nextDay(project.dueDate)}`,
      `SUMMARY:${text(project.name)}`,
    );
    if (clientLocation) lines.push(`LOCATION:${text(clientLocation)}`);
    if (description) lines.push(`DESCRIPTION:${text(description)}`);
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/** Token kanału to dokładnie 32 losowe bajty zakodowane jako base64url. */
export function looksLikeFeedToken(value) {
  return typeof value === "string" && TOKEN_RE.test(value);
}
