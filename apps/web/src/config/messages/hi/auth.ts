import type { Messages } from "..";

export const auth: Messages["auth"] = {
  errors: {
    invalid_credentials: "ईमेल या पासवर्ड सही नहीं है।",
    email_not_confirmed: "पहले अपना ईमेल पक्का करें। हमारा भेजा हुआ लिंक खोलें।",
    user_already_exists: "इस ईमेल से एक खाता पहले से है। साइन इन करें।",
    weak_password: "यह पासवर्ड बहुत कमज़ोर है। लंबा पासवर्ड डालें।",
    same_password: "ऐसा पासवर्ड डालें जो आपके अभी के पासवर्ड से अलग हो।",
    over_email_send_rate_limit:
      "हमने बहुत ज़्यादा ईमेल भेजे हैं। एक घंटा रुकें, फिर से कोशिश करें।",
    over_request_rate_limit: "आपने बहुत बार कोशिश की। कुछ मिनट रुकें, फिर से कोशिश करें।",
    provider_disabled: "Google से साइन इन अभी उपलब्ध नहीं है। अपना ईमेल और पासवर्ड इस्तेमाल करें।",
    access_denied: "आपने Google साइन इन रोक दिया। फिर से कोशिश करें या अपना ईमेल इस्तेमाल करें।",
    oauth_failed: "हम आपको Google से साइन इन नहीं कर सके। फिर से कोशिश करें।",
  },
  errorFallback: "हम यह पूरा नहीं कर सके। फिर से कोशिश करें।",
  validation: {
    email: "सही ईमेल डालें।",
    passwordRequired: "अपना पासवर्ड डालें।",
    passwordMin: "कम से कम 8 अक्षर डालें।",
    passwordMismatch: "दोनों पासवर्ड एक जैसे नहीं हैं।",
  },
  fields: {
    email: "ईमेल",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
    newPassword: "नया पासवर्ड",
    confirmPassword: "नया पासवर्ड फिर से लिखें",
  },
  buttons: {
    signIn: "साइन इन करें",
    signingIn: "साइन इन हो रहा है",
    createAccount: "खाता बनाएँ",
    creatingAccount: "खाता बन रहा है",
    sendLink: "रीसेट लिंक भेजें",
    sendingLink: "लिंक भेजा जा रहा है",
    savePassword: "पासवर्ड सेव करें",
    saving: "सेव हो रहा है",
  },
  google: {
    continue: "Google से आगे बढ़ें",
    opening: "Google खुल रहा है",
    divider: "या अपने ईमेल से",
  },
  goToSignIn: "साइन इन पर जाएँ",
  passwordChanged: "हमने आपका पासवर्ड बदल दिया।",
  login: {
    title: "साइन इन करें",
    description: "अपनी रिपोर्ट देखने के लिए साइन इन करें।",
    noAccount: "खाता नहीं है?",
    createAccount: "खाता बनाएँ",
  },
  signup: {
    title: "खाता बनाएँ",
    description: "अपनी रिपोर्ट अपलोड करें और हर मार्कर की जानकारी पाएँ।",
    haveAccount: "खाता है?",
    signIn: "साइन इन करें",
    confirmTitle: "अपना ईमेल पक्का करें",
    confirmDescription: (email: string) =>
      `हमने ${email} पर एक लिंक भेजा है। अपना खाता पक्का करने के लिए लिंक खोलें।`,
  },
  forgot: {
    title: "अपना पासवर्ड रीसेट करें",
    description: "अपना ईमेल डालें। हम आपको नया पासवर्ड सेट करने का लिंक भेजेंगे।",
    sentTitle: "अपने ईमेल में लिंक खोलें",
    sentDescription: (email: string) =>
      `अगर ${email} से कोई खाता है, तो हमने उस पर लिंक भेजा है। नया पासवर्ड सेट करने के लिए लिंक खोलें।`,
  },
  reset: {
    invalidTitle: "यह लिंक काम नहीं करता",
    invalidDescription: "लिंक सही नहीं है या उसका समय खत्म हो गया। नया लिंक माँगें।",
    sendNewLink: "नया लिंक भेजें",
    title: "नया पासवर्ड सेट करें",
    forEmail: (email: string) => `${email} के लिए।`,
  },
  security: {
    changePassword: "पासवर्ड बदलें",
    google: "Google खाता",
    googleLinked: "आपका खाता Google से जुड़ा है। आप Google से साइन इन कर सकते हैं।",
    googleNotLinked: "आपका खाता Google से जुड़ा नहीं है।",
  },
};
