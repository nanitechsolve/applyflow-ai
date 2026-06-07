import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Star, RefreshCw, FileText } from 'lucide-react'

const API = 'http://127.0.0.1:8000'

export default function Jobs() {
  const [jobs, setJobs]       = useState([])
  const [url, setUrl]         = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/jobs`)
      setJobs(res.data.jobs)
    } catch (err) {
      console.error("Failed to fetch jobs", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddJob = async () => {
    if (!url.trim()) return
    setAdding(true)
    setMessage(null)

    try {
      const res = await axios.post(`${API}/jobs/collect`, { url })
      setMessage({ type: 'success', text: `✅ Job collected successfully!` })
      setUrl('')
      fetchJobs()

      // Auto match the job
      await axios.post(`${API}/jobs/match/${res.data.job_id}`)
      fetchJobs()
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Failed to collect job. Try a different URL.' })
    } finally {
      setAdding(false)
    }
  }

  const handleGenerate = async (job_id) => {
    setMessage(null)
    try {
      await axios.post(`${API}/jobs/generate/${job_id}`)
      setMessage({ type: 'success', text: '✅ CV and cover letter generated!' })
      fetchJobs()
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Generation failed.' })
    }
  }

  const getScoreColor = (score) => {
    if (!score) return '#64748b'
    if (score >= 70) return '#22c55e'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const getStatusColor = (status) => {
    const colors = {
      new:        '#64748b',
      matched:    '#6366f1',
      generating: '#f59e0b',
      ready:      '#22c55e',
    }
    return colors[status] || '#64748b'
  }

  if (loading) return <div style={styles.loading}>Loading jobs...</div>

  return (
    <div>
      <h1 style={styles.heading}>Jobs</h1>
      <p style={styles.sub}>Add job URLs to collect, match and apply</p>

      {/* Add Job */}
      <div style={styles.addBox}>
        <input
          type="text"
          placeholder="Paste a job URL here e.g. https://www.pnet.co.za/jobs--..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={styles.input}
          onKeyDown={e => e.key === 'Enter' && handleAddJob()}
        />
        <button
          onClick={handleAddJob}
          disabled={adding}
          style={styles.addBtn}
        >
          <Plus size={16} />
          {adding ? 'Adding...' : 'Add Job'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          ...styles.message,
          background: message.type === 'success' ? '#22c55e22' : '#ef444422',
          color:      message.type === 'success' ? '#22c55e'   : '#ef4444',
        }}>
          {message.text}
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div style={styles.empty}>
          <Briefcase size={40} color="#334155" />
          <p>No jobs yet. Add a job URL above to get started!</p>
        </div>
      ) : (
        <div style={styles.jobsList}>
          {jobs.map((job, i) => (
            <div key={i} style={styles.jobCard}>

              {/* Job Header */}
              <div style={styles.jobHeader}>
                <div style={styles.jobInfo}>
                  <h3 style={styles.jobTitle}>{job.title}</h3>
                  <p style={styles.jobCompany}>{job.company}</p>
                </div>

                {/* Score */}
                <div style={{
                  ...styles.scoreBadge,
                  background: getScoreColor(job.match_score) + '22',
                  color:      getScoreColor(job.match_score)
                }}>
                  <Star size={14} />
                  {job.match_score ? `${job.match_score}/100` : 'Not scored'}
                </div>
              </div>

              {/* Status + Explanation */}
              <div style={styles.jobMeta}>
                <span style={{
                  ...styles.statusChip,
                  background: getStatusColor(job.status) + '22',
                  color:      getStatusColor(job.status)
                }}>
                  {job.status}
                </span>
                {job.match_explanation && (
                  <p style={styles.explanation}>{job.match_explanation}</p>
                )}
              </div>

              {/* Missing Skills */}
              {job.missing_skills && job.missing_skills.length > 0 && (
                <div style={styles.missingSkills}>
                  <span style={styles.missingLabel}>Missing skills: </span>
                  {job.missing_skills.map((s, i) => (
                    <span key={i} style={styles.missingBadge}>{s}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={styles.actions}>
                <button
                  onClick={() => window.open(job.url, '_blank')}
                  style={styles.actionBtn}
                >
                  View Job
                </button>
                <button
                  onClick={() => handleGenerate(job.id)}
                  style={styles.generateBtn}
                >
                  <FileText size={14} />
                  Generate CV & Cover Letter
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  loading:      { color: '#94a3b8', padding: '40px' },
  heading:      { fontSize: '24px', fontWeight: '700', margin: '0 0 4px' },
  sub:          { color: '#94a3b8', margin: '0 0 24px', fontSize: '14px' },
  addBox:       { display: 'flex', gap: '12px', marginBottom: '16px' },
  input:        { flex: 1, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none' },
  addBtn:       { display: 'flex', alignItems: 'center', gap: '6px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' },
  message:      { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  empty:        { textAlign: 'center', color: '#64748b', padding: '60px 0' },
  jobsList:     { display: 'flex', flexDirection: 'column', gap: '16px' },
  jobCard:      { background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' },
  jobHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  jobInfo:      { flex: 1 },
  jobTitle:     { fontSize: '16px', fontWeight: '600', margin: '0 0 4px', color: '#e2e8f0' },
  jobCompany:   { fontSize: '13px', color: '#6366f1', margin: '0' },
  scoreBadge:   { display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  jobMeta:      { marginBottom: '12px' },
  statusChip:   { display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', marginBottom: '8px' },
  explanation:  { fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' },
  missingSkills:{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '12px' },
  missingLabel: { fontSize: '12px', color: '#64748b' },
  missingBadge: { background: '#ef444422', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' },
  actions:      { display: 'flex', gap: '8px' },
  actionBtn:    { background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' },
  generateBtn:  { display: 'flex', alignItems: 'center', gap: '6px', background: '#6366f122', color: '#6366f1', border: '1px solid #6366f1', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
}