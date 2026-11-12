import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpLeft,
  ArrowUpRight,
  Asterisk,
  MapPin,
} from "lucide-react";
import { ProjectCoverTitle } from "@/components/ProjectCoverTitle";
import { getLocalPosts } from "@/lib/photos";
import { postImages } from "@/lib/photo-posts";
import { profile } from "@/data/profile";

// Every post is a folder of files in the repository, so each page is built once.
export const dynamicParams = false;
type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return getLocalPosts().map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = getLocalPosts().find((item) => item.id === id);
  const title = post?.title || "Photos not found";
  const description = post?.alt || undefined;
  return {
    title,
    description,
    // Replaces the layout's openGraph object as a whole, so repeat siteName.
    openGraph: {
      type: "website",
      siteName: profile.name,
      title: `${title} — ${profile.name}`,
      description,
    },
  };
}

export default async function PhotoPostPage({ params }: Props) {
  const { id } = await params;
  const posts = getLocalPosts();
  const position = posts.findIndex((item) => item.id === id);
  const post = posts[position];
  if (!post) notFound();
  const images = postImages(post);
  // Posts are listed latest first, so "next" is the later post.
  const later =
    posts.length > 1
      ? posts[(position - 1 + posts.length) % posts.length]
      : null;
  const earlier =
    posts.length > 1 ? posts[(position + 1) % posts.length] : null;
  return (
    <main id="main" className="page-shell photo-post-page">
      <Link href="/#photos" className="project-back">
        <ArrowLeft size={15} aria-hidden="true" /> Back to all work
      </Link>
      <div className="project-heading-row">
        <p className="eyebrow">
          <span className="accent-line" aria-hidden="true" />{" "}
          {post.id.padStart(2, "0")} / PHOTOGRAPHY
        </p>
      </div>
      <div className="project-visual">
        <Asterisk
          className="project-visual-symbol"
          size={36}
          strokeWidth={1}
          aria-hidden="true"
        />
        <ProjectCoverTitle title={post.title} />
        <span className="project-visual-caption">{post.folder}</span>
        <span className="project-visual-number">
          {String(images.length).padStart(2, "0")}{" "}
          {images.length === 1 ? "PHOTO" : "PHOTOS"}
        </span>
      </div>
      {(post.location || post.hashtags.length > 0) && (
        <div className="project-summary">
          {post.location && (
            <p className="photo-post-location">
              <MapPin size={16} aria-hidden="true" />
              <span className="sr-only">Location: </span>
              {post.location}
            </p>
          )}
          {post.hashtags.length > 0 && (
            <div className="tag-list">
              {post.hashtags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <ol className="photo-post-gallery">
        {images.map((image, index) => (
          <li key={image.src}>
            {/* Plain images: the files are already sized and compressed by
                scripts/add-photos.mjs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
            />
          </li>
        ))}
      </ol>
      {earlier && later && (
        <nav
          className="project-directions neu-card"
          aria-label="Photo post navigation"
        >
          <Link
            href={`/photos/${earlier.id}`}
            className="project-direction previous-project"
          >
            <ArrowUpLeft size={42} strokeWidth={1} aria-hidden="true" />
            <div>
              <span className="section-label">EARLIER POST</span>
              <h2>{earlier.folder}</h2>
            </div>
          </Link>
          <Link
            href={`/photos/${later.id}`}
            className="project-direction next-project"
          >
            <div>
              <span className="section-label">LATER POST</span>
              <h2>{later.folder}</h2>
            </div>
            <ArrowUpRight size={42} strokeWidth={1} aria-hidden="true" />
          </Link>
        </nav>
      )}
    </main>
  );
}
