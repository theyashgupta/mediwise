import type { Messages } from "..";
import { review } from "../review";

export const howItWorks: Messages["howItWorks"] = {
  eyebrow: "यह कैसे काम करता है",
  title: review("लैब PDF से साफ़ रिपोर्ट तक"),
  body: "आपको मार्कर का मतलब जानने की ज़रूरत नहीं है। MediWise रिपोर्ट पढ़ता है और आपको बताता है।",
  step: (number: number) => `चरण ${number}`,
  upload: {
    title: "अपलोड करें",
    body: (maxFiles: number) =>
      review(`अपनी रिपोर्ट PDF या फ़ोटो के रूप में जोड़ें, ${maxFiles} फ़ाइलें तक।`),
    alt: (maxFiles: number) => `अपलोड पेज: ${maxFiles} PDF या फ़ोटो तक डालें।`,
  },
  understand: {
    title: "समझें",
    body: review("MediWise हर मार्कर आसान भाषा में समझाता है और उसकी रेंज दिखाता है।"),
    alt: "Vitamin B12 का पेज: मार्कर क्या है, उसका मान, और रेंज में उसकी जगह।",
  },
  track: {
    title: "ट्रैक करें",
    body: "देखें कि हर मार्कर एक रिपोर्ट से अगली रिपोर्ट तक कैसे बदलता है।",
    alt: "ट्रेंड पेज: हर मार्कर और पिछली रिपोर्ट के बाद उसका बदलाव।",
  },
};
