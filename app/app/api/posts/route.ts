import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// GET POSTS
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channelId = Number(searchParams.get("channelId"));

  const posts = await prisma.post.findMany({
    where: { channelId },
    include: {
      author: {
        select: { displayName: true },
      },
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json(posts);
}

// CREATE POST (ONLY ONE POST HANDLER)
export async function POST(req: Request) {
  const cookieStore = cookies();
  const userId = (await cookieStore).get("userId")?.value;

  //  AUTH CHECK
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { title, body: content, channelId } = body;

  //  VALIDATION
  if (!title || !channelId) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  //  IMPORTANT FIX: CHECK CHANNEL EXISTS
  const channel = await prisma.channel.findUnique({
    where: { id: Number(channelId) },
  });

  if (!channel) {
    return NextResponse.json(
      { error: "Channel does not exist" },
      { status: 400 }
    );
  }

  //  CREATE POST
  const post = await prisma.post.create({
    data: {
      title,
      body: content || "",
      channelId: channel.id,
      authorId: Number(userId),
    },
  });

  return NextResponse.json(post);
}