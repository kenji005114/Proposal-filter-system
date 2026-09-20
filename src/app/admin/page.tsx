import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/admin/login");

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl flex-1 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">管理者ページ</h1>
          <p className="mt-1 text-sm text-slate-600">登録済みクライアント一覧</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            ログアウト
          </button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="px-4 py-2">メールアドレス</th>
              <th className="px-4 py-2">名前</th>
              <th className="px-4 py-2">登録日</th>
              <th className="px-4 py-2">プロジェクト数</th>
              <th className="px-4 py-2">ログイン方法</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-900">{client.email}</td>
                <td className="px-4 py-2">{client.name ?? "-"}</td>
                <td className="px-4 py-2">
                  {client.createdAt.toLocaleDateString("ja-JP")}
                </td>
                <td className="px-4 py-2">{client._count.projects}</td>
                <td className="px-4 py-2">
                  {client.passwordHash ? "メール/パスワード" : "Google"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <p className="p-4 text-sm text-slate-500">
            まだ登録されているクライアントはいません。
          </p>
        )}
      </div>
    </div>
  );
}
