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
        borderRadius: 12,
        padding: 28,
        marginBottom: 20,
      }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>
          Welcome {user.email?.split('@')[0]}
        </h1>
        <p style={{ marginTop: 8, color: '#cfe3ff' }}>
          Your assigned machines and refill activity overview.
        </p>
      </div>

      {/* CARDS */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        {/* Assigned Machines */}
        <div
          onClick={() => nav("/machines-assigned")}
          style={cardStyle}
        >
          <h3>Assigned Machines</h3>
          <p style={cardValue}>{assignedCount}</p>
        </div>

        {/* Total Products */}
        <div
          onClick={() => nav("/products")}
          style={cardStyle}
        >
          <h3>Products</h3>
          <p style={cardValue}>View List</p>
        </div>

        {/* Refill Logs */}
        <div
          onClick={() => nav("/my-refills")}
          style={cardStyle}
        >
          <h3>Your Refills</h3>
          <p style={cardValue}>{refillCount}</p>
        </div>
      </div>

      {/* MACHINE GRID */}
      <h3>Machines Assigned to You</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
        gap: 16
      }}>
        {machines.map(m => (
          <MachineCard key={m.id} machine={m} onView={() => nav('/machine/' + m.id)} />
        ))}
      </div>

    </div>
  )
}

const cardStyle = {
  flex: 1,
  padding: 20,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  cursor: "pointer",
  textAlign: "center",
}

const cardValue = {
  fontSize: 32,
  fontWeight: 800,
  marginTop: 10,
}
