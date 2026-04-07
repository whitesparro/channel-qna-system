import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

async function collectDescendantIds(replyId: number): Promise<number[]> {
  const children = await prisma.reply.findMany({
    where: { parentReplyId: replyId },
    select: { id: true },
  });
  const ids: number[] = [];
  for (const child of children) {
    ids.push(child.id);
    ids.push(...(await collectDescendantIds(child.id)));
  }
  return ids;
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const replyId = Number(id);

  const descendantIds = await collectDescendantIds(replyId);
  const allIds = [replyId, ...descendantIds];

  await prisma.vote.deleteMany({ where: { replyId: { in: allIds } } });
  await prisma.attachment.deleteMany({ where: { replyId: { in: allIds } } });

  const idsChildrenFirst = [...descendantIds, replyId];
  for (const rid of idsChildrenFirst) {
    await prisma.reply.delete({ where: { id: rid } });
  }

  return NextResponse.json({ success: true });
}
