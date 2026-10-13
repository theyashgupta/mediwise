export const paymentPacks = [
  { id: "pack_1", credits: 1, amount: 4900, label: "1 report credit" },
  { id: "pack_5", credits: 5, amount: 19900, label: "5 report credits" },
  { id: "pack_20", credits: 20, amount: 59900, label: "20 report credits" },
] as const;

export type PaymentPack = (typeof paymentPacks)[number];
export type PaymentPackId = PaymentPack["id"];

export const paymentCurrency = "INR";
