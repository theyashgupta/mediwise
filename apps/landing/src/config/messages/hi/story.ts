import type { Messages } from "..";
import { review } from "../review";

export const story: Messages["story"] = {
  alert: {
    title: "डॉक्टर के लिए एक लाइन",
    body: review(
      "स्कैन की जिस लाइन में नोड्यूल या गांठ हो, वह सबसे पहले आती है। उसके बारे में डॉक्टर से पूछें।",
    ),
    alt: "नतीजे: 6 mm thyroid nodule वाली अल्ट्रासाउंड लाइन सबसे पहले है। यह डॉक्टर से पूछने को कहती है।",
  },
  findings: {
    title: "पिछली रिपोर्ट के बाद क्या बदला",
    body: review("देखें कि पिछली रिपोर्ट के बाद कौन से मार्कर सुधरे और कौन से बिगड़े।"),
    alt: "नतीजे: मार्च 2024 के बाद LDL cholesterol, homocysteine और urine albumin बिगड़े हैं।",
  },
  moveFirst: {
    title: "आपका स्कोर, और पहले किस पर काम करें",
    body: review(
      "तय नियम हर रिपोर्ट को स्कोर करते हैं और बताते हैं कि किन मार्कर पर पहले काम करें।",
    ),
    alt: "पहले इन पर काम करें: urine albumin, homocysteine, potassium, mean platelet volume और LDL cholesterol, इसी क्रम में।",
  },
};
