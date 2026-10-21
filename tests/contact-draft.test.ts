import assert from "node:assert/strict";
import test from "node:test";
import {
  clearDraft,
  DRAFT_KEY,
  DRAFT_LIMITS,
  loadDraft,
  parseDraft,
  saveDraft,
} from "../src/lib/contact-draft";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const throwing = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("full");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

const draft = {
  name: "Alex",
  email: "alex@example.com",
  message: "Hello, I have a project in mind.",
};

test("a saved draft is restored unchanged", () => {
  const storage = fakeStorage();
  saveDraft(storage, draft);
  assert.deepEqual(loadDraft(storage), draft);
});

test("the honeypot field is never saved or restored", () => {
  const storage = fakeStorage();
  saveDraft(storage, { ...draft, website: "https://spam.example" });
  assert.deepEqual(Object.keys(JSON.parse(storage.data.get(DRAFT_KEY)!)), [
    "name",
    "email",
    "message",
  ]);

  const tampered = fakeStorage({
    [DRAFT_KEY]: JSON.stringify({ ...draft, website: "https://spam.example" }),
  });
  assert.deepEqual(loadDraft(tampered), draft);
});

test("a partly filled draft keeps what was typed", () => {
  const storage = fakeStorage();
  saveDraft(storage, { name: "Alex" });
  assert.deepEqual(loadDraft(storage), {
    name: "Alex",
    email: "",
    message: "",
  });
});

test("a blank form removes the draft instead of saving an empty one", () => {
  const storage = fakeStorage();
  saveDraft(storage, draft);
  saveDraft(storage, { name: "", email: "  ", message: "" });
  assert.equal(storage.data.has(DRAFT_KEY), false);
});

test("clearDraft removes the draft", () => {
  const storage = fakeStorage();
  saveDraft(storage, draft);
  clearDraft(storage);
  assert.equal(loadDraft(storage), null);
});

test("unusable stored data is ignored", () => {
  for (const raw of [
    "not json",
    "null",
    "[]",
    "42",
    '"text"',
    "{}",
    '{"name":5,"email":null,"message":["x"]}',
  ]) {
    assert.equal(parseDraft(raw), null, raw);
  }
  assert.equal(parseDraft(null), null);
});

test("wrong field types become empty strings", () => {
  assert.deepEqual(parseDraft('{"name":5,"email":"a@b.co","message":{}}'), {
    name: "",
    email: "a@b.co",
    message: "",
  });
});

test("loading unusable data removes it from storage", () => {
  const storage = fakeStorage({ [DRAFT_KEY]: "not json" });
  assert.equal(loadDraft(storage), null);
  assert.equal(storage.data.has(DRAFT_KEY), false);
});

test("over-long values are cut to the field limits", () => {
  const long = {
    name: "n".repeat(DRAFT_LIMITS.name + 50),
    email: "e".repeat(DRAFT_LIMITS.email + 50),
    message: "m".repeat(DRAFT_LIMITS.message + 50),
  };
  const restored = parseDraft(JSON.stringify(long));
  assert.equal(restored?.name.length, DRAFT_LIMITS.name);
  assert.equal(restored?.email.length, DRAFT_LIMITS.email);
  assert.equal(restored?.message.length, DRAFT_LIMITS.message);

  const storage = fakeStorage();
  saveDraft(storage, long);
  assert.equal(loadDraft(storage)?.message.length, DRAFT_LIMITS.message);
});

test("missing or failing storage never throws", () => {
  assert.doesNotThrow(() => saveDraft(null, draft));
  assert.doesNotThrow(() => clearDraft(null));
  assert.equal(loadDraft(null), null);

  assert.doesNotThrow(() => saveDraft(throwing, draft));
  assert.doesNotThrow(() => clearDraft(throwing));
  assert.equal(loadDraft(throwing), null);
});
