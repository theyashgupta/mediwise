import { paymentPacks } from "@mediwise/shared";

export { paymentPacks };

export type PaymentPack = (typeof paymentPacks)[number];
export type PaymentPackId = PaymentPack["id"];

export const paymentCurrency = "INR";
