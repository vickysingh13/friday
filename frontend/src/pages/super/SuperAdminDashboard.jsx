import React from "react";
import { useAdmin } from "../../contexts/AdminContext";
import { useSuperAdminKPIs } from "../../hooks/useSuperAdminKPIs";

export default function SuperAdminDashboard() {
  const { user } = useAdmin();
  const { loading, stats } = useSuperAdminKPIs();

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>Super Admin Dashboard</h1>

      <p style={{ color: "#555", marginBottom: 24 }}>
        Logged in as <b>{user?.email}</b>
      </p>

      {/* KPI CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        <Card
          title="Total Organisations"
          value={loading ? "—" : stats.organisations}
        />
        <Card
          title="Total Machines"
          value={loading ? "—" : stats.machines}
        />
        <Card
          title="Total Admins"
          value={loading ? "—" : stats.admins}
        />
        <Card
          title="Total Refills"
          value={loading ? "—" : stats.refills}
        />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 4px 14px rgba(0,0,0,.08)",
      }}
    >
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      <div style={{ fontSize: 32, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
