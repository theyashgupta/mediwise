export const pricing = {
  eyebrow: "Pricing",
  title: "Pay for each report you read",
  body: (maxFiles: number) =>
    `One credit reads one report, with up to ${maxFiles} files. Prices are in Indian rupees and include tax.`,
  pack: (credits: number) => `${credits} ${credits === 1 ? "report" : "reports"}`,
  best: "Lowest price per report",
  forOneReport: "For one report",
  perReport: (perReport: string) => `${perReport} a report`,
  refund:
    "You can get a refund for a credit that you did not use. Ask within 7 days of the payment.",
};
