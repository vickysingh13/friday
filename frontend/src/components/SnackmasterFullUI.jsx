import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function SnackmasterFullUI({ machines = [], onView, onRefill, user = { email: '' } }) {
  const nav = useNavigate()
  const handleView = (id) => { if (onView) return onView(id); if (nav) nav('/machine/' + id) }
  const handleRefill = (id) => { if (onRefill) return onRefill(id); alert('Refill: ' + id) }

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
      :root{--primary:#2c3e50;--secondary:#3498db;--success:#2ecc71;--warning:#f39c12;--danger:#e74c3c;--light:#ecf0f1;--dark:#34495e}
      *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Tahoma,Helvetica,Arial,sans-serif}
      body{background-color:#f5f7fa;color:#333}
      .container{display:flex;min-height:100vh}
      .sidebar{width:250px;background-color:var(--primary);color:white;padding:20px 0}
      .logo{text-align:center;padding:20px 0;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:20px}
      .nav-links{list-style:none}
      .nav-links li{padding:12px 20px;border-left:4px solid transparent;transition:all .3s}
      .nav-links li:hover,.nav-links li.active{background-color:rgba(255,255,255,0.1);border-left:4px solid var(--secondary)}
      .main-content{flex:1;padding:20px;overflow-y:auto}
      .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding-bottom:15px;border-bottom:1px solid #ddd}
      .dashboard-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;margin-bottom:30px}
      .card{background:white;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);padding:20px}
      .machine-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
      .machine-card{background:white;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);padding:20px;border-left:4px solid var(--secondary)}
      .machine-header{display:flex;justify-content:space-between;margin-bottom:15px}
      `}</style>

      <div className="container">
        <aside className="sidebar">
          <div className="logo"><h1>SNACKMASTER</h1></div>
          <ul className="nav-links">
            <li className="active"><a>Dashboard</a></li>
            <li><a>Machine List</a></li>
            <li><a>Upload Data</a></li>
            <li><a>Master Data</a></li>
            <li><a>Sales Data</a></li>
            <li><a>Current Stock</a></li>
            <li><a>Refill Products</a></li>
            <li><a>Settings</a></li>
          </ul>
        </aside>

        <main className="main-content">
          <header className="header">
            <h2>Dashboard</h2>
            <div className="user-info">
              <div className="user-welcome">
                <div className="user-avatar">{(user.email || 'U')[0].toUpperCase()}</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{user.email}</div>
              </div>
              <button className="btn" style={{ background: '#e74c3c', color: '#fff', border: 'none' }} onClick={() => { localStorage.removeItem('sm_user'); window.location.href = '/login' }}>Logout</button>
            </div>
          </header>

          <section className="dashboard-cards">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: '1rem', color: 'var(--dark)', fontWeight: 600 }}>Total Machines</div>
                <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <i className="fas fa-cube" />
                </div>
              </div>
              <div className="card-value">{machines.length}</div>
              <div style={{ color: '#27ae60' }}>All machines operational</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: '1rem', color: 'var(--dark)', fontWeight: 600 }}>Low Stock Alerts</div>
                <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <i className="fas fa-exclamation-triangle" />
                </div>
              </div>
              <div className="card-value">{machines.filter(m => (m.current_stock_percent || 0) < 25).length}</div>
              <div style={{ color: '#e74c3c' }}>Need attention</div>
            </div>
          </section>

          <h3 className="section-title">Your Machines</h3>
          <div className="machine-list">
            {machines.map(m => (
              <div className="machine-card" key={m.id}>
                <div className="machine-header">
                  <div className="machine-id">{m.name || m.id}</div>
                  <div>{m.current_stock_percent || 0}%</div>
                </div>
                <div className="machine-info">
                  <div><span>Location:</span><span>{m.location || '-'}</span></div>
                  <div><span>Stock Level:</span><span>{m.current_stock_percent || 0}%</span></div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={() => handleView(m.id)}>View Details</button>
                  <button className="btn btn-warning" onClick={() => handleRefill(m.id)}>Refill</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
