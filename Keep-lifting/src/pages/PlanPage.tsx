import { useEffect, useState } from "react";
import { db } from "../db/db";

export default function PlanPage() {
  const [notes, setNotes] = useState("");

  // Load saved notes
  useEffect(() => {
    db.notes.get(1).then((data) => {
      if (data) setNotes(data.text);
    });
  }, []);

  // Save automatically
  const saveNotes = async (text: string) => {
    setNotes(text);
    await db.notes.put({ id: 1, text });
  };

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ color: "white" }}>Plan</h2>

      <textarea
        style={{
          width: "100%",
          height: "80vh",
          background: "#111",
          color: "white",
          padding: "10px",
          border: "1px solid #333",
          borderRadius: "6px",
          fontSize: "16px"
        }}
        value={notes}
        onChange={(e) => saveNotes(e.target.value)}
        placeholder="Write anything you want..."
      />
    </div>
  );
}