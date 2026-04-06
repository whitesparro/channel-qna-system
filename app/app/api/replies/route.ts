import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

// GET REPLIES
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  const replies = await prisma.reply.findMany({
    where: {
      postId: Number(postId),
    },
    orderBy: {
      id: "asc",
    },
  });

  return NextResponse.json(replies);
}

// CREATE REPLY (PROTECTED)
export async function POST(req: Request) {
  try {
    const userId = (await cookies()).get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { body, postId, parentReplyId } = await req.json();

    if (!body || !postId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const reply = await prisma.reply.create({
      data: {
        body,
        postId: Number(postId),
        parentReplyId: parentReplyId
          ? Number(parentReplyId)
          : null,
        authorId: Number(userId),
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}