import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { isContactConfigured } from "@/lib/rate-limit";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: "Contact",
  description: `Have something in mind? Start a conversation with ${profile.name}.`,
};
export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <main id="main" className="page-shell">
      <div className="contact-layout">
        <div>
          <p className="eyebrow">
            <span className="accent-line" /> A CONVERSATION STARTS HERE
          </p>
          <h1 className="page-heading">
            Have something
            <br />
            <em>in mind?</em>
          </h1>
          <p className="page-lead">
            An idea that needs a little direction. A project that could use a
            fresh perspective. Or a simple hello. I’d love to hear it.
          </p>
          {profile.email && (
            <div className="contact-aside">
              Prefer email?
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </div>
          )}
          <p className="contact-aside">
            Good things often start
            <br />
            with a conversation.
          </p>
        </div>
        <ContactForm configured={isContactConfigured()} />
      </div>
    </main>
  );
}
