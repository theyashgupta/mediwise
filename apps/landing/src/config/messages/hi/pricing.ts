import type { Messages } from "..";
import { review } from "../review";

export const pricing: Messages["pricing"] = {
  eyebrow: "कीमत",
  title: "जितनी रिपोर्ट पढ़वाएँ, उतना पेमेंट करें",
  body: (maxFiles: number) =>
    review(
      `एक क्रेडिट से MediWise एक रिपोर्ट पढ़ता है, ${maxFiles} फ़ाइलों तक। कीमतें भारतीय रुपये में हैं और इनमें टैक्स शामिल है।`,
    ),
  pack: (credits: number) => `${credits} रिपोर्ट`,
  best: "प्रति रिपोर्ट सबसे कम कीमत",
  forOneReport: "एक रिपोर्ट के लिए",
  perReport: (perReport: string) => `${perReport} प्रति रिपोर्ट`,
  refund: review(
    "जिस क्रेडिट का इस्तेमाल नहीं हुआ, उसका रिफ़ंड मिल सकता है। पेमेंट के 7 दिन के अंदर माँगें।",
  ),
};
