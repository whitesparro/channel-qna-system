import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  await prisma.vote.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.post.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: { displayName: "admin", passwordHash: adminHash, role: "ADMIN" },
  });

  const aliceHash = await bcrypt.hash("password123", 10);
  const alice = await prisma.user.create({
    data: { displayName: "alice", passwordHash: aliceHash, role: "USER" },
  });

  const bobHash = await bcrypt.hash("password123", 10);
  const bob = await prisma.user.create({
    data: { displayName: "bob", passwordHash: bobHash, role: "USER" },
  });

  const general = await prisma.channel.create({
    data: { name: "general", description: "General programming discussion", creatorId: admin.id },
  });
  const javascript = await prisma.channel.create({
    data: { name: "javascript", description: "JavaScript tips and questions", creatorId: alice.id },
  });
  const python = await prisma.channel.create({
    data: { name: "python", description: "Python programming help", creatorId: bob.id },
  });

  const post1 = await prisma.post.create({
    data: { title: "How do I use React hooks?", body: "I am confused about useEffect and useState. Can someone explain when to use each one?", channelId: general.id, authorId: alice.id },
  });
  const post2 = await prisma.post.create({
    data: { title: "What is Prisma ORM?", body: "Can someone explain Prisma ORM simply? I keep hearing about it.", channelId: general.id, authorId: bob.id },
  });
  const post3 = await prisma.post.create({
    data: { title: "Arrow functions vs regular functions", body: "What is the difference between arrow functions and regular functions in JavaScript?", channelId: javascript.id, authorId: alice.id },
  });
  const post4 = await prisma.post.create({
    data: { title: "List comprehensions in Python", body: "How do list comprehensions work? Are they always faster than loops?", channelId: python.id, authorId: bob.id },
  });

  const reply1 = await prisma.reply.create({
    data: { body: "useState manages state in functional components. useEffect handles side effects like API calls.", postId: post1.id, authorId: admin.id },
  });
  await prisma.reply.create({
    data: { body: "Also check the React docs — they have great examples for both hooks!", postId: post1.id, parentReplyId: reply1.id, authorId: bob.id },
  });
  await prisma.reply.create({
    data: { body: "Prisma is a type-safe ORM. You define your schema in a .prisma file and it generates a client.", postId: post2.id, authorId: alice.id },
  });
  const reply4 = await prisma.reply.create({
    data: { body: "Arrow functions don't have their own 'this' binding — that's the key difference.", postId: post3.id, authorId: admin.id },
  });
  await prisma.reply.create({
    data: { body: "Right! So use regular functions when you need 'this' to refer to the calling context.", postId: post3.id, parentReplyId: reply4.id, authorId: bob.id },
  });
  await prisma.reply.create({
    data: { body: "List comprehensions are more Pythonic and often faster, but readability matters too.", postId: post4.id, authorId: alice.id },
  });

  await prisma.vote.create({ data: { userId: bob.id, postId: post1.id, value: 1 } });
  await prisma.vote.create({ data: { userId: alice.id, postId: post2.id, value: 1 } });
  await prisma.vote.create({ data: { userId: admin.id, postId: post3.id, value: 1 } });
  await prisma.vote.create({ data: { userId: alice.id, replyId: reply1.id, value: 1 } });

  console.log("✅ Seed complete. Admin: admin/admin123 | Users: alice/password123, bob/password123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
