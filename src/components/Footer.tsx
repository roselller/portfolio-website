import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import { siteCopy } from "@/data/site-copy";
import { CurrentYear } from "./CurrentYear";

export function Footer() {
  return (
    <footer className="site-footer">
      <Link href="/" className="footer-name">
        {profile.name}
        <span>{siteCopy.footer.tagline}</span>
      </Link>
      <div className="footer-links">
        {siteCopy.footer.links.map(({ href, label }) => (
          <Link key={href} href={href}>
            {label} <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        ))}
      </div>
      <p>
        © <CurrentYear buildYear={new Date().getFullYear()} />{" "}
        <span>{siteCopy.footer.status}</span>
      </p>
    </footer>
  );
}
