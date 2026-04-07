import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const channels = await prisma.channel.findMany({
    include: { creator: { select: { displayName: true } }, _count: { select: { posts: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(channels);
}

export async function POST(req: Request) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
  }
  if (body.name.length > 50) {
    return NextResponse.json({ error: "Channel name too long" }, { status: 400 });
  }

  try {
    const channel = await prisma.channel.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() ?? "",
        creatorId: Number(userId),
      },
    });
    return NextResponse.json(channel);
  } catch {
    return NextResponse.json({ error: "Channel name already taken" }, { status: 400 });
  }
}
