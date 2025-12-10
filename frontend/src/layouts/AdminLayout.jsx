// frontend/src/layouts/AdminLayout.jsx
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

          {/* Machines submenu */}
          <div>
            <div style={{ color: "#aaa", fontSize: 12, padding: "6px 12px" }}>Machines</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 6 }}>
              <Link to="/admin/machines" style={subLinkStyle}>All Machines</Link>
              <Link to="/admin/machines/assign" style={subLinkStyle}>Assign Machines</Link>
            </div>
          </div>

          <Link to="/admin/products" style={linkStyle}>Manage Products</Link>
          <Link to="/admin/refill-logs" style={linkStyle}>Refill Logs</Link>
          <Link to="/admin/audit-logs" style={linkStyle}>Audit Logs</Link>
          <Link to="/admin/users" style={linkStyle}>Users</Link>
        </div>

      </div>

      {/* RIGHT CONTENT AREA */}
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

const subLinkStyle = {
  color: "#ddd",
  textDecoration: "none",
  padding: "6px 10px",
  borderRadius: 6,
  background: "transparent",
  display: "block",
  fontSize: 13
};
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            