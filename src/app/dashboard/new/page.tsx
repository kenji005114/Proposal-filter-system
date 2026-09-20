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

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proposalsFile, setProposalsFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proposalsFile) {
      setError("提案一覧CSVを選択してください。");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const proposalsCsv = await readFile(proposalsFile);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, budget, deadline, proposalsCsv }),
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
    <div className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">CSVから新規プロジェクト作成</h1>
      <p className="mt-2 text-sm text-slate-600">
        タイトルと募集要項を入力し、Lancersの提案一覧をまとめたCSVをアップロードしてください。
        フォーマットは{" "}
        <a href="/samples/proposals-sample.csv" className="text-sky-600 hover:underline">
          提案一覧サンプル
        </a>{" "}
        をご参照ください。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">タイトル</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">提案一覧CSV</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setProposalsFile(e.target.files?.[0] ?? null)}
          />
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              CSVを選択
            </button>
            <span className="text-sm text-slate-500">
              {proposalsFile ? proposalsFile.name : "ファイルが選択されていません"}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">募集要項</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="プロジェクトの募集要項を入力してください。"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">予算（円・任意）</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">納期（任意）</label>
            <input
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="例: 2026-10-31"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
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
