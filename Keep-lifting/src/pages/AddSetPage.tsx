import { db } from "../db/db";
import type { SetLog } from "../db/db";
import { useState, useEffect } from "react";
import RestTimer from "../components/RestTimer";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  background: "var(--grey-dark)",
  color: "var(--white)",
  border: "1px solid var(--grey-border)"
};

export default function AddSetPage() {
  const [workoutType, setWorkoutType] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [category, setCategory] = useState<"strength" | "carry" | "hold" | "cardio">("strength");

  // Inputs
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [reps, setReps] = useState<number | undefined>(undefined);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [time, setTime] = useState<number | undefined>(undefined);

  // Rest timer
  const [showTimer, setShowTimer] = useState(false);

  // Live workout log
  const [currentSets, setCurrentSets] = useState<SetLog[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentWorkoutId, setCurrentWorkoutId] = useState<number | null>(null);

  // Group sets by exercise
  function groupSetsByExercise(sets: SetLog[]) {
    const groups: Record<string, SetLog[]> = {};

    sets.forEach((set) => {
      if (!groups[set.exercise]) {
        groups[set.exercise] = [];
      }
      groups[set.exercise].push(set);
    });

    return groups;
  }

  // Auto‑carryover
  useEffect(() => {
    if (exercise.trim().length < 2) return;

    async function loadLast() {
      const last = await db.sets
        .where("exercise")
        .equalsIgnoreCase(exercise.trim())
        .reverse()
        .first();

      if (!last) return;

      if (last.weight !== undefined) setWeight(last.weight);
      if (last.reps !== undefined) setReps(last.reps);
      if (last.distance !== undefined) setDistance(last.distance);
      if (last.time !== undefined) setTime(last.time);
    }

    loadLast();
  }, [exercise]);

  // Load today's workout + sets
  useEffect(() => {
    async function loadWorkout() {
      const today = new Date().toISOString().split("T")[0];

      const workout = await db.workouts.where("date").equals(today).first();

      if (workout) {
        setCurrentWorkoutId(workout.id!);

        const sets = await db.sets
          .where("workoutId")
          .equals(workout.id!)
          .toArray();

        setCurrentSets(sets);
      }
    }

    loadWorkout();
  }, []);

  // Save set
  async function addSet() {
    if (!exercise) return;

    const today = new Date().toISOString().split("T")[0];

    // Find or create today's workout
    let workout = await db.workouts.where("date").equals(today).first();

    if (!workout) {
      const id = await db.workouts.add({
        date: today,
        type: workoutType,
        finished: false
      });
      workout = { id, date: today, type: workoutType, finished: false };
      setCurrentWorkoutId(id);
    }

    // Save the set
    await db.sets.add({
      workoutId: workout.id!,
      category,
      exercise,
      weight,
      reps,
      distance,
      time,
      date: new Date().toISOString()
    });

    // Refresh visible sets
    const updated = await db.sets
      .where("workoutId")
      .equals(workout.id!)
      .toArray();

    setCurrentSets(updated);

    // Reset inputs
    setExercise("");
    setWeight(undefined);
    setReps(undefined);
    setDistance(undefined);
    setTime(undefined);

    // Show rest timer
    setShowTimer(true);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 20 }}>Add Set</h2>

      {/* ⭐ GROUPED WORKOUT SETS */}
      <div style={{ marginBottom: 20 }}>
        {Object.entries(groupSetsByExercise(currentSets)).map(([exerciseName, sets]) => (
          <div key={exerciseName} style={{ marginBottom: 20 }}>
            
            {/* Exercise Header */}
            <div
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginBottom: 8,
                color: "var(--white)"
              }}
            >
              {exerciseName}
            </div>

            {/* Sets under this exercise */}
            {sets.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "var(--grey-dark)",
                  padding: 10,
                  marginBottom: 6,
                  borderRadius: 6,
                  border: "1px solid var(--grey-border)",
                  color: "var(--white)"
                }}
              >
                {s.weight !== undefined && `${s.weight}kg `}
                {s.reps !== undefined && `× ${s.reps}`}
                {s.distance !== undefined && `${s.distance}m `}
                {s.time !== undefined && `${s.time}s `}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Workout Type Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["A", "B", "C", "D", "E"].map((t) => (
          <button
            key={t}
            onClick={() => setWorkoutType(t as any)}
            style={{
              flex: 1,
              padding: 10,
              background: workoutType === t ? "var(--red)" : "var(--grey-dark)",
              color: "var(--white)",
              border: "1px solid var(--grey-border)",
              cursor: "pointer"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Category Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["strength", "carry", "hold", "cardio"].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c as any)}
            style={{
              flex: 1,
              padding: 10,
              background: category === c ? "var(--red)" : "var(--grey-dark)",
              color: "var(--white)",
              border: "1px solid var(--grey-border)",
              cursor: "pointer",
              textTransform: "capitalize"
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Exercise Input */}
      <input
        type="text"
        placeholder="Exercise"
        value={exercise}
        onChange={(e) => setExercise(e.target.value)}
        style={inputStyle}
      />

      {/* Dynamic Inputs */}
      {category === "strength" && (
        <>
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight ?? ""}
            onChange={(e) => setWeight(Number(e.target.value))}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Reps"
            value={reps ?? ""}
            onChange={(e) => setReps(Number(e.target.value))}
            style={inputStyle}
          />
        </>
      )}

      {category === "carry" && (
        <>
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight ?? ""}
            onChange={(e) => setWeight(Number(e.target.value))}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Distance (m)"
            value={distance ?? ""}
            onChange={(e) => setDistance(Number(e.target.value))}
            style={inputStyle}
          />
        </>
      )}

      {category === "hold" && (
        <>
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight ?? ""}
            onChange={(e) => setWeight(Number(e.target.value))}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Time (sec)"
            value={time ?? ""}
            onChange={(e) => setTime(Number(e.target.value))}
            style={inputStyle}
          />
        </>
      )}

      {category === "cardio" && (
        <>
          <input
            type="number"
            placeholder="Time (min)"
            value={time ?? ""}
            onChange={(e) => setTime(Number(e.target.value))}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Distance (km)"
            value={distance ?? ""}
            onChange={(e) => setDistance(Number(e.target.value))}
            style={inputStyle}
          />
        </>
      )}

      {/* Add Set Button */}
      <button
        onClick={addSet}
        style={{
          width: "100%",
          padding: 15,
          background: "var(--red)",
          color: "var(--white)",
          border: "none",
          fontSize: 18,
          cursor: "pointer"
        }}
      >
        Add Set
      </button>

      {/* Rest Timer */}
      {showTimer && (
        <RestTimer
          seconds={90}
          onClose={() => setShowTimer(false)}
        />
      )}
    </div>
  );
}