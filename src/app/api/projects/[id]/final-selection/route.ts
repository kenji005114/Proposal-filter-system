import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id } = await params;
  const { proposalId } = await req.json();

  const project = await prisma.project.findUnique({
    where: { id },
    include: { finalSelection: true },
  });

  if (!project || project.clientId !== session.user.id) {
    return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  }

  if (project.finalSelection?.status === "CONFIRMED") {
    return NextResponse.json({ error: "既に最終決定済みです。" }, { status: 409 });
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, projectId: id, excluded: false },
  });

  if (!proposal) {
    return NextResponse.json({ error: "候補者が見つかりません。" }, { status: 404 });
  }

  const finalSelection = await prisma.finalSelection.upsert({
    where: { projectId: id },
    update: { proposalId, status: "PENDING_PAYMENT" },
    create: { projectId: id, proposalId, status: "PENDING_PAYMENT" },
  });

  return NextResponse.json({ id: finalSelection.id });
}
