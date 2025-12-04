// frontend/src/pages/DashboardHome.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebaseClient'
import MachineCard from '../components/MachineCard'
import { useNavigate } from 'react-router-dom'

export default function DashboardHome() {
  const [machines, setMachines] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  const user = JSON.parse(localStorage.getItem("sm_user") || "{}")
  const myUID = user.uid

  // LOAD ASSIGNED MACHINES ONLY
  useEffect(() => {
    async function loadMachines() {
      setLoading(true)
      try {
        const q = query(
          collection(db, "machines"),
          where("assignedTo", "==", myUID)
        )
        const mSnap = await getDocs(q)
        setMachines(mSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadMachines()
  }, [myUID])

  // LOAD ONLY THIS REFILLER'S REFILL LOGS
  useEffect(() => {
    async function loadLogs() {
      try {
        const q = query(
          collection(db, "refill_logs"),
          where("userEmail", "==", user.email)
        )
        const lSnap = await getDocs(q)
        setLogs(lSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      }
    }
    loadLogs()
  }, [user.email])

  const assignedCount = machines.length
  const refillCount = logs.length

  if (loading) {
    return <div style={{ padding: 28 }}>Loading dashboard...</div>
  }

  return (
  <div style={{ padding: 24 }}>

    {/* HERO SECTION */}
    <div style={{
      background: 'linear-gradient(90deg,#0f1724 0%, #10243a 100%)',
      color: '#fff',
      borderRadius: 14,
      padding: 32,
      marginBottom: 28,
      boxShadow: "0 6px 16px rgba(0,0,0,0.25)"
    }}>
      <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>
        Welcome back, {user.email?.split('@')[0]}
      </h1>
      <p style={{ marginTop: 10, color: '#cfe3ff', fontSize: 15 }}>
        Track machines, products, and your refill activity.
      </p>
    </div>

    {/* DASHBOARD CARDS */}
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
      gap: 20,
      marginBottom: 30
    }}>
      
      <div style={cardStyle} onClick={() => nav("/machines-assigned")}>
        <h3 style={cardTitle}>Assigned Machines</h3>
        <div style={cardValue}>{assignedCount}</div>
        <p style={cardHint}>Machines assigned by admin</p>
      </div>

      <div style={cardStyle} onClick={() => nav("/products")}>
        <h3 style={cardTitle}>Products</h3>
        <div style={cardValue}>📦</div>
        <p style={cardHint}>View product list</p>
      </div>

      <div style={cardStyle} onClick={() => nav("/my-refills")}>
        <h3 style={cardTitle}>Your Refills</h3>
        <div style={cardValue}>{refillCount}</div>
        <p style={cardHint}>Refills done by you</p>
      </div>

    </div>

    {/* MACHINE LIST */}
    <h3 style={{ marginBottom: 16 }}>Machines Assigned to You</h3>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
      gap: 16,
    }}>
      {machines.map(m => (
        <MachineCard
          key={m.id}
          machine={m}
          onView={() => nav('/machine/' + m.id)}
        />
      ))}

      {machines.length === 0 && (
        <div style={{
          gridColumn: "1 / -1",
          textAlign: "center",
          color: "#777",
          marginTop: 40,
          fontSize: 18
        }}>
          No machines assigned yet.
        </div>
      )}
    </div>
  </div>
)
}

// enhanced card styles
const cardTitle = { margin: 0, fontWeight: 700, fontSize: 18 }
const cardHint = { fontSize: 13, marginTop: 4, color: "#777" }

const cardStyle = {
  background: "#fff",
  borderRadius: 14,
  padding: 22,
  boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "transform .2s, box-shadow .2s",
  textAlign: "center",
}
const cardValue = {
  fontSize: 36,
  fontWeight: 900,
  margin: "10px 0",
  color: "#0b74ff"
}
