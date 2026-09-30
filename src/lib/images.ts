export function projectImageUrl(value: string | null) {
  if (!value) return null;
  if (value.startsWith("/images/") && !value.includes("..")) return value;
  try {
    const url = new URL(value);
    const allowedHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || "")
      .split(",")
      .map((host) => host.trim())
      .filter(Boolean);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      allowedHosts.includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
