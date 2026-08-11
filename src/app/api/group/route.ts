import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeUserStats, getChallenge } from "@/lib/challenge";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const challenge = await getChallenge();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, entries: { select: { date: true, count: true } } },
    orderBy: { createdAt: "asc" },
  });

  const members = users.map((u) => {
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
  });

  members.sort((a, b) => b.totalPushups - a.totalPushups);

  return NextResponse.json({ challenge, members });
}
