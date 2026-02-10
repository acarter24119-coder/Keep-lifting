import { useState, useEffect } from "react";
import type { SetLog, Template } from "../db/db";
import { db } from "../db/db";
import RestTimer from "../components/RestTimer";

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
  const [workoutType, setWorkoutType] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [category, setCategory] = useState<"strength" | "carry" | "hold" | "cardio">("strength");

  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [reps, setReps] = useState<number | undefined>(undefined);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [time, setTime] = useState<number | undefined>(undefined);

  const [showTimer, setShowTimer] = useState(false);
  const [currentSets, setCurrentSets] = useState<SetLog[]>([]);

  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateExercises, setTemplateExercises] = useState<string[]>([]);
  const [templateExercise, setTemplateExercise] = useState("");
  const [templateShowDropdown, setTemplateShowDropdown] = useState(false);

  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  const [templateQueue, setTemplateQueue] = useState<string[] | null>(null);

  useEffect(() => {
    db.exercises
      .orderBy("id")
      .reverse()
      .limit(15)
      .toArray()
      .then(list => setRecentExercises(list.map(e => e.name)));
  }, []);

  useEffect(() => {
    db.templates.toArray().then(setTemplates);
  }, []);

  function groupSetsByExercise(sets: SetLog[]) {
    const groups: Record<string, SetLog[]> = {};
    sets.forEach((set) => {
      if (!groups[set.exercise]) groups[set.exercise] = [];
      groups[set.exercise].push(set);
    });
    return groups;
  }

  useEffect(() => {
    if (!exercise.trim()) return;

    async function loadProgression() {
      const last = await db.sets
        .where("exercise")
        .equalsIgnoreCase(exercise.trim())
        .reverse()
        .first();

      if (!last) return;

      if (category === "strength") {
        setWeight((last.weight ?? 0) + 2.5);
        setReps(last.reps ?? 5);
        setDistance(undefined);
        setTime(undefined);
      }

      if (category === "carry") {
        setWeight((last.weight ?? 0) + 5);
        setDistance(last.distance ?? 20);
        setReps(undefined);
        setTime(undefined);
      }

      if (category === "hold") {
        setWeight(last.weight ?? 0);
        setTime((last.time ?? 20) + 5);
        setReps(undefined);
        setDistance(undefined);
      }

      if (category === "cardio") {
        setTime((last.time ?? 60) + 10);
        setDistance(last.distance ?? 1);
        setWeight(undefined);
        setReps(undefined);
      }
    }

    loadProgression();
  }, [exercise, category]);

  useEffect(() => {
    async function loadWorkout() {
      const today = new Date().toISOString().split("T")[0];
      const workout = await db.workouts.where("date").equals(today).first();

      if (workout) {
        const sets = await db.sets
          .where("workoutId")
          .equals(workout.id!)
          .toArray();

        setCurrentSets(sets);
      }
    }

    loadWorkout();
  }, []);

  async function addSet() {
    if (!exercise.trim()) return;

    const today = new Date().toISOString().split("T")[0];
    let workout = await db.workouts.where("date").equals(today).first();

    if (!workout) {
      const id = await db.workouts.add({
        date: today,
        type: workoutType,
        finished: false
      });
      workout = { id, date: today, type: workoutType, finished: false };
    }

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

    const exists = await db.exercises.where("name").equals(exercise).first();
    if (!exists) {
      await db.exercises.add({ name: exercise });

      const list = await db.exercises.orderBy("id").reverse().limit(15).toArray();
      setRecentExercises(list.map(e => e.name));
    }

    const updated = await db.sets
      .where("workoutId")
      .equals(workout.id!)
      .toArray();

    setCurrentSets(updated);

    setExercise("");
    setWeight(undefined);
    setReps(undefined);
    setDistance(undefined);
    setTime(undefined);

    setShowTimer(true);

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

  function loadTemplate(template: Template) {
    if (!template.exercises || template.exercises.length === 0) return;

    setShowTemplateMenu(false);
    setTemplateQueue(template.exercises);
    setExercise(template.exercises[0]);
  }

  function startEditingTemplate(t: Template) {
    setEditingTemplateId(t.id!);
    setTemplateName(t.name);
    setTemplateExercises(t.exercises);
    setTemplateExercise("");
    setShowTemplateMenu(false);
    setShowCreateTemplate(true);
  }

  function addExerciseToTemplate() {
    const name = templateExercise.trim();
    if (!name) return;
    setTemplateExercises(prev => [...prev, name]);
    setTemplateExercise("");
  }

  async function saveTemplate() {
    const name = templateName.trim();
    if (!name || templateExercises.length === 0) return;

    if (editingTemplateId) {
      await db.templates.update(editingTemplateId, {
        name,
        exercises: templateExercises
      });
    } else {
      await db.templates.add({
        name,
        exercises: templateExercises
      });
    }

    const all = await db.templates.toArray();
    setTemplates(all);

    setTemplateName("");
    setTemplateExercises([]);
    setTemplateExercise("");
    setEditingTemplateId(null);
    setShowCreateTemplate(false);
  }
return (
    <div style={{ padding: 20 }}>
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
            <h3 style={{ color: "var(--white)", marginBottom: 10 }}>Load Template</h3>

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
                  onClick={() => startEditingTemplate(t)}
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

            <input
              type="text"
              placeholder="Template name (e.g. Events Day)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={inputStyle}
            />

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

              {templateShowDropdown && recentExercises.length > 0 && (
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
                  {recentExercises.map((ex) => (
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
<h2 style={{ marginBottom: 20 }}>Add Set</h2>

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

      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          style={inputStyle}
        />

        {showDropdown && recentExercises.length > 0 && (
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
            {recentExercises.map((ex) => (
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

      {showTimer && (
        <RestTimer
          seconds={60}
          onClose={() => setShowTimer(false)}
        />
      )}
    </div>
  );
}        