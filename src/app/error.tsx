"use client";

import Link from "next/link";
import { NeumorphicButton } from "@/components/ui/NeumorphicButton";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main" className="not-found">
      <p className="eyebrow">A BRIEF PAUSE</p>
      <h1>Something took a detour.</h1>
      <p>The page couldn’t be loaded. Please try again in a moment.</p>
      <NeumorphicButton onClick={retry}>Try again</NeumorphicButton>
      <p style={{ marginTop: 25 }}>
        <Link href="/about">Meet the person behind the work</Link>
      </p>
    </main>
  );
}
