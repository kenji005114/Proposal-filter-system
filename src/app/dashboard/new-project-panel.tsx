"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

export function NewProjectPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proposalsFile, setProposalsFile] = useState<File | null>(null);
  const [briefText, setBriefText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proposalsFile) {
      setError("CSVファイルをアップロードしてください。");
      return;
    }
    if (!briefText.trim()) {
      setError("募集要項を入力してください。");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const proposalsCsv = await readFile(proposalsFile);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefText, proposalsCsv }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "インポートに失敗しました。");
        setLoading(false);
        return;
      }

      const { id } = await res.json();
      router.push(`/dashboard/projects/${id}`);
    } catch {
      setError("CSVの読み込みに失敗しました。");
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-slate-200 p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => setProposalsFile(e.target.files?.[0] ?? null)}
      />

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">CSVから新規プロジェクト作成</h2>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
        >
          + CSVから新規プロジェクト
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {proposalsFile ? `選択中のファイル: ${proposalsFile.name}` : "CSVファイルが選択されていません"}
        {" "}(
        <a href="/samples/proposals-sample.csv" className="text-sky-600 hover:underline">
          提案一覧サンプル
        </a>
        )
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">募集要項</label>
          <p className="mt-1 text-xs text-slate-500">
            タイトル・内容・納期・予算などをまとめて入力してください（1行目がタイトルとして扱われます）。
            「納期：2026-10-31」「予算：300,000円」のように書いていただくと、該当項目を自動で抽出します。
          </p>
          <textarea
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            rows={10}
            placeholder={
              "ECサイトのトップページデザイン制作\n\nレスポンシブ対応のECサイトトップページをデザインしていただける方を募集します。\n\n予算：300,000円\n納期：2026-10-31"
            }
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
        >
          {loading ? "インポート中..." : "インポートしてランキング作成"}
        </button>
      </form>
    </div>
  );
}
