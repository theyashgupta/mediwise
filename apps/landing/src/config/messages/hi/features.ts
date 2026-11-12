import type { Messages } from "..";
import { review } from "../review";

export const features: Messages["features"] = {
  eyebrow: "सुविधाएँ",
  title: "हर लैब की रिपोर्ट के लिए बना",
  files: {
    title: (maxFiles: number) => `एक रिपोर्ट में ${maxFiles} फ़ाइलें तक`,
    body: (fileMb: number, totalMb: number) =>
      `PDF, फ़ोटो या पोर्टल का स्क्रीनशॉट, हर फ़ाइल ${fileMb} MB तक और कुल ${totalMb} MB तक।`,
  },
  studies: {
    title: "ECG, अल्ट्रासाउंड और X-ray रिपोर्ट",
    body: review("MediWise छपे हुए शब्द और मान कॉपी करता है, स्कैन की तस्वीरें नहीं।"),
  },
  family: {
    title: "आपके परिवार की प्रोफ़ाइल",
    body: (maxProfiles: number) =>
      `${maxProfiles} प्रोफ़ाइल तक, हर व्यक्ति के लिए उसकी उम्र, लिंग और वंश की रेंज।`,
    language: "सेटिंग में हिन्दी चुनें, और ऐप व अपना सार हिन्दी में पढ़ें।",
  },
  doctor: {
    title: "आपके डॉक्टर के लिए एक सार",
    body: "अपने नतीजे एक साफ़ पेज पर, सफ़ेद पर काले अक्षरों में, डॉक्टर के लिए प्रिंट करें।",
  },
  questions: {
    title: "डॉक्टर से पूछने के सवाल",
    body: "MediWise आपके नतीजों से सवाल लिखता है, अगली बार डॉक्टर के पास ले जाने के लिए।",
  },
  settled: {
    title: review("दोबारा हुआ स्कैन लाइन तय कर सकता है"),
    body: (days: number) =>
      review(
        `${days} दिन के अंदर वही जाँच बिना अलर्ट लाइन के हो, तो पहले वाली लाइन तय हो जाती है।`,
      ),
  },
  episode: {
    title: "एक जाँच के सिलसिले के लिए एक एपिसोड",
    body: "MediWise उन रिपोर्ट को ढूँढता है जो शायद एक साथ हैं, और उन्हें तारीख के क्रम में दिखाता है।",
  },
  trends: {
    title: "सभी जाँचों में ट्रेंड",
    body: "हर मार्कर को सभी जाँचों में देखें, आपकी सबसे अच्छी रेंज एक पट्टी के रूप में।",
  },
};
