"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SelectionPanel({
  projectId,
  proposalId,
}: {
  projectId: string;
  proposalId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/final-selection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/dashboard/projects/${projectId}/payment`);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-sky-500 px-2 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-50 disabled:opacity-50"
    >
      最終選択
    </button>
  );
}
