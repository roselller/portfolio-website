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
  // The photo print on the About quote card (4:5 portrait). To swap the photo:
  // put ONE resized, location-stripped JPEG or WebP in public/about/ (never an
  // original camera file: phone photos carry GPS), then change src, width and
  // height here to that file's pixels (keep 4:5) and write alt text for it.
  portrait: {
    src: "/about/portrait.jpg",
    alt: "Roseller smiling at the camera in a black cap, dark-framed glasses and a black zip jacket, with a hazy city skyline and blossoming trees behind",
    width: 600,
    height: 750,
  },
};
