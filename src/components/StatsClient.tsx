"use client";

import { useState } from "react";
import ProgressBar from "./ProgressBar";
import type { UserStats } from "@/lib/challenge";

type SerializedWeek = Omit<UserStats["weekly"][number], "start" | "end"> & {
  start: string;
  end: string;
};

type Stats = Omit<UserStats, "weekly"> & { weekly: SerializedWeek[] };

const TABS = ["Daily", "Weekly", "Monthly", "Annual"] as const;
type Tab = (typeof TABS)[number];

function fmtDate(key: string) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function StatsClient({
  stats,
  challengeName,
  stakeAmount,
}: {
  stats: Stats;
  challengeName: string;
  stakeAmount: number;
}) {
  const [tab, setTab] = useState<Tab>("Daily");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{challengeName}</h1>
        <p className="text-sm text-slate-500">Your personal stats</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Current streak" value={`${stats.annual.currentStreak}d`} />
        <StatTile label="Longest streak" value={`${stats.annual.longestStreak}d`} />
        <StatTile label="Total push-ups" value={stats.annual.totalPushups.toLocaleString()} />
        <StatTile
          label="Stakes owed"
          value={`$${stats.stakes.amountOwed.toLocaleString()}`}
          danger={stats.stakes.amountOwed > 0}
        />
      </div>

      <div className="card !bg-brand-50 border-brand-100">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-brand-800">
            {stats.stakes.weeksFailed === 0
              ? "You're clean — no missed weeks so far. 🎉"
              : `You've missed ${stats.stakes.weeksFailed} week${stats.stakes.weeksFailed === 1 ? "" : "s"} (${stats.stakes.weeksPassed} passed).`}
          </span>
          <span className="font-bold text-brand-900">
            ${stats.stakes.amountOwed} / ${stakeAmount} per missed week
          </span>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Daily" && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-slate-600">Last 30 days</h3>
          <ul className="space-y-2">
            {stats.daily.slice(0, 30).map((d) => (
              <li key={d.date} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-slate-500">{fmtDate(d.date)}</span>
                <ProgressBar value={d.total} goal={stats.today.goal} className="flex-1" />
              </li>
            ))}
            {stats.daily.length === 0 && (
              <p className="text-sm text-slate-400">No entries yet.</p>
            )}
          </ul>
        </div>
      )}

      {tab === "Weekly" && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-slate-600">
            Weekly totals (goal: {stats.weekly[0]?.goal ?? 700} / week)
          </h3>
          <ul className="divide-y divide-slate-100">
            {stats.weekly.map((w) => (
              <li key={w.weekIndex} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    Week {w.weekIndex + 1}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      ({fmtDate(w.start)} – {fmtDate(w.end)})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {w.total.toLocaleString()} / {w.goal.toLocaleString()} push-ups
                  </p>
                </div>
                <StatusPill week={w} />
              </li>
            ))}
            {stats.weekly.length === 0 && (
              <p className="text-sm text-slate-400">No weeks tracked yet.</p>
            )}
          </ul>
        </div>
      )}

      {tab === "Monthly" && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-slate-600">Monthly totals</h3>
          <ul className="space-y-3">
            {stats.monthly.map((m) => (
              <li key={m.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-slate-500">{m.total.toLocaleString()} push-ups</span>
                </div>
                <ProgressBar value={m.total} goal={m.goal} />
              </li>
            ))}
            {stats.monthly.length === 0 && (
              <p className="text-sm text-slate-400">No months tracked yet.</p>
            )}
          </ul>
        </div>
      )}

      {tab === "Annual" && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-600">Whole-challenge progress</h3>
          <ProgressBar value={stats.annual.totalPushups} goal={stats.annual.challengeGoal} />
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Stat label="Days elapsed" value={stats.annual.daysElapsed} />
            <Stat label="Days remaining" value={stats.annual.daysRemaining} />
            <Stat label="Days goal met" value={stats.annual.daysCompleted} />
            <Stat label="Expected by now" value={stats.annual.goalToDate.toLocaleString()} />
            <Stat label="Actual total" value={stats.annual.totalPushups.toLocaleString()} />
            <Stat
              label="On pace?"
              value={stats.annual.onPace ? "Yes ✅" : "Behind ⚠️"}
            />
          </dl>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="card !p-3 text-center">
      <p className={`text-xl font-bold ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function StatusPill({ week }: { week: SerializedWeek }) {
  if (!week.isComplete) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        In progress
      </span>
    );
  }
  return week.pass ? (
    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
      Passed
    </span>
  ) : (
    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
      Missed
    </span>
  );
}
