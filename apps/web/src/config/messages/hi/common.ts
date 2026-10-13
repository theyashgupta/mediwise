import type { Messages } from "..";
import { review } from "../review";

export const common: Messages["common"] = {
  retry: "फिर से कोशिश करें",
  loading: "लोड हो रहा है",
  disclaimer: review("MediWise जानकारी के लिए है, निदान के लिए नहीं। यह डॉक्टर की जगह नहीं लेता।"),
  status: {
    optimal: review("सबसे अच्छा"),
    watch: review("ध्यान दें"),
    risk: review("जोखिम"),
    unknown: "पता नहीं",
  },
  range: {
    between: (low: number, high: number) => `${low} से ${high}`,
    below: (high: number) => `${high} से कम`,
    above: (low: number) => `${low} से ज़्यादा`,
    lab: review("लैब रेंज"),
    calibrated: review("कैलिब्रेटेड रेंज"),
    optimal: review("सबसे अच्छी रेंज"),
    barLabel: (value: string, status: string) => `मान ${value}, ${status}।`,
    labLabel: (range: string) => review(`लैब रेंज ${range}।`),
    calibratedLabel: (range: string) => review(`कैलिब्रेटेड रेंज ${range}।`),
  },
  score: { label: (score: number, tier: string) => `स्कोर 100 में से ${score}, ${tier}` },
  chart: {
    value: "मान",
    labChanged: "इस नतीजे पर लैब बदली",
    labChangedShort: "लैब बदली",
    linked: "दोबारा जाँच या जुड़ी रिपोर्ट",
    linkedShort: "दोबारा जाँच",
    lab: "लैब",
    notPrinted: "छपा नहीं है",
    none: "कोई नहीं",
    labChangedSentence: "इस नतीजे पर लैब बदल गई।",
  },
  theme: { useLight: "लाइट थीम चुनें", useDark: "डार्क थीम चुनें" },
  language: { label: "भाषा" },
};
