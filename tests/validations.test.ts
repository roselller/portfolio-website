import assert from "node:assert/strict";
import test from "node:test";
import { flattenError as flattenMini } from "zod/mini";
import { flattenError, object, string } from "zod";
import { contactSchema } from "../src/lib/validations";

// The contact schema as it was before it moved to zod/mini. The new schema
// must accept and reject exactly what this one does, with the same messages.
const previousSchema = object({
  name: string()
    .trim()
    .min(2, "Please enter at least 2 characters.")
    .max(100, "Please keep your name under 100 characters."),
  email: string()
    .trim()
    .max(254, "Please enter a shorter email address.")
    .email("Please enter a valid email address."),
  message: string()
    .trim()
    .min(10, "A little more detail, please — at least 10 characters.")
    .max(5000, "Please keep your message under 5,000 characters."),
  website: string().max(200).optional().default(""),
});

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I would like to talk about a project.",
};

const emails = [
  "ada@example.com",
  "  ada@example.com  ",
  "Ada.Lovelace+portfolio@Sub.Example.CO.UK",
  "A@EXAMPLE.COM",
  "o'brien@example.com",
  "a-b_c@example-domain.org",
  "x".repeat(240) + "@example.com", // 252 characters: inside the limit
  "x".repeat(243) + "@example.com", // 255 characters: one over
  "x".repeat(300) + "@nope", // too long and not an address
  "",
  "   ",
  "ada",
  "ada@",
  "@example.com",
  "ada@example",
  "ada@example.c",
  "ada @example.com",
  "ada@exa mple.com",
  ".ada@example.com",
  "ada.@example.com",
  "ada..lovelace@example.com",
  "ada@-example.com",
  "ada@example..com",
  "ada@@example.com",
  "josé@example.com",
  "ada@exämple.com",
  "ada@example.com\n",
  "<script>@example.com",
  "ada@127.0.0.1",
  "ada@[127.0.0.1]",
];

const names = [
  "Ada",
  "  Ad  ",
  "A",
  " A ",
  "",
  "   ",
  "李雷",
  "李",
  "👩‍💻",
  "x".repeat(100),
  "x".repeat(101),
  "  " + "x".repeat(100) + "  ",
  "Ada\nLovelace",
];

const messages = [
  "ten chars!",
  "nine char",
  "  nine char  ",
  "   ",
  "",
  "x".repeat(5000),
  "x".repeat(5001),
  "  " + "x".repeat(5000) + "  ",
  "Line one\nLine two\r\nLine three, with ünicode and 日本語.",
];

const websites: unknown[] = [
  undefined,
  "",
  "spam",
  "x".repeat(200),
  "x".repeat(201),
];

type Outcome =
  | { ok: true; data: unknown }
  | { ok: false; fieldErrors: Record<string, string[]> };

function previous(input: unknown): Outcome {
  const result = previousSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : {
        ok: false,
        fieldErrors: flattenError(result.error).fieldErrors as Record<
          string,
          string[]
        >,
      };
}

function current(input: unknown): Outcome {
  const result = contactSchema.safeParse(input);
  return result.success
    ? { ok: true, data: result.data }
    : {
        ok: false,
        fieldErrors: flattenMini(result.error).fieldErrors as Record<
          string,
          string[]
        >,
      };
}

/** The honeypot's message is never shown, so only its presence is compared. */
function withoutHoneypotText(outcome: Outcome): Outcome {
  if (outcome.ok || !outcome.fieldErrors.website) return outcome;
  return {
    ok: false,
    fieldErrors: {
      ...outcome.fieldErrors,
      website: outcome.fieldErrors.website.map(() => "<honeypot>"),
    },
  };
}

function assertSame(input: unknown, label: string) {
  assert.deepEqual(
    withoutHoneypotText(current(input)),
    withoutHoneypotText(previous(input)),
    label,
  );
}

test("every email edge case gets the same verdict, data and messages", () => {
  for (const email of emails) {
    assertSame(
      { ...valid, email },
      `email ${JSON.stringify(email.slice(0, 40))}`,
    );
  }
});

test("every name edge case gets the same verdict, data and messages", () => {
  for (const name of names) {
    assertSame({ ...valid, name }, `name ${JSON.stringify(name.slice(0, 40))}`);
  }
});

test("every message edge case gets the same verdict, data and messages", () => {
  for (const message of messages) {
    assertSame(
      { ...valid, message },
      `message ${JSON.stringify(message.slice(0, 40))}`,
    );
  }
});

test("the honeypot defaults to empty and rejects long values in both", () => {
  for (const website of websites) {
    assertSame(
      { ...valid, website },
      `website ${String(website).slice(0, 20)}`,
    );
  }
  assert.equal(
    (current(valid) as { data: { website: string } }).data.website,
    "",
  );
  assert.equal(current({ ...valid, website: "x".repeat(201) }).ok, false);
});

test("fields are trimmed and unknown keys are dropped, as before", () => {
  const input = {
    name: "  Ada  ",
    email: "  ada@example.com  ",
    message: "  I would like to talk about a project.  ",
    extra: "ignored",
  };
  assert.deepEqual(current(input), previous(input));
  assert.deepEqual(current(input), {
    ok: true,
    data: {
      name: "Ada",
      email: "ada@example.com",
      message: "I would like to talk about a project.",
      website: "",
    },
  });
});

test("several problems at once report the same messages in the same order", () => {
  for (const input of [
    { name: "A", email: "nope", message: "short" },
    { name: " ", email: "x".repeat(300), message: " " },
    { name: "x".repeat(101), email: "", message: "x".repeat(5001) },
  ]) {
    assertSame(input, JSON.stringify(input).slice(0, 60));
  }
});

test("missing or wrongly typed values fail on the same fields", () => {
  const fieldsOf = (outcome: Outcome) =>
    outcome.ok ? null : Object.keys(outcome.fieldErrors).sort();
  for (const input of [
    {},
    { name: 5, email: true, message: ["a"] },
    { name: null, email: undefined, message: {} },
    { ...valid, website: 7 },
    { ...valid, name: undefined },
  ]) {
    assert.deepEqual(
      fieldsOf(current(input)),
      fieldsOf(previous(input)),
      JSON.stringify(input),
    );
  }
  // Whole-input mistakes are rejected by both, with nothing to show per field.
  for (const input of [undefined, null, "text", 12, []]) {
    assert.equal(current(input).ok, false);
    assert.equal(previous(input).ok, false);
  }
});
