export type InviteOwner = { name?: string; org?: string | null };

export type Invite = {
  id: string;              // short id in URL
  slug: string;            // festival slug (e.g., "diwali")
  title: string;           // display title on public page
  subtitle?: string;       // optional tagline
  owner?: InviteOwner;
  mediaUrl: string;        // final image or video URL
  ogImageUrl?: string;     // static PNG for OG (may equal mediaUrl if image)
  theme?: string;          // template slug / style
  locale?: string;         // "en", "hi", "hinglish"
  props?: Record<string, any>;
  createdAt: number;       // ms epoch
  wishesEnabled?: boolean;

  // Lightweight analytics (denormalized)
  views?: number;
  uniques?: number;
  lastViewedAt?: number;
  updatedAt?: number;
  rsvpEnabled?: boolean;                 // turn RSVP on/off per invite
  rsvpMode?: "simple" | "counts";        // "simple" = just attending Y/N; "counts" = adults/kids

};
