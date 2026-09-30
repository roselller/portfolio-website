import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NeumorphicCard } from "@/components/ui/NeumorphicCard";
import { profile } from "@/data/profile";

export const metadata: Metadata = {
  title: "About",
  description: `Meet ${profile.name}, a designer and developer at the intersection of thoughtful and unexpected.`,
};

export default function AboutPage() {
  return (
    <main id="main" className="page-shell">
      <div className="about-layout">
        <div>
          <p className="eyebrow">
            <span className="accent-line" /> THE PERSON BEHIND THE PIXELS
          </p>
          <h1 className="page-heading">
            Curious by nature.
            <br />
            <em>Considered by choice.</em>
          </h1>
          <p className="page-lead">
            I’m {profile.name}, a designer and developer who likes asking “what
            if?” — and then building something to find out.
          </p>
          <p className="page-lead">
            My practice brings design and development into the same
            conversation. From the first sketch to the last interaction, I look
            for the detail that makes an experience feel clear, useful, and a
            little more human.
          </p>
        </div>
        <NeumorphicCard className="about-note">
          <div className="note-mark" aria-hidden="true">
            “
          </div>
          <p>
            Make it work beautifully.
            <br />
            Make it feel effortless.
            <br />
            Leave a little room
            <br />
            for surprise.
          </p>
          <span>A FEW WORDS TO BUILD BY</span>
        </NeumorphicCard>
      </div>
      <div className="about-sections">
        <section>
          <h2 className="section-label">01 / THE TOOLBOX</h2>
          <div className="skill-group">
            <h3>From an idea to an interface</h3>
            <div className="tag-list">
              {[
                "Interface design",
                "Design systems",
                "Prototyping",
                "Interaction design",
              ].map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
          <div className="skill-group">
            <h3>From an interface to an experience</h3>
            <div className="tag-list">
              {[
                "TypeScript",
                "React",
                "Next.js",
                "CSS",
                "Three.js",
                "PostgreSQL",
              ].map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>
        </section>
        <section>
          <h2 className="section-label">02 / AN ONGOING JOURNEY</h2>
          <div className="timeline">
            <div className="timeline-item">
              <span>THE STARTING POINT</span>
              <h3>Follow the curiosity.</h3>
              <p>
                Taking things apart, trying things out, and learning how the
                pieces fit together.
              </p>
            </div>
            <div className="timeline-item">
              <span>THE PRACTICE</span>
              <h3>Connect design and code.</h3>
              <p>
                Exploring how thoughtful interfaces become useful, accessible
                experiences.
              </p>
            </div>
            <div className="timeline-item">
              <span>THE NEXT CHAPTER</span>
              <h3>Keep making. Keep learning.</h3>
              <p>
                Looking for new perspectives, interesting problems, and people
                to build with.
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="page-cta">
        <h2>Let’s see where an idea takes us.</h2>
        <Link className="button button-solid" href="/contact">
          Start a conversation <ArrowUpRight size={17} />
        </Link>
      </div>
    </main>
  );
}
