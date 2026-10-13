import type { Messages } from "..";
import { review } from "../review";

export const bento: Messages["bento"] = {
  eyebrow: "सुविधाएँ",
  title: "भारत की लैब जैसी रिपोर्ट छापती हैं, उनके लिए बना",
  files: {
    title: (maxFiles: number) => `एक रिपोर्ट में ${maxFiles} फ़ाइलें तक`,
    body: (fileMb: number, totalMb: number) =>
      `PDF, JPG, PNG, HEIC या WebP। हर फ़ाइल ${fileMb} MB तक, कुल ${totalMb} MB तक।`,
  },
  family: {
    title: "परिवार की प्रोफ़ाइल",
    body: (maxProfiles: number) =>
      `${maxProfiles} प्रोफ़ाइल तक। हर व्यक्ति को अपनी उम्र, लिंग और वंश की रेंज मिलती है।`,
    people: ["मैं", "जीवनसाथी", "माता-पिता", "बच्चा"],
  },
  cost: {
    title: "प्रति रिपोर्ट कीमत",
    body: (firstPrice: string, perReport: string, credits: number) =>
      `एक रिपोर्ट ${firstPrice} में। ${credits} रिपोर्ट के पैक में ${perReport} प्रति रिपोर्ट।`,
  },
  trends: {
    title: "ट्रेंड",
    body: "हर मार्कर को सभी जाँचों में देखें, आपकी सबसे अच्छी रेंज एक पट्टी के रूप में।",
  },
  doctor: {
    title: "आपके डॉक्टर के लिए एक सार",
    body: "अपने नतीजे एक साफ़ पेज पर प्रिंट करें, सफ़ेद पर काले अक्षरों में, और डॉक्टर के पास ले जाएँ।",
  },
  studies: {
    title: "ECG, अल्ट्रासाउंड और X-ray रिपोर्ट",
    body: review(
      "MediWise हर जाँच से छपे हुए शब्द और मान कॉपी करता है। यह स्कैन की तस्वीरें नहीं पढ़ता।",
    ),
  },
};
