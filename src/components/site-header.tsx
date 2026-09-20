"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold text-slate-900">
          候補者セレクター
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {status === "authenticated" ? (
            <>
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                ダッシュボード
              </Link>
              <span className="text-slate-400">{session.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-400"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
