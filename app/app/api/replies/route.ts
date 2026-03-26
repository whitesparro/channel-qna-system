import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET replies for a post
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    const replies = await prisma.reply.findMany({
      where: {
        postId: postId ? Number(postId) : undefined,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(replies);
  } catch (error) {
    console.error("GET REPLIES ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// CREATE reply
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { body: content, postId, parentReplyId } = body;

    if (!content || !postId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const reply = await prisma.reply.create({
      data: {
        body: content,
        postId: Number(postId),
        parentReplyId: parentReplyId
          ? Number(parentReplyId)
          : null,
        authorId: null, // no auth yet
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error("CREATE REPLY ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}