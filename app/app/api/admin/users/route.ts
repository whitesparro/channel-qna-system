import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      displayName: true,
      role: true,
      _count: { select: { posts: true, replies: true } },
    },
    orderBy: { displayName: "asc" },
  });
  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const userId = (await cookies()).get("userId")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (caller?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, role } = await req.json();
  if (!id || !role) return NextResponse.json({ error: "id and role required" }, { status: 400 });
  if (!["USER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (id === Number(userId)) return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: Number(id) },
    data: { role },
    select: { id: true, displayName: true, role: true },
  });
  return NextResponse.json(updated);
}
