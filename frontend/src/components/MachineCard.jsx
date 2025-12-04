// frontend/src/components/MachineCard.jsx
import React from "react";

// Converts Firestore timestamp to readable date
function formatDate(ts) {
  if (!ts || !ts.seconds) return "-";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function MachineCard({ machine = {}, onView }) {
  const percent = machine.current_stock_percent ?? 0;

  // Improved color thresholds
  const color =
    percent >= 70 ? "#2ecc71" : percent >= 40 ? "#f1c40f" : "#e74c3c";

  return (
    <div
      onClick={() => onView && onView(machine.id)}
      style={outerCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = cardHoverShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = cardShadow;
      }}
    >
      {/* HEADER */}
      <div style={headerRow}>
        <div style={titleText}>
          {machine.name || machine.id || "Unnamed Machine"}
        </div>

        <div
          style={{
            ...statusBadge,
            color,
            border: `1px solid ${color}55`,
          }}
        >
          {(machine.status || "UNKNOWN").toUpperCase()}
        </div>
      </div>

      {/* LOCATION */}
      <div style={subText}>📍 {machine.location || "-"}</div>

      {/* STOCK BAR */}
      <div style={stockRow}>
        <div style={stockBar}>
          <div style={{ width: `${percent}%`, ...stockFill(color) }} />
        </div>
        <div style={percentText}>{percent}%</div>
      </div>

      {/* EXTRA MACHINE INFO */}
      <div style={infoLine}>
        Last Refill: <b>{formatDate(machine.last_refill_at)}</b>
      </div>

      <div style={infoLine}>
        Products Inside: <b>{machine.productCount ?? "—"}</b>
      </div>
    </div>
  );
}

/* STYLES */
const outerCard = {
  background: "#fff",
  borderRadius: 14,
  padding: 18,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(18,24,40,0.08)",
  transition: "transform .18s ease, box-shadow .18s ease",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 8,
};

const titleText = { fontWeight: 800, fontSize: 16, color: "#111" };

const statusBadge = {
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
};

const subText = { fontSize: 13, color: "#666", marginBottom: 12 };

const stockRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
};

const stockBar = {
  flex: 1,
  height: 9,
  background: "#ececec",
  borderRadius: 99,
  overflow: "hidden",
};

const stockFill = (color) => ({
  height: "100%",
  background: color,
});

const percentText = { fontSize: 14, fontWeight: 800, minWidth: 40 };

const infoLine = {
  fontSize: 12,
  color: "#444",
  marginTop: 4,
};

const cardShadow = "0 8px 20px rgba(18,24,40,0.08)";
const cardHoverShadow = "0 14px 30px rgba(18,24,40,0.16)";
