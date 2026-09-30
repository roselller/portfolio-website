// Shared identity and public-facing site metadata.
export const profile = {
  name: "Roseller Armirola",
  firstName: "Roseller",
  initials: "ra",
  role: "Designer & developer",
  description:
    "I turn curiosity into considered digital experiences. A balance of thoughtful design, thoughtful code, and a little unexpected.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  github: "",
  linkedin: "",
};
