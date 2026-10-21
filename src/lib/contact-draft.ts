// Keeps a half-written contact form in this tab's sessionStorage, so a refresh
// or a visit to another page does not lose it. The draft never leaves the
// device: it is read and written only by the browser, and only the three
// visible fields are stored (never the hidden honeypot).

export const DRAFT_KEY = "portfolio-contact-draft";

// Same limits as the inputs' `maxLength` and the zod schema.
export const DRAFT_LIMITS = { name: 100, email: 254, message: 5000 } as const;

export type ContactDraft = Record<keyof typeof DRAFT_LIMITS, string>;

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const FIELDS = Object.keys(DRAFT_LIMITS) as (keyof ContactDraft)[];

function isBlank(draft: ContactDraft) {
  return FIELDS.every((field) => draft[field].trim() === "");
}

// Stored text is untrusted: it may be old, edited or from another version.
export function parseDraft(raw: string | null): ContactDraft | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const record = data as Record<string, unknown>;
  const draft = { name: "", email: "", message: "" } satisfies ContactDraft;
  for (const field of FIELDS) {
    const value = record[field];
    if (typeof value === "string") {
      draft[field] = value.slice(0, DRAFT_LIMITS[field]);
    }
  }
  return isBlank(draft) ? null : draft;
}

export function getDraftStorage(): DraftStorage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Reading sessionStorage can throw when site data is blocked.
    return null;
  }
}

export function clearDraft(storage: DraftStorage | null) {
  try {
    storage?.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

export function loadDraft(storage: DraftStorage | null): ContactDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(DRAFT_KEY);
    const draft = parseDraft(raw);
    if (raw !== null && !draft) clearDraft(storage);
    return draft;
  } catch {
    return null;
  }
}

// Saves only name, email and message. When all three are blank the key is
// removed, so resetting the form after a send does not leave an empty draft.
export function saveDraft(
  storage: DraftStorage | null,
  values: Readonly<Record<string, unknown>>,
) {
  if (!storage) return;
  const draft = { name: "", email: "", message: "" } satisfies ContactDraft;
  for (const field of FIELDS) {
    const value = values[field];
    if (typeof value === "string") {
      draft[field] = value.slice(0, DRAFT_LIMITS[field]);
    }
  }
  if (isBlank(draft)) {
    clearDraft(storage);
    return;
  }
  try {
    storage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage is full or blocked; the form keeps working without a draft.
  }
}
