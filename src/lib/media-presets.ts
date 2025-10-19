export const bgForTemplate = (slug: string) => {
  // TEMP fallback while you’re still adding JPEGs
  const maybe = `/assets/backgrounds/${slug}.jpg`;
  // quick client-side existence test (only runs once per slug)
  if (typeof document !== "undefined") {
    const img = new Image();
    img.src = maybe;
    if (img.width === 0) return null; // let comp show gradient
  }
  return maybe;
};

// Template → default music (file + nice label + default volume)
export const defaultMusicByTemplate: Record<
  string,
  { file: string; label: string; volume: number }
> = {
  // Core (existing)
  diwali: {
    file: "assets/music/sitar-chill.mp3",
    label: "Sitar Chill",
    volume: 0.8,
  },
  "ganesh-chaturthi": {
    file: "assets/music/dhol-tasha.mp3",
    label: "Dhol Tasha",
    volume: 0.95,
  },
  janmashtami: {
    file: "assets/music/bansuri-krishna.mp3",
    label: "Bansuri Krishna",
    volume: 0.85,
  },
  navratri: {
    file: "assets/music/garba-beat.mp3",
    label: "Garba Beat",
    volume: 0.95,
  },
  birthday: {
    file: "assets/music/birthday-pop.mp3",
    label: "Birthday Pop",
    volume: 0.9,
  },
  anniversary: {
    file: "assets/music/shehnai-celebration.mp3",
    label: "Shehnai Celebration",
    volume: 0.8,
  },
  "new-year": {
    file: "assets/music/festive-brass.mp3",
    label: "Festive Brass",
    volume: 0.9,
  },
  eid: { file: "assets/music/sufi-soft.mp3", label: "Sufi Soft", volume: 0.8 },

  // More festivals
  holi: {
    file: "assets/music/dhol-tasha.mp3",
    label: "Dhol Tasha",
    volume: 0.95,
  },
  "raksha-bandhan": {
    file: "assets/music/shehnai-celebration.mp3",
    label: "Shehnai Celebration",
    volume: 0.85,
  },
  lohri: {
    file: "assets/music/dhol-tasha.mp3",
    label: "Dhol Tasha",
    volume: 0.95,
  },
  "makar-sankranti": {
    file: "assets/music/sitar-chill.mp3",
    label: "Sitar Chill",
    volume: 0.85,
  },
  pongal: {
    file: "assets/music/shehnai-celebration.mp3",
    label: "Shehnai Celebration",
    volume: 0.85,
  },
  onam: {
    file: "assets/music/sitar-chill.mp3",
    label: "Sitar Chill",
    volume: 0.85,
  },
  "karwa-chauth": {
    file: "assets/music/shehnai-celebration.mp3",
    label: "Shehnai Celebration",
    volume: 0.8,
  },
  "bhai-dooj": {
    file: "assets/music/sitar-chill.mp3",
    label: "Sitar Chill",
    volume: 0.85,
  },
  "ram-navami": {
    file: "assets/music/bansuri-krishna.mp3",
    label: "Bansuri Krishna",
    volume: 0.85,
  },
  "hanuman-jayanti": {
    file: "assets/music/bansuri-krishna.mp3",
    label: "Bansuri Krishna",
    volume: 0.85,
  },
  "eid-al-adha": {
    file: "assets/music/sufi-soft.mp3",
    label: "Sufi Soft",
    volume: 0.8,
  },
  christmas: {
    file: "assets/music/festive-brass.mp3",
    label: "Festive Brass",
    volume: 0.9,
  },
  "durga-puja": {
    file: "assets/music/dhak-soft.mp3",
    label: "Dhak ambience (soft)",
    volume: 0.8,
  },
  chhath: {
    file: "assets/music/devotional-soft.mp3",
    label: "Bhajan pad",
    volume: 0.78,
  },
  baisakhi: {
    file: "assets/music/bhangra-pad.mp3",
    label: "Bhangra pad",
    volume: 0.78,
  },
  vishu: {
    file: "assets/music/veena-pad.mp3",
    label: "Veena & pad",
    volume: 0.78,
  },

  // Daily wishes
  "good-morning": {
    file: "assets/music/sitar-chill.mp3",
    label: "Sitar Chill",
    volume: 0.65,
  },
  "good-night": {
    file: "assets/music/sufi-soft.mp3",
    label: "Sufi Soft",
    volume: 0.6,
  },
  congratulations: {
    file: "assets/music/festive-brass.mp3",
    label: "Festive Brass",
    volume: 0.9,
  },
  "best-of-luck": {
    file: "assets/music/sitar-chill.mp3",
    label: "Sitar Chill",
    volume: 0.7,
  },
  "get-well-soon": {
    file: "assets/music/sufi-soft.mp3",
    label: "Sufi Soft",
    volume: 0.6,
  },
  "thank-you": {
    file: "assets/music/sitar-chill.mp3",
    label: "Sitar Chill",
    volume: 0.7,
  },
};

// Dropdown choices (including Auto + None)
export const curatedTracks = [
  { id: "auto", label: "Auto (recommended)", file: "" },
  { id: "none", label: "No music", file: "" },
  { id: "dhol", label: "Dhol Tasha", file: "assets/music/dhol-tasha.mp3" },
  { id: "garba", label: "Garba Beat", file: "assets/music/garba-beat.mp3" },
  { id: "sitar", label: "Sitar Chill", file: "assets/music/sitar-chill.mp3" },
  {
    id: "bansuri",
    label: "Bansuri Krishna",
    file: "assets/music/bansuri-krishna.mp3",
  },
  {
    id: "shehnai",
    label: "Shehnai Celebration",
    file: "assets/music/shehnai-celebration.mp3",
  },
  { id: "pop", label: "Birthday Pop", file: "assets/music/birthday-pop.mp3" },
  {
    id: "brass",
    label: "Festive Brass",
    file: "assets/music/festive-brass.mp3",
  },
  { id: "sufi", label: "Sufi Soft", file: "assets/music/sufi-soft.mp3" },
] as const;

export const curatedMap = Object.fromEntries(
  curatedTracks.map((t) => [t.id, t.file])
) as Record<(typeof curatedTracks)[number]["id"], string>;
