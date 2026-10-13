import type { Messages } from "..";
import { review } from "../review";

export const trust: Messages["trust"] = {
  title: "MediWise आपका डेटा कैसे संभालता है",
  storage: {
    title: "भारत में स्टोर",
    body: review("हम आपकी रिपोर्ट और नतीजे मुंबई के Supabase सर्वर पर रखते हैं।"),
  },
  law: {
    title: review("DPDP Act 2023 का पालन करने के लिए बना"),
    body: "डिजिटल निजी डेटा पर भारत का कानून।",
  },
  diagnosis: {
    title: "कोई निदान नहीं",
    body: review("MediWise आपके नतीजे समझाता है। निदान आपके डॉक्टर करते हैं।"),
  },
  identity: {
    title: "पहचान वाले पेज हटते हैं",
    body: review("जब MediWise आपकी फ़ाइलें पढ़ता है, तो आधार या PAN कार्ड जैसे पेज हटा देता है।"),
  },
  payments: { title: "UPI और कार्ड", body: "पेमेंट Cashfree से होते हैं।" },
};
