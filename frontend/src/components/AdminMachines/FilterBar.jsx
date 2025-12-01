// frontend/src/components/AdminMachines/FilterBar.jsx
import React from "react";

export default function FilterBar({ search, setSearch, statusFilter, setStatusFilter }) {
  return (
    <div style={{ display: "flex", gap: 20, marginTop: 20, marginBottom: 10 }}>
      
      {/* SEARCH BOX */}
      <input
        type="text"
        placeholder="Search by ID, Name, Location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          flex: 1,
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
          fontSize: 14,
        }}
      />

      {/* STATUS FILTER */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
          fontSize: 14,
        }}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="service-down">Service Down</option>
      </select>

    </div>
  );
}
