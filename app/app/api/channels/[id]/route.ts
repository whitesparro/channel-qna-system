import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const channelId = Number(params.id);

  // Get distinct users who have posted in this channel
  const users = await prisma.user.findMany({
    where: {
      posts: {
        some: {
          channelId: channelId,
        },
      },
    },
    select: {
      id: true,
      displayName: true,
      role: true,
    },
  });

  return NextResponse.json(users);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const userId = (await cookieStore).get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.channel.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ success: true });
}