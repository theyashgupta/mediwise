import type { Messages } from "..";
import { plural } from "../plural";
import { review } from "../review";
import { formatCount } from "../locales";

export const trends: Messages["trends"] = {
  direction: {
    improving: review("सुधर रहा है"),
    worsening: review("बिगड़ रहा है"),
    stable: review("स्थिर"),
  },
  verdict: {
    improved: review("सुधरा"),
    worsened: review("बिगड़ा"),
    same: "वैसा ही",
    new: "नया",
    gone: "दोबारा जाँच नहीं हुई",
  },
  summary: {
    improved: (n: number) => review(`${formatCount("hi", n)} में सुधार`),
    worsened: (n: number) => review(`${formatCount("hi", n)} में गिरावट`),
    same: (n: number) => `${formatCount("hi", n)} में बदलाव नहीं`,
    new: (n: number) =>
      plural("hi", n, { one: `${formatCount("hi", n)} नया`, other: `${formatCount("hi", n)} नए` }),
    gone: (n: number) => `${formatCount("hi", n)} की दोबारा जाँच नहीं हुई`,
  },
  upload: "रिपोर्ट अपलोड करें",
  columns: {
    marker: "मार्कर",
    trend: "ट्रेंड",
    latest: "ताज़ा",
    lastChange: "पिछला बदलाव",
    change: "बदलाव",
    status: "स्थिति",
    date: "तारीख",
    a: "रिपोर्ट A",
    b: "रिपोर्ट B",
  },
  list: {
    title: "ट्रेंड",
    description: "हर मार्कर एक रिपोर्ट से अगली रिपोर्ट तक कैसे बदलता है।",
    compare: "रिपोर्ट की तुलना करें",
    loadError: "हम आपके ट्रेंड लोड नहीं कर सके।",
    noTrendsTitle: "अभी कोई ट्रेंड नहीं",
    noTrendsBody: "ट्रेंड देखने के लिए दूसरी रिपोर्ट अपलोड करें।",
    noSharedTitle: "अभी कोई साझा मार्कर नहीं",
    noSharedBody:
      "ट्रेंड के लिए एक मार्कर दो रिपोर्ट में होना चाहिए। आपकी किन्हीं दो रिपोर्ट में एक ही मार्कर नहीं है।",
    noMatchTitle: review("इन फ़िल्टर से कोई ट्रेंड नहीं मिला"),
    noMatchBody: review("दूसरे फ़िल्टर चुनें, या सभी ट्रेंड देखने के लिए फ़िल्टर हटाएँ।"),
    clearFilters: review("फ़िल्टर हटाएँ"),
  },
  watch: {
    title: review("इन पर नज़र रखें"),
    description: review(
      "ताज़ा मान में जोखिम या ध्यान दें वाले मार्कर, या पिछले मान से बिगड़े मार्कर।",
    ),
    none: review("कोई मार्कर जोखिम में, ध्यान दें में या पहले से बिगड़ा हुआ नहीं है।"),
    more: (n: number) => review(`${formatCount("hi", n)} और दिखाएँ`),
    change: (delta: string, date: string) => `${date} से ${delta}`,
  },
  suggestion: review("सुझाव"),
  controls: {
    all: "सभी",
    filter: "कैटेगरी से छाँटें",
    direction: review("दिशा"),
    status: "स्थिति",
    sort: "क्रम",
    sortBy: "इस क्रम में:",
    sorts: { change: "सबसे बड़ा बदलाव", name: "नाम" },
  },
  detail: {
    back: "सभी ट्रेंड",
    loadError: "हम यह ट्रेंड लोड नहीं कर सके।",
    emptyTitle: "इस मार्कर का कोई मान नहीं",
    emptyBody: "इस प्रोफ़ाइल की किसी रिपोर्ट में यह मार्कर नहीं है।",
    values: (n: number, name: string) => `${name} के ${formatCount("hi", n)} मान`,
    sinceBefore: "पिछली रिपोर्ट के बाद से।",
    band: review("आपकी प्रोफ़ाइल के लिए सबसे अच्छी रेंज"),
    labNote: (n: number) =>
      review(
        `इस चार्ट में ${formatCount("hi", n)} लैब के नतीजे हैं। रेंज हर लैब में अलग हो सकती है।`,
      ),
  },
  compare: {
    title: "रिपोर्ट की तुलना करें",
    description: "देखें कि दो रिपोर्ट के बीच क्या बदला।",
    loadError: "हम इन रिपोर्ट की तुलना नहीं कर सके।",
    notFoundTitle: "हमें ये रिपोर्ट नहीं मिलीं",
    notFoundBody: "एक प्रोफ़ाइल की दो रिपोर्ट चुनें।",
    latestTwo: "सबसे नई दो रिपोर्ट की तुलना करें",
    emptyTitle: "अभी तुलना के लिए कुछ नहीं",
    emptyBody: "दो रिपोर्ट की तुलना के लिए दूसरी रिपोर्ट अपलोड करें।",
    firstReport: "यह इस प्रोफ़ाइल की पहली रिपोर्ट है। रिपोर्ट A के लिए कोई पुरानी रिपोर्ट चुनें।",
    changedOnly: "सिर्फ़ बदले हुए",
    noChange: review("इन रिपोर्ट के बीच किसी मार्कर की स्थिति नहीं बदली।"),
    notMeasured: "मापा नहीं गया",
    reportA: "रिपोर्ट A",
    reportB: "रिपोर्ट B",
    select: "एक रिपोर्ट चुनें",
  },
};
