"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const JPY_METHODS = [
  { value: "CREDIT_CARD", label: "クレジットカード" },
  { value: "KONBINI", label: "コンビニ払い" },
  { value: "BANK_TRANSFER", label: "銀行振込" },
  { value: "PAYPAY", label: "PayPay" },
];

const CRYPTO_METHODS = [
  { value: "CRYPTO_BNB", label: "BNB" },
  { value: "CRYPTO_BEP20_USDT", label: "USDT (BEP20)" },
  { value: "CRYPTO_ETH", label: "ETH" },
];

interface PaymentInfo {
  id: string;
  method: string;
  status: string;
}

export function PaymentForm({
  finalSelectionId,
  payment,
}: {
  finalSelectionId: string;
  payment: PaymentInfo | null;
}) {
  const router = useRouter();
  const [category, setCategory] = useState<"jpy" | "crypto">("jpy");
  const [method, setMethod] = useState(JPY_METHODS[0].value);
  const [current, setCurrent] = useState<PaymentInfo | null>(payment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalSelectionId, method }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "決済の開始に失敗しました。");
      return;
    }
    const { payment: created } = await res.json();
    setCurrent(created);
  }

  async function simulateConfirm() {
    if (!current) return;
    setLoading(true);
    const res = await fetch(`/api/payments/${current.id}/simulate-confirm`, {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => {
            setCategory("jpy");
            setMethod(JPY_METHODS[0].value);
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            category === "jpy" ? "bg-sky-500 text-white" : "border border-slate-300 text-slate-700"
          }`}
        >
          日本円で支払う
        </button>
        <button
          onClick={() => {
            setCategory("crypto");
            setMethod(CRYPTO_METHODS[0].value);
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            category === "crypto" ? "bg-sky-500 text-white" : "border border-slate-300 text-slate-700"
          }`}
        >
          暗号資産で支払う
        </button>
      </div>

      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
      >
        {(category === "jpy" ? JPY_METHODS : CRYPTO_METHODS).map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!current || current.status !== "PENDING" ? (
        <button
          onClick={startPayment}
          disabled={loading}
          className="w-full rounded-md bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
        >
          {loading ? "処理中..." : "支払いを開始する"}
        </button>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            テストモードで動作しています（本番の決済代行APIキー未設定のため、実際の入出金は発生しません）。
            以下のボタンで「入金完了」を疑似的に発生させ、最終選定を確定できます。
          </p>
          <button
            onClick={simulateConfirm}
            disabled={loading}
            className="mt-3 w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "処理中..." : "［サンドボックス］入金完了をシミュレート"}
          </button>
        </div>
      )}
    </div>
  );
}
