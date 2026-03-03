import { useState, useEffect } from "react";
import type { SetLog, Template } from "../db/db";
import { db } from "../db/db";

// Shared input style
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  background: "var(--grey-dark)",
  color: "var(--white)",
  border: "1px solid var(--grey-border)",
  fontSize: "16px"
};

export default function AddSetPage() {
  /* -------------------------------------------------------
   * WORKOUT + CATEGORY
   * ----------------------------------------------------- */
  const [workoutType, setWorkoutType] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [category, setCategory] = useState<"strength" | "carry" | "hold" | "cardio">("strength");

  /* -------------------------------------------------------
   * ACTIVE SET INPUTS
   * ----------------------------------------------------- */
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [reps, setReps] = useState<number | undefined>(undefined);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [time, setTime] = useState<number | undefined>(undefined);

  /* -------------------------------------------------------
   * CURRENT WORKOUT SETS
   * ----------------------------------------------------- */
  const [currentSets, setCurrentSets] = useState<SetLog[]>([]);

  /* -------------------------------------------------------
   * AUTOFILL
   * ----------------------------------------------------- */
  const [allExercises, setAllExercises] = useState<string[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  /* -------------------------------------------------------
   * PROGRESSION TIP
   * ----------------------------------------------------- */
  const [progressionTip, setProgressionTip] = useState<string | null>(null);

  /* -------------------------------------------------------
   * TEMPLATES
   * ----------------------------------------------------- */
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateExercises, setTemplateExercises] = useState<string[]>([]);
  const [templateExercise, setTemplateExercise] = useState("");
  const [templateShowDropdown, setTemplateShowDropdown] = useState(false);

  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [templateQueue, setTemplateQueue] = useState<string[] | null>(null);

  /* -------------------------------------------------------
   * LOAD ALL EXERCISES (AUTOFILL)
   * ----------------------------------------------------- */
  useEffect(() => {
    db.exercises.orderBy("name").toArray().then(list => {
      const names = list.map(e => e.name);
      setAllExercises(names);
      setFilteredExercises(names.slice(0, 10)); // top 10
    });
  }, []);

  /* -------------------------------------------------------
   * LOAD TEMPLATES
   * ----------------------------------------------------- */
  useEffect(() => {
    db.templates.toArray().then(setTemplates);
  }, []);

  /* -------------------------------------------------------
   * LOAD TODAY'S WORKOUT SETS
   * ----------------------------------------------------- */
  useEffect(() => {
    async function loadWorkout() {
      const today = new Date().toISOString().split("T")[0];
      const workout = await db.workouts.where("date").equals(today).first();

      if (workout) {
        const sets = await db.sets.where("workoutId").equals(workout.id!).toArray();
        setCurrentSets(sets);
      }
    }
    loadWorkout();
  }, []);

  /* -------------------------------------------------------
   * AUTOFILL FILTERING (TOP 10 MATCHES)
   * ----------------------------------------------------- */
  useEffect(() => {
    if (!exercise.trim()) {
      setFilteredExercises(allExercises.slice(0, 10));
      return;
    }

    const q = exercise.toLowerCase();
    const matches = allExercises.filter(ex => ex.toLowerCase().includes(q));
    setFilteredExercises(matches.slice(0, 10));
  }, [exercise, allExercises]);

  /* -------------------------------------------------------
   * PROGRESSION LOGIC
   * ----------------------------------------------------- */
  useEffect(() => {
    if (!exercise.trim()) {
      setProgressionTip(null);
      return;
    }

    async function loadProgression() {
      const last = await db.sets
        .where("exercise")
        .equalsIgnoreCase(exercise.trim())
        .reverse()
        .first();

      if (!last) {
        setProgressionTip("No previous data — choose your starting weight.");
        return;
      }

      const isTechnical =
        /log|clean|axle|circus|sandbag|stone/i.test(exercise);

      let tip = "";

      /* ---------------- STRENGTH ---------------- */
      if (category === "strength") {
        const lastW = last.weight ?? 0;
        const lastR = last.reps ?? 0;

        if (isTechnical) {
          if (lastR >= 6) {
            tip = `Try ${(lastW + 2.5).toFixed(1)}kg × 5–6 today (technical lift).`;
            setWeight(lastW + 2.5);
            setReps(5);
          } else {
            tip = `Repeat ${lastW}kg — technique first.`;
            setWeight(lastW);
            setReps(lastR);
          }
        } else {
          if (lastR >= 8) {
            tip = `Try ${(lastW + 2.5).toFixed(1)}kg × 6–8 today.`;
            setWeight(lastW + 2.5);
            setReps(6);
          } else if (lastR >= 5) {
            tip = `Repeat ${lastW}kg — aim for more reps.`;
            setWeight(lastW);
            setReps(lastR);
          } else {
            tip = `Stay at ${lastW}kg — rebuild reps.`;
            setWeight(lastW);
            setReps(lastR);
          }
        }
      }

      /* ---------------- CARRY ---------------- */
      if (category === "carry") {
        const lastW = last.weight ?? 0;
        const lastD = last.distance ?? 0;

        if (lastD >= 20) {
          tip = `Try ${(lastW + 5).toFixed(1)}kg for 15–20m.`;
          setWeight(lastW + 5);
          setDistance(15);
        } else {
          tip = `Repeat ${lastW}kg — build distance.`;
          setWeight(lastW);
          setDistance(lastD);
        }
      }

      /* ---------------- HOLD ---------------- */
      if (category === "hold") {
        const lastW = last.weight ?? 0;
        const lastT = last.time ?? 0;

        if (lastT >= 20) {
          tip = `Try ${(lastW + 2.5).toFixed(1)}kg for 15–20s.`;
          setWeight(lastW + 2.5);
          setTime(15);
        } else {
          tip = `Repeat ${lastW}kg — build time.`;
          setWeight(lastW);
          setTime(lastT);
        }
      }

      /* ---------------- CARDIO ---------------- */
      if (category === "cardio") {
        const lastT = last.time ?? 0;
        const lastD = last.distance ?? 0;

        tip = `Try ${lastT + 10}s or ${(lastD + 0.1).toFixed(1)}km today.`;
        setTime(lastT + 10);
        setDistance(lastD + 0.1);
      }

      setProgressionTip(tip);
    }

    loadProgression();
  }, [exercise, category]);
/* -------------------------------------------------------
   * GROUP SETS BY EXERCISE (FOR HISTORY LIST)
   * ----------------------------------------------------- */
  function groupSetsByExercise(sets: SetLog[]) {
    const groups: Record<string, SetLog[]> = {};
    sets.forEach((set) => {
      if (!groups[set.exercise]) groups[set.exercise] = [];
      groups[set.exercise].push(set);
    });
    return groups;
  }

  /* -------------------------------------------------------
   * ADD SET TO TODAY'S WORKOUT
   * ----------------------------------------------------- */
  async function addSet() {
    if (!exercise.trim()) return;

    const today = new Date().toISOString().split("T")[0];

    // Ensure workout exists
    let workout = await db.workouts.where("date").equals(today).first();
    if (!workout) {
      const id = await db.workouts.add({
        date: today,
        type: workoutType,
        finished: false
      });
      workout = { id, date: today, type: workoutType, finished: false };
    }

    // Add set
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

    // Add exercise to DB if new
    const exists = await db.exercises.where("name").equals(exercise).first();
    if (!exists) {
      await db.exercises.add({ name: exercise });
      const list = await db.exercises.orderBy("name").toArray();
      setAllExercises(list.map(e => e.name));
    }

    // Refresh workout sets
    const updated = await db.sets.where("workoutId").equals(workout.id!).toArray();
    setCurrentSets(updated);

    // Reset inputs
    setExercise("");
    setWeight(undefined);
    setReps(undefined);
    setDistance(undefined);
    setTime(undefined);

    // Handle template queue (auto‑advance)
    if (templateQueue && templateQueue.length > 0) {
      const [, ...rest] = templateQueue;
      if (rest.length > 0) {
        setExercise(rest[0]);
        setTemplateQueue(rest);
      } else {
        setTemplateQueue(null);
      }
    }
  }

/* -------------------------------------------------------
   * TEMPLATE: LOAD TEMPLATE INTO ACTIVE WORKOUT
   * ----------------------------------------------------- */
  function loadTemplate(template: Template) {
    if (!template.exercises || template.exercises.length === 0) return;

    // Start queue
    setTemplateQueue(template.exercises);

    // Load first exercise immediately
    setExercise(template.exercises[0]);

    // Close menu
    setShowTemplateMenu(false);
  }
  /* -------------------------------------------------------
   * TEMPLATE: ADD EXERCISE TO TEMPLATE (ONE AT A TIME)
   * ----------------------------------------------------- */
  function addExerciseToTemplate() {
    if (!templateExercise.trim()) return;

    setTemplateExercises(prev => [...prev, templateExercise.trim()]);
    setTemplateExercise("");
  }

  /* -------------------------------------------------------
   * TEMPLATE: SAVE (CREATE OR UPDATE)
   * ----------------------------------------------------- */
  async function saveTemplate() {
    if (!templateName.trim()) return;

    const newTemplate: Template = {
      id: editingTemplateId?.toString() || crypto.randomUUID(),
      name: templateName.trim(),
      exercises: templateExercises
    };

    // Save to DB
    await db.templates.put(newTemplate);

    // Update local list
    setTemplates(prev => {
      const exists = prev.some(t => t.id === newTemplate.id);
      return exists
        ? prev.map(t => (t.id === newTemplate.id ? newTemplate : t))
        : [...prev, newTemplate];
    });

    // Reset UI
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateExercises([]);
    setTemplateExercise("");
    setShowCreateTemplate(false);
  }
/* -------------------------------------------------------
   * JSX — TEMPLATE MENU + CREATE TEMPLATE MODAL
   * ----------------------------------------------------- */

  return (
    <div style={{ padding: 20 }}>

      {/* ---------------- TEMPLATE MENU ---------------- */}
      {showTemplateMenu && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100
          }}
        >
          <div
            style={{
              background: "var(--grey-dark)",
              padding: 20,
              borderRadius: 8,
              width: "90%",
              maxWidth: 400
            }}
          >
            <h3 style={{ color: "var(--white)", marginBottom: 10 }}>
              Load Template
            </h3>

            {templates.length === 0 && (
              <div style={{ color: "var(--white)", marginBottom: 10 }}>
                No templates yet. Create one first.
              </div>
            )}

            {templates.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8
                }}
              >
                <button
                  style={{
                    flex: 1,
                    padding: 10,
                    background: "var(--grey-dark)",
                    color: "var(--white)",
                    border: "1px solid var(--grey-border)",
                    textAlign: "left",
                    cursor: "pointer",
                    marginRight: 10
                  }}
                  onClick={() => loadTemplate(t)}
                >
                  {t.name}
                </button>

                <button
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    color: "var(--white)",
                    border: "1px solid var(--grey-border)",
                    cursor: "pointer",
                    fontSize: 14
                  }}
                  onClick={() => {
                    setEditingTemplateId(t.id as any);
                    setTemplateName(t.name);
                    setTemplateExercises(t.exercises);
                    setShowCreateTemplate(true);
                    setShowTemplateMenu(false);
                  }}
                >
                  Edit
                </button>
              </div>
            ))}

            <button
              style={{
                width: "100%",
                padding: 10,
                marginTop: 10,
                background: "var(--grey-dark)",
                color: "var(--white)",
                border: "1px solid var(--grey-border)",
                cursor: "pointer"
              }}
              onClick={() => {
                setEditingTemplateId(null);
                setTemplateName("");
                setTemplateExercises([]);
                setTemplateExercise("");
                setShowTemplateMenu(false);
                setShowCreateTemplate(true);
              }}
            >
              Create New Template
            </button>

            <button
              style={{
                width: "100%",
                padding: 10,
                marginTop: 10,
                background: "var(--red)",
                color: "var(--white)",
                border: "none",
                cursor: "pointer"
              }}
              onClick={() => setShowTemplateMenu(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------- CREATE TEMPLATE MODAL ---------------- */}
      {showCreateTemplate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110
          }}
        >
          <div
            style={{
              background: "var(--grey-dark)",
              padding: 20,
              borderRadius: 8,
              width: "90%",
              maxWidth: 400
            }}
          >
            <h3 style={{ color: "var(--white)", marginBottom: 10 }}>
              {editingTemplateId ? "Edit Template" : "Create Template"}
            </h3>

            {/* Template Name */}
            <input
              type="text"
              placeholder="Template name (e.g. Events Day)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={inputStyle}
            />

            {/* Template Exercise Input */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Exercise"
                value={templateExercise}
                onChange={(e) => setTemplateExercise(e.target.value)}
                onFocus={() => setTemplateShowDropdown(true)}
                onBlur={() => setTimeout(() => setTemplateShowDropdown(false), 150)}
                style={inputStyle}
              />

              {/* Dropdown */}
              {templateShowDropdown && allExercises.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--grey-dark)",
                    border: "1px solid var(--grey-border)",
                    borderRadius: "4px",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto"
                  }}
                >
                  {allExercises.slice(0, 10).map((ex) => (
                    <div
                      key={ex}
                      onMouseDown={() => {
                        setTemplateExercise(ex);
                        setTemplateShowDropdown(false);
                      }}
                      style={{
                        padding: "8px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--grey-border)",
                        color: "var(--white)"
                      }}
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Exercise to Template */}
            <button
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 10,
                background: "var(--grey-dark)",
                color: "var(--white)",
                border: "1px solid var(--grey-border)",
                cursor: "pointer"
              }}
              onClick={addExerciseToTemplate}
            >
              Add Exercise to Template
            </button>

            {/* Template Exercise List */}
            {templateExercises.length > 0 && (
              <div
                style={{
                  marginBottom: 10,
                  maxHeight: 150,
                  overflowY: "auto",
                  border: "1px solid var(--grey-border)",
                  borderRadius: 4,
                  padding: 8
                }}
              >
                {templateExercises.map((ex, idx) => (
                  <div
                    key={idx}
                    style={{
                      color: "var(--white)",
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>{idx + 1}. {ex}</span>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--red)",
                        cursor: "pointer"
                      }}
                      onClick={() =>
                        setTemplateExercises(prev =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Save Template */}
            <button
              style={{
                width: "100%",
                padding: 10,
                marginTop: 5,
                background: "var(--red)",
                color: "var(--white)",
                border: "none",
                cursor: "pointer"
              }}
              onClick={saveTemplate}
            >
              Save Template
            </button>

            {/* Cancel */}
            <button
              style={{
                width: "100%",
                padding: 10,
                marginTop: 10,
                background: "var(--grey-dark)",
                color: "var(--white)",
                border: "1px solid var(--grey-border)",
                cursor: "pointer"
              }}
              onClick={() => {
                setShowCreateTemplate(false);
                setTemplateName("");
                setTemplateExercises([]);
                setTemplateExercise("");
                setEditingTemplateId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
{/* ---------------- MAIN PAGE ---------------- */}
      <h2 style={{ marginBottom: 20 }}>Add Set</h2>

      {/* Load/Create Template Button */}
      <button
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 20,
          background: "var(--grey-dark)",
          color: "var(--white)",
          border: "1px solid var(--grey-border)",
          cursor: "pointer"
        }}
        onClick={() => setShowTemplateMenu(true)}
      >
        Load / Create Template
      </button>

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

      {/* Exercise Input + Autofill */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          style={inputStyle}
        />

        {showDropdown && filteredExercises.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--grey-dark)",
              border: "1px solid var(--grey-border)",
              borderRadius: "4px",
              zIndex: 10,
              maxHeight: "200px",
              overflowY: "auto"
            }}
          >
            {filteredExercises.map((ex) => (
              <div
                key={ex}
                onMouseDown={() => {
                  setExercise(ex);
                  setShowDropdown(false);
                }}
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--grey-border)",
                  color: "var(--white)"
                }}
              >
                {ex}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progression Tip */}
      {progressionTip && (
        <div
          style={{
            background: "var(--grey-dark)",
            border: "1px solid var(--grey-border)",
            padding: "10px",
            borderRadius: 6,
            marginBottom: 15,
            color: "var(--white)",
            fontSize: 14
          }}
        >
          {progressionTip}
        </div>
      )}

      {/* Category‑Specific Inputs */}
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
          cursor: "pointer",
          marginTop: 10
        }}
      >
        Add Set
      </button>

      {/* History List */}
      <div style={{ marginTop: 20 }}>
        {Object.entries(groupSetsByExercise(currentSets)).map(([exerciseName, sets]) => (
          <div key={exerciseName} style={{ marginBottom: 20 }}>
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
                {s.reps !== undefined && `× ${s.reps} `}
                {s.distance !== undefined && `${s.distance}m `}
                {s.time !== undefined && `${s.time}s `}
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}            