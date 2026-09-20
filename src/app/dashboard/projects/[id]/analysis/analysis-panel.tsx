"use client";

import { useState } from "react";

interface Item {
  id: string;
  category: string;
  content: string;
  source: string;
  excluded: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  TITLE: "タイトル",
  DEADLINE: "納期",
  BUDGET: "予算",
  DETAIL: "詳細内容",
  DESIRED: "希望事項",
  AVOID: "避けたい事項",
  ONLINE_MEETING: "オンラインミーティング対応可否",
  OTHER: "追加事項",
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

export function AnalysisPanel({
  projectId,
  initialItems,
}: {
  projectId: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [newCategory, setNewCategory] = useState("OTHER");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleExcluded(item: Item) {
    const nextExcluded = !item.excluded;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, excluded: nextExcluded } : i)));
    await fetch(`/api/projects/${projectId}/brief-analysis/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excluded: nextExcluded }),
    });
  }

  async function deleteItem(item: Item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/projects/${projectId}/brief-analysis/${item.id}`, { method: "DELETE" });
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/projects/${projectId}/brief-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCategory, content: newContent }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "追加に失敗しました。");
      return;
    }

    const { item } = await res.json();
    setItems((prev) => [...prev, item]);
    setNewContent("");
  }

  return (
    <div className="mt-8 space-y-8">
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = items.filter((item) => item.category === category);
        if (categoryItems.length === 0 && category === "OTHER") return null;

        return (
          <div key={category}>
            <h2 className="font-semibold text-slate-900">{CATEGORY_LABELS[category]}</h2>
            {categoryItems.length === 0 ? (
              <p className="mt-1 text-sm text-slate-400">
                未検出（下のフォームから追加できます）
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm ${
                      item.excluded ? "opacity-40" : ""
                    }`}
                  >
                    <label className="flex flex-1 items-start gap-2">
                      <input
                        type="checkbox"
                        checked={!item.excluded}
                        onChange={() => toggleExcluded(item)}
                        className="mt-1"
                      />
                      <span className="whitespace-pre-wrap">{item.content}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteItem(item)}
                      className="shrink-0 text-xs text-red-500 hover:underline"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <form onSubmit={addItem} className="rounded-md border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">追加事項の入力</h2>
        <p className="mt-1 text-xs text-slate-500">
          自動分析で見落とされている項目があれば、こちらから追加してください。
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <input
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="内容を入力"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50"
          >
            追加
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
