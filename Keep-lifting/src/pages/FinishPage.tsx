import { useEffect, useState } from "react";
import { db } from "../db/db";

export default function FinishPage() {
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);

  async function loadData() {
    const today = new Date().toISOString().split("T")[0];

    // Find today's workout
    const w = await db.workouts.where("date").equals(today).first();
    setWorkout(w);

    if (!w) {
      setSets([]);
      setLoading(false);
      return;
    }

    // Load sets for this workout
    const workoutSets = await db.sets
      .where("workoutId")
      .equals(w.id!)
      .reverse()
      .toArray();

    setSets(workoutSets);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // ⭐ DELETE SET
  async function deleteSet(id: number) {
    await db.sets.delete(id);
    loadData();
  }

  // ⭐ FINISH WORKOUT
  async function finishWorkout() {
    if (!workout) return;

    await db.workouts.update(workout.id, { finished: true });

    // Clear sets from screen
    setSets([]);

    // Update workout state
    setWorkout({ ...workout, finished: true });
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Today's Workout</h2>

      {workout?.finished && (
        <div style={{ marginBottom: 20, color: "var(--red)", fontWeight: "bold" }}>
          Workout Finished
        </div>
      )}

      {sets.length === 0 && !workout?.finished && (
        <div style={{ color: "var(--white)", marginBottom: 20 }}>
          No sets added yet.
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
            borderRadius: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
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

          <button
            onClick={() => deleteSet(s.id)}
            style={{
              background: "var(--red)",
              color: "var(--white)",
              border: "none",
              padding: "8px 12px",
              cursor: "pointer",
              borderRadius: 4
            }}
          >
            X
          </button>
        </div>
      ))}

      {/* ⭐ FINISH WORKOUT BUTTON */}
      {!workout?.finished && sets.length > 0 && (
        <button
          onClick={finishWorkout}
          style={{
            marginTop: 20,
            width: "100%",
            padding: 15,
            background: "var(--red)",
            color: "var(--white)",
            border: "none",
            fontSize: 18,
            cursor: "pointer"
          }}
        >
          Finish Workout
        </button>
      )}
    </div>
  );
}