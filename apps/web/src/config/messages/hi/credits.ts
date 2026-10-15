import type { Messages } from "..";
import { plural } from "../plural";
import { review } from "../review";
import { formatCount } from "../locales";

export const credits: Messages["credits"] = {
  left: (n: number) =>
    plural("hi", n, {
      one: `${formatCount("hi", n)} रिपोर्ट बाकी`,
      other: `${formatCount("hi", n)} रिपोर्ट बाकी`,
    }),
  title: "रिपोर्ट क्रेडिट",
  description: "MediWise पढ़ी गई रिपोर्ट को कैसे गिनता है।",
  loadError: "हम आपके क्रेडिट लोड नहीं कर सके।",
  none: "आपके पास कोई रिपोर्ट क्रेडिट नहीं बचा।",
  eachReport: review("MediWise जो भी रिपोर्ट पढ़ता है, उसमें एक रिपोर्ट क्रेडिट लगता है।"),
  refund: review("अगर हम कोई रिपोर्ट नहीं पढ़ पाते, तो उसका क्रेडिट आपको वापस मिल जाता है।"),
  cannotBuy: review("आप अभी क्रेडिट नहीं खरीद सकते। पेमेंट की सुविधा बाद में आएगी।"),
  contact: "अभी क्रेडिट पाने के लिए MediWise टीम से संपर्क करें।",
  goToReports: "अपनी रिपोर्ट पर जाएँ",
};
