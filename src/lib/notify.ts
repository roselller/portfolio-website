import "server-only";
import { Resend } from "resend";

type ContactMessage = { name: string; email: string; message: string };

const SEND_TIMEOUT_MS = 8000;
let client: Resend | undefined;

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out.")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Emails the site owner a copy of a contact message that was already saved. */
export async function sendContactNotification({
  name,
  email,
  message,
}: ContactMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) throw new Error("Notifications are not configured.");
  client ??= new Resend(apiKey);

  // Resend returns failures as `{ error }` rather than throwing.
  const { error } = await withTimeout(
    client.emails.send({
      from:
        process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `New portfolio message from ${name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
    SEND_TIMEOUT_MS,
  );
  if (error) throw new Error("The notification email was rejected.");
}
