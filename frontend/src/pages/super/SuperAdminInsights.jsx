import React, { useState } from "react";
import { useOperationalMetrics } from "../../hooks/useOperationalMetrics";

// ✅ EXPORT DEFAULT IS HERE
export default function SuperAdminInsights() {
  console.log("🔥 SuperAdminInsights MOUNTED");

  const [days, setDays] = useState(7);
  const { loading, data } = useOperationalMetrics(days);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading insights…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Operational Insights</h1>

      {/* TIME FILTER */}
      <div style={{ margin: "12px 0 24px" }}>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              background: days === d ? "#1e88e5" : "#eee",
              color: days === d ? "#fff" : "#000",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Last {d} days
          </button>
        ))}
      </div>

      {/* KPI CARDS */}
      <div style={grid}>
        <Card title="Active Machines" value={data.machines.active} />
        <Card title="Disabled Machines" value={data.machines.disabled} />
        <Card title="Unassigned Machines" value={data.machines.unassigned} />
        <Card title="Avg Refill %" value={`${data.refills.avgPercent}%`} />
      </div>

      {/* STALE MACHINES */}
      <Section title={`Machines not refilled in ${days} days`}>
        <SimpleTable
          rows={data.machines.stale}
          empty="No stale machines 🎉"
          columns={[
            ["ID", "id"],
            ["Name", "name"],
            ["Org", "orgId"],
          ]}
        />
      </Section>

      {/* ORG HEALTH */}
      <Section title="Organisation Health">
        <SimpleTable
          rows={data.organisations.map((o) => ({
            ...o,
            health: getHealth(o, data.machines), // Now passing full machine list handled in hook/component logic if needed, 
                                                 // but for simple display:
            // logic below requires raw machine list? 
            // The hook returns aggregates. 
            // For this specific 'health' function to work perfectly, 
            // you might need the full machine list in 'data.machines.all' 
            // or simplify the health check.
            // For now, I will assume simple status check:
          }))}
          empty="No organisations"
          columns={[
            ["Org ID", "id"],
            ["Name", "name"],
            ["Status", "status"], // Simplified to show status directly
          ]}
        />
      </Section>
    </div>
  );
}

/* ───────── HELPERS ───────── */

// Simplified health check based on org status only
// (Since we aren't pulling every single machine into the hook state to filter by org here)
function getHealth(org) {
    if (org.suspended) return "🔴 CRITICAL";
    if (org.status !== 'active') return "🟡 ATTENTION";
    return "🟢 HEALTHY";
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <h3>{title}</h3>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 32 }}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function SimpleTable({ rows, columns, empty }) {
  if (!rows.length) return <div style={{ color: "#777" }}>{empty}</div>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={thead}>
          {columns.map((c) => (
            <th key={c[0]} style={{ padding: "8px 0" }}>{c[0]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={row}>
            {columns.map((c) => (
              <td key={c[1]} style={{ padding: "8px 0" }}>{r[c[1]] || "—"}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ───────── STYLES ───────── */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
};

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 14px rgba(0,0,0,.08)",
};

const thead = {
  borderBottom: "2px solid #ddd",
  textAlign: "left",
};

const row = {
  borderBottom: "1px solid #eee",
};