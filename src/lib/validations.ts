// zod/mini on purpose: the regular "zod" import bundles every message
// translation and the chained API, about 20 KB gzipped more on the contact
// page. The rules and the messages the form shows are the same; the test in
// tests/validations.test.ts holds them to the previous schema.
import {
  _default,
  maxLength,
  minLength,
  object,
  optional,
  regex,
  regexes,
  string,
  trim,
  type input,
} from "zod/mini";

export const contactSchema = object({
  name: string().check(
    trim(),
    minLength(2, "Please enter at least 2 characters."),
    maxLength(100, "Please keep your name under 100 characters."),
  ),
  email: string().check(
    trim(),
    maxLength(254, "Please enter a shorter email address."),
    regex(regexes.email, "Please enter a valid email address."),
  ),
  message: string().check(
    trim(),
    minLength(10, "A little more detail, please — at least 10 characters."),
    maxLength(5000, "Please keep your message under 5,000 characters."),
  ),
  // Honeypot: real visitors never see it, so a long value is a bot. The text
  // is never shown.
  website: _default(
    optional(string().check(maxLength(200, "Invalid value."))),
    "",
  ),
});

export type ContactInput = input<typeof contactSchema>;
export type ContactResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof ContactInput, string[]>>;
    };
