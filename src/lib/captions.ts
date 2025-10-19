// src/lib/captions.ts
export type CaptionLang = "en" | "hi" | "hinglish";

type TemplateSeed = {
  [slug: string]: {
    en?: string[];
    hi?: string[];
    hinglish?: string[];
    // regional seeds can live under the same slug
  };
};

// Lightweight token merge
export function fillTokens(t: string, tokens: Record<string, string | undefined>) {
  return t
    .replace(/\{title\}/g, tokens.title || "")
    .replace(/\{names\}/g, tokens.names || "")
    .replace(/\{date\}/g, tokens.date || "")
    .replace(/\{venue\}/g, tokens.venue || "")
    .replace(/\{festival\}/g, tokens.festival || "");
}

const seeds: TemplateSeed = {
  // ===== Examples (add more as you ship packs) =====
  diwali: {
    en: [
      "Lights on, hearts warm ✨ {festival} invite by {names} — {date}{venue}",
      "Let the diyas glow and joy flow 🪔 See you on {date} — {venue}",
      "Festive vibes only. Join us for {festival}! ✨",
    ],
    hi: [
      "दीयों की रौशनी और खुशियों की बरसात 🪔 {festival} पर सादर आमंत्रण — {date} {venue}",
      "आइए मिलकर मनाएँ {festival} ✨ {date} • {venue}",
    ],
    hinglish: [
      "Diyas, mithai aur full vibes 🪔 {festival} party on {date} at {venue}",
      "{festival} ka scene set hai! ✨ Milte hai {date} • {venue}",
    ],
  },

  "ganesh-chaturthi": {
    en: [
      "Bappa arrives! 🌺 Join us for {festival} — {date} • {venue}",
      "With Modaks & melodies, celebrate {festival} with {names}",
    ],
    hi: [
      "बप्पा मोरया! 🌺 {festival} पर सादर आमंत्रण — {date} • {venue}",
    ],
    hinglish: [
      "Bappa ke saath good vibes only 🌺 {date} • {venue}",
    ],
  },

  holi: {
    en: [
      "Add a little more color to your day 🎨 {festival} invite by {names}",
      "Gulal, dhol & a lot of love — {festival} on {date}",
    ],
    hi: ["रंग बरसे! 🎨 {festival} पर सादर आमंत्रण — {date} {venue}"],
    hinglish: ["Rangeen milte hai! 🎨 {festival} • {date} • {venue}"],
  },

  lohri: {
    en: ["Bonfire, dhol & rewari 🔥 Celebrate Lohri with us — {date} • {venue}"],
    hi: ["लोहड़ी की गर्माहट के साथ 🔥 {date} • {venue}"],
    hinglish: ["Bonfire night set hai 🔥 Lohri • {date} • {venue}"],
  },

  pongal: {
    en: ["Sweet beginnings 🍚 Celebrate Pongal — {date} • {venue}"],
    hi: ["मिठास भरी शुरुआत 🍚 पोंगल उत्सव — {date} • {venue}"],
    hinglish: ["Pongal vibes only 🍚 {date} • {venue}"],
  },

  onam: {
    en: ["Pookalam & sadhya bliss 🌼 Onam with {names} — {date}"],
    hi: ["ओणम की शुभकामनाएँ 🌼 {date} • {venue}"],
    hinglish: ["Onam feels 🌼 {date} • {venue}"],
  },

  "durga-puja": {
    en: ["Shakti & shringar 🌺 Durga Puja — {date} • {venue}"],
    hi: ["माँ दुर्गा का आशीर्वाद 🌺 {date} • {venue}"],
    hinglish: ["Durga Puja vibes 🌺 {date} • {venue}"],
  },

  eid: {
    en: ["Moonlight & meetha 🌙 Eid Mubarak — {date} • {venue}"],
    hi: ["ईद मुबारक 🌙 {date} • {venue}"],
    hinglish: ["Eid Mubarak 🌙 {date} • {venue}"],
  },

  baisakhi: {
    en: ["Fields of gold 🌾 Baisakhi Mubarak — {date} • {venue}"],
    hi: ["बैशाखी की शुभकामनाएँ 🌾 {date} • {venue}"],
    hinglish: ["Balle balle! 🌾 Baisakhi • {date} • {venue}"],
  },

  vishu: {
    en: ["Prosperity & positivity 🌿 Vishu — {date} • {venue}"],
    hi: ["विशु की मंगलकामनाएँ 🌿 {date} • {venue}"],
    hinglish: ["Vishu vibes 🌿 {date} • {venue}"],
  },

  // Generic fallback for any slug
  _fallback: {
    en: [
      "You’re invited ✨ {title} — {date} • {venue}",
      "Let’s celebrate! ✨ {title} — {date}",
    ],
    hi: [
      "सादर आमंत्रण ✨ {title} — {date} • {venue}",
    ],
    hinglish: [
      "Party scene set ✨ {title} — {date} • {venue}",
    ],
  },
};

export function getCaptions(
  slug: string,
  lang: CaptionLang,
  tokens: Record<string, string | undefined>
) {
  const pool = seeds[slug]?.[lang] || seeds._fallback[lang] || [];
  const formatted = pool
    .map((t) =>
      fillTokens(t, {
        ...tokens,
        festival: tokens.title || tokens.slug || "",
      })
    )
    .filter(Boolean);
  return formatted.length ? formatted : ["You're invited ✨"];
}
