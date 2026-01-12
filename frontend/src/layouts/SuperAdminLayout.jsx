import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseClient";

export default function SuperAdminLayout() {
  const navigate = useNavigate();

  // Used the safer logic from the old code (try/finally)
  // This ensures you are redirected even if Firebase throws an error
  async function handleLogout() {
    try {
      await signOut(auth);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <h2 style={{ color: "#4fc3f7", marginBottom: 24 }}>Super Admin</h2>

        <nav style={navStyle}>
          <Link to="/super" style={linkStyle}>Dashboard</Link>
          <Link to="/super/insights" style={linkStyle}>Insights</Link>
          <Link to="/super/orgs" style={linkStyle}>Organisations</Link>
          <Link to="/super/admins" style={linkStyle}>Admins</Link>
          <Link to="/super/machines" style={linkStyle}>Machines</Link>
          <Link to="/super/audit" style={linkStyle}>Audit Logs</Link>
        </nav>

        <button onClick={handleLogout} style={logoutStyle}>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}

// --- Styles ---

const sidebarStyle = {
  width: 260,
  background: "linear-gradient(180deg,#0b1c2d,#0f2f4a)",
  color: "#fff",
  padding: "20px 16px",
  display: "flex",
  flexDirection: "column",
};

const navStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

// Kept the nice visual style from the old code for links
const linkStyle = {
  textDecoration: "none",
  color: "#e3f2fd",
  background: "rgba(255,255,255,0.08)",
  padding: "10px 12px",
  borderRadius: 6,
  fontWeight: 500,
  transition: "background 0.2s ease",
  display: "block", // Ensures padding works correctly
};

const logoutStyle = {
  marginTop: "auto",
  padding: "10px",
  background: "#e53935",
  border: "none",
  color: "#fff",
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer", // Added cursor pointer for better UX
  width: "100%",     // Ensures button fills the width
};