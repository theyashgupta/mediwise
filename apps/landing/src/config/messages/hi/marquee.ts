import type { Messages } from "..";

export const marquee: Messages["marquee"] = {
  title: (count: number) => `${count} लैब मार्कर, जिन्हें MediWise पहचानता है`,
  body: "MediWise हर छपे हुए टेस्ट के नाम को अपने कैटलॉग से मिलाता है। जो नाम वह नहीं पहचानता, वह “पहचाना नहीं गया” दिखता है।",
};
