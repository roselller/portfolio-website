import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";

export function ProjectGrid({
  projects,
  sample = true,
}: {
  projects: Project[];
  sample?: boolean;
}) {
  return (
    <div className="project-grid">
      {projects.map((project, index) => (
        <Link
          className="project-card neu-card"
          href={`/projects/${project.slug}`}
          key={project.slug}
        >
          <span className="project-card-number">
            {String(index + 1).padStart(2, "0")} /{" "}
            {(project.isSample ?? sample) ? "CONCEPT" : "PROJECT"}
          </span>
          <div className="project-card-title">
            <h3>{project.title}</h3>
            <ArrowUpRight size={24} />
          </div>
          <p>{project.shortDescription}</p>
          <div className="tag-list">
            {project.techStack.slice(0, 2).map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
