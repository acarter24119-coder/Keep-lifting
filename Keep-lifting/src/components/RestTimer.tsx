import { useEffect, useState } from "react";

export default function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Vibrate on iPhone
      if (navigator.vibrate) navigator.vibrate(300);
      onClose();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 70,
        left: 0,
        right: 0,
        background: "var(--grey-dark)",
        padding: 20,
        borderTop: "2px solid var(--red)",
        textAlign: "center",
        color: "var(--white)"
      }}
    >
      <h2 style={{ fontSize: 40, margin: 0, color: "var(--red)" }}>
        {timeLeft}s
      </h2>

      <div style={{ marginTop: 10, display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={() => setTimeLeft(60)}
          style={{ padding: "6px 12px", background: "var(--grey)", border: "1px solid var(--grey-border)", color: "var(--white)" }}
        >
          60s
        </button>
        <button
          onClick={() => setTimeLeft(90)}
          style={{ padding: "6px 12px", background: "var(--grey)", border: "1px solid var(--grey-border)", color: "var(--white)" }}
        >
          90s
        </button>
        <button
          onClick={() => setTimeLeft(120)}
          style={{ padding: "6px 12px", background: "var(--grey)", border: "1px solid var(--grey-border)", color: "var(--white)" }}
        >
          120s
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: 10,
          padding: "8px 12px",
          background: "var(--red)",
          color: "var(--white)",
          border: "none",
          cursor: "pointer"
        }}
      >
        Close
      </button>
    </div>
  );
}