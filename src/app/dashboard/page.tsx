import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dateKey, getChallenge, todayUTC } from "@/lib/challenge";
import NavBar from "@/components/NavBar";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const challenge = await getChallenge();
  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const initialEntries = entries.map((e) => ({
    id: e.id,
    date: dateKey(e.date),
    count: e.count,
    note: e.note,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div>
      <NavBar userName={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <DashboardClient
          initialEntries={initialEntries}
          dailyGoal={challenge.dailyGoal}
          todayKey={dateKey(todayUTC())}
        />
      </main>
    </div>
  );
}
