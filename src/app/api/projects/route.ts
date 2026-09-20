import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseProjectBriefCsv, parseProposalsCsv } from "@/lib/csv";
import { scoreProposal } from "@/lib/scoring";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { projectCsv, proposalsCsv } = await req.json();
  if (!projectCsv || !proposalsCsv) {
    return NextResponse.json({ error: "CSVファイルが不足しています。" }, { status: 400 });
  }

  let brief;
  let proposalRows;
  try {
    brief = parseProjectBriefCsv(projectCsv);
    proposalRows = parseProposalsCsv(proposalsCsv);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "CSVの解析に失敗しました。" },
      { status: 400 }
    );
  }

  if (!brief.title) {
    return NextResponse.json({ error: "募集要項CSVにtitle列が必要です。" }, { status: 400 });
  }
  if (proposalRows.length === 0) {
    return NextResponse.json({ error: "提案一覧CSVにデータがありません。" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      clientId: session.user.id,
      title: brief.title,
      description: brief.description,
      budget: brief.budget,
      deadline: brief.deadline,
      proposals: {
        create: proposalRows.map((row) => {
          const result = scoreProposal(row);
          return {
            lancerName: row.lancerName,
            proposalAmount: row.proposalAmount,
            proposalMessage: row.proposalMessage,
            achievementsCount: row.achievementsCount,
            unsatisfiedCount: row.unsatisfiedCount,
            completionRate: row.completionRate,
            badge: row.badge,
            beginnerFriendly: row.beginnerFriendly,
            identityVerified: row.identityVerified,
            ndaVerified: row.ndaVerified,
            phoneVerified: row.phoneVerified,
            lancersCheck: row.lancersCheck,
            score: result.score,
            excluded: result.excluded,
            exclusionReason: result.exclusionReason,
          };
        }),
      },
    },
  });

  return NextResponse.json({ id: project.id });
}
