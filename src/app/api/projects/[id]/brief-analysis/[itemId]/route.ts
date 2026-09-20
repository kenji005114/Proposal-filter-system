import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedItem(id: string, itemId: string, clientId: string) {
  const item = await prisma.briefAnalysisItem.findUnique({
    where: { id: itemId },
    include: { project: true },
  });
  if (!item || item.projectId !== id || item.project.clientId !== clientId) return null;
  return item;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id, itemId } = await params;
  const item = await getOwnedItem(id, itemId, session.user.id);
  if (!item) {
    return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  }

  const { excluded } = await req.json();
  const updated = await prisma.briefAnalysisItem.update({
    where: { id: itemId },
    data: { excluded: Boolean(excluded) },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id, itemId } = await params;
  const item = await getOwnedItem(id, itemId, session.user.id);
  if (!item) {
    return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  }

  await prisma.briefAnalysisItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
