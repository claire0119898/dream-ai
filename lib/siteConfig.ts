export const SITE_NAME = "잠결";

function resolveSiteUrl() {
  const configuredUrl = process.env.SITE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) return `https://${vercelProductionUrl.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL?.trim() ?? "";
export const DICTIONARY_UPDATED_AT = "2026-07-18";

export function dreamPath(keyword: string) {
  return `/dream/${encodeURIComponent(keyword)}`;
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
