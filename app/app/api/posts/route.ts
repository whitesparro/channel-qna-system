import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channelId = Number(searchParams.get("channelId"));

  const posts = await prisma.post.findMany({
    where: { channelId },
    include: {
      author: { select: { displayName: true } },
      attachments: true,
      votes: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, body: content, channelId } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "Title too long" }, { status: 400 });
  if (!channelId) return NextResponse.json({ error: "channelId required" }, { status: 400 });

  const channel = await prisma.channel.findUnique({ where: { id: Number(channelId) } });
  if (!channel) return NextResponse.json({ error: "Channel does not exist" }, { status: 400 });

  const post = await prisma.post.create({
    data: {
      title: title.trim(),
      body: content?.trim() || "",
      channelId: channel.id,
      authorId: Number(userId),
    },
  });

  return NextResponse.json(post);
}
