import Link from "next/link";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { SignpostHero } from "@/components/SignpostHero";
import { getProjectCollection } from "@/lib/projects";
import { siteCopy } from "@/data/site-copy";
import { ButtonLink } from "@/components/ui/Button";
import { WorkExplorer } from "@/components/WorkExplorer";
import { getPosts } from "@/lib/photos";
import { toFolders } from "@/lib/photo-posts";
import { getWritings } from "@/lib/writing";

export const revalidate = 3600;

export default async function HomePage() {
  const [{ projects, sample }, writings, posts] = await Promise.all([
    getProjectCollection(),
    getWritings(),
    getPosts(),
  ]);
  const folders = toFolders(posts);
  // Only what the window shows goes to the browser, not the full text.
  const pieces = writings.map(({ slug, title, date, type }) => ({
    slug,
    title,
    date,
    type,
  }));
  // The last card of the page, under the photo and writing window.
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
      <SignpostHero projects={projects} sample={sample} />
      {/* In the 3D view this window rises over the foot of the pole (CSS:
          .hero:not(.hero-list) + .photo-scene), so the signpost hides behind it. */}
      <WorkExplorer folders={folders} pieces={pieces} />
      <div className="work-context">{context}</div>
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
