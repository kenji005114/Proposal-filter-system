import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeBriefItems } from "@/lib/brief";
import type { BriefItemCategory } from "@prisma/client";
import { AnalysisPanel } from "./analysis-panel";

export default async function BriefAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.clientId !== session.user.id) notFound();

  const existingCount = await prisma.briefAnalysisItem.count({ where: { projectId: id } });
  if (existingCount === 0) {
    const analyzed = analyzeBriefItems(project.description);
    if (analyzed.length > 0) {
      await prisma.briefAnalysisItem.createMany({
        data: analyzed.map((item) => ({
          projectId: id,
          category: item.category as BriefItemCategory,
          content: item.content,
        })),
      });
    }
  }

  const items = await prisma.briefAnalysisItem.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <Link href={`/dashboard/projects/${id}`} className="text-sm text-sky-600 hover:underline">
        ← プロジェクトに戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">募集要項分析</h1>
      <p className="mt-1 text-sm text-slate-600">{project.title}</p>
      <p className="mt-1 text-xs text-slate-400">
        ルールベースの自動抽出のため、見落としや誤検出がある場合は下記から追加・除外してください。
      </p>

      <AnalysisPanel projectId={id} initialItems={items} />
    </div>
  );
}
