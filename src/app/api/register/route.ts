import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "入力内容を確認してください（パスワードは8文字以上）。" },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.client.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています。" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await prisma.client.create({
    data: { name, email, passwordHash },
  });

  return NextResponse.json({ id: client.id });
}
