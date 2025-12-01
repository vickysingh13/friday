// frontend/src/components/MachineCard.jsx
import React from 'react';

export default function MachineCard({ machine = {}, onView }) {
  const percent = machine.current_stock_percent ?? 0;
  // color based on percent (informational; you said low-stock will be added later)
  const color = percent > 70 ? '#2ecc71' : percent > 40 ? '#f1c40f' : '#e74c3c';

  return (
    <div
      onClick={() => onView && onView(machine.id)}
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 8px 20px rgba(18,24,40,0.06)',
        cursor: 'pointer',
        transition: 'transform .18s ease, box-shadow .18s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(18,24,40,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(18,24,40,0.06)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, color: '#111' }}>{machine.name || machine.id}</div>
        <div style={{
          padding: '6px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          color,
          border: `1px solid ${color}33`
        }}>
          {machine.status ? machine.status.toUpperCase() : 'UNKNOWN'}
        </div>
      </div>

      <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
        Location: {machine.location || '-'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: '#f1f1f3', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${percent}%`, height: '100%', background: color }} />
          </div>
        </div>

        <div style={{ minWidth: 44, textAlign: 'right', fontWeight: 700 }}>{percent}%</div>
      </div>
    </div>
  );
}
