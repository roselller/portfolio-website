import assert from "node:assert/strict";
import test from "node:test";
import { processContact } from "../src/lib/contact-service";

const valid = {
  name: "  Alex Example  ",
  email: "  alex@example.com  ",
  message: "  I would like to discuss a portfolio project.  ",
  website: "",
};

function setup(
  options: {
    available?: boolean;
    allowed?: boolean;
    reason?: string;
    failSave?: boolean;
    failLimit?: boolean;
  } = {},
) {
  const saved: unknown[] = [];
  let checks = 0;
  return {
    saved,
    get checks() {
      return checks;
    },
    dependencies: {
      available: options.available ?? true,
      rateLimit: async () => {
        checks++;
        if (options.failLimit) throw new Error("Redis failed");
        return { success: options.allowed ?? true, reason: options.reason };
      },
      save: async (message: unknown) => {
        if (options.failSave) throw new Error("Database failed");
        saved.push(message);
      },
    },
  };
}

test("accepts a valid message only after a rate check, and stores trimmed fields", async () => {
  const context = setup();
  assert.deepEqual(await processContact(valid, context.dependencies), {
    ok: true,
  });
  assert.equal(context.checks, 1);
  assert.deepEqual(context.saved, [
    {
      name: "Alex Example",
      email: "alex@example.com",
      message: "I would like to discuss a portfolio project.",
    },
  ]);
});

test("invalid, oversized, and malformed requests never reach external services", async () => {
  for (const payload of [
    null,
    {},
    { ...valid, email: "bad" },
    { ...valid, message: "x" },
    { ...valid, message: "x".repeat(5001) },
    { ...valid, name: " " },
  ]) {
    const context = setup();
    assert.equal(
      (await processContact(payload, context.dependencies)).ok,
      false,
    );
    assert.equal(context.checks, 0);
    assert.equal(context.saved.length, 0);
  }
});

test("honeypot submissions silently discard the message without external calls", async () => {
  const context = setup();
  assert.deepEqual(
    await processContact(
      { ...valid, website: "spam.example" },
      context.dependencies,
    ),
    { ok: true },
  );
  assert.equal(context.checks, 0);
  assert.equal(context.saved.length, 0);
});

test("unconfigured services cannot report a genuine message as saved", async () => {
  const context = setup({ available: false });
  assert.equal((await processContact(valid, context.dependencies)).ok, false);
  assert.equal(context.checks, 0);
  assert.equal(context.saved.length, 0);
});

test("rate limits, Redis failures, and fail-open timeout responses cannot cause writes", async () => {
  for (const options of [
    { allowed: false },
    { reason: "timeout" },
    { failLimit: true },
  ]) {
    const context = setup(options);
    assert.equal((await processContact(valid, context.dependencies)).ok, false);
    assert.equal(context.saved.length, 0);
  }
});

test("database failures return a safe error without exposing infrastructure details", async () => {
  const context = setup({ failSave: true });
  const result = await processContact(valid, context.dependencies);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes("Database failed"), false);
  assert.equal(context.saved.length, 0);
});
