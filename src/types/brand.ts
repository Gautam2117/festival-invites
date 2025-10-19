export type BrandProfile = {
  id: string;              // short id
  name: string;            // e.g., "Botify"
  logoUrl?: string;        // https://...
  tagline?: string;        // optional
  primary: string;         // hex like #2563eb
  secondary?: string;      // optional accent
  ribbon?: boolean;        // show corner ribbon/logo
  endCard?: boolean;       // show end card at the end
  createdAt: number;
  updatedAt: number;
};
