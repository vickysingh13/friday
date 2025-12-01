// frontend/src/pages/Dashboard.jsx
import React from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import DashboardHome from './DashboardHome'

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ marginLeft: 240, width: '100%' }}>
          <DashboardHome />
        </div>
      </div>
    </>
  )
}
