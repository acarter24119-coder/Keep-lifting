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

export interface Notes {
  id: number;
  text: string;
}

export interface ExerciseName {
  id?: number;
  name: string;
}

export interface Template {
  id: string;               // UUID string
  name: string;
  exercises: string[];
}

class KeepLiftingDB extends Dexie {
  workouts!: Dexie.Table<Workout, number>;
  sets!: Dexie.Table<SetLog, number>;
  plans!: Dexie.Table<Plan, string>;
  notes!: Dexie.Table<Notes, number>;
  exercises!: Dexie.Table<ExerciseName, number>;
  templates!: Dexie.Table<Template, string>;   // FIXED

  constructor() {
    super("KeepLiftingDB");

    this.version(6).stores({
      workouts: "++id, date, type, finished",
      sets: "++id, workoutId, category, date",
      plans: "key",
      notes: "id",
      exercises: "++id, name",
      templates: "id, name"   // FIXED
    });
  }
}

export const db = new KeepLiftingDB();