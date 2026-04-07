import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const postId = Number(params.id);
  const replies = await prisma.reply.findMany({ where: { postId }, select: { id: true } });
  const replyIds = replies.map((r) => r.id);

  await prisma.vote.deleteMany({ where: { OR: [{ postId }, { replyId: { in: replyIds } }] } });
  await prisma.attachment.deleteMany({ where: { OR: [{ postId }, { replyId: { in: replyIds } }] } });
  await prisma.reply.deleteMany({ where: { postId } });
  await prisma.post.delete({ where: { id: postId } });

  return NextResponse.json({ message: "Post deleted" });
}
