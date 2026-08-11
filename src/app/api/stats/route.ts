import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeUserStats, getChallenge } from "@/lib/challenge";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const challenge = await getChallenge();
  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    select: { date: true, count: true },
  });

  const stats = computeUserStats(entries, challenge);
  return NextResponse.json({ stats, challenge });
}
