import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter at least 2 characters.")
    .max(100, "Please keep your name under 100 characters."),
  email: z
    .string()
    .trim()
    .max(254, "Please enter a shorter email address.")
    .email("Please enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "A little more detail, please — at least 10 characters.")
    .max(5000, "Please keep your message under 5,000 characters."),
  website: z.string().max(200).optional().default(""),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof ContactInput, string[]>>;
    };
