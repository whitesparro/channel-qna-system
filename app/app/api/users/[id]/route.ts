import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const targetId = Number(id);
  if (targetId === Number(userId)) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await prisma.vote.deleteMany({ where: { userId: targetId } });
  await prisma.reply.updateMany({ where: { authorId: targetId }, data: { authorId: null } });
  await prisma.post.updateMany({ where: { authorId: targetId }, data: { authorId: null } });
  await prisma.channel.updateMany({ where: { creatorId: targetId }, data: { creatorId: null } });
  await prisma.user.delete({ where: { id: targetId } });

  return NextResponse.json({ success: true });
}
