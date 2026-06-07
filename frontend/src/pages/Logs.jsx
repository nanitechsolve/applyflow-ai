import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, RefreshCw } from 'lucide-react'

const API = 'http://127.0.0.1:8000'

export default function Logs() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/logs`)
      setLogs(res.data.logs)
    } catch (err) {
      console.error("Failed to fetch logs", err)
    } finally {
      setLoading(false)
    }
  }

  const getEventColor = (event_type) => {
    const colors = {
      JOB_FOUND:      '#6366f1',
      JOB_SCORED:     '#f59e0b',
      DOC_GENERATED:  '#06b6d4',
      FORM_FILLED:    '#8b5cf6',
      SUBMITTED:      '#22c55e',
      BLOCKED:        '#ef4444',
      ERROR:          '#ef4444',
      USER_APPROVED:  '#22c55e',
      USER_REJECTED:  '#ef4444',
    }
    return colors[event_type] || '#64748b'
  }

  const exportLogs = () => {
    const csv = [
      'Time,Event,Message',
      ...logs.map(l =>
        `"${new Date(l.created_at).toLocaleString()}","${l.event_type}","${l.message}"`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'applyflow_logs.csv'
    a.click()
  }

  if (loading) return <div style={styles.loading}>Loading logs...</div>

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Audit Logs</h1>
          <p style={styles.sub}>Full history of all actions taken by ApplyFlow AI</p>
        </div>
        <div style={styles.headerBtns}>
          <button onClick={fetchLogs} style={styles.refreshBtn}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button onClick={exportLogs} style={styles.exportBtn}>
            <FileText size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={styles.table}>

        {/* Table Header */}
        <div style={styles.tableHeader}>
          <span style={{ width: '160px' }}>Time</span>
          <span style={{ width: '160px' }}>Event</span>
          <span style={{ flex: 1 }}>Message</span>
        </div>

        {/* Table Rows */}
        {logs.length === 0 ? (
          <div style={styles.empty}>No logs yet.</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={styles.tableRow}>
              <span style={styles.time}>
                {new Date(log.created_at).toLocaleString()}
              </span>
              <span style={{
                ...styles.eventBadge,
                background: getEventColor(log.event_type) + '22',
                color:      getEventColor(log.event_type),
              }}>
                {log.event_type}
              </span>
              <span style={styles.logMessage}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  loading:     { color: '#94a3b8', padding: '40px' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  heading:     { fontSize: '24px', fontWeight: '700', margin: '0 0 4px' },
  sub:         { color: '#94a3b8', margin: '0', fontSize: '14px' },
  headerBtns:  { display: 'flex', gap: '8px' },
  refreshBtn:  { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' },
  exportBtn:   { display: 'flex', alignItems: 'center', gap: '6px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  table:       { background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' },
  tableHeader: { display: 'flex', gap: '16px', padding: '12px 20px', borderBottom: '1px solid #334155', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  tableRow:    { display: 'flex', gap: '16px', padding: '12px 20px', borderBottom: '1px solid #1e293b', alignItems: 'center', fontSize: '13px' },
  time:        { width: '160px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 },
  eventBadge:  { width: '160px', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', flexShrink: 0, textAlign: 'center' },
  logMessage:  { flex: 1, color: '#cbd5e1' },
  empty:       { padding: '40px', textAlign: 'center', color: '#64748b' },
}