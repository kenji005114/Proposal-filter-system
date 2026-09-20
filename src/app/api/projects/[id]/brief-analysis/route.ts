import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analyzeBriefItems } from "@/lib/brief";
import type { BriefItemCategory } from "@prisma/client";

async function getOwnedProject(id: string, clientId: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.clientId !== clientId) return null;
  return project;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getOwnedProject(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  }

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

  return NextResponse.json({ items });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id } = await params;
  const project = await getOwnedProject(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  }

  const { category, content } = await req.json();
  if (!category || !content?.trim()) {
    return NextResponse.json({ error: "カテゴリと内容を入力してください。" }, { status: 400 });
  }

  const item = await prisma.briefAnalysisItem.create({
    data: {
      projectId: id,
      category: category as BriefItemCategory,
      content: String(content).trim(),
      source: "MANUAL",
    },
  });

  return NextResponse.json({ item });
}
