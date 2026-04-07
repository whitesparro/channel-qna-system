import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// GET vote counts for a post or reply
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const replyId = searchParams.get("replyId");

  const where = postId ? { postId: Number(postId) } : { replyId: Number(replyId) };
  const votes = await prisma.vote.findMany({ where });

  const score = votes.reduce((acc, v) => acc + v.value, 0);
  const ups = votes.filter((v) => v.value === 1).length;
  const downs = votes.filter((v) => v.value === -1).length;

  return NextResponse.json({ score, ups, downs, total: votes.length });
}

// POST: cast or update vote
export async function POST(req: Request) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, replyId, value } = await req.json();
  if (value !== 1 && value !== -1 && value !== 0) {
    return NextResponse.json({ error: "Value must be 1, -1, or 0" }, { status: 400 });
  }
  if (!postId && !replyId) {
    return NextResponse.json({ error: "postId or replyId required" }, { status: 400 });
  }

  const uid = Number(userId);
  const existing = await prisma.vote.findFirst({
    where: {
      userId: uid,
      ...(postId ? { postId: Number(postId) } : { replyId: Number(replyId) }),
    },
  });

  if (value === 0) {
    // Remove vote (neutral)
    if (existing) await prisma.vote.delete({ where: { id: existing.id } });
    return NextResponse.json({ removed: true });
  }

  if (existing) {
    const updated = await prisma.vote.update({
      where: { id: existing.id },
      data: { value },
    });
    return NextResponse.json(updated);
  }

  const vote = await prisma.vote.create({
    data: {
      userId: uid,
      value,
      ...(postId ? { postId: Number(postId) } : { replyId: Number(replyId) }),
    },
  });
  return NextResponse.json(vote);
}
