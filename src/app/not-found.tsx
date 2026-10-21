import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <p className="eyebrow">404 / A SMALL DETOUR</p>
      <h1>A different direction.</h1>
      <p>
        This page isn’t here, but there’s plenty to explore back at the
        signpost.
      </p>
      <ButtonLink href="/">
        Back to the work <ArrowUpRight size={17} />
      </ButtonLink>
    </main>
  );
}
