// frontend/src/pages/Dashboard.jsx
import React from 'react'
import Navbar from '../components/Navbar'
import DashboardHome from './DashboardHome'

export default function Dashboard() {
  return (
    <>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <div style={{ marginLeft: 240, width: '100%' }}>
          <DashboardHome />
        </div>
      </div>
    </>
  )
}
