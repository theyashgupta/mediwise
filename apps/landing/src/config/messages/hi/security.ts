import type { Messages } from "..";
import { review } from "../review";

export const security: Messages["security"] = {
  title: review("MediWise आपके डेटा की सुरक्षा कैसे करता है"),
  description: review(
    "MediWise में आपकी रिपोर्ट की सुरक्षा के उपाय, और सुरक्षा की कमज़ोरी की रिपोर्ट कैसे करें।",
  ),
  intro: review(
    "यह पेज उन उपायों की सूची देता है जो आपकी रिपोर्ट और आपके खाते की सुरक्षा करते हैं।",
  ),
  items: {
    encryption: {
      title: review("एन्क्रिप्शन"),
      body: review(
        "आपका डेटा एन्क्रिप्टेड कनेक्शन (TLS) से जाता है। Supabase डेटाबेस और फ़ाइलों को स्टोरेज में एन्क्रिप्ट करता है।",
      ),
    },
    storage: {
      title: review("प्राइवेट स्टोरेज"),
      body: review(
        "आपकी फ़ाइलें प्राइवेट स्टोरेज में हैं। फ़ाइल सिर्फ़ MediWise API के कम समय वाले लिंक से खुलती है।",
      ),
    },
    trackers: {
      title: review("कोई ट्रैकर नहीं"),
      body: review(
        "MediWise कोई एनालिटिक्स, विज्ञापन ट्रैकर या थर्ड-पार्टी कुकी इस्तेमाल नहीं करता।",
      ),
    },
    deletion: {
      title: review("डिलीट करना"),
      body: review(
        "खाता डिलीट करने पर MediWise आपकी फ़ाइलें, आपका डेटा और आपका साइन-इन डिलीट करता है। टैक्स कानून के लिए पेमेंट रिकॉर्ड रहते हैं।",
      ),
    },
    shareLinks: {
      title: review("हैश किए गए शेयर लिंक"),
      body: review(
        "शेयर लिंक एक लंबे रैंडम कोड से बनता है। MediWise उसका सिर्फ़ एक-तरफ़ा कोड रखता है। हर लिंक की एक आख़िरी तारीख होती है।",
      ),
    },
    supplyChain: {
      title: review("सप्लाई-चेन स्कैन"),
      body: review(
        "हर बदलाव पर और हर दिन एक स्कैन कोड और उसके पैकेज में जाने-माने सप्लाई-चेन वर्म के निशान जाँचता है।",
      ),
    },
  },
  report: {
    title: review("सुरक्षा की कमज़ोरी की रिपोर्ट करें"),
    body: review("पब्लिक issue न खोलें। निजी रिपोर्ट के लिए SECURITY.md के कदम अपनाएँ।"),
    link: review("SECURITY.md पढ़ें"),
  },
};
