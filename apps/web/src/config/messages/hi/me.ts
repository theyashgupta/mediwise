import type { Messages } from "..";
import { review } from "../review";

export const me: Messages["me"] = {
  menu: {
    open: "यूज़र मेन्यू खोलें",
    signedInAs: "इस खाते से साइन इन है",
    loadingAccount: "खाता लोड हो रहा है",
    unavailable: "खाता उपलब्ध नहीं है",
    theme: "थीम",
    light: "लाइट",
    dark: "डार्क",
    system: "सिस्टम के जैसा",
    signOut: "साइन आउट करें",
    signingOut: "साइन आउट हो रहा है",
  },
  consent: {
    termsBefore: review("मेरी उम्र 18 साल या उससे ज़्यादा है और मुझे "),
    termsLink: review("शर्तें"),
    termsAfter: review(" स्वीकार हैं"),
    healthBefore: review(
      "मेरी सहमति है कि MediWise मेरी हेल्थ रिपोर्ट स्टोर करे और उन्हें पढ़ने के लिए एक AI सेवा का इस्तेमाल करे, जैसा ",
    ),
    healthLink: review("निजता नीति"),
    healthAfter: review(" में बताया गया है।"),
    required: review("आगे बढ़ने के लिए इस बॉक्स पर टिक करें।"),
    gateTitle: review("रिपोर्ट अपलोड करने से पहले अपनी सहमति दें"),
    gateDescription: review("कोई रिपोर्ट पढ़ने से पहले MediWise को आपकी सहमति चाहिए।"),
    gateChanged: review("निजता नीति बदल गई है। रिपोर्ट अपलोड करने से पहले फिर से सहमति दें।"),
    agree: review("आगे बढ़ें"),
    agreeing: review("सेव हो रहा है"),
    loadError: review("हम आपकी सहमति लोड नहीं कर सके।"),
  },
};
