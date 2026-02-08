import { useState } from "react";
import TabBar from "./components/TabBar";

import AddSetPage from "./pages/AddSetPage";
import FinishPage from "./pages/FinishPage";
import HistoryPage from "./pages/HistoryPage";
import PlanPage from "./pages/PlanPage";
import WorkoutDetailsPage from "./pages/WorkoutDetailsPage";

export default function App() {
  const [tab, setTab] = useState("Add Set");

  // ⭐ Detect if URL is /workout/:id
  const path = window.location.pathname;

  if (path.startsWith("/workout/")) {
    const id = Number(path.replace("/workout/", ""));
    return <WorkoutDetailsPage workoutId={id} />;
  }

  return (
    <div style={{ paddingBottom: "60px" }}>
      {tab === "Add Set" && <AddSetPage />}
      {tab === "Finish" && <FinishPage />}
      {tab === "History" && <HistoryPage />}
      {tab === "Plan" && <PlanPage />}

      <TabBar current={tab} onChange={setTab} />
    </div>
  );
}