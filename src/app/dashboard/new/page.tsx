"use client";

import { useState } from "react";
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
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [proposalsFile, setProposalsFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectFile || !proposalsFile) {
      setError("両方のCSVファイルを選択してください。");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const [projectCsv, proposalsCsv] = await Promise.all([
        readFile(projectFile),
        readFile(proposalsFile),
      ]);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectCsv, proposalsCsv }),
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
        募集要項CSVと、Lancersの提案一覧をまとめたCSVをそれぞれアップロードしてください。
        フォーマットは{" "}
        <a href="/samples/project-brief-sample.csv" className="text-sky-600 hover:underline">
          募集要項サンプル
        </a>{" "}
        /{" "}
        <a href="/samples/proposals-sample.csv" className="text-sky-600 hover:underline">
          提案一覧サンプル
        </a>{" "}
        をご参照ください。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">募集要項CSV</label>
          <input
            required
            type="file"
            accept=".csv"
            onChange={(e) => setProjectFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">提案一覧CSV</label>
          <input
            required
            type="file"
            accept=".csv"
            onChange={(e) => setProposalsFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
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
