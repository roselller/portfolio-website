import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpLeft, ArrowUpRight, Asterisk } from "lucide-react";
import { getProjectBySlug, getProjectReadme } from "@/lib/projects";
import { ProjectCoverTitle } from "@/components/ProjectCoverTitle";
import { ProjectReadme } from "@/components/ProjectReadme";
import { safeExternalUrl } from "@/lib/utils";
import { projectImageUrl } from "@/lib/images";
import { profile } from "@/data/profile";

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { project } = await getProjectBySlug(slug);
  const title = project?.title || "Project not found";
  return {
    title,
    description: project?.shortDescription,
    // Replaces the layout's openGraph object as a whole, so repeat siteName.
    openGraph: {
      type: "website",
      siteName: profile.name,
      title: `${title} — ${profile.name}`,
      description: project?.shortDescription,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const { project, projects, sample } = await getProjectBySlug(slug);
  if (!project) notFound();
  const position = projects.findIndex((item) => item.slug === slug);
  const previous =
    projects.length > 1
      ? projects[(position - 1 + projects.length) % projects.length]
      : null;
  const next =
    projects.length > 1 ? projects[(position + 1) % projects.length] : null;
  const projectUrl = safeExternalUrl(project.projectUrl);
  const repoUrl = safeExternalUrl(project.repoUrl);
  const thumbnail = projectImageUrl(project.thumbnailUrl);
  const readme = !sample && repoUrl ? await getProjectReadme(repoUrl) : null;
  return (
    <main id="main" className="page-shell">
      <Link href="/" className="project-back">
        <ArrowLeft size={15} /> Back to all work
      </Link>
      <div className="project-heading-row">
        <div>
          <p className="eyebrow">
            <span className="accent-line" />{" "}
            {String(position + 1).padStart(2, "0")} /{" "}
            {sample ? "CONCEPT PROJECT" : "SELECTED WORK"}
          </p>
          <h1 className="page-heading">{project.title}</h1>
          <p className="page-lead">{project.shortDescription}</p>
        </div>
        <div className="tag-list">
          {project.techStack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </div>
      <div className="project-visual">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={`${project.title} project preview`}
            fill
            sizes="(max-width: 600px) 89vw, 84vw"
            preload
          />
        ) : (
          <>
            <Asterisk
              className="project-visual-symbol"
              size={36}
              strokeWidth={1}
            />
            <ProjectCoverTitle title={project.title} />
            <span className="project-visual-caption">
              {sample ? "A CONCEPT EXPLORATION" : "DESIGN & DEVELOPMENT"}
            </span>
            <span className="project-visual-number">
              {String(position + 1).padStart(2, "0")} /{" "}
              {String(projects.length).padStart(2, "0")}
            </span>
          </>
        )}
      </div>
      <section className="project-story">
        <div className="project-brief-heading">
          <h2>{sample ? "The story" : "Project brief"}</h2>
          {(projectUrl || repoUrl) && (
            <div className="project-links">
              {repoUrl && (
                <a
                  className="button button-solid"
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View repository <ArrowUpRight size={17} />
                </a>
              )}
              {projectUrl && projectUrl !== repoUrl && (
                <a
                  className={`button ${repoUrl ? "button-outline" : "button-solid"}`}
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View live project <ArrowUpRight size={17} />
                </a>
              )}
            </div>
          )}
        </div>
        <div>
          {readme && repoUrl ? (
            <ProjectReadme html={readme} repositoryUrl={repoUrl} />
          ) : (
            project.description
              .split("\n\n")
              .map((paragraph, i) => <p key={i}>{paragraph}</p>)
          )}
          {sample && (
            <aside className="concept-note">
              This is a sample concept, included as editable portfolio content.
            </aside>
          )}
        </div>
      </section>
      {previous && next && (
        <nav className="project-directions" aria-label="Project navigation">
          <Link
            href={`/projects/${previous.slug}`}
            className="project-direction previous-project"
          >
            <ArrowUpLeft size={42} strokeWidth={1} />
            <div>
              <span className="section-label">PREVIOUS DIRECTION</span>
              <h2>{previous.title}</h2>
            </div>
          </Link>
          <Link
            href={`/projects/${next.slug}`}
            className="project-direction next-project"
          >
            <div>
              <span className="section-label">NEXT DIRECTION</span>
              <h2>{next.title}</h2>
            </div>
            <ArrowUpRight size={42} strokeWidth={1} />
          </Link>
        </nav>
      )}
    </main>
  );
}
