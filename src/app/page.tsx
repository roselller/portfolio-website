import Link from "next/link";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { SignpostHero } from "@/components/SignpostHero";
import { getProjectCollection } from "@/lib/projects";
import { siteCopy } from "@/data/site-copy";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoScene } from "@/components/PhotoScene";
import { WritingFolders } from "@/components/WritingFolders";
import { CardModeOnly } from "@/components/CardModeOnly";
import { getLocalPosts } from "@/lib/photos";
import { toFolders } from "@/lib/photo-posts";
import { getWritings } from "@/lib/writing";

export const revalidate = 3600;

export default async function HomePage() {
  const [{ projects, sample }, writings] = await Promise.all([
    getProjectCollection(),
    getWritings(),
  ]);
  const folders = toFolders(getLocalPosts());
  // Only what the folders show goes to the browser, not the full text.
  const pieces = writings.map(({ slug, title, date, type, summary }) => ({
    slug,
    title,
    date,
    type,
    summary,
  }));
  // Under the pole in the 3D view, at the end of the page in card mode.
  const context = (
    <section id="introduction" className="intro-section neu-card">
      <div className="intro-side">
        <Asterisk size={32} strokeWidth={1.25} aria-hidden="true" />
        <span className="eyebrow">{siteCopy.intro.eyebrow}</span>
      </div>
      <div className="intro-copy">
        <h2>
          {siteCopy.intro.heading}
          <span>{siteCopy.intro.emphasis}</span>
        </h2>
        <p>{siteCopy.intro.bio}</p>
        <div className="intro-actions">
          <ButtonLink href="/about">
            {siteCopy.intro.aboutCta}{" "}
            <ArrowUpRight size={17} aria-hidden="true" />
          </ButtonLink>
          <Link href="/contact" className="text-link">
            {siteCopy.intro.contactCta}{" "}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
  return (
    <main id="main">
      <SignpostHero projects={projects} sample={sample}>
        {context}
      </SignpostHero>
      <PhotoScene folders={folders} />
      <WritingFolders pieces={pieces} />
      <CardModeOnly className="work-context">{context}</CardModeOnly>
      <nav className="accessible-projects" aria-label="All projects">
        <h2>{siteCopy.hero.accessibleHeading}</h2>
        {projects.map((project) => (
          <Link key={project.slug} href={`/projects/${project.slug}`}>
            {project.title}
          </Link>
        ))}
      </nav>
    </main>
  );
}
