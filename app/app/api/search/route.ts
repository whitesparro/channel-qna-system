import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "content"; // content|author|top|bottom|most|least
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = 10;
  const skip = (page - 1) * limit;

  if (type === "content") {
    // Substring search across posts + replies
    const [posts, replies, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { author: { select: { displayName: true } }, channel: { select: { name: true } } },
        skip,
        take: limit,
      }),
      prisma.reply.findMany({
        where: { body: { contains: q, mode: "insensitive" } },
        include: { author: { select: { displayName: true } }, post: { select: { id: true, title: true } } },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
          ],
        },
      }),
    ]);
    return NextResponse.json({ posts, replies, total, page });
  }

  if (type === "author") {
    // Content by specific author
    const [posts, replies] = await Promise.all([
      prisma.post.findMany({
        where: { author: { displayName: { contains: q, mode: "insensitive" } } },
        include: { author: { select: { displayName: true } }, channel: { select: { name: true } } },
        skip,
        take: limit,
      }),
      prisma.reply.findMany({
        where: { author: { displayName: { contains: q, mode: "insensitive" } } },
        include: { author: { select: { displayName: true } }, post: { select: { id: true, title: true } } },
        skip,
        take: limit,
      }),
    ]);
    return NextResponse.json({ posts, replies, total: posts.length + replies.length, page });
  }

  if (type === "most") {
    // User with most posts
    const users = await prisma.user.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "desc" } },
      take: limit,
    });
    return NextResponse.json({ users, page });
  }

  if (type === "least") {
    // User with least posts (only users with at least 1 post)
    const users = await prisma.user.findMany({
      where: { posts: { some: {} } },
      include: { _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "asc" } },
      take: limit,
    });
    return NextResponse.json({ users, page });
  }

  if (type === "top") {
    // Highest voted posts
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { displayName: true } },
        channel: { select: { name: true } },
        votes: true,
        _count: { select: { votes: true } },
      },
      skip,
      take: limit,
    });
    const scored = posts
      .map((p) => ({ ...p, score: p.votes.reduce((a, v) => a + v.value, 0) }))
      .sort((a, b) => b.score - a.score);
    return NextResponse.json({ posts: scored, page });
  }

  if (type === "bottom") {
    // Lowest voted posts
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { displayName: true } },
        channel: { select: { name: true } },
        votes: true,
      },
      skip,
      take: limit,
    });
    const scored = posts
      .map((p) => ({ ...p, score: p.votes.reduce((a, v) => a + v.value, 0) }))
      .sort((a, b) => a.score - b.score);
    return NextResponse.json({ posts: scored, page });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
