import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.reply.deleteMany();
  await prisma.post.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.user.deleteMany(); // ADD THIS

  // CREATE USER FIRST
  const user = await prisma.user.create({
    data: {
      displayName: "Demo User",
      passwordHash: "hashedpassword",
      role: "USER",
    },
  });

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
      authorId: user.id, //  FIXED
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "What is Prisma?",
      body: "Can someone explain Prisma ORM simply?",
      channelId: channel.id,
      authorId: user.id, //  FIXED
    },
  });

  // Create replies
  const reply1 = await prisma.reply.create({
    data: {
      body: "useState manages state, useEffect handles side effects.",
      postId: post1.id,
      authorId: user.id, //  FIXED
    },
  });

  await prisma.reply.create({
    data: {
      body: "Prisma is an ORM that simplifies database access.",
      postId: post2.id,
      authorId: user.id, //  FIXED
    },
  });

  await prisma.reply.create({
    data: {
      body: "Also check the React docs!",
      postId: post1.id,
      parentReplyId: reply1.id,
      authorId: user.id, //  FIXED
    },
  });

  console.log(" Seed data created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());