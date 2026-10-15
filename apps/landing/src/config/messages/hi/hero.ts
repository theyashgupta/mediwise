import type { Messages } from "..";
import { review } from "../review";

export const hero: Messages["hero"] = {
  eyebrow: "आपकी हर लैब रिपोर्ट के लिए",
  title: "आपकी लैब रिपोर्ट, हर मार्कर आसान भाषा में।",
  body: review(
    "रिपोर्ट की PDF, फ़ोटो या स्क्रीनशॉट अपलोड करें। MediWise हर मार्कर समझाता है। यह हर मान को छपी हुई रेफ़रेंस रेंज और आपकी उम्र, लिंग और वंश की रेंज के सामने दिखाता है। फिर हर नई रिपोर्ट में हर मार्कर को ट्रैक करता है।",
  ),
  howItWorks: "देखें यह कैसे काम करता है",
  forOneReport: "में एक रिपोर्ट।",
  perReportInPack: (credits: number) => `प्रति रिपोर्ट, ${credits} रिपोर्ट के पैक में।`,
  tax: review("कीमत में टैक्स शामिल है।"),
  reportAlt:
    "MediWise की एक रिपोर्ट: 81 में से 67 मार्कर कैलिब्रेटेड रेंज में हैं। सबसे पहले urine albumin पर काम करना है। स्कोर 89, Platinum।",
  callouts: {
    files: (count: number) => `${count} फ़ाइलें`,
    filesLabel: "एक रिपोर्ट में PDF या फ़ोटो",
    markers: (count: number) => `${count} मार्कर`,
    markersLabel: "हर मार्कर की जानकारी, प्रकाशित स्रोत के साथ",
    fileTypes: (count: number) => `${count} फ़ाइल टाइप`,
    fileTypesLabel: "PDF, फ़ोटो या पेशेंट पोर्टल का स्क्रीनशॉट",
  },
};
