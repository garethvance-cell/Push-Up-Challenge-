"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl">💪</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Push-Up Challenge</h1>
          <p className="mt-1 text-sm text-slate-500">
            100 a day. 700 a week. $500 on the line.
          </p>
        </div>

        <div className="card">
          <div className="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-1.5 ${
                mode === "login" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-1.5 ${
                mode === "signup" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              Join challenge
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Display name
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gareth"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                {mode === "signup" ? "Create a 4-6 digit PIN" : "PIN"}
              </label>
              <input
                className="input"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                inputMode="numeric"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={4}
                maxLength={6}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait…" : mode === "signup" ? "Join the challenge" : "Log in"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Share this link with your friends so everyone can join the same challenge.
        </p>
      </div>
    </div>
  );
}
