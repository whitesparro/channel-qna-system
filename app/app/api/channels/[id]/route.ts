import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await prisma.channel.findUnique({
    where: { id: Number(id) },
    include: { creator: { select: { displayName: true } } },
  });
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(channel);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const channelId = Number(id);

  const posts = await prisma.post.findMany({ where: { channelId }, select: { id: true } });
  const postIds = posts.map((p) => p.id);
  const replies = await prisma.reply.findMany({ where: { postId: { in: postIds } }, select: { id: true } });
  const replyIds = replies.map((r) => r.id);

  await prisma.vote.deleteMany({ where: { OR: [{ postId: { in: postIds } }, { replyId: { in: replyIds } }] } });
  await prisma.attachment.deleteMany({ where: { OR: [{ postId: { in: postIds } }, { replyId: { in: replyIds } }] } });
  await prisma.reply.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.post.deleteMany({ where: { channelId } });
  await prisma.channel.delete({ where: { id: channelId } });

  return NextResponse.json({ success: true });
}
