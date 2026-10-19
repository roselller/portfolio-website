"use server";

import { headers } from "next/headers";
import { getDatabase } from "@/db";
import { messages } from "@/db/schema";
import { checkContactLimits, isContactConfigured } from "@/lib/rate-limit";
import { processContact } from "@/lib/contact-service";
import { sendContactNotification } from "@/lib/notify";
import type { ContactResult } from "@/lib/validations";

export async function submitContact(input: unknown): Promise<ContactResult> {
  const requestHeaders = await headers();
  return processContact(input, {
    available: isContactConfigured(),
    rateLimit: () => checkContactLimits(requestHeaders),
    save: async (values) => {
      const database = getDatabase();
      if (!database) throw new Error("Contact is unavailable.");
      await database.insert(messages).values(values);
    },
    notify: sendContactNotification,
  });
}
