/* -----------------------------------------------------------------------
   Media presets  — all assets live in /public/assets/…
   Because they are in the public folder we NEVER “import/require” them –
   we reference their final URL. Next.js serves them from /.next/static/media
   automatically on Vercel / any CDN.
   -------------------------------------------------------------------- */

/* ────────────────────────────────────────────────────────── */
/* 1️⃣  Background helper                                    */
/* ────────────────────────────────────────────────────────── */

/** `/assets/backgrounds/<slug>.jpg` – falls back to gradient if 404 */
export const bgForTemplate = (slug: string) => `/assets/backgrounds/${slug}.jpg`;

/* ────────────────────────────────────────────────────────── */
/* 2️⃣  Template → default background music                  */
/* ────────────────────────────────────────────────────────── */

const music = (file: string) => `/assets/music/${file}`;

export const defaultMusicByTemplate: Record<
  string,
  { file: string; label: string; volume: number }
> = {
  /* ──────────── Core templates ──────────── */
  diwali:             { file: music("sitar-chill.mp3"),         label: "Sitar Chill",         volume: 0.80 },
  "ganesh-chaturthi": { file: music("dhol-tasha.mp3"),          label: "Dhol Tasha",          volume: 0.95 },
  janmashtami:        { file: music("bansuri-krishna.mp3"),     label: "Bansuri Krishna",     volume: 0.85 },
  navratri:           { file: music("garba-beat.mp3"),          label: "Garba Beat",          volume: 0.95 },
  birthday:           { file: music("birthday-pop.mp3"),        label: "Birthday Pop",        volume: 0.90 },
  anniversary:        { file: music("shehnai-celebration.mp3"), label: "Shehnai Celebration", volume: 0.80 },
  "new-year":         { file: music("festive-brass.mp3"),       label: "Festive Brass",       volume: 0.90 },
  eid:                { file: music("sufi-soft.mp3"),           label: "Sufi Soft",           volume: 0.80 },

  /* ──────────── More festivals ──────────── */
  holi:               { file: music("dhol-tasha.mp3"),          label: "Dhol Tasha",          volume: 0.95 },
  "raksha-bandhan":   { file: music("shehnai-celebration.mp3"), label: "Shehnai Celebration", volume: 0.85 },
  lohri:              { file: music("dhol-tasha.mp3"),          label: "Dhol Tasha",          volume: 0.95 },
  "makar-sankranti":  { file: music("sitar-chill.mp3"),         label: "Sitar Chill",         volume: 0.85 },
  pongal:             { file: music("shehnai-celebration.mp3"), label: "Shehnai Celebration", volume: 0.85 },
  onam:               { file: music("sitar-chill.mp3"),         label: "Sitar Chill",         volume: 0.85 },
  "karwa-chauth":     { file: music("shehnai-celebration.mp3"), label: "Shehnai Celebration", volume: 0.80 },
  "bhai-dooj":        { file: music("sitar-chill.mp3"),         label: "Sitar Chill",         volume: 0.85 },
  "ram-navami":       { file: music("bansuri-krishna.mp3"),     label: "Bansuri Krishna",     volume: 0.85 },
  "hanuman-jayanti":  { file: music("bansuri-krishna.mp3"),     label: "Bansuri Krishna",     volume: 0.85 },
  "eid-al-adha":      { file: music("sufi-soft.mp3"),           label: "Sufi Soft",           volume: 0.80 },
  christmas:          { file: music("festive-brass.mp3"),       label: "Festive Brass",       volume: 0.90 },
  "durga-puja":       { file: music("dhak-soft.mp3"),           label: "Dhak ambience",       volume: 0.80 },
  chhath:             { file: music("devotional-soft.mp3"),     label: "Bhajan Pad",          volume: 0.78 },
  baisakhi:           { file: music("bhangra-pad.mp3"),         label: "Bhangra Pad",         volume: 0.78 },
  vishu:              { file: music("veena-pad.mp3"),           label: "Veena Pad",           volume: 0.78 },

  /* ──────────── Daily wishes ──────────── */
  "good-morning":     { file: music("sitar-chill.mp3"),         label: "Sitar Chill",         volume: 0.65 },
  "good-night":       { file: music("sufi-soft.mp3"),           label: "Sufi Soft",           volume: 0.60 },
  congratulations:    { file: music("festive-brass.mp3"),       label: "Festive Brass",       volume: 0.90 },
  "best-of-luck":     { file: music("sitar-chill.mp3"),         label: "Sitar Chill",         volume: 0.70 },
  "get-well-soon":    { file: music("sufi-soft.mp3"),           label: "Sufi Soft",           volume: 0.60 },
  "thank-you":        { file: music("sitar-chill.mp3"),         label: "Sitar Chill",         volume: 0.70 },
};

/* ────────────────────────────────────────────────────────── */
/* 3️⃣  Curated “pick your own” dropdown                     */
/* ────────────────────────────────────────────────────────── */

export const curatedTracks = [
  { id: "auto",  label: "Auto (recommended)", file: "" },
  { id: "none",  label: "No music",           file: "" },

  { id: "dhol",    label: "Dhol Tasha",          file: music("dhol-tasha.mp3") },
  { id: "garba",   label: "Garba Beat",          file: music("garba-beat.mp3") },
  { id: "sitar",   label: "Sitar Chill",         file: music("sitar-chill.mp3") },
  { id: "bansuri", label: "Bansuri Krishna",     file: music("bansuri-krishna.mp3") },
  { id: "shehnai", label: "Shehnai Celebration", file: music("shehnai-celebration.mp3") },
  { id: "pop",     label: "Birthday Pop",        file: music("birthday-pop.mp3") },
  { id: "brass",   label: "Festive Brass",       file: music("festive-brass.mp3") },
  { id: "sufi",    label: "Sufi Soft",           file: music("sufi-soft.mp3") },
] as const;

export const curatedMap = Object.fromEntries(
  curatedTracks.map((t) => [t.id, t.file])
) as Record<(typeof curatedTracks)[number]["id"], string>;
