import type { Messages } from "..";

export const comparison: Messages["comparison"] = {
  eyebrow: "तुलना",
  title: "लैब PDF आपको नंबर देती है। MediWise बताता है कि उनका मतलब क्या है।",
  caption: "आम लैब PDF और MediWise की तुलना",
  feature: "सुविधा",
  pdf: "आम लैब PDF",
  rows: {
    explained: {
      label: "जानकारी",
      pdf: "टेस्ट के नाम और नंबर",
      us: "हर मार्कर आसान भाषा में",
    },
    scored: {
      label: "स्कोर",
      pdf: "लैब की छपी हुई रेंज",
      us: "आपकी उम्र, लिंग और वंश की रेंज",
    },
    tracked: {
      label: "ट्रैकिंग",
      pdf: "हर फ़ाइल में एक जाँच",
      us: "आपकी सभी जाँचों में हर मार्कर",
    },
    family: {
      label: "परिवार",
      pdf: "हर व्यक्ति की अलग फ़ाइल",
      us: (maxProfiles: number) => `एक खाते में ${maxProfiles} प्रोफ़ाइल तक`,
    },
    flags: {
      label: "डॉक्टर के लिए ज़रूरी बातें",
      pdf: "लंबी रिपोर्ट में आसानी से छूट जाती हैं",
      us: "स्कैन की लाइनें और डॉक्टर से पूछने के सवाल",
    },
    cost: {
      label: "कीमत",
      pdf: "टेस्ट के साथ आती है",
      us: (perReport: string) => `${perReport} प्रति रिपोर्ट से शुरू`,
    },
  },
};
