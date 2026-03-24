import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type CreatePostBody = {
  title?: string;
  body?: string;
  channelId?: number;
  authorId?: number;
};

// GET all posts
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        channel: true,
        author: true,
        replies: true
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// CREATE a post
export async function POST(req: Request) {
  try {
    const body: CreatePostBody = await req.json();

    if (!body.title || !body.body || !body.channelId || !body.authorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title: body.title,
        body: body.body,
        channelId: body.channelId,
        authorId: body.authorId
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
