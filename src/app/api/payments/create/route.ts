import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { providerFor } from "@/lib/payments";
import type { PaymentMethod } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { finalSelectionId, method } = await req.json();
  if (!finalSelectionId || !method) {
    return NextResponse.json({ error: "パラメータが不足しています。" }, { status: 400 });
  }

  const finalSelection = await prisma.finalSelection.findUnique({
    where: { id: finalSelectionId },
    include: { project: true, proposal: true },
  });

  if (!finalSelection || finalSelection.project.clientId !== session.user.id) {
    return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
  }

  if (finalSelection.status === "CONFIRMED") {
    return NextResponse.json({ error: "既に決済が完了しています。" }, { status: 409 });
  }

  const amountJpy = finalSelection.proposal.proposalAmount ?? 0;
  const provider = providerFor(method as PaymentMethod);

  const payment = await prisma.payment.upsert({
    where: { finalSelectionId },
    update: { method, provider, status: "PENDING", amountJpy },
    create: { finalSelectionId, method, provider, status: "PENDING", amountJpy },
  });

  return NextResponse.json({ payment });
}
