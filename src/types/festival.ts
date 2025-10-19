export type Festival = {
  slug: string;            // url slug, unique
  name: string;            // display name
  date_iso: string;        // ISO date like 2025-10-20
  region?: string;         // IN (default) or state code like IN-PB, IN-TN
  tags?: string[];         // ["lights","family"]
  featured?: boolean;      // show in Featured rail
  hero_image?: string;     // optional cover image (og/social)
};
