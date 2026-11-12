import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { SafeHtml, writingUrl } from "@/components/ProjectReadme";
import { ButtonAnchor } from "@/components/ui/Button";
import { getWritingBySlug, getWritings, writingHtml } from "@/lib/writing";
import { formatWritingDate } from "@/lib/writing-file";
import { profile } from "@/data/profile";
import { workPath } from "@/lib/work-path";

// Every piece is a file in the repository, so each page is built once.
export const dynamicParams = false;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getWritings()).map(({ slug }) => ({ slug }));
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
      <article className="writing-article">
        <header className="writing-header">
          <p className="eyebrow work-path">
            <span className="accent-line" aria-hidden="true" />{" "}
            {workPath("writing", position + 1, writing.slug)}
          </p>
          <h1 className="page-heading writing-title">{writing.title}</h1>
          <p className="writing-meta">
            {writing.type} · {profile.name}
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
        <div className="writing-paper">
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
          {writing.pdf && (
            <p className="writing-pdf">
              <ButtonAnchor
                href={`/writing/${writing.pdf}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the PDF <ArrowUpRight size={17} aria-hidden="true" />
              </ButtonAnchor>
            </p>
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
