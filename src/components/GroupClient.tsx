"use client";

import { useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";

type Member = {
  id: string;
  name: string;
  isMe: boolean;
  todayTotal: number;
  todayGoal: number;
  currentWeekTotal: number;
  currentWeekGoal: number;
  currentWeekOnPace: boolean;
  weeksFailed: number;
  weeksPassed: number;
  amountOwed: number;
  totalPushups: number;
  percentComplete: number;
  currentStreak: number;
};

type SortKey = "total" | "streak" | "owed" | "week";

export default function GroupClient({
  members,
  stakeAmount,
}: {
  members: Member[];
  stakeAmount: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("total");

  const sorted = useMemo(() => {
    const copy = [...members];
    switch (sortKey) {
      case "streak":
        return copy.sort((a, b) => b.currentStreak - a.currentStreak);
      case "owed":
        return copy.sort((a, b) => b.amountOwed - a.amountOwed);
      case "week":
        return copy.sort((a, b) => b.currentWeekTotal - a.currentWeekTotal);
      default:
        return copy.sort((a, b) => b.totalPushups - a.totalPushups);
    }
  }, [members, sortKey]);

  const totalPot = members.reduce((sum, m) => sum + m.amountOwed, 0);
  const cleanCount = members.filter((m) => m.amountOwed === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Group leaderboard</h1>
        <p className="text-sm text-slate-500">
          ${stakeAmount} on the line for anyone who misses 700 in a week.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card !p-3 text-center">
          <p className="text-xl font-bold">{members.length}</p>
          <p className="text-xs text-slate-500">Participants</p>
        </div>
        <div className="card !p-3 text-center">
          <p className="text-xl font-bold text-red-600">${totalPot.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total currently owed</p>
        </div>
        <div className="card !p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{cleanCount}</p>
          <p className="text-xs text-slate-500">Still clean (no misses)</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-slate-500">Sort by</span>
        <select
          className="input !w-auto"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="total">Total push-ups</option>
          <option value="week">This week</option>
          <option value="streak">Current streak</option>
          <option value="owed">Amount owed</option>
        </select>
      </div>

      <div className="space-y-3">
        {sorted.map((m, i) => (
          <div key={m.id} className={`card ${m.isMe ? "!border-brand-300 !bg-brand-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 text-sm font-semibold text-slate-400">#{i + 1}</span>
                <span className="font-semibold">
                  {m.name}
                  {m.isMe && <span className="ml-1 text-xs font-normal text-brand-600">(you)</span>}
                </span>
                {m.currentStreak > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    🔥 {m.currentStreak}d
                  </span>
                )}
              </div>
              {m.amountOwed > 0 ? (
                <span className="text-sm font-bold text-red-600">-${m.amountOwed}</span>
              ) : (
                <span className="text-sm font-bold text-emerald-600">$0</span>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-slate-500">Today</p>
                <ProgressBar value={m.todayTotal} goal={m.todayGoal} />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">
                  This week {m.currentWeekOnPace ? "✅" : ""}
                </p>
                <ProgressBar value={m.currentWeekTotal} goal={m.currentWeekGoal} />
              </div>
            </div>

            <div className="mt-3 flex justify-between text-xs text-slate-500">
              <span>{m.totalPushups.toLocaleString()} total push-ups</span>
              <span>
                {m.weeksPassed} passed / {m.weeksFailed} missed weeks
              </span>
              <span>{m.percentComplete}% of year</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
