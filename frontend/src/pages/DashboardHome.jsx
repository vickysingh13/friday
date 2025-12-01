// frontend/src/pages/DashboardHome.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebaseClient'
import MachineCard from '../components/MachineCard'
import { useNavigate } from 'react-router-dom'

// helper: check if Firestore timestamp is today in Asia/Kolkata
function isTimestampToday(ts) {
  if (!ts || !ts.seconds) return false
  const tz = 'Asia/Kolkata'
  const d = new Date(ts.seconds * 1000)
  const today = new Date()
  const a = d.toLocaleDateString('en-GB', { timeZone: tz })
  const b = today.toLocaleDateString('en-GB', { timeZone: tz })
  return a === b
}

export default function DashboardHome() {
  const [machines, setMachines] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const mSnap = await getDocs(collection(db, 'machines'))
        setMachines(mSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        const lSnap = await getDocs(collection(db, 'refill_logs'))
        setLogs(lSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  const totalMachines = machines.length
  const activeMachines = machines.filter(m => (m.status || '').toLowerCase() === 'active').length

  // Refill logs that happened today in Asia/Kolkata
  const refillsToday = logs.filter(l => isTimestampToday(l.createdAt)).length

  // quick stats array (for mapping cards)
  const stats = useMemo(() => ([
    { id: 'total', label: 'Total Machines', value: totalMachines, hint: 'All machines' },
    { id: 'active', label: 'Active Machines', value: activeMachines, hint: 'Marked active' },
    // placeholder for Low Stock removed as requested
    { id: 'refills', label: 'Refills Today', value: refillsToday, hint: 'Refill logs today' },
  ]), [totalMachines, activeMachines, refillsToday])

  if (loading) {
    return <div style={{ padding: 28 }}>Loading dashboard...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      {/* HERO */}
      <div style={{
        background: 'linear-gradient(90deg,#0f1724 0%, #10243a 100%)',
        color: '#fff',
        borderRadius: 12,
        padding: 28,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Hello { (JSON.parse(localStorage.getItem('sm_user')||'{}')).email?.split('@')?.[0] || 'User' } 👋</h1>
            <p style={{ margin: '8px 0 0', color: '#cfe3ff' }}>Overview of your machines and recent refill activity.</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => nav('/machine/_v00001')} style={pillBtnStyle}>Go to Machine 1</button>
            <button onClick={() => nav('/machine/_v00002')} style={ghostBtnStyle}>Machine 2</button>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.id} style={{
            background: '#fff',
            padding: 16,
            borderRadius: 12,
            boxShadow: '0 10px 24px rgba(18,24,40,0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ color: '#666', fontSize: 13 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{s.value}</div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{s.hint}</div>
            </div>
            <div style={{ fontSize: 28, color: '#0b74ff', fontWeight: 800 }}>{/* icon placeholder */}▣</div>
          </div>
        ))}
      </div>

      {/* MACHINE GRID */}
      <h3 style={{ margin: '8px 0 14px' }}>Machines</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
        {machines.map(m => (
          <MachineCard key={m.id} machine={m} onView={(id) => nav('/machine/' + id)} />
        ))}
      </div>
    </div>
  )
}

const pillBtnStyle = {
  background: '#03a9f4',
  color: '#fff',
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700
}

const ghostBtnStyle = {
  background: 'transparent',
  color: '#cfe3ff',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #1f7fc6',
  cursor: 'pointer',
  fontWeight: 700
}
