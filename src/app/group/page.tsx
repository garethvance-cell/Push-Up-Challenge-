import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeUserStats, getChallenge } from "@/lib/challenge";
import NavBar from "@/components/NavBar";
import GroupClient from "@/components/GroupClient";

export default async function GroupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const challenge = await getChallenge();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, entries: { select: { date: true, count: true } } },
    orderBy: { createdAt: "asc" },
  });

  const members = users
    .map((u) => {
      const stats = computeUserStats(u.entries, challenge);
      const currentWeek = stats.weekly[0] ?? null;
      return {
        id: u.id,
        name: u.name,
        isMe: u.id === user.id,
        todayTotal: stats.today.total,
        todayGoal: stats.today.goal,
        currentWeekTotal: currentWeek?.total ?? 0,
        currentWeekGoal: challenge.weeklyGoal,
        currentWeekOnPace: (currentWeek?.total ?? 0) >= challenge.weeklyGoal,
        weeksFailed: stats.stakes.weeksFailed,
        weeksPassed: stats.stakes.weeksPassed,
        amountOwed: stats.stakes.amountOwed,
        totalPushups: stats.annual.totalPushups,
        percentComplete: stats.annual.percentComplete,
        currentStreak: stats.annual.currentStreak,
      };
    })
    .sort((a, b) => b.totalPushups - a.totalPushups);

  return (
    <div>
      <NavBar userName={user.name} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <GroupClient members={members} stakeAmount={challenge.stakeAmount} />
      </main>
    </div>
  );
}
