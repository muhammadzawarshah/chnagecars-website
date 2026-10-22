// The public marketplace is deployed separately. Set the URL at frontend build time.
export function websiteUrl(path: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return site ? `${site}/${path.replace(/^\/+/, "")}` : "";
}

// Website images are stored as paths on the website (e.g. /images/specials/x.jpg); previews here load them from it.
export function websiteImage(src: string) {
  return src.startsWith("/") && !src.startsWith("//") ? websiteUrl(src) || src : src;
}
