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

// NEW: Notebook interface
export interface Notes {
  id: number;
  text: string;
}

class KeepLiftingDB extends Dexie {
  workouts!: Dexie.Table<Workout, number>;
  sets!: Dexie.Table<SetLog, number>;
  plans!: Dexie.Table<Plan, string>;
  notes!: Dexie.Table<Notes, number>; // NEW

  constructor() {
    super("KeepLiftingDB");

    // Bump version 2 → 3 to add notes table
    this.version(3).stores({
      workouts: "++id, date, type, finished",
      sets: "++id, workoutId, category, date",
      plans: "key",
      notes: "id" // NEW
    });
  }
}

export const db = new KeepLiftingDB();