import type { Messages } from "..";
import { review } from "../review";

export const site: Messages["site"] = {
  title: "MediWise: आपकी लैब रिपोर्ट का हर मार्कर, आसान भाषा में",
  description:
    "लैब रिपोर्ट की PDF या फ़ोटो अपलोड करें। MediWise हर मार्कर समझाता है और उसे आपकी उम्र, लिंग और वंश के हिसाब से स्कोर करता है। फिर हर नई रिपोर्ट में उसे ट्रैक करता है।",
  skipToContent: "सीधे सामग्री पर जाएँ",
  disclaimer: review("MediWise जानकारी के लिए है, निदान के लिए नहीं। यह डॉक्टर की जगह नहीं लेता।"),
  readReport: "मेरी रिपोर्ट समझें",
  signIn: "साइन इन",
  pauseMotion: "एनिमेशन रोकें",
  language: "भाषा",
  nav: { label: "मुख्य", howItWorks: "यह कैसे काम करता है", pricing: "कीमत", faq: "सवाल-जवाब" },
  footer: {
    policies: "नीतियाँ",
    terms: "इस्तेमाल की शर्तें",
    privacy: "निजता नीति",
    refunds: "रिफ़ंड नीति",
    contact: "संपर्क",
  },
  notFound: {
    title: review("पेज नहीं मिला"),
    body: review("यह पेज मौजूद नहीं है। पता जाँचें, या होम पेज पर जाएँ।"),
    home: review("होम पेज पर जाएँ"),
  },
  finalCta: {
    title: "जानिए आपकी अगली लैब रिपोर्ट क्या कहती है।",
    body: "उसे MediWise पर अपलोड करें। आपको हर मार्कर की जानकारी, एक स्कोर और डॉक्टर से पूछने के सवाल मिलते हैं।",
  },
};
