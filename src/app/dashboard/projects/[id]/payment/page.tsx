import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentForm } from "./payment-form";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { finalSelection: { include: { proposal: true, payment: true } } },
  });

  if (!project || project.clientId !== session.user.id) notFound();
  if (!project.finalSelection) redirect(`/dashboard/projects/${id}`);

  const { finalSelection } = project;

  return (
    <div className="mx-auto max-w-xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">最終選択の決済</h1>
      <p className="mt-2 text-sm text-slate-600">
        プロジェクト「{project.title}」の最終候補者「{finalSelection.proposal.lancerName}」さんを確定するには、決済を完了してください。
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">
        金額: {finalSelection.proposal.proposalAmount?.toLocaleString() ?? "-"} 円
      </p>

      {finalSelection.status === "CONFIRMED" ? (
        <div className="mt-6 rounded-md bg-emerald-50 p-4 text-emerald-800">
          決済が完了し、最終選定が確定しました。
        </div>
      ) : (
        <PaymentForm finalSelectionId={finalSelection.id} payment={finalSelection.payment} />
      )}
    </div>
  );
}
