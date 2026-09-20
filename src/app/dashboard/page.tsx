import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { finalSelection: true, proposals: true },
  });

  return (
    <div className="mx-auto max-w-5xl flex-1 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">プロジェクト一覧</h1>
        <Link
          href="/dashboard/new"
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
        >
          + CSVから新規プロジェクト
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 text-slate-600">
          まだプロジェクトがありません。募集要項と提案一覧のCSVをインポートして始めましょう。
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {projects.map((project) => (
            <li key={project.id} className="p-4 hover:bg-slate-50">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <p className="text-sm text-slate-500">候補者 {project.proposals.length}名</p>
                </div>
                <span className="text-sm text-slate-500">
                  {project.finalSelection?.status === "CONFIRMED"
                    ? "選定確定済み"
                    : project.finalSelection?.status === "PENDING_PAYMENT"
                      ? "決済待ち"
                      : "選定中"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
