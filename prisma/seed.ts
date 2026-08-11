import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const startDate = process.env.CHALLENGE_START_DATE
    ? new Date(process.env.CHALLENGE_START_DATE)
    : new Date(new Date().toISOString().slice(0, 10));

  await prisma.challenge.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "100 Push-Ups a Day Challenge",
      startDate,
      durationDays: 365,
      dailyGoal: 100,
      weeklyGoal: 700,
      stakeAmount: 500,
    },
  });

  console.log(`Challenge seeded with start date ${startDate.toISOString().slice(0, 10)}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
