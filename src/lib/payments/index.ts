import type { PaymentMethod, PaymentProvider } from "@prisma/client";

export const JPY_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CREDIT_CARD", label: "クレジットカード" },
  { value: "KONBINI", label: "コンビニ払い" },
  { value: "BANK_TRANSFER", label: "銀行振込" },
  { value: "PAYPAY", label: "PayPay" },
];

export const CRYPTO_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CRYPTO_BNB", label: "BNB" },
  { value: "CRYPTO_BEP20_USDT", label: "USDT (BEP20)" },
  { value: "CRYPTO_ETH", label: "ETH" },
];

export function providerFor(method: PaymentMethod): PaymentProvider {
  return method.startsWith("CRYPTO_") ? "NOWPAYMENTS" : "KOMOJU";
}
