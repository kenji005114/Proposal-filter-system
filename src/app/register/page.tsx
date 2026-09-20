"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "登録に失敗しました。");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">新規登録</h1>
      <p className="mt-2 text-sm text-slate-600">
        クライアントとしてシステムに登録します。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">お名前</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">メールアドレス</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">パスワード（8文字以上）</label>
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
        >
          {loading ? "登録中..." : "登録する"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        すでに登録済みの方は{" "}
        <Link href="/login" className="text-sky-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
