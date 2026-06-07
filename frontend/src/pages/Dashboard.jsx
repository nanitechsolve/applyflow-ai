import { useState, useEffect } from 'react'
import axios from 'axios'
import { Briefcase, Star, FileText, CheckCircle } from 'lucide-react'

const API = 'https://applyflow-ai-backend-wjzj.onrender.com'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_jobs:        0,
    matched_jobs:      0,
    documents_created: 0,
    submitted:         0
  })
  const [logs, setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/logs`)
      ])
      setStats(statsRes.data)
      setLogs(logsRes.data.logs)
    } catch (err) {
      console.error("Failed to fetch dashboard data", err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Jobs Found',    value: stats.total_jobs,        icon: Briefcase,   color: '#6366f1' },
    { label: 'Matched Jobs',  value: stats.matched_jobs,      icon: Star,        color: '#f59e0b' },
    { label: 'Documents',     value: stats.documents_created, icon: FileText,    color: '#06b6d4' },
    { label: 'Submitted',     value: stats.submitted,         icon: CheckCircle, color: '#22c55e' },
  ]

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>

  return (
    <div>
      <h1 style={styles.heading}>Dashboard</h1>
      <p style={styles.sub}>Welcome back, Vuyolwethu 👋</p>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((card, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.iconBox, background: card.color + '22' }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div>
              <p style={styles.statValue}>{card.value}</p>
              <p style={styles.statLabel}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        {logs.length === 0 ? (
          <p style={styles.empty}>No activity yet.</p>
        ) : (
          logs.slice(0, 10).map((log, i) => (
            <div key={i} style={styles.logRow}>
              <span style={styles.logType}>{log.event_type}</span>
              <span style={styles.logMsg}>{log.message}</span>
              <span style={styles.logTime}>
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  loading:      { color: '#94a3b8', padding: '40px' },
  heading:      { fontSize: '24px', fontWeight: '700', margin: '0 0 4px' },
  sub:          { color: '#94a3b8', margin: '0 0 32px', fontSize: '14px' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  statCard:     { background: '#1e293b', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #334155' },
  iconBox:      { padding: '10px', borderRadius: '10px' },
  statValue:    { fontSize: '28px', fontWeight: '700', margin: '0' },
  statLabel:    { fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' },
  section:      { background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 16px' },
  empty:        { color: '#94a3b8', fontSize: '14px' },
  logRow:       { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #334155', fontSize: '13px' },
  logType:      { background: '#6366f122', color: '#6366f1', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', whiteSpace: 'nowrap' },
  logMsg:       { flex: 1, color: '#cbd5e1' },
  logTime:      { color: '#64748b', whiteSpace: 'nowrap' },
}