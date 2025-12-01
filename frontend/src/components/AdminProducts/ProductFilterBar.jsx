import React from "react";
export default function ProductFilterBar({ search, setSearch }) {
  return (
    <div style={{ display: "flex", marginTop: 20, marginBottom: 10 }}>
      <input
        type="text"
        placeholder="Search by name or SKU..."
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
    </div>
  );
}
