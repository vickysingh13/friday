import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseClient";
import { useNavigate } from "react-router-dom";
import MachineCard from "../components/MachineCard";
import { useAdmin } from "../contexts/AdminContext";

export default function DashboardHome() {
  const { user, role, orgId, loading } = useAdmin();
  const nav = useNavigate();

  const [machines, setMachines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  /* 🔍 DEBUG — KEEP TEMPORARILY */
  useEffect(() => {
    console.log("🧠 AUTH CONTEXT", {
      uid: user?.uid,
      email: user?.email,
      role,
      orgId,
    });
  }, [user, role, orgId]);

  /* 🚫 WAIT UNTIL AUTH CONTEXT IS STABLE */
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!role) return;

    // orgId REQUIRED for admin + refiller
    if (role !== "super_admin" && !orgId) {
      console.warn("⛔ Skipping dashboard queries — orgId missing");
      setPageLoading(false);
      return;
    }

    loadMachines();
    loadLogs();
  }, [loading, user, role, orgId]);

  /* 🔹 LOAD MACHINES (ORG-SAFE) */
  async function loadMachines() {
    try {
      let q;

      if (role === "super_admin") {
        // Super admin → all machines
        q = query(collection(db, "machines"));
      } else if (role === "admin" && orgId) {
        q = query(
          collection(db, "machines"),
          where("orgId", "==", orgId)
        );
      } else if (role === "refiller" && orgId) {
        q = query(
          collection(db, "machines"),
          where("orgId", "==", orgId),
          where("assignedTo", "==", user.uid)
        );
      } else {
        console.warn("⛔ loadMachines aborted — invalid role/orgId");
        return;
      }

      const snap = await getDocs(q);
      setMachines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("❌ loadMachines failed", err);
    } finally {
      setPageLoading(false);
    }
  }

  /* 🔹 LOAD REFILL LOGS (ORG + USER SAFE) */
  async function loadLogs() {
    try {
      let q;

      if (role === "super_admin") {
        q = query(collection(db, "refill_logs"));
      } else if (orgId) {
        q = query(
          collection(db, "refill_logs"),
          where("orgId", "==", orgId),
          where("userEmail", "==", user.email)
        );
      } else {
        console.warn("⛔ loadLogs aborted — orgId missing");
        return;
      }

      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("❌ loadLogs failed", err);
    }
  }

  if (loading || pageLoading) {
    return <div style={{ padding: 24 }}>Loading dashboard…</div>;
  }

  return (
    <div style={{ padding: 24 }}>

      {/* HERO */}
      <div
        style={{
          background: "linear-gradient(90deg,#0f1724,#10243a)",
          color: "#fff",
          borderRadius: 14,
          padding: 28,
          marginBottom: 26,
        }}
      >
        <h2 style={{ margin: 0 }}>Welcome, {user.email}</h2>
        <p style={{ opacity: 0.85, marginTop: 8 }}>
          Role: <b>{role}</b> · Org: <b>{orgId || "—"}</b>
        </p>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          marginBottom: 30,
        }}
      >
        <div style={card}>
          <h3>Machines</h3>
          <div style={big}>{machines.length}</div>
        </div>

        <div style={card}>
          <h3>Your Refills</h3>
          <div style={big}>{logs.length}</div>
        </div>
      </div>

      {/* MACHINE LIST */}
      <h3 style={{ marginBottom: 12 }}>Machines</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 14,
        }}
      >
        {machines.map(m => (
          <MachineCard
            key={m.id}
            machine={m}
            onView={() => {
              if (role === "refiller") {
                nav(`/refiller/machines/${m.id}/slots`);
              } else {
                nav(`/admin/machines/${m.id}/slots`);
              }
            }}
          />
        ))}

        {machines.length === 0 && (
          <div style={{ color: "#777", marginTop: 30 }}>
            No machines available.
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── styles ───── */

const card = {
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 4px 14px rgba(0,0,0,.08)",
  textAlign: "center",
};

const big = {
  fontSize: 32,
  fontWeight: 800,
  marginTop: 6,
  color: "#0b74ff",
};
