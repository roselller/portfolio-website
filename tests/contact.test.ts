import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { processContact, SITE_LIMIT_REASON } from "../src/lib/contact-service";

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
    failNotify?: boolean;
  } = {},
) {
  const saved: unknown[] = [];
  const notified: unknown[] = [];
  const order: string[] = [];
  let checks = 0;
  return {
    saved,
    notified,
    order,
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
        order.push("save");
        saved.push(message);
      },
      notify: async (message: unknown) => {
        order.push("notify");
        if (options.failNotify) throw new Error("Resend failed");
        notified.push(message);
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
    assert.equal(context.notified.length, 0);
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
  assert.equal(context.notified.length, 0);
});

test("unconfigured services cannot report a genuine message as saved", async () => {
  const context = setup({ available: false });
  assert.equal((await processContact(valid, context.dependencies)).ok, false);
  assert.equal(context.checks, 0);
  assert.equal(context.saved.length, 0);
  assert.equal(context.notified.length, 0);
});

test("rate limits, Redis failures, and fail-open timeout responses cannot cause writes", async () => {
  for (const options of [
    { allowed: false },
    { allowed: false, reason: SITE_LIMIT_REASON },
    { reason: "timeout" },
    { failLimit: true },
  ]) {
    const context = setup(options);
    assert.equal((await processContact(valid, context.dependencies)).ok, false);
    assert.equal(context.saved.length, 0);
    assert.equal(context.notified.length, 0);
  }
});

test("a full site-wide daily limit says so, and differs from the per-visitor message", async () => {
  const site = await processContact(
    valid,
    setup({ allowed: false, reason: SITE_LIMIT_REASON }).dependencies,
  );
  const visitor = await processContact(
    valid,
    setup({ allowed: false }).dependencies,
  );
  assert.equal(site.ok, false);
  assert.equal(visitor.ok, false);
  if (site.ok || visitor.ok) return;
  assert.match(site.message, /tomorrow/);
  assert.match(visitor.message, /10 minutes/);
  assert.notEqual(site.message, visitor.message);
});

test("database failures return a safe error without exposing infrastructure details", async () => {
  const context = setup({ failSave: true });
  const result = await processContact(valid, context.dependencies);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(result).includes("Database failed"), false);
  assert.equal(context.saved.length, 0);
  assert.equal(context.notified.length, 0, "no email for an unsaved message");
});

test("the owner is notified once, after the message is saved", async () => {
  const context = setup();
  assert.deepEqual(await processContact(valid, context.dependencies), {
    ok: true,
  });
  assert.deepEqual(context.order, ["save", "notify"]);
  assert.deepEqual(context.notified, context.saved);
});

test("a failed notification still reports success because the message is stored", async () => {
  const errors = mock.method(console, "error", () => {});
  try {
    const context = setup({ failNotify: true });
    const result = await processContact(valid, context.dependencies);
    assert.deepEqual(result, { ok: true });
    assert.equal(context.saved.length, 1);
    // The log line must not carry the visitor's details or the provider error.
    const logged = JSON.stringify(
      errors.mock.calls.map((call) => call.arguments),
    );
    assert.equal(errors.mock.callCount(), 1);
    assert.equal(logged.includes("alex@example.com"), false);
    assert.equal(logged.includes("Resend failed"), false);
  } finally {
    errors.mock.restore();
  }
});
