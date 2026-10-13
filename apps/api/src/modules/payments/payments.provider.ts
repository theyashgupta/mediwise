export type PaymentEvent =
  | { kind: "paid"; orderId: string; paymentId: string; amount: number }
  | { kind: "refunded"; orderId: string; refundId: string; amount: number }
  | { kind: "ignored"; type: string };

export type CreateProviderOrder = {
  orderId: string;
  amount: number;
  userId: string;
  email: string;
  packId: string;
  label: string;
};

export type PaymentProvider = {
  createOrder: (order: CreateProviderOrder) => Promise<{ sessionId: string }>;
  verifyWebhook: (rawBody: string, header: (name: string) => string | undefined) => boolean;
  parseEvent: (rawBody: string) => PaymentEvent;
};
