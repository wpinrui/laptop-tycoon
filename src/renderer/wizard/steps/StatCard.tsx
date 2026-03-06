export function StatCard({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <div
      style={{
        background: "#2a2a2a",
        border: warning ? "1px solid #ff9800" : "1px solid #444",
        borderRadius: "8px",
        padding: "16px",
        textAlign: "center",
      }}
    >
      <div style={{ color: "#888", fontSize: "0.75rem", marginBottom: "8px" }}>{label}</div>
      <div style={{ color: warning ? "#ff9800" : "#e0e0e0", fontSize: "1.25rem", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}
