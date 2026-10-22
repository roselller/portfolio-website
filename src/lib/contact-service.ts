import { flattenError } from "zod/mini";
import { contactSchema, type ContactResult } from "./validations";

// Returned by the rate limiter when the whole site (not just this visitor) has
// used up its daily allowance. Lives here so tests can import it under tsx.
export const SITE_LIMIT_REASON = "site-limit";

type ContactMessage = { name: string; email: string; message: string };

type ContactDependencies = {
  available: boolean;
  rateLimit: () => Promise<{ success: boolean; reason?: string }>;
  save: (message: ContactMessage) => Promise<void>;
  // Sends the owner a heads-up. Runs only after the message is safely saved.
  notify: (message: ContactMessage) => Promise<void>;
};

export async function processContact(
  input: unknown,
  dependencies: ContactDependencies,
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: flattenError(parsed.error).fieldErrors,
    };
  if (parsed.data.website) return { ok: true };
  if (!dependencies.available)
    return {
      ok: false,
      message:
        "The contact form is currently unavailable. Please try again later.",
    };
  try {
    const limit = await dependencies.rateLimit();
    if (limit.reason === "timeout")
      return {
        ok: false,
        message:
          "The contact form is taking a moment. Please try again shortly.",
      };
    if (limit.reason === SITE_LIMIT_REASON)
      return {
        ok: false,
        message:
          "The contact form has reached its limit for today. Please try again tomorrow.",
      };
    if (!limit.success)
      return {
        ok: false,
        message:
          "You’ve sent a few messages recently. Please try again in 10 minutes.",
      };
    const { name, email, message } = parsed.data;
    await dependencies.save({ name, email, message });
    try {
      await dependencies.notify({ name, email, message });
    } catch {
      // The message is already stored, so a failed email must not look like a
      // failed submission. Nothing personal is logged.
      console.error("The contact notification could not be sent.");
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Your message couldn’t be saved. Please try again in a moment.",
    };
  }
}
