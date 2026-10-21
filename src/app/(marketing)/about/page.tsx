import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { NeumorphicCard } from "@/components/ui/NeumorphicCard";
import { profile } from "@/data/profile";
import { formatMonth, sortedJourney } from "@/data/journey";
import { skillGroups } from "@/data/skills";

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
            I’m {profile.name}, a Singapore-based developer and designer who
            likes asking “what if?” and then building something to find out. I’m
            studying Information Systems at Singapore Management University,
            combining computer science with business management. I’m most drawn
            to analysis, automation, and the kind of tools that make everyday
            work quietly simpler.
          </p>
          <p className="page-lead">
            Away from the desk, I build on the side: an on-device translator for
            macOS, a city-building game in Python, machine learning experiments,
            and this site. I also take photographs, and I studied Korean as a
            minor.
          </p>
        </div>
        <NeumorphicCard className="about-note">
          <div className="note-mark" aria-hidden="true">
            “
          </div>
          <p className="note-original" lang="zh-Hans">
            千里之行，
            <br />
            始于足下
          </p>
          <p className="note-translation">
            A journey of a thousand li begins with a single step.
          </p>
          <span>A FEW WORDS I BUILD BY</span>
          <figure className="about-polaroid">
            <Image
              src={profile.portrait.src}
              alt={profile.portrait.alt}
              width={profile.portrait.width}
              height={profile.portrait.height}
              sizes="150px"
            />
          </figure>
        </NeumorphicCard>
      </div>
      <div className="about-sections">
        <section>
          <h2 className="section-label">01 / THE TOOLBOX</h2>
          {skillGroups.map((group) => (
            <div className="skill-group" key={group.title}>
              <h3>{group.title}</h3>
              <div className="tag-list">
                {group.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </section>
        <section>
          <h2 className="section-label">02 / AN ONGOING JOURNEY</h2>
          <ol className="timeline">
            {sortedJourney().map((entry) => (
              <li className="timeline-item" key={entry.name}>
                <p className="timeline-date">
                  <time dateTime={entry.start}>{formatMonth(entry.start)}</time>
                  {"\u00a0–"}
                  <br />
                  <time dateTime={entry.end}>{formatMonth(entry.end)}</time>
                </p>
                <div className="timeline-body">
                  <h3>
                    <Image
                      src={entry.logo}
                      alt=""
                      width={32}
                      height={32}
                      className="timeline-logo"
                    />
                    {entry.name}
                  </h3>
                  <p className="timeline-role">{entry.role}</p>
                  {entry.details && <p>{entry.details}</p>}
                  {entry.highlights && (
                    <ul>
                      {entry.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {entry.groups?.map((group) => (
                    <div className="timeline-group" key={group.title}>
                      <h4>{group.title}</h4>
                      <ul>
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="intro-section neu-card about-cta">
        <div className="intro-side">
          <Asterisk size={32} strokeWidth={1.25} aria-hidden="true" />
          <span className="eyebrow">WHAT COMES NEXT</span>
        </div>
        <div className="intro-copy">
          <h2>Let’s see where an idea takes us.</h2>
          <div className="intro-actions">
            <ButtonLink href="/contact">
              Start a conversation <ArrowUpRight size={17} />
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
