

interface TabBarProps {
  current: string;
  onChange: (tab: string) => void;
}

export default function TabBar({ current, onChange }: TabBarProps) {
  const tabs = ["Add Set", "Finish", "History", "Plan"];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "var(--grey-dark)",
        display: "flex",
        borderTop: "1px solid var(--grey-border)"
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: current === tab ? "var(--red)" : "var(--white)",
            fontWeight: current === tab ? "bold" : "normal",
            cursor: "pointer"
          }}
        >
          {tab}
        </div>
      ))}
    </div>
  );
}