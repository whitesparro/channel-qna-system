import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reply.deleteMany();
  await prisma.post.deleteMany();
  await prisma.channel.deleteMany();

  // Create channel
  const channel = await prisma.channel.create({
    data: {
      name: "general",
      description: "General programming discussion",
    },
  });

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      title: "How do I use React hooks?",
      body: "I am confused about useEffect and useState.",
      channelId: channel.id,
      authorId: 1, // adjust if needed
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "What is Prisma?",
      body: "Can someone explain Prisma ORM simply?",
      channelId: channel.id,
      authorId: 1,
    },
  });

  // Create replies
  const reply1 = await prisma.reply.create({
    data: {
      body: "useState manages state, useEffect handles side effects.",
      postId: post1.id,
      authorId: 1,
    },
  });

  await prisma.reply.create({
    data: {
      body: "Also check the React docs!",
      postId: post1.id,
      parentReplyId: reply1.id,
      authorId: 1,
    },
  });

  console.log("🌱 Seed data created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());