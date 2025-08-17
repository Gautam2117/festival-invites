export const bgForTemplate = (slug: string) =>
  `assets/backgrounds/${slug}.jpg`;

// Template → default music (file + nice label + default volume)
export const defaultMusicByTemplate: Record<
  string,
  { file: string; label: string; volume: number }
> = {
  diwali: { file: "assets/music/sitar-chill.mp3", label: "Sitar Chill", volume: 0.8 },
  "ganesh-chaturthi": { file: "assets/music/dhol-tasha.mp3", label: "Dhol Tasha", volume: 0.95 },
  janmashtami: { file: "assets/music/bansuri-krishna.mp3", label: "Bansuri Krishna", volume: 0.85 },
  navratri: { file: "assets/music/garba-beat.mp3", label: "Garba Beat", volume: 0.95 },
  birthday: { file: "assets/music/birthday-pop.mp3", label: "Birthday Pop", volume: 0.9 },
  anniversary: { file: "assets/music/shehnai-celebration.mp3", label: "Shehnai Celebration", volume: 0.8 },
  "new-year": { file: "assets/music/festive-brass.mp3", label: "Festive Brass", volume: 0.9 },
  eid: { file: "assets/music/sufi-soft.mp3", label: "Sufi Soft", volume: 0.8 },
};

// Dropdown choices (including Auto + None)
export const curatedTracks = [
  { id: "auto",  label: "Auto (recommended)", file: "" },
  { id: "none",  label: "No music",           file: "" },
  { id: "dhol",  label: "Dhol Tasha",         file: "assets/music/dhol-tasha.mp3" },
  { id: "garba", label: "Garba Beat",         file: "assets/music/garba-beat.mp3" },
  { id: "sitar", label: "Sitar Chill",        file: "assets/music/sitar-chill.mp3" },
  { id: "bansuri", label: "Bansuri Krishna",  file: "assets/music/bansuri-krishna.mp3" },
  { id: "shehnai", label: "Shehnai Celebration", file: "assets/music/shehnai-celebration.mp3" },
  { id: "pop",   label: "Birthday Pop",       file: "assets/music/birthday-pop.mp3" },
  { id: "brass", label: "Festive Brass",      file: "assets/music/festive-brass.mp3" },
  { id: "sufi",  label: "Sufi Soft",          file: "assets/music/sufi-soft.mp3" },
] as const;

export const curatedMap = Object.fromEntries(
  curatedTracks.map((t) => [t.id, t.file])
) as Record<(typeof curatedTracks)[number]["id"], string>;
