export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#2a2a2a",
        border: "1px solid #444",
        borderRadius: "8px",
        padding: "16px",
        textAlign: "center",
      }}
    >
      <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>{label}</div>
      <div style={{ color: "#e0e0e0", fontSize: "20px", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}
