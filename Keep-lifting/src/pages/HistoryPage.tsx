import { useEffect, useState } from "react";
import { db } from "../db/db";

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await db.workouts
        .orderBy("date")
        .reverse()
        .toArray();

      setWorkouts(all);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>History</h2>

      {workouts.length === 0 && (
        <div style={{ color: "var(--white)" }}>
          No past workouts yet.
        </div>
      )}

      {workouts.map((w) => (
        <div
          key={w.id}
          onClick={() => window.location.href = `/workout/${w.id}`}
          style={{
            padding: 12,
            marginBottom: 10,
            background: "var(--grey-dark)",
            border: "1px solid var(--grey-border)",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: "bold", color: "var(--red)" }}>
            {w.date} — Workout {w.type}
          </div>

          <div style={{ color: "var(--white)", marginTop: 5 }}>
            {w.finished ? "Finished" : "In Progress"}
          </div>
        </div>
      ))}
    </div>
  );
}