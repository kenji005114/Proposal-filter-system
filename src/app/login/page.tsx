"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません。");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">ログイン</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
          <label className="block text-sm font-medium text-slate-700">パスワード</label>
          <input
            required
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
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">または</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
      >
        Googleアカウントでログイン
      </button>

      <p className="mt-6 text-sm text-slate-600">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="text-sky-600 hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
