import type { Messages } from "..";
import { review } from "../review";

export const dashboard: Messages["dashboard"] = {
  ask: {
    title: "अपनी रिपोर्ट के बारे में पूछें",
    body: "हर उत्तर हर संख्या की रिपोर्ट और तारीख बताता है।",
    changed: (marker: string) => `मेरा ${marker} कैसे बदला है?`,
    finding: (title: string) => review(`मेरी रिपोर्ट "${title}" के बारे में क्या कहती है?`),
    retest: (marker: string) => `मुझे ${marker} की दोबारा जांच कब करानी चाहिए?`,
    open: "सवाल पूछें",
  },
  greeting: {
    morning: "सुप्रभात",
    afternoon: "नमस्ते",
    evening: "शुभ संध्या",
    named: (greeting: string, name: string) => `${greeting}, ${name}`,
  },
  upload: "रिपोर्ट अपलोड करें",
  incomplete: {
    title: (name: string) => `${name} की प्रोफ़ाइल पूरी करें`,
    body: review(
      "जन्म की तारीख और लिंग डालें। MediWise इनसे हर मार्कर को सही रेंज के हिसाब से स्कोर करता है।",
    ),
    action: "प्रोफ़ाइल पूरी करें",
  },
  approximateBirth: {
    title: (name: string) => `${name} की जन्म की तारीख जाँचें`,
    body: review(
      "हमने इसे एक रिपोर्ट पर लिखी उम्र से निकाला है। कुछ रेंज उम्र के साथ बदलती हैं, इसलिए सही तारीख डालें।",
    ),
    action: "तारीख डालें",
  },
  loadError: "हम आपका डैशबोर्ड लोड नहीं कर पाए।",
  install: {
    title: "MediWise इंस्टॉल करें",
    body: "MediWise को अपनी होम स्क्रीन पर जोड़ें। फिर यह एक ऐप की तरह खुलेगा।",
    action: "इंस्टॉल करें",
    dismiss: "बंद करें",
    ios: {
      title: "MediWise को होम स्क्रीन पर जोड़ें",
      body: "फिर MediWise एक ऐप की तरह खुलेगा।",
      steps: [
        "Safari में शेयर बटन पर टैप करें।",
        review("Add to Home Screen (होम स्क्रीन में जोड़ें) पर टैप करें।"),
        review("Add (जोड़ें) पर टैप करें।"),
      ],
      close: "बंद करें",
    },
  },
  readFailed: "हम आपकी सबसे नई रिपोर्ट नहीं पढ़ पाए।",
  empty: {
    title: "अपनी पहली रिपोर्ट अपलोड करें",
    body: review(
      "रिपोर्ट की PDF या फ़ोटो अपलोड करें। हम हर मार्कर पढ़ते हैं और उसे आसान अंग्रेज़ी में समझाते हैं। हम हर मार्कर को आपकी उम्र, लिंग और वंश की रेंज के हिसाब से स्कोर करते हैं।",
    ),
  },
  processing: {
    titleOne: "आपकी रिपोर्ट पढ़ी जा रही है",
    titleMany: (n: number) => `आपकी ${n} रिपोर्ट पढ़ी जा रही हैं`,
    bodyOne: "रिपोर्ट तैयार होने पर यह पेज अपडेट हो जाएगा।",
    bodyMany: "हर रिपोर्ट तैयार होने पर यह पेज अपडेट हो जाएगा।",
  },
  latest: {
    coverage: (percent: number) => review(`मुख्य मार्कर में से ${percent}% मापे गए`),
    fallbackTitle: "आपकी सबसे नई रिपोर्ट",
    since: (date: string) => `${date} की रिपोर्ट के बाद से`,
    noChange: "कोई बदलाव नहीं",
    byStatus: review("स्थिति के हिसाब से मार्कर"),
    open: "रिपोर्ट खोलें",
  },
  newSince: {
    title: (date: string) => `${date} के बाद नई रिपोर्ट`,
    body: (date: string) =>
      review(`इन रिपोर्ट में कम मार्कर हैं। आपका स्कोर ${date} की रिपोर्ट से ही रहता है।`),
  },
  attention: {
    title: review("इन पर ध्यान दें"),
    seeAll: (n: number) => `सभी ${n} देखें`,
    none: review("स्कोर किए गए सभी मार्कर अपनी सबसे अच्छी रेंज में हैं।"),
  },
  recent: {
    title: "हाल की रिपोर्ट",
    all: "सभी रिपोर्ट",
    fallbackTitle: "रिपोर्ट",
    files: (n: number) => `${n} फ़ाइलें`,
  },
  retest: {
    title: review("दोबारा टेस्ट का समय"),
    dueSince: (date: string) => review(`${date} से बाकी`),
    dueOn: (date: string) => review(`${date} को करवाना है`),
    addLabel: (marker: string) => `${marker} का दोबारा टेस्ट अपने कैलेंडर में जोड़ें`,
    add: "कैलेंडर में जोड़ें",
    askDoctor: review("दोबारा टेस्ट बुक करने से पहले अपने डॉक्टर से पूछें।"),
  },
  calendar: {
    summary: (marker: string, name: string) => `${name} का ${marker} दोबारा टेस्ट`,
    description: (date: string) =>
      review(
        `MediWise ने यह तारीख ${date} की आपकी रिपोर्ट से सुझाई है। दोबारा टेस्ट बुक करने से पहले अपने डॉक्टर से पूछें।`,
      ),
  },
  family: {
    title: "आपका परिवार",
    empty: "परिवार के सदस्य जोड़ें, ताकि उनकी रिपोर्ट यहाँ दिखें।",
    add: "परिवार का सदस्य जोड़ें",
    noReport: "अभी कोई रिपोर्ट नहीं।",
    atRisk: (n: number) => review(`${n} मार्कर जोखिम में`),
    stale: "पिछले 12 महीनों में कोई रिपोर्ट नहीं।",
    staleFrequent: "पिछले 3 महीनों में कोई रिपोर्ट नहीं।",
    upload: "रिपोर्ट अपलोड करें",
  },
};
