"use client";

import { useCallback, useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { submitContact } from "@/app/actions/contact";
import {
  clearDraft,
  getDraftStorage,
  loadDraft,
  saveDraft,
} from "@/lib/contact-draft";
import {
  contactSchema,
  type ContactInput,
  type ContactResult,
} from "@/lib/validations";
import { Button } from "./ui/Button";
import type { z } from "zod";

// How long the send button shows green (sent) or red (not sent) before the
// thank-you panel appears or the button returns to normal.
const SUCCESS_MS = 1400;
const ERROR_MS = 1600;

type SendFeedback = "success" | "error" | null;

function DrawnCheck() {
  return (
    <svg
      className="draw-icon"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12.5l5.5 5.5L20 6.5" pathLength="1" />
    </svg>
  );
}

function DrawnCross() {
  return (
    <svg
      className="draw-icon"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" pathLength="1" />
      <path d="M18 6L6 18" pathLength="1" />
    </svg>
  );
}

export function ContactForm({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ContactResult | null>(null);
  const [feedback, setFeedback] = useState<SendFeedback>(null);
  const [sent, setSent] = useState(false);
  // The thank-you panel mounts after the form has faded out, so focus its
  // heading when it appears (a stable callback runs once, on mount).
  const focusOnMount = useCallback((element: HTMLHeadingElement | null) => {
    element?.focus();
  }, []);
  const reduced = useReducedMotion();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    subscribe,
    reset,
    formState: { errors },
  } = useForm<ContactInput, unknown, z.output<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "", website: "" },
  });

  // Keep an unsent draft in this tab (sessionStorage) so a refresh or a visit
  // to another page does not lose it. The page is prerendered with empty
  // fields, so the draft is restored after mount. Restore first, then start
  // saving, so the first save cannot overwrite the draft. setValue is used
  // (not reset) so the form's defaults stay empty for the resets below.
  useEffect(() => {
    const storage = getDraftStorage();
    const draft = loadDraft(storage);
    if (draft) {
      setValue("name", draft.name, { shouldDirty: true });
      setValue("email", draft.email, { shouldDirty: true });
      setValue("message", draft.message, { shouldDirty: true });
    }
    return subscribe({
      formState: { values: true },
      callback: ({ values }) => saveDraft(storage, values),
    });
  }, [setValue, subscribe]);

  // The button holds its green or red state for a moment, then moves on: to
  // the thank-you panel after a send, back to normal after a miss.
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(
      () => {
        setFeedback(null);
        if (feedback === "success") setSent(true);
      },
      feedback === "success" ? SUCCESS_MS : ERROR_MS,
    );
    return () => window.clearTimeout(timer);
  }, [feedback]);

  // A field was left empty or is not valid: the button shakes red too.
  function onInvalid() {
    if (pending || feedback) return;
    setFeedback("error");
  }

  function onSubmit(values: z.output<typeof contactSchema>) {
    if (pending || feedback) return;
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
        if (response.ok) {
          reset();
          clearDraft(getDraftStorage());
          setFeedback("success");
        } else {
          setFeedback("error");
        }
      } catch {
        setResult({
          ok: false,
          message:
            "The connection was interrupted. Please refresh the page and try again.",
        });
        setFeedback("error");
      }
    });
  }

  return (
    <div className="contact-form neu-card">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <m.div
            key="success"
            className="form-success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <Check size={34} strokeWidth={1.5} color="var(--accent-glow)" />
            <h2 ref={focusOnMount} tabIndex={-1}>
              Message received.
            </h2>
            <p>
              Thanks for sharing what you have in mind. I’m looking forward to
              reading it.
            </p>
            <Button
              onClick={() => {
                reset();
                clearDraft(getDraftStorage());
                setSent(false);
                setResult(null);
              }}
            >
              Send another message <ArrowUpRight size={16} />
            </Button>
          </m.div>
        ) : (
          <m.form
            key="form"
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            noValidate
            aria-busy={pending}
            // After a send the emptied form stays up while the button shows
            // green; nothing in it can be used until the thank-you panel.
            inert={feedback === "success"}
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
            <Button
              type="submit"
              className="form-submit"
              disabled={pending && !feedback}
              aria-disabled={feedback ? true : undefined}
              data-status={feedback ?? undefined}
            >
              {feedback === "success" ? (
                <>
                  Sent <DrawnCheck />
                </>
              ) : feedback === "error" ? (
                <>
                  Not sent <DrawnCross />
                </>
              ) : pending ? (
                <>
                  Sending…{" "}
                  <LoaderCircle size={17} className="sending-spinner" />
                </>
              ) : (
                <>
                  Send message <ArrowUpRight size={17} />
                </>
              )}
            </Button>
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
