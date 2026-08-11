"use client";

import { useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";

type EntryDTO = { id: string; date: string; count: number; note?: string | null; createdAt: string };

const QUICK_ADD = [10, 20, 25, 50];

export default function DashboardClient({
  initialEntries,
  dailyGoal,
  todayKey,
}: {
  initialEntries: EntryDTO[];
  dailyGoal: number;
  todayKey: string;
}) {
  const [entries, setEntries] = useState<EntryDTO[]>(initialEntries);
  const [customCount, setCustomCount] = useState("");
  const [date, setDate] = useState(todayKey);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === date).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [entries, date]
  );
  const dayTotal = dayEntries.reduce((sum, e) => sum + e.count, 0);
  const isToday = date === todayKey;

  async function addEntry(count: number) {
    if (count <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, date }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't log that.");
        return;
      }
      setEntries((prev) => [data.entry, ...prev]);
      setCustomCount("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeEntry(id: string) {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!res.ok) setEntries(prev);
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isToday ? "Today" : new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h2>
          <input
            type="date"
            value={date}
            max={todayKey}
            onChange={(e) => setDate(e.target.value)}
            className="input !w-auto text-sm"
          />
        </div>
        <ProgressBar value={dayTotal} goal={dailyGoal} />

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_ADD.map((n) => (
            <button
              key={n}
              disabled={submitting}
              onClick={() => addEntry(n)}
              className="btn-secondary"
            >
              +{n}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addEntry(parseInt(customCount, 10));
          }}
        >
          <input
            className="input"
            type="number"
            min={1}
            max={2000}
            placeholder="Custom amount"
            value={customCount}
            onChange={(e) => setCustomCount(e.target.value)}
          />
          <button className="btn-primary" disabled={submitting || !customCount} type="submit">
            Add
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-slate-600">
          Entries logged {isToday ? "today" : "this day"} ({dayEntries.length})
        </h3>
        {dayEntries.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing logged yet. Get moving! 💪</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {dayEntries.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-semibold">{e.count}</span> push-ups
                  <span className="ml-2 text-xs text-slate-400">
                    {new Date(e.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <button
                  onClick={() => removeEntry(e.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
