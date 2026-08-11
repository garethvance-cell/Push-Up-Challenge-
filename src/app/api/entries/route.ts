import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dateKey, parseDateKey, todayUTC } from "@/lib/challenge";

const postSchema = z.object({
  count: z.number().int().min(1).max(2000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(140).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dateParam = req.nextUrl.searchParams.get("date");
  const where = dateParam
    ? { userId: user.id, date: parseDateKey(dateParam) }
    : { userId: user.id };

  const entries = await prisma.entry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: dateParam ? undefined : 500,
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      date: dateKey(e.date),
      count: e.count,
      note: e.note,
      createdAt: e.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { count, note } = parsed.data;
  const date = parsed.data.date ? parseDateKey(parsed.data.date) : todayUTC();

  if (date > todayUTC()) {
    return NextResponse.json({ error: "Can't log push-ups for a future date." }, { status: 400 });
  }

  const entry = await prisma.entry.create({
    data: { userId: user.id, date, count, note },
  });

  return NextResponse.json({
    entry: { id: entry.id, date: dateKey(entry.date), count: entry.count, note: entry.note, createdAt: entry.createdAt },
  });
}
