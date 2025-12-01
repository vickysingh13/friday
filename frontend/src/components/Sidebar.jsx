import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiGrid, FiDatabase, FiActivity, FiClock, FiLogOut } from "react-icons/fi";

export default function Sidebar() {
  const nav = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("sm_user") || "{}");

  const MenuItem = ({ icon, label, path }) => (
    <div
      onClick={() => nav(path)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        margin: "4px 0",
        cursor: "pointer",
        borderRadius: 6,
        background: location.pathname === path ? "#222" : "transparent",
        color: location.pathname === path ? "#fff" : "#bbb",
        transition: ".2s",
      }}
    >
      {icon}
      <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{label}</span>
    </div>
  );

  function logout() {
    localStorage.removeItem("sm_user");
    nav("/login");
  }

  return (
    <div
      style={{
        width: 240,
        background: "#111",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        paddingTop: 70,
        paddingLeft: 12,
        paddingRight: 12,
        color: "#fff",
        boxShadow: "2px 0 6px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MenuItem icon={<FiGrid size={20} />} label="Dashboard" path="/" />
      <MenuItem icon={<FiDatabase size={20} />} label="Machines" path="/" />
      <MenuItem icon={<FiActivity size={20} />} label="Inventory" path="/" />
      <MenuItem icon={<FiClock size={20} />} label="History" path="/" />

      <div
        style={{
          marginTop: "auto",
          padding: "12px 18px",
          cursor: "pointer",
          color: "#e74c3c",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
        onClick={logout}
      >
        <FiLogOut size={18} />
        Logout
      </div>
    </div>
  );
}
