export type Project = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  techStack: string[];
  thumbnailUrl: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  signOrder: number;
  isSample?: boolean;
};

// Fictional concept projects used for padding and full GitHub fallback.
export const sampleProjects: Project[] = [
  {
    id: "1",
    slug: "orbit",
    title: "Orbit",
    shortDescription: "A calmer place for your next big idea.",
    description:
      "Orbit is a sample concept for a focused project workspace. It explores how a clear hierarchy, a little breathing room, and intentional interactions can help a team move from an idea to its next step.\n\nThe concept brings tasks, notes, and milestones into one considered interface. This entry is starter content, ready to be replaced with a real project, its process, and its outcomes.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 0,
  },
  {
    id: "2",
    slug: "form-and-field",
    title: "Form & Field",
    shortDescription: "Everyday objects. Uncommon attention to detail.",
    description:
      "A sample storefront concept for useful, thoughtfully made objects. Form & Field explores editorial product storytelling, a restrained visual system, and a straightforward path from discovery to product detail.\n\nThis placeholder case study demonstrates how a commerce project could be presented. Replace it with your research, design decisions, final screens, and verified results.",
    techStack: ["React", "Tailwind CSS", "Motion"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 1,
  },
  {
    id: "3",
    slug: "echo",
    title: "Echo",
    shortDescription: "A small space for the sounds that stay with you.",
    description:
      "Echo is a sample listening experience exploring the relationship between sound and interface. The concept uses quiet visual feedback and spacious typography to make browsing a music collection feel personal.\n\nIt is a fictional project included to demonstrate this portfolio. Add your own challenge, approach, and implementation details here.",
    techStack: ["TypeScript", "Web Audio", "Framer Motion"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 2,
  },
  {
    id: "4",
    slug: "waypoint",
    title: "Waypoint",
    shortDescription: "Find the interesting way there.",
    description:
      "A sample travel planning concept built around curiosity. Waypoint explores a gentler way to collect places, plan a route, and keep useful information close at hand.\n\nThis is demonstration content. Replace it with a real story about the audience, constraints, choices, and lessons behind your work.",
    techStack: ["Next.js", "Maps", "Drizzle"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 3,
  },
  {
    id: "5",
    slug: "aura",
    title: "Aura",
    shortDescription: "Make room for a more mindful routine.",
    description:
      "Aura is a sample wellness concept centered on small, sustainable habits. It explores an inviting daily check-in, accessible progress visualization, and an interface that respects a person's attention.\n\nThe project is a placeholder, with no real usage or outcome claims. Replace this page with your own work and supporting evidence.",
    techStack: ["React", "TypeScript", "Tailwind CSS"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 4,
  },
  {
    id: "6",
    slug: "index",
    title: "Index",
    shortDescription: "A home for things worth keeping.",
    description:
      "A sample digital archive for ideas, references, and discoveries. Index explores how search, typography, and a well-structured collection can make saved information useful again.\n\nThis concept is included as editable starter content. Add real project screenshots and links when your case study is ready.",
    techStack: ["Next.js", "PostgreSQL", "Zod"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 5,
  },
  {
    id: "7",
    slug: "still",
    title: "Still",
    shortDescription: "A quieter corner of the internet.",
    description:
      "Still is a sample reading experience that puts the writing first. The concept explores comfortable line lengths, careful contrast, and a visual rhythm that works across devices.\n\nUse this starter page to tell the story of a real project, including the decisions that mattered and what you learned along the way.",
    techStack: ["Next.js", "MDX", "CSS"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 6,
  },
  {
    id: "8",
    slug: "playground",
    title: "Playground",
    shortDescription: "Experiments with no straight lines.",
    description:
      "A sample collection of small experiments in creative coding. Playground is a place for exploring 3D, motion, and unexpected interactions without needing every experiment to become a product.\n\nReplace this concept with your own sketches, prototypes, and technical explorations. Document what each experiment taught you.",
    techStack: ["Three.js", "React Three Fiber", "GSAP"],
    thumbnailUrl: null,
    projectUrl: null,
    repoUrl: null,
    signOrder: 7,
  },
];
