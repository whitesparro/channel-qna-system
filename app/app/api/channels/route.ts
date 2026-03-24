import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all channels
export async function GET() {
  try {
    console.log("GET channels hit");

    const channels = await prisma.channel.findMany();

    console.log("Channels:", channels);

    return NextResponse.json(channels);
  } catch (error) {
    console.error("CHANNEL ERROR:", error);

    return NextResponse.json(
      { error: "Failed", details: String(error) },
      { status: 500 }
    );
  }
}

// CREATE a channel
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.create({
      data: {
        name: body.name,
        description: body.description ?? "",
        creatorId: undefined // ✅ FIX: satisfies Prisma relation
      }
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("CREATE CHANNEL ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}