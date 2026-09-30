import { contactSchema, type ContactResult } from "./validations";

type ContactDependencies = {
  available: boolean;
  rateLimit: () => Promise<{ success: boolean; reason?: string }>;
  save: (message: {
    name: string;
    email: string;
    message: string;
  }) => Promise<void>;
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
      fieldErrors: parsed.error.flatten().fieldErrors,
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
    if (!limit.success)
      return {
        ok: false,
        message:
          "You’ve sent a few messages recently. Please try again in 10 minutes.",
      };
    const { name, email, message } = parsed.data;
    await dependencies.save({ name, email, message });
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Your message couldn’t be saved. Please try again in a moment.",
    };
  }
}
