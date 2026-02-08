import { useEffect, useState } from "react";
import { db } from "../db/db";

export default function WorkoutDetailsPage({ workoutId }: { workoutId: number }) {
  const [sets, setSets] = useState<any[]>([]);
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const w = await db.workouts.get(workoutId);
      setWorkout(w);

      const s = await db.sets
        .where("workoutId")
        .equals(workoutId)
        .reverse()
        .toArray();

      setSets(s);
      setLoading(false);
    }

    load();
  }, [workoutId]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>
        Workout {workout.type} — {workout.date}
      </h2>

      {sets.length === 0 && (
        <div style={{ color: "var(--white)" }}>
          No sets recorded.
        </div>
      )}

      {sets.map((s) => (
        <div
          key={s.id}
          style={{
            padding: 12,
            marginBottom: 10,
            background: "var(--grey-dark)",
            border: "1px solid var(--grey-border)",
            borderRadius: 4
          }}
        >
          <div style={{ fontWeight: "bold", color: "var(--red)" }}>
            {s.exercise} ({s.category})
          </div>

          <div style={{ color: "var(--white)", marginTop: 5 }}>
            {s.weight !== undefined && <div>Weight: {s.weight} kg</div>}
            {s.reps !== undefined && <div>Reps: {s.reps}</div>}
            {s.distance !== undefined && <div>Distance: {s.distance}</div>}
            {s.time !== undefined && <div>Time: {s.time}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}