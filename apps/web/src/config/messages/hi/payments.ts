import type { Messages } from "..";
import { plural } from "../plural";
import { review } from "../review";

export const payments: Messages["payments"] = {
  policyLinks: {
    terms: "इस्तेमाल की शर्तें",
    privacy: "निजता नीति",
    refunds: "रिफ़ंड नीति",
    contact: "संपर्क",
  },
  policy: {
    lastChange: (date: string) => `पिछला बदलाव: ${date}`,
    nav: "नीतियाँ",
  },
  buy: {
    title: "रिपोर्ट क्रेडिट खरीदें",
    loadError: "हम क्रेडिट पैक लोड नहीं कर सके।",
    checkoutError: review("पेमेंट विंडो नहीं खुली। फिर से कोशिश करें।"),
    buy: "खरीदें",
    buyPack: (label: string) => `${label} खरीदें`,
    opening: "पेमेंट खुल रहा है",
  },
  status: {
    waiting: review("हम आपके बैंक से पेमेंट पक्का होने का इंतज़ार कर रहे हैं।"),
    paid: (n: number) =>
      review(
        plural("hi", n, {
          one: `पेमेंट मिल गया। हमने आपके खाते में ${n} रिपोर्ट क्रेडिट जोड़ दिया।`,
          other: `पेमेंट मिल गया। हमने आपके खाते में ${n} रिपोर्ट क्रेडिट जोड़ दिए।`,
        }),
      ),
    late: review(
      "आपके बैंक ने अभी पेमेंट पक्का नहीं किया है। पक्का होने पर आपके क्रेडिट यहाँ दिखेंगे।",
    ),
  },
};
