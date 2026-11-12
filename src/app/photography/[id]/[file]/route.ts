import { getContent, getContentSource } from "@/lib/content";
import { isPostId } from "@/lib/photo-posts";

// Serves one photo of the content repository from this site's own address, so
// the browser only ever talks to this site and the repository stays private.
// Only files the loaded posts list can be asked for; anything else is a 404
// without a request to the repository. Vercel's CDN keeps the answer, so the
// repository is read once per photo, not once per visitor.
const FILE = /^((?:cover|[1-9]\d{0,2})(?:-s)?)\.webp$/;
const FOREVER = "public, max-age=31536000, s-maxage=31536000, immutable";
const SHORT = "public, max-age=300, s-maxage=300";

function isWebp(bytes: Uint8Array) {
  const at = (offset: number, text: string) =>
    [...text].every((char, i) => bytes[offset + i] === char.charCodeAt(0));
  return bytes.length > 12 && at(0, "RIFF") && at(8, "WEBP");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; file: string }> },
) {
  const { id, file } = await params;
  const name = FILE.exec(file)?.[1];
  if (!name || !isPostId(id)) return new Response(null, { status: 404 });
  const { posts } = await getContent();
  const sha = posts.find((post) => post.id === id)?.versions[name];
  const source = getContentSource();
  if (!sha || !source) return new Response(null, { status: 404 });
  // Only the address that names this exact file is served. Any other `v` (or
  // none) is sent to it without touching the store, so a made-up query string
  // cannot make the site read the repository.
  const version = sha.slice(0, 12);
  if (new URL(request.url).searchParams.get("v") !== version) {
    return new Response(null, {
      status: 308,
      headers: {
        Location: `/photography/${id}/${name}.webp?v=${version}`,
        "Cache-Control": SHORT,
      },
    });
  }
  try {
    const bytes = await source.readBytes(sha);
    if (!isWebp(bytes)) return new Response(null, { status: 404 });
    return new Response(bytes as BodyInit, {
      headers: { "Content-Type": "image/webp", "Cache-Control": FOREVER },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
