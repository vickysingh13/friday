import React from "react";
import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* LEFT SIDEBAR */}
      <div style={{
        width: 240,
        background: "#111",
        color: "#fff",
        padding: "20px 12px"
      }}>
        <h2 style={{ color: "#0bc3ff" }}>Admin Panel</h2>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link to="/admin" style={linkStyle}>Dashboard</Link>
          <Link to="/admin/machines" style={linkStyle}>Manage Machines</Link>
          <Link to="/admin/products" style={linkStyle}>Manage Products</Link>
          <Link to="/admin/refill-logs" style={linkStyle}>Refill Logs</Link>
          <Link to="/admin/audit-logs" style={linkStyle}>Audit Logs</Link>
          <Link to="/admin/users" style={linkStyle}>Manage Users</Link> {/* Add this */}
        </div>  
      </div>

      {/* PAGE CONTENT GOES HERE */}
      <div style={{ flex: 1, padding: 20 }}>
        <Outlet />
      </div>

    </div>
  );
}

const linkStyle = {
  color: "#eee",
  textDecoration: "none",
  padding: "8px 12px",
  borderRadius: 6,
  background: "#222",
  display: "block"
};
