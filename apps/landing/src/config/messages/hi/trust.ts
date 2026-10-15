import type { Messages } from "..";
import { review } from "../review";

export const trust: Messages["trust"] = {
  title: "MediWise आपका डेटा कैसे संभालता है",
  storage: {
    title: review("ट्रांज़िट और स्टोरेज, दोनों में एन्क्रिप्टेड"),
    body: review("आपकी रिपोर्ट और नतीजे सिर्फ़ आपके खाते तक सीमित हैं।"),
  },
  law: {
    title: review("डेटा सुरक्षा कानून का पालन करने के लिए बना"),
    body: review("हम आपका डेटा नहीं बेचते। हम विज्ञापन नहीं दिखाते।"),
  },
  diagnosis: {
    title: "कोई निदान नहीं",
    body: review("MediWise आपके नतीजे समझाता है। निदान आपके डॉक्टर करते हैं।"),
  },
  identity: {
    title: "पहचान वाले पेज हटते हैं",
    body: review(
      "जब MediWise आपकी फ़ाइलें पढ़ता है, तो पहचान दस्तावेज़ वाले पेज हटा देता है, जैसे पासपोर्ट या राष्ट्रीय पहचान पत्र।",
    ),
  },
  payments: { title: "कार्ड और UPI", body: "पेमेंट Cashfree से होते हैं।" },
  securityLink: review("MediWise आपके डेटा की सुरक्षा कैसे करता है"),
};
