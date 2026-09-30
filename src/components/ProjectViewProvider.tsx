"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const ProjectViewContext = createContext<{
  grid: boolean;
  reduced: boolean;
  setList: (list: boolean) => void;
} | null>(null);

export function ProjectViewProvider({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
  const [list, setList] = useState(false);
  return (
    <ProjectViewContext.Provider
      value={{ grid: reduced || list, reduced, setList }}
    >
      {children}
    </ProjectViewContext.Provider>
  );
}
export function useProjectView() {
  const view = useContext(ProjectViewContext);
  if (!view) throw new Error("Project view requires ProjectViewProvider");
  return view;
}
