import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET posts (optionally filter by channel)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    const posts = await prisma.post.findMany({
      where: channelId
        ? { channelId: Number(channelId) }
        : {},
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("GET POSTS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// CREATE post
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { title, body: content, channelId } = body;

    if (!title || !content || !channelId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        body: content,
        channelId: Number(channelId),
        authorId: 1 // temporary (auth comes later)
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("CREATE POST ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}