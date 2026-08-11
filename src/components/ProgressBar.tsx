export default function ProgressBar({
  value,
  goal,
  className = "",
}: {
  value: number;
  goal: number;
  className?: string;
}) {
  const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const met = value >= goal;
  return (
    <div className={className}>
      <div className="progress-track">
        <div
          className={`progress-fill ${met ? "!bg-emerald-500" : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>
          {value.toLocaleString()} / {goal.toLocaleString()}
        </span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}
