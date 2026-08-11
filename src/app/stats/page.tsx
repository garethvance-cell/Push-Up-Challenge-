import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeUserStats, dateKey, getChallenge } from "@/lib/challenge";
import NavBar from "@/components/NavBar";
import StatsClient from "@/components/StatsClient";

export default async function StatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const challenge = await getChallenge();
  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    select: { date: true, count: true },
  });

  const stats = computeUserStats(entries, challenge);

  const serialized = {
    ...stats,
    weekly: stats.weekly.map((w) => ({
      ...w,
      start: dateKey(w.start),
      end: dateKey(w.end),
    })),
  };

  return (
    <div>
      <NavBar userName={user.name} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <StatsClient stats={serialized} challengeName={challenge.name} stakeAmount={challenge.stakeAmount} />
      </main>
    </div>
  );
}
