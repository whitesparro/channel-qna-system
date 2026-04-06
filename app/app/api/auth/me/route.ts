import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const userId = (await cookies()).get("userId")?.value;

  if (!userId) {
    return NextResponse.json(null);
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  return NextResponse.json(user);
}