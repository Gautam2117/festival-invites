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

// Convenience for wish-type templates (no details required)
const WISH = { names: "", date: "", venue: "" };

export const copy: Record<Lang, Copy> = {
  en: {
    labels: {
      eventTitle: "Event Title",
      hosts: "Hosts / Names",
      dateTime: "Date & Time",
      venue: "Venue",
    },
    defaults: {
      // Existing
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

      // New festivals
      holi: {
        title: "Holi Celebration",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      "raksha-bandhan": {
        title: "Raksha Bandhan",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      lohri: {
        title: "Lohri Celebration",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Ludhiana, Punjab",
      },
      "makar-sankranti": {
        title: "Makar Sankranti",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Ahmedabad, Gujarat",
      },
      pongal: {
        title: "Pongal Celebration",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Chennai, Tamil Nadu",
      },
      onam: {
        title: "Onam Celebrations",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Kochi, Kerala",
      },
      "karwa-chauth": {
        title: "Karwa Chauth",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Delhi, India",
      },
      "bhai-dooj": {
        title: "Bhai Dooj",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      "ram-navami": {
        title: "Ram Navami",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Ayodhya, Uttar Pradesh",
      },
      "hanuman-jayanti": {
        title: "Hanuman Jayanti",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      "eid-al-adha": {
        title: "Eid al-Adha Mubarak",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Jaipur, Rajasthan",
      },
      christmas: {
        title: "Christmas Celebration",
        names: "Your Name & Family",
        date: sampleDateEN,
        venue: "Your City",
      },
      // In copy.en.defaults (add these keys)
      "durga-puja": {
        title: "Durga Puja",
        names: "Sharod Shubhechha",
        date: sampleDateEN,
        venue: "Pandal / Community Grounds",
      },
      chhath: {
        title: "Chhath Puja",
        names: "With devotion and gratitude",
        date: sampleDateEN,
        venue: "Riverbank / Ghat",
      },
      baisakhi: {
        title: "Happy Baisakhi",
        names: "Dhol, bhangra & joy",
        date: sampleDateEN,
        venue: "Gurudwara / Community",
      },
      vishu: {
        title: "Happy Vishu",
        names: "With love and light",
        date: sampleDateEN,
        venue: "Home / Temple",
      },

      // Daily wishes (no details required)
      "good-morning": { title: "Good Morning", ...WISH },
      "good-night": { title: "Good Night", ...WISH },
      congratulations: { title: "Congratulations!", ...WISH },
      "best-of-luck": { title: "Best of Luck!", ...WISH },
      "get-well-soon": { title: "Get Well Soon", ...WISH },
      "thank-you": { title: "Thank You!", ...WISH },
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
      // Existing
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

      // New festivals
      holi: {
        title: "होली उत्सव",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      "raksha-bandhan": {
        title: "रक्षाबंधन",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      lohri: {
        title: "लोहड़ी उत्सव",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "लुधियाना, पंजाब",
      },
      "makar-sankranti": {
        title: "मकर संक्रांति",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "अहमदाबाद, गुजरात",
      },
      pongal: {
        title: "पोंगल उत्सव",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "चेन्नई, तमिलनाडु",
      },
      onam: {
        title: "ओणम उत्सव",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "कोच्चि, केरल",
      },
      "karwa-chauth": {
        title: "करवा चौथ",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "दिल्ली, भारत",
      },
      "bhai-dooj": {
        title: "भाई दूज",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      "ram-navami": {
        title: "राम नवमी",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "अयोध्या, उत्तर प्रदेश",
      },
      "hanuman-jayanti": {
        title: "हनुमान जयंती",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      "eid-al-adha": {
        title: "ईद-उल-अजहा मुबारक",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "जयपुर, राजस्थान",
      },
      christmas: {
        title: "क्रिसमस समारोह",
        names: "आपका नाम एवं परिवार",
        date: sampleDateHI,
        venue: "आपका शहर",
      },
      // In copy.hi.defaults
      "durga-puja": {
        title: "दुर्गा पूजा",
        names: "शारद शुभेच्छा",
        date: sampleDateHI,
        venue: "पंडाल / सामुदायिक मैदान",
      },
      chhath: {
        title: "छठ पूजा",
        names: "भक्ति और कृतज्ञता के साथ",
        date: sampleDateHI,
        venue: "नदी तट / घाट",
      },
      baisakhi: {
        title: "बैसाखी की शुभकामनाएँ",
        names: "ढोल, भांगड़ा और खुशी",
        date: sampleDateHI,
        venue: "गुरुद्वारा / समुदाय",
      },
      vishu: {
        title: "विशु की शुभकामनाएँ",
        names: "प्यार और प्रकाश के साथ",
        date: sampleDateHI,
        venue: "घर / मंदिर",
      },

      // Daily wishes
      "good-morning": { title: "शुभ प्रभात", ...WISH },
      "good-night": { title: "शुभ रात्रि", ...WISH },
      congratulations: { title: "बधाई हो!", ...WISH },
      "best-of-luck": { title: "शुभकामनाएँ", ...WISH },
      "get-well-soon": { title: "जल्द स्वस्थ हों", ...WISH },
      "thank-you": { title: "धन्यवाद!", ...WISH },
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
      // Existing
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

      // New festivals
      holi: {
        title: "Holi Celebration",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      "raksha-bandhan": {
        title: "Raksha Bandhan",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      lohri: {
        title: "Lohri Celebration",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Ludhiana, Punjab",
      },
      "makar-sankranti": {
        title: "Makar Sankranti",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Ahmedabad, Gujarat",
      },
      pongal: {
        title: "Pongal Celebration",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Chennai, Tamil Nadu",
      },
      onam: {
        title: "Onam Celebrations",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Kochi, Kerala",
      },
      "karwa-chauth": {
        title: "Karwa Chauth",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Delhi, India",
      },
      "bhai-dooj": {
        title: "Bhai Dooj",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      "ram-navami": {
        title: "Ram Navami",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Ayodhya, Uttar Pradesh",
      },
      "hanuman-jayanti": {
        title: "Hanuman Jayanti",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      "eid-al-adha": {
        title: "Eid al-Adha Mubarak",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Jaipur, Rajasthan",
      },
      christmas: {
        title: "Christmas Celebration",
        names: "Aapka Naam & Parivaar",
        date: sampleDateHG,
        venue: "Your City",
      },
      // In copy.hinglish.defaults
      "durga-puja": {
        title: "Durga Puja",
        names: "Sharod Shubhechha",
        date: sampleDateHG,
        venue: "Pandal / Grounds",
      },
      chhath: {
        title: "Chhath Puja",
        names: "Bhakti aur shukriya ke saath",
        date: sampleDateHG,
        venue: "Ghat / Riverbank",
      },
      baisakhi: {
        title: "Happy Baisakhi",
        names: "Dhol, bhangra & khushi",
        date: sampleDateHG,
        venue: "Gurudwara / Community",
      },
      vishu: {
        title: "Happy Vishu",
        names: "With love & light",
        date: sampleDateHG,
        venue: "Home / Temple",
      },

      // Daily wishes
      "good-morning": { title: "Good Morning", ...WISH },
      "good-night": { title: "Good Night", ...WISH },
      congratulations: { title: "Congratulations!", ...WISH },
      "best-of-luck": { title: "Best of Luck!", ...WISH },
      "get-well-soon": { title: "Get Well Soon", ...WISH },
      "thank-you": { title: "Thank You!", ...WISH },
    },
  },
};

export function getDefaults(slug: string, lang: Lang) {
  const c = copy[lang];
  return c.defaults[slug] ?? c.defaults["diwali"];
}
