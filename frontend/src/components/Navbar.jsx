import React from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("sm_user") || "{}");

  function handleLogout() {
    localStorage.removeItem("sm_user");
    nav("/login");
  }

  return (
    <nav
      style={{
        width: "100%",
        padding: "12px 24px",
        background: "#111",          // Solid dark theme
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 99,
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      }}
    >
      {/* LOGO SECTION */}
      <div
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          letterSpacing: "1px",
          cursor: "pointer",
        }}
        onClick={() => nav("/")}
      >
        SNACK<span style={{ color: "#03a9f4" }}>MASTER</span>
      </div>

      {/* CENTER NAV LINKS */}
      <div style={{ display: "flex", gap: "28px", fontSize: "1rem" }}>
        <span style={linkStyle} onClick={() => nav("/")}>
          Dashboard
        </span>
        <span style={linkStyle} onClick={() => nav("/")}>
          Machines
        </span>
        <span style={linkStyle} onClick={() => nav("/")}>
          Inventory
        </span>
        <span style={linkStyle} onClick={() => nav("/")}>
          History
        </span>
      </div>

      {/* RIGHT SIDE */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ fontSize: "0.95rem", opacity: 0.8 }}>
          {user.email}
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: "6px 14px",
            background: "#e53935",
            border: "none",
            color: "#fff",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

const linkStyle = {
  cursor: "pointer",
  color: "#ccc",
  transition: "0.2s",
  fontWeight: 500,
};
