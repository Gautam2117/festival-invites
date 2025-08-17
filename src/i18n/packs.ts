// src/i18n/packs.ts
export type Lang = "en" | "hi" | "hinglish";

type Copy = {
  labels: {
    eventTitle: string;
    hosts: string;
    dateTime: string;
    venue: string;
  };
  defaults: {
    [slug: string]: {
      title: string;
      names: string;
      date: string;
      venue: string;
    };
  };
};

// Helper to make a readable date placeholder
const sampleDateEN = "12 Nov 2025, 7:00 PM";
const sampleDateHI = "12 नवम्बर 2025, शाम 7:00";
const sampleDateHG = "12 Nov 2025, shaam 7 baje";

export const copy: Record<Lang, Copy> = {
  en: {
    labels: {
      eventTitle: "Event Title",
      hosts: "Hosts / Names",
      dateTime: "Date & Time",
      venue: "Venue",
    },
    defaults: {
      "ganesh-chaturthi": {
        title: "Ganesh Chaturthi Celebration",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      diwali: {
        title: "Diwali Celebration",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      janmashtami: {
        title: "Janmashtami Utsav",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      navratri: {
        title: "Navratri Garba Night",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      birthday: {
        title: "Birthday Celebration",
        names: "Hosted by You",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      anniversary: {
        title: "Anniversary Celebration",
        names: "You & Partner",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      "new-year": {
        title: "New Year Party",
        names: "Your Name & Friends",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      eid: {
        title: "Eid Mubarak",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
    },
  },

  hi: {
    labels: {
      eventTitle: "कार्यक्रम का नाम",
      hosts: "मेज़बान / नाम",
      dateTime: "तारीख और समय",
      venue: "स्थान",
    },
    defaults: {
      "ganesh-chaturthi": {
        title: "गणेश चतुर्थी उत्सव",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      diwali: {
        title: "दीवाली समारोह",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      janmashtami: {
        title: "जन्माष्टमी उत्सव",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      navratri: {
        title: "नवरात्रि गरबा नाइट",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      birthday: {
        title: "जन्मदिन समारोह",
        names: "मेज़बान: आप",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      anniversary: {
        title: "विवाह वर्षगाँठ समारोह",
        names: "आप एवं जीवनसाथी",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      "new-year": {
        title: "नए साल की पार्टी",
        names: "आप एवं मित्र",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      eid: {
        title: "ईद मुबारक",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
    },
  },

  hinglish: {
    labels: {
      eventTitle: "Event Title",
      hosts: "Mehmaan Nawazi / Names",
      dateTime: "Date & Time",
      venue: "Venue",
    },
    defaults: {
      "ganesh-chaturthi": {
        title: "Ganesh Chaturthi Utsav",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      diwali: {
        title: "Diwali Celebration",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      janmashtami: {
        title: "Janmashtami Utsav",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      navratri: {
        title: "Navratri Garba Night",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      birthday: {
        title: "Birthday Celebration",
        names: "Host: You",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      anniversary: {
        title: "Anniversary Celebration",
        names: "You & Partner",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      "new-year": {
        title: "New Year Party",
        names: "You & Friends",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      eid: {
        title: "Eid Mubarak",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
    },
  },
};

export function getDefaults(slug: string, lang: Lang) {
  const c = copy[lang];
  return c.defaults[slug] ?? c.defaults["diwali"];
}
