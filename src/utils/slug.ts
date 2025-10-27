export const canonicalSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    // collapse any run of non-alphanumerics to a single hyphen
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
