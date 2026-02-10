import Dexie from "dexie";

export interface Workout {
  id?: number;
  date: string;
  type: "A" | "B" | "C" | "D" | "E";
  finished: boolean;
}

export interface SetLog {
  id?: number;
  workoutId: number;
  category: "strength" | "carry" | "hold" | "cardio";
  exercise: string;
  weight?: number;
  reps?: number;
  distance?: number;
  time?: number;
  date: string;
}

export interface Plan {
  key: "A" | "B" | "C" | "D" | "E";
  exercises: string[];
}

// Notebook interface
export interface Notes {
  id: number;
  text: string;
}

// Exercise list interface
export interface ExerciseName {
  id?: number;
  name: string;
}

// NEW: Template interface
export interface Template {
  id?: number;
  name: string;
  exercises: string[];
}

class KeepLiftingDB extends Dexie {
  workouts!: Dexie.Table<Workout, number>;
  sets!: Dexie.Table<SetLog, number>;
  plans!: Dexie.Table<Plan, string>;
  notes!: Dexie.Table<Notes, number>;
  exercises!: Dexie.Table<ExerciseName, number>;
  templates!: Dexie.Table<Template, number>; // NEW

  constructor() {
    super("KeepLiftingDB");

    // Bump version 4 → 5 to add templates table
    this.version(5).stores({
      workouts: "++id, date, type, finished",
      sets: "++id, workoutId, category, date",
      plans: "key",
      notes: "id",
      exercises: "++id, name",
      templates: "++id, name" // NEW
    });
  }
}

export const db = new KeepLiftingDB();