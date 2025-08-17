export type Language = "en" | "hi" | "hinglish";

export type TemplateMeta = {
  id: string;
  title: string;
  slug: string;
  languages: Language[];
  accent: string;     // Tailwind arbitrary color or token e.g. "from-orange-400"
  thumbnail: string;  // /assets/thumbnails/slug.jpg
  tags: string[];
};

export const templates: TemplateMeta[] = [
  {
    id: "ganesh",
    title: "Ganesh Chaturthi",
    slug: "ganesh-chaturthi",
    languages: ["en", "hi", "hinglish"],
    accent: "from-orange-400 via-rose-400 to-fuchsia-500",
    thumbnail: "/assets/thumbnails/ganesh.jpg",
    tags: ["festival", "devotional", "vibrant"],
  },
  {
    id: "diwali",
    title: "Diwali",
    slug: "diwali",
    languages: ["en", "hi", "hinglish"],
    accent: "from-amber-400 via-orange-400 to-rose-500",
    thumbnail: "/assets/thumbnails/diwali.jpg",
    tags: ["festival", "lights", "gold"],
  },
  {
    id: "janmashtami",
    title: "Janmashtami",
    slug: "janmashtami",
    languages: ["en", "hi", "hinglish"],
    accent: "from-sky-400 via-indigo-400 to-violet-500",
    thumbnail: "/assets/thumbnails/janmashtami.jpg",
    tags: ["festival", "divine", "elegant"],
  },
  {
    id: "navratri",
    title: "Navratri",
    slug: "navratri",
    languages: ["en", "hi", "hinglish"],
    accent: "from-pink-400 via-rose-400 to-orange-500",
    thumbnail: "/assets/thumbnails/navratri.jpg",
    tags: ["festival", "garba", "vibrant"],
  },
  { id: "birthday", title: "Birthday", slug: "birthday",
    languages: ["en","hi","hinglish"], accent: "from-fuchsia-400 via-rose-400 to-amber-400",
    thumbnail: "/assets/thumbnails/birthday.jpg", tags: ["personal","confetti"] },
  { id: "anniversary", title: "Anniversary", slug: "anniversary",
    languages: ["en","hi","hinglish"], accent: "from-rose-400 via-pink-400 to-purple-500",
    thumbnail: "/assets/thumbnails/anniversary.jpg", tags: ["personal","romantic"] },
  { id: "newyear", title: "New Year", slug: "new-year",
    languages: ["en","hi","hinglish"], accent: "from-amber-400 via-yellow-400 to-rose-500",
    thumbnail: "/assets/thumbnails/newyear.jpg", tags: ["celebration","sparkle"] },
  { id: "ramzan", title: "Ramzan/Eid", slug: "eid",
    languages: ["en","hi","hinglish"], accent: "from-emerald-400 via-teal-400 to-cyan-500",
    thumbnail: "/assets/thumbnails/eid.jpg", tags: ["festival","crescent"] },
];
