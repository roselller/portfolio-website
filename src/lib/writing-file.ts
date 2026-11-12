// Reads one writing file: a short header between two `---` lines, then the
// text in Markdown. Pure (no file system), so it can be tested.
//
//   ---
//   title: Why hawker centres matter
//   date: 2026-09-14
//   type: Opinion
//   author: A different byline (optional)
//   summary: One line shown on the front folder.
//   ---
//   The text.

export type Writing = {
  slug: string;
  title: string;
  /** ISO day (YYYY-MM-DD), or null when the file gives none. */
  date: string | null;
  /** A short label such as "Opinion" or "Proposal". */
  type: string;
  /** The byline, or "" to use the site owner's name. */
  author: string;
  summary: string;
  /** The text, in Markdown. */
  body: string;
};

export const WRITING_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function unquote(value: string) {
  const quoted = /^(["'])(.*)\1$/.exec(value);
  return quoted ? quoted[2] : value;
}

/** The header's `key: value` lines and the text after it. */
export function splitFrontmatter(text: string) {
  const fields: Record<string, string> = {};
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return { fields, body: text.trim() };
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (end === -1) return { fields, body: text.trim() };
  for (const line of lines.slice(1, end)) {
    const match = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (match) fields[match[1].toLowerCase()] = unquote(match[2].trim());
  }
  return {
    fields,
    body: lines
      .slice(end + 1)
      .join("\n")
      .trim(),
  };
}

function validDay(value: string | undefined) {
  if (!value || !DAY.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  // Date.parse accepts 2026-02-31 and rolls it over; only keep real days.
  return Number.isNaN(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
    ? null
    : value;
}

/** One piece of writing, or null when the file has no usable slug or title. */
export function parseWritingFile(slug: string, text: string): Writing | null {
  if (!WRITING_SLUG.test(slug)) return null;
  const { fields, body } = splitFrontmatter(text);
  const title = fields.title?.trim();
  if (!title) return null;
  return {
    slug,
    title,
    date: validDay(fields.date),
    type: fields.type?.trim() || "Writing",
    author: fields.author?.trim() || "",
    summary: fields.summary?.trim() || "",
    body,
  };
}

/** Newest first; pieces without a date go last; ties sort by title. */
export function sortWritings(writings: Writing[]) {
  return [...writings].sort(
    (a, b) =>
      (b.date ?? "").localeCompare(a.date ?? "") ||
      a.title.localeCompare(b.title),
  );
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/** "14 Sep 2026" for an ISO day, the same in every time zone and browser. */
export function formatWritingDate(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return `${date} ${MONTHS[month - 1]} ${year}`;
}
