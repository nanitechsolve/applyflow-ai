import { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react'

const API = 'https://applyflow-ai-backend-wjzj.onrender.com'

export default function Documents() {
  const [jobs, setJobs]           = useState([])
  const [documents, setDocuments] = useState({})
  const [expanded, setExpanded]   = useState({})
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetchJobsAndDocs()
  }, [])

  const fetchJobsAndDocs = async () => {
    try {
      const jobsRes = await axios.get(`${API}/jobs`)
      const jobs    = jobsRes.data.jobs
      setJobs(jobs)

      const docsMap = {}
      for (const job of jobs) {
        const docsRes = await axios.get(`${API}/documents/${job.id}`)
        docsMap[job.id] = docsRes.data.documents
      }
      setDocuments(docsMap)
    } catch (err) {
      console.error("Failed to fetch documents", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const downloadDoc = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.click()
  }

  const getScoreColor = (score) => {
    if (!score) return '#64748b'
    if (score >= 70) return '#22c55e'
    if (score >= 50) return '#f59e0b'
    return '#ef4444'
  }

  if (loading) return <div style={styles.loading}>Loading documents...</div>

  return (
    <div>
      <h1 style={styles.heading}>Documents</h1>
      <p style={styles.sub}>Generated CVs and cover letters for each job</p>

      {jobs.length === 0 ? (
        <div style={styles.empty}>No jobs yet. Add jobs first to generate documents.</div>
      ) : (
        jobs.map((job) => {
          const docs = documents[job.id] || []
          const cv   = docs.find(d => d.doc_type === 'cv')
          const cl   = docs.find(d => d.doc_type === 'cover_letter')

          return (
            <div key={job.id} style={styles.jobCard}>

              {/* Job Header */}
              <div style={styles.jobHeader}>
                <div style={styles.jobInfo}>
                  <h3 style={styles.jobTitle}>{job.title}</h3>
                  <p style={styles.jobCompany}>{job.company}</p>
                </div>
                <div style={styles.jobRight}>
                  {job.match_score && (
                    <span style={{
                      ...styles.scoreBadge,
                      background: getScoreColor(job.match_score) + '22',
                      color:      getScoreColor(job.match_score)
                    }}>
                      {job.match_score}/100
                    </span>
                  )}
                  <span style={styles.docCount}>
                    {docs.length} document{docs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* No documents yet */}
              {docs.length === 0 && (
                <p style={styles.noDocs}>
                  No documents yet. Go to Jobs page and click Generate CV & Cover Letter.
                </p>
              )}

              {/* CV Document */}
              {cv && (
                <div style={styles.docSection}>
                  <div
                    style={styles.docHeader}
                    onClick={() => toggleExpand(`cv-${job.id}`)}
                  >
                    <div style={styles.docHeaderLeft}>
                      <FileText size={16} color="#6366f1" />
                      <span style={styles.docType}>Tailored CV</span>
                      <span style={styles.docVersion}>v{cv.version}</span>
                      <span style={styles.docDate}>
                        {new Date(cv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.docHeaderRight}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadDoc(cv.content, `CV_${job.company}_${job.title}.txt`)
                        }}
                        style={styles.downloadBtn}
                      >
                        <Download size={13} />
                        Download
                      </button>
                      {expanded[`cv-${job.id}`]
                        ? <ChevronUp size={16} color="#64748b" />
                        : <ChevronDown size={16} color="#64748b" />
                      }
                    </div>
                  </div>

                  {expanded[`cv-${job.id}`] && (
                    <div style={styles.docContent}>
                      <pre style={styles.docText}>{cv.content}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Cover Letter */}
              {cl && (
                <div style={styles.docSection}>
                  <div
                    style={styles.docHeader}
                    onClick={() => toggleExpand(`cl-${job.id}`)}
                  >
                    <div style={styles.docHeaderLeft}>
                      <FileText size={16} color="#06b6d4" />
                      <span style={styles.docType}>Cover Letter</span>
                      <span style={styles.docVersion}>v{cl.version}</span>
                      <span style={styles.docDate}>
                        {new Date(cl.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.docHeaderRight}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadDoc(cl.content, `CoverLetter_${job.company}_${job.title}.txt`)
                        }}
                        style={styles.downloadBtn}
                      >
                        <Download size={13} />
                        Download
                      </button>
                      {expanded[`cl-${job.id}`]
                        ? <ChevronUp size={16} color="#64748b" />
                        : <ChevronDown size={16} color="#64748b" />
                      }
                    </div>
                  </div>

                  {expanded[`cl-${job.id}`] && (
                    <div style={styles.docContent}>
                      <pre style={styles.docText}>{cl.content}</pre>
                    </div>
                  )}
                </div>
              )}

            </div>
          )
        })
      )}
    </div>
  )
}

const styles = {
  loading:        { color: '#94a3b8', padding: '40px' },
  heading:        { fontSize: '24px', fontWeight: '700', margin: '0 0 4px' },
  sub:            { color: '#94a3b8', margin: '0 0 24px', fontSize: '14px' },
  empty:          { color: '#64748b', textAlign: 'center', padding: '60px 0' },
  jobCard:        { background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  jobHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  jobInfo:        { flex: 1 },
  jobTitle:       { fontSize: '16px', fontWeight: '600', margin: '0 0 4px', color: '#e2e8f0' },
  jobCompany:     { fontSize: '13px', color: '#6366f1', margin: '0' },
  jobRight:       { display: 'flex', alignItems: 'center', gap: '8px' },
  scoreBadge:     { padding: '3px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  docCount:       { fontSize: '12px', color: '#64748b' },
  noDocs:         { fontSize: '13px', color: '#64748b', fontStyle: 'italic' },
  docSection:     { border: '1px solid #334155', borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' },
  docHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', background: '#0f172a' },
  docHeaderLeft:  { display: 'flex', alignItems: 'center', gap: '8px' },
  docHeaderRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  docType:        { fontSize: '14px', fontWeight: '500', color: '#e2e8f0' },
  docVersion:     { fontSize: '12px', color: '#64748b', background: '#1e293b', padding: '2px 6px', borderRadius: '4px' },
  docDate:        { fontSize: '12px', color: '#64748b' },
  downloadBtn:    { display: 'flex', alignItems: 'center', gap: '4px', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' },
  docContent:     { padding: '16px', background: '#0f172a', borderTop: '1px solid #334155' },
  docText:        { margin: '0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif' },
}