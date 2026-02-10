import { useEffect, useState } from "react";
import { db } from "../db/db";
import type { SetLog, Workout } from "../db/db";

export default function WorkoutDetailsPage({ workoutId }: { workoutId: number }) {
  const [sets, setSets] = useState<SetLog[]>([]);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const w = await db.workouts.get(workoutId);
      setWorkout(w || null);

      const s = await db.sets
        .where("workoutId")
        .equals(workoutId)
        .toArray();

      setSets(s);
      setLoading(false);
    }

    load();
  }, [workoutId]);

  function groupSetsByExercise(list: SetLog[]) {
    const groups: Record<string, SetLog[]> = {};
    list.forEach((set) => {
      if (!groups[set.exercise]) groups[set.exercise] = [];
      groups[set.exercise].push(set);
    });
    return groups;
  }

  if (loading) {
    return <div style={{ padding: 20, color: "var(--white)" }}>Loading…</div>;
  }

  if (!workout) {
    return (
      <div style={{ padding: 20, color: "var(--white)" }}>
        Workout not found.
      </div>
    );
  }

  const grouped = groupSetsByExercise(sets);

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

      {Object.entries(grouped).map(([exerciseName, exerciseSets]) => (
        <div key={exerciseName} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 8,
              color: "var(--red)"
            }}
          >
            {exerciseName}
          </div>

          {exerciseSets.map((s) => (
            <div
              key={s.id}
              style={{
                background: "var(--grey-dark)",
                padding: 12,
                marginBottom: 6,
                borderRadius: 6,
                border: "1px solid var(--grey-border)",
                color: "var(--white)"
              }}
            >
              {s.category && (
                <div style={{ opacity: 0.7, marginBottom: 4 }}>
                  {s.category}
                </div>
              )}

              {s.weight !== undefined && <div>Weight: {s.weight} kg</div>}
              {s.reps !== undefined && <div>Reps: {s.reps}</div>}
              {s.distance !== undefined && <div>Distance: {s.distance}</div>}
              {s.time !== undefined && <div>Time: {s.time}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}