"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { submitContact } from "@/app/actions/contact";
import {
  contactSchema,
  type ContactInput,
  type ContactResult,
} from "@/lib/validations";
import { NeumorphicButton } from "./ui/NeumorphicButton";
import type { z } from "zod";

export function ContactForm({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ContactResult | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ContactInput, unknown, z.output<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "", website: "" },
  });

  useEffect(() => {
    if (result?.ok) successHeading.current?.focus();
  }, [result]);

  function onSubmit(values: z.output<typeof contactSchema>) {
    if (pending) return;
    setResult(null);
    startTransition(async () => {
      try {
        const response = await submitContact(values);
        setResult(response);
        if (!response.ok && response.fieldErrors) {
          for (const [field, messages] of Object.entries(
            response.fieldErrors,
          )) {
            if (messages?.[0])
              setError(field as keyof ContactInput, { message: messages[0] });
          }
        }
        if (response.ok) reset();
      } catch {
        setResult({
          ok: false,
          message:
            "The connection was interrupted. Please refresh the page and try again.",
        });
      }
    });
  }

  return (
    <div className="contact-form neu-card">
      <AnimatePresence mode="wait" initial={false}>
        {result?.ok ? (
          <m.div
            key="success"
            className="form-success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <Check size={34} strokeWidth={1.5} color="var(--accent-glow)" />
            <h2 ref={successHeading} tabIndex={-1}>
              Message received.
            </h2>
            <p>
              Thanks for sharing what you have in mind. I’m looking forward to
              reading it.
            </p>
            <NeumorphicButton onClick={() => setResult(null)}>
              Send another message <ArrowUpRight size={16} />
            </NeumorphicButton>
          </m.div>
        ) : (
          <m.form
            key="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-busy={pending}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <div className="form-field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                autoComplete="name"
                placeholder="What should I call you?"
                maxLength={100}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
              />
              {errors.name && (
                <span className="field-error" id="name-error">
                  {errors.name.message}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <span className="field-error" id="email-error">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="message">What’s on your mind?</label>
              <textarea
                id="message"
                placeholder="A project, an idea, or just a hello…"
                rows={5}
                maxLength={5000}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                {...register("message")}
              />
              {errors.message && (
                <span className="field-error" id="message-error">
                  {errors.message.message}
                </span>
              )}
            </div>
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="website">Leave this field empty</label>
              <input
                id="website"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
            </div>
            <AnimatePresence>
              {result && !result.ok && (
                <m.p
                  className="form-feedback"
                  role="alert"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.2 }}
                >
                  {result.message}
                </m.p>
              )}
            </AnimatePresence>
            <NeumorphicButton
              type="submit"
              className="form-submit"
              disabled={pending}
            >
              {pending ? (
                <>
                  Sending…{" "}
                  <LoaderCircle size={17} className="sending-spinner" />
                </>
              ) : (
                <>
                  Send message <ArrowUpRight size={17} />
                </>
              )}
            </NeumorphicButton>
            <p className="form-note" aria-live="polite">
              {!configured
                ? "This preview is not accepting messages yet."
                : "Your details are used only to respond to your message."}
            </p>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
