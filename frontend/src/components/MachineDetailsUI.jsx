import React, { useEffect, useState, useRef } from 'react'
import Papa from 'papaparse'
import axios from 'axios'
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebaseClient'

export default function MachineDetailsUI({ machineId, onBack }) {

  const [machine, setMachine] = useState(null)
  const [slots, setSlots] = useState([])
  const [logs, setLogs] = useState([])
  const [masterFile, setMasterFile] = useState(null)
  const [salesFile, setSalesFile] = useState(null)
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('')

  const fileInputMaster = useRef()
  const fileInputSales = useRef()

  useEffect(() => {
    if (!machineId) return
    loadMachine()
    loadLogs()
  }, [machineId])

  async function loadMachine() {
    try {
      const d = await getDoc(doc(db, 'machines', machineId))
      if (d.exists()) setMachine({ id: d.id, ...d.data() })

      const slotsSnap = await getDocs(collection(db, `machines/${machineId}/slots`)).catch(() => null)
      if (slotsSnap && !slotsSnap.empty) setSlots(slotsSnap.docs.map(s => ({ id: s.id, ...s.data() })))

    } catch (err) { console.error(err) }
  }

  async function loadLogs() {
    try {
      const q = query(collection(db, 'refill_logs'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
  }

  function parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: r => resolve(r.data),
        error: e => reject(e)
      })
    })
  }

  async function handleProcess() {
    if (!masterFile || !salesFile) return alert("Please select both CSV files")

    setStatus("Parsing CSV...")

    try {
      const master = await parseCSV(masterFile)
      const sales = await parseCSV(salesFile)

      const masterMap = {}
      master.forEach(row => {
        const name = row.Name || row.name
        const qty = Number(row.quantity || row.Quantity || row.qty || 0)
        if (!name) return
        masterMap[name] = (masterMap[name] || 0) + qty
      })

      const salesCount = {}
      sales.forEach(row => {
        const name = row.Name || row.name
        if (!name) return
        salesCount[name] = (salesCount[name] || 0) + 1
      })

      const out = []
      Object.keys(masterMap).forEach(name => {
        out.push({
          name,
          masterQty: masterMap[name],
          salesQty: salesCount[name] || 0,
          remainingQty: Math.max(0, masterMap[name] - (salesCount[name] || 0))
        })
      })

      setResults(out)
      setStatus("Updating DB...")

      const backend = import.meta.env.VITE_BACKEND_URL
      await axios.post(`${backend}/process-csv`, {
        machineId,
        results: out,
        capacity: machine.capacity
      })

      setStatus("Updated successfully")
      await loadMachine()

    } catch (err) {
      console.error(err)
      setStatus("Error: " + err.message)
    }
  }

  async function handleConfirmRefill() {
    if (!confirm("Confirm refill complete?")) return;

    setStatus("Refilling...")

    try {
      const backend = import.meta.env.VITE_BACKEND_URL
      const user = JSON.parse(localStorage.getItem("sm_user") || "{}")

      await axios.post(`${backend}/confirm-refill`, {
        machineId,
        userEmail: user.email
      })

      setStatus("Refill complete")
      await loadMachine()
      await loadLogs()

    } catch (err) {
      console.error(err)
      setStatus("Error: " + err.message)
    }
  }

  return (
    <div style={{ padding: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={onBack}>← Back</button>

        <div>
          <strong>{machine?.name || machineId}</strong>
          <div style={{ fontSize: 12, color: '#555' }}>{machine?.location || '-'}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div>Capacity: {machine?.capacity}</div>
          <div>Stock: {machine?.current_stock_percent}%</div>
          <div>Last Refill: {machine?.last_refill_at ? new Date(machine.last_refill_at.seconds * 1000).toLocaleString() : '-'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>

        {/* LEFT PANEL */}
        <div>

          {/* Slots */}
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <h3>Slot-wise / Product list</h3>

            {slots.length > 0 ? (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Slot</th><th>Product</th><th>Capacity</th><th>Current</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s.id}>
                      <td>{s.slot_number}</td>
                      <td>{s.product_name}</td>
                      <td>{s.capacity}</td>
                      <td>{s.current_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div>No slot data available.</div>}
          </div>

          <div style={{ height: 20 }} />

          {/* CSV TOOL */}
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <h3>CSV Inventory Tool</h3>

            {/* Drag + Drop */}
            <div style={{ display: 'flex', gap: 20 }}>

              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setMasterFile(e.dataTransfer.files[0]) }}
                onClick={() => fileInputMaster.current.click()}
                style={{ flex: 1, padding: 20, border: '2px dashed #3498db', textAlign: 'center', cursor: 'pointer' }}
              >
                <strong>Drop Master CSV</strong><br />
                <small>or click</small>
              </div>

              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setSalesFile(e.dataTransfer.files[0]) }}
                onClick={() => fileInputSales.current.click()}
                style={{ flex: 1, padding: 20, border: '2px dashed #f39c12', textAlign: 'center', cursor: 'pointer' }}
              >
                <strong>Drop Sales CSV</strong><br />
                <small>or click</small>
              </div>

            </div>

            {/* Hidden inputs */}
            <input type="file" ref={fileInputMaster} style={{ display: 'none' }} accept=".csv" onChange={e => setMasterFile(e.target.files[0])} />
            <input type="file" ref={fileInputSales} style={{ display: 'none' }} accept=".csv" onChange={e => setSalesFile(e.target.files[0])} />

            {/* Buttons */}
            <button onClick={handleProcess}>Calculate</button>

            {/* Results */}
            {results.length > 0 && (
              <table style={{ width: '100%', marginTop: 12 }}>
                <thead>
                  <tr><th>Name</th><th>Master</th><th>Sales</th><th>Remaining</th></tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.masterQty}</td>
                      <td>{r.salesQty}</td>
                      <td>{r.remainingQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>

        {/* RIGHT PANEL */}
        <div>

          {/* Actions */}
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <h3>Actions</h3>

            <button onClick={() => fileInputMaster.current.click()}>Upload Master CSV</button>
            <button onClick={() => fileInputSales.current.click()}>Upload Sales CSV</button>
            <button onClick={handleProcess}>Calculate & Update</button>
            <button onClick={handleConfirmRefill}>Confirm Refill</button>
          </div>

          <div style={{ height: 20 }} />

          {/* LOGS */}
          <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
            <h3>Refill History</h3>

            {logs.length === 0 ? <div>No logs.</div> : (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr><th>Time</th><th>User</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td>{l.createdAt ? new Date(l.createdAt.seconds * 1000).toLocaleString() : '-'}</td>
                      <td>{l.userEmail}</td>
                      <td>{l.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
