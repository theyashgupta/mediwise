import type { Messages } from "..";
import { review } from "../review";

export const settings: Messages["settings"] = {
  title: "सेटिंग",
  description: "आपका खाता और आपकी अपनी प्रोफ़ाइल।",
  identity: { title: "पहचान", description: "यह नाम पूरे MediWise में दिखता है।" },
  loadError: "हम आपका खाता लोड नहीं कर सके।",
  nameSaved: "हमने आपका नाम सेव कर दिया।",
  accountDeleted: review("हमने आपका खाता हटा दिया।"),
  profile: {
    title: "आपकी प्रोफ़ाइल",
    description: review(
      "आपकी उम्र, लिंग और वंश से तय होता है कि MediWise आपके मार्कर किस रेंज से जाँचे।",
    ),
  },
  credits: {
    title: "रिपोर्ट क्रेडिट",
    description: review("MediWise हर रिपोर्ट पढ़ने के लिए एक रिपोर्ट क्रेडिट लेता है।"),
    more: "और क्रेडिट कैसे पाएँ",
  },
  security: { title: "सुरक्षा", description: "आपका पासवर्ड और आप कैसे साइन इन करते हैं।" },
  appearance: { title: "दिखावट", description: "MediWise यह पसंद इसी डिवाइस पर सेव करता है।" },
  language: {
    title: "भाषा",
    description: "MediWise यह पसंद इस डिवाइस पर और आपके खाते में सेव करता है।",
  },
  about: {
    title: "जानकारी",
    description: (company: string) => review(`MediWise, ${company} का एक ब्रांड है।`),
    brand: "ब्रांड",
    company: "कंपनी",
    email: "ईमेल",
    policies: "नीतियाँ",
  },
  data: {
    title: "आपका डेटा",
    description: review(
      "अपनी प्रोफ़ाइल, रिपोर्ट, मार्कर और अपलोड की गई फ़ाइलों की कॉपी डाउनलोड करें, या यह सब हटाएँ।",
    ),
    preparing: "डाउनलोड तैयार हो रहा है",
    download: "मेरा डेटा डाउनलोड करें",
    files: review("आपकी अपलोड की गई फ़ाइलें"),
    filesExpire: review(
      "हर फ़ाइल लिंक 5 मिनट तक काम करता है। नए लिंक के लिए अपना डेटा फिर से डाउनलोड करें।",
    ),
    delete: "खाता हटाएँ",
  },
  deleteDialog: {
    title: "अपना खाता हटाना है?",
    description: review(
      "इससे हर प्रोफ़ाइल, रिपोर्ट और अपलोड की गई फ़ाइल हट जाएगी। आप इसे वापस नहीं ला सकते। कॉपी चाहिए तो पहले अपना डेटा डाउनलोड करें।",
    ),
    confirm: (word: string) => `पक्का करने के लिए ${word} लिखें`,
    cancel: "रद्द करें",
    deleting: "हटाया जा रहा है",
  },
  nameForm: {
    name: "नाम",
    email: "ईमेल",
    saving: "सेव हो रहा है",
    save: "नाम सेव करें",
    nameRequired: "नाम डालें",
    nameTooLong: "80 या उससे कम अक्षरों का नाम डालें",
  },
  theme: { label: "थीम", light: "लाइट", dark: "डार्क", system: "सिस्टम जैसा" },
};
