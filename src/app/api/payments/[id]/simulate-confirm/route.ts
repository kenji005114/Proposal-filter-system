import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * サンドボックス専用: 決済代行業者からのWebhook受信を模擬し、入金完了として扱う。
 * 本番導入時はKomoju/NOWPaymentsのWebhook検証ハンドラに置き換える。
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { finalSelection: { include: { project: true } } },
  });

  if (!payment || payment.finalSelection.project.clientId !== session.user.id) {
    return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  }

  await prisma.payment.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });

  await prisma.finalSelection.update({
    where: { id: payment.finalSelectionId },
    data: { status: "CONFIRMED" },
  });

  return NextResponse.json({ ok: true });
}
