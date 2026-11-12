import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { SafeHtml, writingUrl } from "@/components/ProjectReadme";
import { getWritingBySlug, writingHtml } from "@/lib/writing";
import { formatWritingDate } from "@/lib/writing-file";
import { profile } from "@/data/profile";
import { workPath } from "@/lib/work-path";

// Pieces come from the content repository: a page is built when first asked
// for and refreshed hourly, so a new piece needs no deploy.
export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

// Nothing is built ahead of time (the content store is not reachable while
// building); each page is built on its first visit and then cached.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { writing } = await getWritingBySlug(slug);
  const title = writing?.title || "Writing not found";
  const description = writing?.summary || undefined;
  return {
    title,
    description,
    // Replaces the layout's openGraph object as a whole, so repeat siteName.
    openGraph: {
      type: "article",
      siteName: profile.name,
      title: `${title} — ${profile.name}`,
      description,
    },
  };
}

export default async function WritingPage({ params }: Props) {
  const { slug } = await params;
  const { writing, writings } = await getWritingBySlug(slug);
  if (!writing) notFound();
  const position = writings.findIndex((item) => item.slug === slug);
  const previous =
    writings.length > 1
      ? writings[(position - 1 + writings.length) % writings.length]
      : null;
  const next =
    writings.length > 1 ? writings[(position + 1) % writings.length] : null;
  return (
    <main id="main" className="page-shell writing-page">
      <Link href="/#writing" className="project-back">
        <ArrowLeft size={15} aria-hidden="true" /> Back to all work
      </Link>
      <div className="project-heading-row">
        <p className="eyebrow work-path">
          <span className="accent-line" aria-hidden="true" />{" "}
          {workPath("writing", position + 1, writing.slug)}
        </p>
      </div>
      {/* The sheet holds the whole document, as the original file does: its
          title, its byline, then the text. All of it comes from the piece's
          file in content/writing/. */}
      <article className="writing-article">
        <div className="writing-paper">
          <header className="writing-header">
            <h1 className="writing-title">{writing.title}</h1>
            <p className="writing-meta">
              By {writing.author || profile.name}
              {" · "}
              {writing.type}
              {writing.date && (
                <>
                  {" · "}
                  <time dateTime={writing.date}>
                    {formatWritingDate(writing.date)}
                  </time>
                </>
              )}
            </p>
          </header>
          {writing.body ? (
            <SafeHtml
              html={writingHtml(writing.body)}
              className="project-readme writing-body"
              // The page title owns heading level one.
              headingShift={1}
              tableLabel="Table"
              resolveUrl={writingUrl}
            />
          ) : (
            writing.summary && <p className="page-lead">{writing.summary}</p>
          )}
        </div>
      </article>
      {previous && next && (
        <nav
          className="project-directions neu-card"
          aria-label="Writing navigation"
        >
          <Link
            href={`/writing/${previous.slug}`}
            className="project-direction previous-project"
          >
            <ArrowUpLeft size={42} strokeWidth={1} aria-hidden="true" />
            <div>
              <span className="section-label">PREVIOUS PIECE</span>
              <h2>{previous.title}</h2>
            </div>
          </Link>
          <Link
            href={`/writing/${next.slug}`}
            className="project-direction next-project"
          >
            <div>
              <span className="section-label">NEXT PIECE</span>
              <h2>{next.title}</h2>
            </div>
            <ArrowUpRight size={42} strokeWidth={1} aria-hidden="true" />
          </Link>
        </nav>
      )}
    </main>
  );
}
