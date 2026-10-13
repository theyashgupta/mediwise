import type { Messages } from "..";
import { plural } from "../plural";
import { review } from "../review";

export const episodes: Messages["episodes"] = {
  title: "एपिसोड",
  sectionTitle: (name: string) => `${name} के एपिसोड`,
  sectionDescription:
    "एपिसोड एक ही सिलसिले की जाँचों की रिपोर्ट को साथ रखता है, जैसे कुछ हफ़्तों में कई जाँचें।",
  empty: "अभी कोई एपिसोड नहीं है। 45 दिन में तीन रिपोर्ट आने पर MediWise एक एपिसोड सुझाता है।",
  loadError: "हम एपिसोड लोड नहीं कर सके।",
  reports: (n: number) => plural("hi", n, { one: `${n} रिपोर्ट`, other: `${n} रिपोर्ट` }),
  period: (from: string, to: string) => `${from} से ${to}`,
  openSince: (from: string) => `${from} से खुला`,
  open: "खुला",
  ended: "खत्म",
  openEpisode: "एपिसोड खोलें",
  proposal: {
    title: review("ये रिपोर्ट शायद साथ की हैं"),
    body: (count: number, from: string, to: string) =>
      `${from} से ${to} के बीच ${count} रिपोर्ट आईं। इन्हें एक एपिसोड की तरह देखने के लिए नाम दें।`,
    save: "एपिसोड के रूप में सेव करें",
    saving: "सेव कर रहे हैं",
    dismiss: "अभी नहीं",
    failed: "हम एपिसोड सेव नहीं कर सके। फिर से कोशिश करें।",
  },
  fields: {
    name: "नाम",
    namePlaceholder: "जैसे, थायरॉइड की जाँचें",
    note: "कारण (वैकल्पिक)",
    noteHelp: review(
      "यह नोट सिर्फ़ आप देखते हैं। MediWise सार लिखने के लिए इसका इस्तेमाल नहीं करता।",
    ),
    characters: (count: string, max: string) => `${max} में से ${count} अक्षर`,
  },
  page: {
    loadError: "हम यह एपिसोड लोड नहीं कर सके।",
    notFoundTitle: "हमें यह एपिसोड नहीं मिला",
    notFoundBody: "किसी ने इसे हटा दिया, या यह किसी दूसरे अकाउंट का है।",
    back: "एपिसोड पर वापस जाएँ",
    summary: "सार",
    stats: { reports: "रिपोर्ट", days: "दिन", repeated: "दोहराए गए" },
    timeline: {
      title: "टाइमलाइन",
      description: "एपिसोड की हर रिपोर्ट, सबसे पुरानी पहले।",
      empty: "इस एपिसोड में कोई रिपोर्ट नहीं है। रिपोर्ट के पेज से कोई रिपोर्ट जोड़ें।",
      markers: (n: number, flagged: number) =>
        review(`${n} मार्कर, ${flagged} वॉच या जोखिम की स्थिति में`),
      unnamedReport: "रिपोर्ट",
    },
    repeated: {
      title: "दोहराए गए मार्कर",
      description: "इस एपिसोड में जिन मार्कर के दो या ज़्यादा मान हैं।",
      empty: "इस एपिसोड में किसी मार्कर के दो मान नहीं हैं।",
      values: (n: number) => `${n} मान`,
    },
    since: {
      title: "एपिसोड शुरू होने के बाद से",
      description: "हर दोहराए गए मार्कर का पहला और आखिरी मान।",
      to: "से",
    },
    studies: {
      title: "स्टडी",
      description: "MediWise छपी हुई रिपोर्ट से इम्प्रेशन कॉपी करता है।",
      noImpression: "रिपोर्ट में कोई इम्प्रेशन छपा नहीं है।",
    },
    outstanding: {
      title: "एक बार मापे गए",
      description: review(
        "इन नतीजों की स्थिति वॉच या जोखिम है और इस एपिसोड में इनका एक ही मान है। इनके बारे में अपने डॉक्टर से बात करें।",
      ),
      empty: review("वॉच या जोखिम की स्थिति वाले किसी नतीजे का सिर्फ़ एक मान नहीं है।"),
    },
    direction: {
      improving: review("सुधर रहा है"),
      worsening: review("बिगड़ रहा है"),
      stable: "स्थिर",
    },
  },
  settings: {
    title: "एपिसोड की सेटिंग",
    save: "सेव करें",
    saved: "हमने एपिसोड सेव कर दिया।",
    end: "एपिसोड खत्म करें",
    reopen: "एपिसोड फिर से खोलें",
    delete: "एपिसोड हटाएँ",
    failed: "हम बदलाव सेव नहीं कर सके। फिर से कोशिश करें।",
    deleteDialog: {
      title: "यह एपिसोड हटाएँ?",
      description: review("रिपोर्ट बनी रहेंगी। सिर्फ़ एपिसोड और उसका नोट हटेगा।"),
      cancel: "रद्द करें",
      confirm: "हटाएँ",
      deleting: "हटा रहे हैं",
    },
    deleted: (name: string) => `हमने ${name} हटा दिया।`,
  },
  report: {
    title: "एपिसोड",
    description:
      "इस रिपोर्ट को किसी एपिसोड में जोड़ें, ताकि यह उन्हीं जाँचों की दूसरी रिपोर्ट के साथ दिखे।",
    partOf: "यह रिपोर्ट इस एपिसोड का हिस्सा है:",
    remove: "एपिसोड से हटाएँ",
    episode: "एपिसोड",
    newEpisode: "नया एपिसोड",
    add: "एपिसोड में जोड़ें",
    adding: "जोड़ रहे हैं",
    failed: "हम एपिसोड नहीं बदल सके। फिर से कोशिश करें।",
  },
};
