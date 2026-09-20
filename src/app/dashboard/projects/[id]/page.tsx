import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scoreProposal } from "@/lib/scoring";
import { SelectionPanel } from "./selection-panel";

const BADGE_LABEL: Record<string, string> = {
  CERTIFIED: "認定ランサー",
  SILVER: "シルバー",
  BRONZE: "ブロンズ",
  REGULAR: "レギュラー",
  NONE: "-",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      proposals: true,
      finalSelection: { include: { proposal: true } },
    },
  });

  if (!project || project.clientId !== session.user.id) notFound();

  const ranked = [...project.proposals].sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
    return (b.score ?? -Infinity) - (a.score ?? -Infinity);
  });

  return (
    <div className="mx-auto max-w-5xl flex-1 px-6 py-12">
      <Link href="/dashboard" className="text-sm text-sky-600 hover:underline">
        ← プロジェクト一覧に戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{project.title}</h1>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{project.description}</p>

      {project.finalSelection && (
        <div className="mt-6 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm">
          {project.finalSelection.status === "CONFIRMED" ? (
            <p className="font-semibold text-sky-800">
              最終選定確定済み: {project.finalSelection.proposal.lancerName} さん
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sky-800">
                選択中: {project.finalSelection.proposal.lancerName} さん（決済待ち）
              </p>
              <Link
                href={`/dashboard/projects/${project.id}/payment`}
                className="rounded-md bg-sky-500 px-3 py-1.5 font-semibold text-white hover:bg-sky-400"
              >
                決済へ進む
              </Link>
            </div>
          )}
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold text-slate-900">候補者ランキング（暫定スコア）</h2>
      <p className="mt-1 text-xs text-slate-500">
        ※スコアリング基準は現在調整中の暫定値です。
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4">順位</th>
              <th className="py-2 pr-4">応募者</th>
              <th className="py-2 pr-4">スコア</th>
              <th className="py-2 pr-4">実績/残念</th>
              <th className="py-2 pr-4">完了率</th>
              <th className="py-2 pr-4">バッジ</th>
              <th className="py-2 pr-4">確認状況</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p, index) => {
              const result = scoreProposal(p);
              return (
                <tr
                  key={p.id}
                  className={`border-b border-slate-100 ${p.excluded ? "opacity-50" : ""}`}
                >
                  <td className="py-2 pr-4">{p.excluded ? "-" : index + 1}</td>
                  <td className="py-2 pr-4 font-medium text-slate-900">{p.lancerName}</td>
                  <td className="py-2 pr-4">
                    {p.excluded ? (
                      <span className="text-red-600">{result.exclusionReason}</span>
                    ) : (
                      p.score?.toFixed(1)
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {p.achievementsCount} / {p.unsatisfiedCount}
                  </td>
                  <td className="py-2 pr-4">{p.completionRate}%</td>
                  <td className="py-2 pr-4">
                    {BADGE_LABEL[p.badge]}
                    {p.beginnerFriendly && (
                      <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                        初心者に優しい
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-xs">
                    本人:{p.identityVerified ? "済" : "未"} / 秘密保持:
                    {p.ndaVerified ? "済" : "未"} / 電話:{p.phoneVerified ? "済" : "未"} / チェック:
                    {p.lancersCheck ? "済" : "未"}
                  </td>
                  <td className="py-2 pr-4">
                    {!p.excluded && project.finalSelection?.status !== "CONFIRMED" && (
                      <SelectionPanel projectId={project.id} proposalId={p.id} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
