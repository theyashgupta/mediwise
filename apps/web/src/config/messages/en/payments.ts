import { plural } from "../plural";
import { formatCount } from "../locales";

export const payments = {
  policyLinks: {
    terms: "Terms of use",
    privacy: "Privacy policy",
    refunds: "Refund policy",
    contact: "Contact",
  },
  policy: {
    lastChange: (date: string) => `Last change: ${date}.`,
    version: (version: string) => `Version ${version}.`,
    washingtonLink: "Washington state consumer health data",
    nav: "Policies",
  },
  buy: {
    title: "Buy report credits",
    loadError: "We could not load the credit packs.",
    checkoutError: "The payment window did not open. Try again.",
    buy: "Buy",
    buyPack: (label: string) => `Buy ${label}`,
    opening: "Opening payment",
  },
  status: {
    waiting: "We are waiting for your bank to confirm the payment.",
    paid: (n: number) =>
      `Payment received. We added ${plural("en", n, { one: `${formatCount("en", n)} report credit`, other: `${formatCount("en", n)} report credits` })} to your account.`,
    late: "Your bank did not confirm the payment yet. Your credits show here when it does.",
  },
};
