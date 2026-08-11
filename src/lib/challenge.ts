import "server-only";
import { prisma } from "./prisma";

export type ChallengeConfig = {
  id: string;
  name: string;
  startDate: Date;
  durationDays: number;
  dailyGoal: number;
  weeklyGoal: number;
  stakeAmount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** All day math is done in UTC so every participant shares the same
 * day/week boundaries regardless of local timezone. */
export function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function todayUTC(): Date {
  return utcMidnight(new Date());
}

export function dateKey(d: Date): string {
  return utcMidnight(d).toISOString().slice(0, 10);
}

export function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((utcMidnight(b).getTime() - utcMidnight(a).getTime()) / DAY_MS);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

let cachedChallenge: ChallengeConfig | null = null;

/** Fetches the single shared Challenge row, seeding sensible defaults
 * on first access if it doesn't exist yet. */
export async function getChallenge(): Promise<ChallengeConfig> {
  if (cachedChallenge) return cachedChallenge;

  let challenge = await prisma.challenge.findUnique({ where: { id: "default" } });
  if (!challenge) {
    challenge = await prisma.challenge.create({
      data: {
        id: "default",
        name: "100 Push-Ups a Day Challenge",
        startDate: todayUTC(),
        durationDays: 365,
        dailyGoal: 100,
        weeklyGoal: 700,
        stakeAmount: 500,
      },
    });
  }

  cachedChallenge = challenge;
  return challenge;
}

export type WeekSummary = {
  weekIndex: number;
  start: Date;
  end: Date;
  total: number;
  goal: number;
  pass: boolean;
  isComplete: boolean;
  owesStake: boolean;
};

export type MonthSummary = {
  key: string;
  label: string;
  total: number;
  goal: number;
  daysLogged: number;
  daysInMonth: number;
};

export type DayEntry = { date: Date; count: number };

export type UserStats = {
  today: { date: string; total: number; goal: number; percent: number };
  daily: { date: string; total: number }[];
  weekly: WeekSummary[];
  monthly: MonthSummary[];
  annual: {
    totalPushups: number;
    goalToDate: number;
    challengeGoal: number;
    daysElapsed: number;
    daysCompleted: number;
    daysRemaining: number;
    currentStreak: number;
    longestStreak: number;
    percentComplete: number;
    onPace: boolean;
  };
  stakes: {
    weeksCompleted: number;
    weeksPassed: number;
    weeksFailed: number;
    amountOwed: number;
    stakeAmount: number;
  };
};

/** Groups raw entries by day, summing multi-entry days into one total. */
export function sumByDay(entries: DayEntry[]): Map<string, number> {
  const byDay = new Map<string, number>();
  for (const e of entries) {
    const key = dateKey(e.date);
    byDay.set(key, (byDay.get(key) ?? 0) + e.count);
  }
  return byDay;
}

export function computeUserStats(
  entries: DayEntry[],
  challenge: ChallengeConfig,
  now: Date = new Date()
): UserStats {
  const today = todayUTC();
  const start = utcMidnight(challenge.startDate);
  const byDay = sumByDay(entries);

  const daysElapsedRaw = daysBetween(start, today) + 1;
  const daysElapsed = Math.min(Math.max(daysElapsedRaw, 0), challenge.durationDays);
  const challengeEnd = addDays(start, challenge.durationDays - 1);
  const lastTrackedDay = today < challengeEnd ? today : challengeEnd;

  // ---- Daily series (whole challenge to date) ----
  const daily: { date: string; total: number }[] = [];
  for (let i = 0; i < daysElapsed; i++) {
    const d = addDays(start, i);
    if (d > lastTrackedDay) break;
    daily.push({ date: dateKey(d), total: byDay.get(dateKey(d)) ?? 0 });
  }

  const todayTotal = byDay.get(dateKey(today)) ?? 0;

  // ---- Weekly summaries (7-day blocks anchored to start date) ----
  const totalWeeks = Math.ceil(challenge.durationDays / 7);
  const currentWeekIndex = Math.floor(daysBetween(start, today) / 7);
  const weekly: WeekSummary[] = [];
  for (let w = 0; w <= Math.min(currentWeekIndex, totalWeeks - 1); w++) {
    const wStart = addDays(start, w * 7);
    const wEndRaw = addDays(wStart, 6);
    const wEnd = wEndRaw > challengeEnd ? challengeEnd : wEndRaw;
    let total = 0;
    for (let d = wStart; d <= wEnd; d = addDays(d, 1)) {
      total += byDay.get(dateKey(d)) ?? 0;
    }
    const isComplete = today > wEnd;
    const pass = total >= challenge.weeklyGoal;
    weekly.push({
      weekIndex: w,
      start: wStart,
      end: wEnd,
      total,
      goal: challenge.weeklyGoal,
      pass,
      isComplete,
      owesStake: isComplete && !pass,
    });
  }
  weekly.reverse(); // most recent first

  // ---- Monthly summaries ----
  const monthMap = new Map<string, MonthSummary>();
  for (let d = start; d <= lastTrackedDay; d = addDays(d, 1)) {
    const key = monthKey(d);
    const existing = monthMap.get(key);
    const total = byDay.get(dateKey(d)) ?? 0;
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    if (existing) {
      existing.total += total;
      existing.daysLogged += 1;
    } else {
      monthMap.set(key, {
        key,
        label,
        total,
        goal: challenge.dailyGoal, // multiplied below once days-in-range known
        daysLogged: 1,
        daysInMonth,
      });
    }
  }
  // Recompute each month's goal as dailyGoal * (days of that month within the challenge range)
  const monthly = Array.from(monthMap.values()).map((m) => ({
    ...m,
    goal: m.daysLogged > 0 ? challenge.dailyGoal * m.daysLogged : m.goal,
  }));
  monthly.reverse();

  // ---- Annual / whole-challenge stats ----
  const totalPushups = daily.reduce((sum, d) => sum + d.total, 0);
  const daysCompleted = daily.filter((d) => d.total >= challenge.dailyGoal).length;
  const goalToDate = daysElapsed * challenge.dailyGoal;
  const challengeGoal = challenge.durationDays * challenge.dailyGoal;

  let currentStreak = 0;
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].total >= challenge.dailyGoal) currentStreak++;
    else break;
  }
  let longestStreak = 0;
  let running = 0;
  for (const d of daily) {
    if (d.total >= challenge.dailyGoal) {
      running++;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }

  // ---- Stake tracking ----
  const completedWeeks = weekly.filter((w) => w.isComplete);
  const weeksFailed = completedWeeks.filter((w) => !w.pass).length;
  const weeksPassed = completedWeeks.filter((w) => w.pass).length;

  return {
    today: {
      date: dateKey(today),
      total: todayTotal,
      goal: challenge.dailyGoal,
      percent: Math.min(100, Math.round((todayTotal / challenge.dailyGoal) * 100)),
    },
    daily: daily.slice().reverse(),
    weekly,
    monthly,
    annual: {
      totalPushups,
      goalToDate,
      challengeGoal,
      daysElapsed,
      daysCompleted,
      daysRemaining: Math.max(challenge.durationDays - daysElapsed, 0),
      currentStreak,
      longestStreak,
      percentComplete: challengeGoal > 0 ? Math.round((totalPushups / challengeGoal) * 100) : 0,
      onPace: totalPushups >= goalToDate,
    },
    stakes: {
      weeksCompleted: completedWeeks.length,
      weeksPassed,
      weeksFailed,
      amountOwed: weeksFailed * challenge.stakeAmount,
      stakeAmount: challenge.stakeAmount,
    },
  };
}
