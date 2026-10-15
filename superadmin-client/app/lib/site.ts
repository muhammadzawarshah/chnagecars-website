// The public marketplace is deployed separately. Set the URL at frontend build time.
export function websiteUrl(path: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  return site ? `${site}/${path.replace(/^\/+/, "")}` : "";
}
