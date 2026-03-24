import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET posts (optionally filter by channel)
export async function GET(req: Request) {
  try {
    console.log("GET posts hit");

    const posts = await prisma.post.findMany();

    console.log("Posts:", posts);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("POSTS ERROR:", error);

    return NextResponse.json(
      { error: "Failed", details: String(error) },
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
        
        channel: {
          connect: { id: Number(channelId) } 
        }
      }
    });

    return NextResponse.json(post);
  } catch (error) {
  console.error("FULL POST ERROR:", error);

  return NextResponse.json(
    { error: "Failed to create post", details: String(error) },
    { status: 500 }
  );
}
}