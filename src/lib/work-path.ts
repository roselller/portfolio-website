// The path shown at the top of a Work sub-page, written like a folder on
// disk: ~/PROJECTS/01_portfolio-website/ or ~/PHOTOGRAPHY/17_18.05.26/.

/** A name as one path segment: spaces become hyphens, slashes are dropped. */
function segment(name: string) {
  return name
    .trim()
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, "-");
}

export function workPath(section: string, number: number, name: string) {
  const index = String(Math.max(0, Math.floor(number))).padStart(2, "0");
  return `~/${section.toUpperCase()}/${index}_${segment(name)}/`;
}

/** "[17] 18.05.26" -> "18.05.26": a post folder's name without its number. */
export function folderDate(folder: string) {
  return folder.replace(/^\s*\[\d+\]\s*/, "").trim() || folder.trim();
}
