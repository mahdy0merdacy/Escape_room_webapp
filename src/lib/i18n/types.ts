export type Locale = "en" | "fr" | "ar";
export const LOCALES: Locale[] = ["en", "fr", "ar"];
export const DEFAULT_LOCALE: Locale = "en";

export type Dict = {
  dir: "ltr" | "rtl";
  nav: {
    rooms: string;
    about: string;
    faq: string;
    contact: string;
    bookNow: string;
  };
  home: {
    eyebrow: string;
    h1a: string;
    h1b: string;
    h1c: string;
    tagline: string;
    cta: string;
    explore: string;
    roomsH: string;
    roomsSub: string;
    fromPrice: string;
    bookNow: string;
    difficulty: string;
    players: string;
    howH: string;
    steps: { n: string; title: string; desc: string }[];
    ctaH: string;
    ctaSub: string;
    ctaBtn: string;
  };
  contact: {
    eyebrow: string;
    heading: string;
    tagline: string;
    call: string;
    tapToCall: string;
    whatsapp: string;
    message: string;
    hoursLabel: string;
    daily: string;
    directions: string;
    locationSub: string;
    languagesLabel: string;
    ctaH: string;
    ctaSub: string;
    ctaBtn: string;
  };
  faq: {
    eyebrow: string;
    heading: string;
    tagline: string;
    items: { q: string; a: string }[];
    stillH: string;
    stillSub: string;
    callBtn: string;
    contactBtn: string;
  };
  reviews: {
    eyebrow: string;
    heading: string;
    count: string;
    cta: string;
    googleBtn: string;
  };
  gallery: {
    eyebrow: string;
    heading: string;
    tagline: string;
    shareCta: string;
    shareSub: string;
  };
  booking: {
    title: string;
    stepDate: string;
    stepTime: string;
    stepDetails: string;
    selectDate: string;
    seeAvailable: string;
    checking: string;
    noSlots: string;
    noSlotsToday: string;
    tryTomorrow: string;
    changeDate: string;
    changeTime: string;
    fullName: string;
    email: string;
    phone: string;
    partySize: string;
    rate: string;
    total: string;
    confirm: string;
    booking: string;
    duration: string;
  };
  rooms: {
    eyebrow: string;
    heading: string;
    tagline: string;
    perPerson: string;
    basedOnGroup: string;
    viewRoom: string;
    learnMore: string;
    comingSoon: string;
    comingSoonDesc: string;
    unavailable: string;
    unavailableDesc: string;
  };
  room: {
    players: string;
    age: string;
    ageValue: string;
    pricing: string;
    perPerson: string;
    gallery: string;
    story: string;
    comingSoon: string;
    comingSoonDesc: string;
    unavailable: string;
    unavailableDesc: string;
  };
  footer: {
    explore: string;
    contactHeading: string;
  };
};
