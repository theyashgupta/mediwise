import type { Messages } from "..";
import { plural } from "../plural";
import { review } from "../review";

export const yearReview: Messages["yearReview"] = {
  title: "साल का सार",
  period: (from: string, to: string) => `${from} से ${to}`,
  card: {
    score: (from: number, to: number) => `स्कोर ${from} → ${to}`,
    moved: (n: number) => plural("hi", n, { one: `${n} मार्कर बदला`, other: `${n} मार्कर बदले` }),
    stillAtRisk: (n: number) => review(`${n} अब भी जोखिम में`),
    open: "सार खोलें",
  },
  direction: { improved: review("बेहतर स्थिति"), worsened: review("खराब स्थिति") },
  to: "से",
  noScore: "कोई स्कोर नहीं",
  stats: { score: "स्कोर", reports: "रिपोर्ट", labs: "लैब" },
  moved: {
    title: "जिन मार्कर की स्थिति बदली",
    description: review("इन मार्कर की स्थिति पहली रिपोर्ट और आखिरी रिपोर्ट में अलग है।"),
    empty: "किसी मार्कर की स्थिति नहीं बदली।",
  },
  risk: {
    title: review("जो मार्कर अब भी जोखिम में हैं"),
    description: review("ये मार्कर पहली और आखिरी, दोनों रिपोर्ट में जोखिम में हैं।"),
    empty: review("कोई भी मार्कर लगातार जोखिम में नहीं रहा।"),
  },
  once: {
    title: "एक बार मापे गए मार्कर",
    description: "इस अवधि में इन मार्कर का एक ही मान है, इसलिए इनका कोई ट्रेंड नहीं है।",
  },
  page: {
    print: "प्रिंट करें",
    loadError: "हम साल का सार लोड नहीं कर सके।",
    emptyTitle: "अभी साल का सार नहीं है",
    emptyBody:
      "साल के सार के लिए एक साल की दो रिपोर्ट चाहिए। क्या बदला, यह देखने के लिए दूसरी रिपोर्ट अपलोड करें।",
    upload: "रिपोर्ट अपलोड करें",
  },
};
