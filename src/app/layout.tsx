import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { profile } from "@/data/profile";
import { ProjectViewProvider } from "@/components/ProjectViewProvider";
import { SiteBackground } from "@/components/SiteBackground";
import { GlassFilter } from "@/components/GlassFilter";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: `${profile.name} — Designer & Developer`,
    template: `%s — ${profile.name}`,
  },
  description: profile.description,
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.dataset.theme=localStorage.getItem("portfolio-theme")==="light"?"light":"dark"}catch(e){}})();`,
          }}
        />
        <link
          rel="preload"
          href="/fonts/Monocraft.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Miracode.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <noscript>
          <style>{".page-transition { opacity: 1 !important; }"}</style>
        </noscript>
        <SiteBackground />
        <GlassFilter />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <ProjectViewProvider>
            <Navbar />
            {children}
            <Footer />
          </ProjectViewProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
