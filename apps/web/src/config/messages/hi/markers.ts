import type { Messages } from "..";
import { review } from "../review";

export const markers: Messages["markers"] = {
  noChange: "कोई बदलाव नहीं",
  side: { above: "से ऊपर", below: "से नीचे", outside: "से बाहर" },
  rangeName: { watch: review("ध्यान दें रेंज"), lab: review("लैब रेंज") },
  sentence: {
    optimal: (name: string) => review(`आपका ${name} आपकी प्रोफ़ाइल के लिए सबसे अच्छी रेंज में है।`),
    watch: (name: string, side: string) =>
      review(`आपका ${name} सबसे अच्छी रेंज ${side} है, पर ध्यान दें रेंज में है।`),
    risk: (name: string, side: string, range: string) =>
      review(`आपका ${name} ${range} ${side} है। इस मान के बारे में डॉक्टर से बात करें।`),
    unknown: review(
      "MediWise ने इस मान को स्कोर नहीं किया। आपकी प्रोफ़ाइल पर कोई कैलिब्रेटेड रेंज लागू नहीं होती।",
    ),
  },
  header: {
    labRange: (range: string) => review(`लैब रेंज: ${range}`),
    noLabRange: review("रिपोर्ट में कोई लैब रेंज नहीं है।"),
  },
  knowledge: {
    whatItIs: "यह क्या है",
    whyItMatters: "यह क्यों ज़रूरी है",
    whatMovesIt: "इसे क्या बदलता है",
  },
  nav: {
    label: "इस रिपोर्ट के दूसरे मार्कर",
    previous: "पिछला मार्कर",
    next: "अगला मार्कर",
  },
  trajectory: {
    first: "यह पहला मान है। अगली रिपोर्ट बदलाव की दिशा दिखाएगी।",
    since: (date: string) => `${date} की रिपोर्ट के बाद से।`,
    band: review("इस रिपोर्ट के लिए सबसे अच्छी रेंज"),
  },
  sit: {
    optimal: (range: string) => review(`सबसे अच्छी रेंज ${range}।`),
    watch: (range: string) => review(`ध्यान दें रेंज ${range}।`),
    labBar: review("लैब रेंज (पतली पट्टी)"),
    source: review("कैलिब्रेटेड रेंज का स्रोत:"),
    noCalibrated: review(
      "आपकी प्रोफ़ाइल पर कोई कैलिब्रेटेड रेंज लागू नहीं होती। MediWise लैब रेंज का इस्तेमाल करता है।",
    ),
    noRange: review("आपकी प्रोफ़ाइल पर कोई रेंज लागू नहीं होती।"),
  },
  page: {
    loadError: "हम यह मार्कर लोड नहीं कर सके।",
    missingTitle: "यह मार्कर इस रिपोर्ट में नहीं है",
    missingBody: "रिपोर्ट के मार्कर देखने के लिए रिपोर्ट खोलें।",
    openReport: "रिपोर्ट खोलें",
    whereYouSit: "आपका मान कहाँ है",
    trajectory: "बदलाव का रुख",
    meaning: "आपके लिए इसका मतलब",
    knowledge: "जानकारी",
    calibratedFor: (who: string) => review(`आपके लिए कैलिब्रेट किया गया, ${who}`),
    sources: "स्रोत",
  },
};
