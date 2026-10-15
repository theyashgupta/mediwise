import type { Messages } from "..";
import { review } from "../review";

export const shell: Messages["shell"] = {
  nav: {
    home: "होम",
    reports: "रिपोर्ट",
    trends: "ट्रेंड",
    profiles: "प्रोफ़ाइल",
    settings: "सेटिंग",
  },
  pages: {
    ask: "पूछें",
    home: "होम",
    reports: "रिपोर्ट",
    upload: "रिपोर्ट अपलोड करें",
    report: "रिपोर्ट",
    marker: "मार्कर",
    trends: "ट्रेंड",
    trend: "ट्रेंड",
    compare: "रिपोर्ट की तुलना करें",
    profiles: "प्रोफ़ाइल",
    episode: "एपिसोड",
    yearReview: "साल का सार",
    settings: "सेटिंग",
    credits: "रिपोर्ट क्रेडिट",
    kitchenSink: "किचन सिंक",
    design: "डिज़ाइन",
    admin: "ऑपरेटर",
  },
  breadcrumb: "आप यहाँ हैं",
  home: "MediWise होम",
  upload: "रिपोर्ट अपलोड करें",
  skipToContent: "सीधे सामग्री पर जाएँ",
  mainNav: "मुख्य",
  menu: "मेन्यू",
  expandSidebar: "साइडबार खोलें",
  collapseSidebar: "साइडबार छोटा करें",
  collapse: "छोटा करें",
  shortcuts: {
    title: "कीबोर्ड शॉर्टकट",
    description: "किसी पेज पर जाने के लिए G दबाएँ, फिर एक अक्षर दबाएँ।",
    goTo: (page: string) => `${page} पर जाएँ`,
    toggleSidebar: "साइडबार छोटा करें या खोलें",
    show: "कीबोर्ड शॉर्टकट दिखाएँ",
    then: "फिर",
  },
  footer: {
    nav: "जानकारी और नीतियाँ",
    about: "MediWise के बारे में",
    legal: (year: number, company: string) =>
      review(`© ${year} MediWise. MediWise, ${company} का एक ब्रांड है।`),
  },
  offline: {
    title: "आप ऑफ़लाइन हैं",
    body: "अपनी रिपोर्ट देखने के लिए इंटरनेट से जुड़ें। MediWise इस डिवाइस पर कोई रिपोर्ट नहीं रखता।",
  },
  update: { available: "अपडेट उपलब्ध है", action: "अपडेट करें" },
};
