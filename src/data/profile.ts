// Shared identity and public-facing site metadata.
export const profile = {
  name: "Roseller Armirola",
  firstName: "Roseller",
  initials: "ra",
  role: "Designer & developer",
  description:
    "I turn curiosity into considered digital experiences. A balance of thoughtful design, thoughtful code, and a little unexpected.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  github: "https://github.com/roselller/",
  linkedin: "https://www.linkedin.com/in/roseller-armirola-iii/",
  // The photo print on the About quote card (4:5 portrait).
  // To swap in the real photo: put ONE resized, location-stripped JPEG or WebP
  // in public/about/ (never an original camera file), then change src, width
  // and height here to match that file's pixels (keep about 4:5), and write
  // real alt text describing the photo instead of the placeholder text.
  portrait: {
    src: "/about/portrait-placeholder.svg",
    alt: "Placeholder portrait, to be replaced with a photo",
    width: 400,
    height: 500,
  },
};
