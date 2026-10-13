import type { AssistantRefusalKind } from "@mediwise/shared";

export const refusalCopy: Record<AssistantRefusalKind, string> = {
  diagnosis:
    "MediWise cannot say if you have a condition. Only a doctor can make a diagnosis. You can ask about a value in your reports.",
  treatment:
    "MediWise cannot suggest a medicine, a dose or a treatment. Ask your doctor before you change a medicine.",
  worry: "MediWise cannot tell you how serious this is. Ask your doctor about this result.",
  prediction: "MediWise cannot predict your health. Ask your doctor about your risk.",
  not_in_data: "Your reports do not show this. MediWise answers only from the reports you added.",
  other_person: "Ask about one person at a time. Open their profile, then ask again.",
  off_topic: "MediWise answers questions about your reports only.",
  emergency:
    "MediWise cannot help with symptoms. If you feel very unwell, call 112 now. If you think about harming yourself, call Tele-MANAS on 14416.",
  fallback:
    "MediWise could not write a safe answer. You were not charged for this question. Open the report to see the values.",
};

export const unavailableCopy = "The assistant is not available now. Try again later.";
