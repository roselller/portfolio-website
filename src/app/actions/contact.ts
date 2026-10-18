"use server";

import { headers } from "next/headers";
import { getDatabase } from "@/db";
import { messages } from "@/db/schema";
import {
  getContactLimiter,
  getRateLimitKey,
  isContactConfigured,
} from "@/lib/rate-limit";
import { processContact } from "@/lib/contact-service";
import { sendContactNotification } from "@/lib/notify";
import type { ContactResult } from "@/lib/validations";

export async function submitContact(input: unknown): Promise<ContactResult> {
  const requestHeaders = await headers();
  return processContact(input, {
    available: isContactConfigured(),
    rateLimit: async () => {
      const limiter = getContactLimiter();
      if (!limiter) throw new Error("Contact is unavailable.");
      const result = await limiter.limit(getRateLimitKey(requestHeaders));
      await result.pending;
      return result;
    },
    save: async (values) => {
      const database = getDatabase();
      if (!database) throw new Error("Contact is unavailable.");
      await database.insert(messages).values(values);
    },
    notify: sendContactNotification,
  });
}
