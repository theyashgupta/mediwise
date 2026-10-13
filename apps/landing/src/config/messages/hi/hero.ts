import type { Messages } from "..";

export const hero: Messages["hero"] = {
  eyebrow: "भारत की लैब रिपोर्ट के लिए",
  title: "आपकी लैब रिपोर्ट, हर मार्कर आसान भाषा में।",
  body: "रिपोर्ट की PDF या फ़ोटो अपलोड करें। MediWise हर मार्कर समझाता है और उसे आपकी उम्र, लिंग और वंश के हिसाब से स्कोर करता है। फिर हर नई रिपोर्ट में हर मार्कर को ट्रैक करता है।",
  howItWorks: "देखें यह कैसे काम करता है",
  forOneReport: "में एक रिपोर्ट।",
  perReportInPack: (credits: number) => `प्रति रिपोर्ट, ${credits} रिपोर्ट के पैक में।`,
  gst: "कीमत में GST शामिल है।",
  reportAlt:
    "MediWise की एक रिपोर्ट: 81 में से 67 मार्कर कैलिब्रेटेड रेंज में हैं। सबसे पहले urine albumin पर काम करना है। स्कोर 89, Platinum।",
  callouts: {
    files: (count: number) => `${count} फ़ाइलें`,
    filesLabel: "एक रिपोर्ट में PDF या फ़ोटो",
    markers: (count: number) => `${count} मार्कर`,
    markersLabel: "हर मार्कर की जानकारी, प्रकाशित स्रोत के साथ",
    storage: "मुंबई",
    storageLabel: "यहाँ हम आपकी रिपोर्ट रखते हैं",
  },
};
