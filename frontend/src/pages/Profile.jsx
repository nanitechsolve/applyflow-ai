import { useState, useEffect } from 'react'
import axios from 'axios'
import { User, Upload, CheckCircle } from 'lucide-react'

const API = 'http://127.0.0.1:8000'

export default function Profile() {
  const [profile, setProfile]   = useState(null)
  const [skills, setSkills]     = useState([])
  const [experience, setExp]    = useState([])
  const [education, setEdu]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage]   = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/profile`)
      setProfile(res.data.profile)
      setSkills(res.data.skills)
      setExp(res.data.experience)
      setEdu(res.data.education)
    } catch (err) {
      console.error("No profile found", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(`${API}/profile/upload`, formData)
      setMessage({ type: 'success', text: `✅ CV uploaded! Found ${res.data.skills} skills and ${res.data.experience} jobs.` })
      fetchProfile()
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div style={styles.loading}>Loading profile...</div>

  return (
    <div>
      <h1 style={styles.heading}>My Profile</h1>
      <p style={styles.sub}>Your CV data extracted and stored</p>

      {/* Upload Section */}
      <div style={styles.uploadBox}>
        <Upload size={24} color="#6366f1" />
        <div>
          <p style={styles.uploadTitle}>Upload your CV</p>
          <p style={styles.uploadSub}>PDF or DOCX supported</p>
        </div>
        <label style={styles.uploadBtn}>
          {uploading ? 'Uploading...' : 'Choose File'}
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </label>
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

      {/* Profile Info */}
      {profile && (
        <>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <User size={18} color="#6366f1" />
              <h2 style={styles.cardTitle}>Personal Info</h2>
            </div>
            <div style={styles.infoGrid}>
              <div><p style={styles.infoLabel}>Name</p><p style={styles.infoValue}>{profile.name}</p></div>
              <div><p style={styles.infoLabel}>Email</p><p style={styles.infoValue}>{profile.email}</p></div>
              <div><p style={styles.infoLabel}>Phone</p><p style={styles.infoValue}>{profile.phone}</p></div>
              <div><p style={styles.infoLabel}>Location</p><p style={styles.infoValue}>{profile.location || 'Cape Town'}</p></div>
            </div>
            {profile.summary && (
              <div style={{ marginTop: '16px' }}>
                <p style={styles.infoLabel}>Summary</p>
                <p style={{ ...styles.infoValue, lineHeight: '1.6' }}>{profile.summary}</p>
              </div>
            )}
          </div>

          {/* Skills */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <CheckCircle size={18} color="#22c55e" />
              <h2 style={styles.cardTitle}>Skills ({skills.length})</h2>
            </div>
            <div style={styles.skillsGrid}>
              {skills.map((s, i) => (
                <span key={i} style={styles.skillBadge}>{s.skill}</span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <CheckCircle size={18} color="#f59e0b" />
              <h2 style={styles.cardTitle}>Experience ({experience.length})</h2>
            </div>
            {experience.map((exp, i) => (
              <div key={i} style={styles.expRow}>
                <div>
                  <p style={styles.expRole}>{exp.role}</p>
                  <p style={styles.expCompany}>{exp.company}</p>
                  <p style={styles.expDesc}>{exp.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Education */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <CheckCircle size={18} color="#06b6d4" />
              <h2 style={styles.cardTitle}>Education ({education.length})</h2>
            </div>
            {education.map((edu, i) => (
              <div key={i} style={styles.expRow}>
                <p style={styles.expRole}>{edu.degree} in {edu.field}</p>
                <p style={styles.expCompany}>{edu.institution} · {edu.year}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const styles = {
  loading:     { color: '#94a3b8', padding: '40px' },
  heading:     { fontSize: '24px', fontWeight: '700', margin: '0 0 4px' },
  sub:         { color: '#94a3b8', margin: '0 0 24px', fontSize: '14px' },
  uploadBox:   { display: 'flex', alignItems: 'center', gap: '16px', background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px dashed #6366f1', marginBottom: '16px' },
  uploadTitle: { margin: '0', fontWeight: '600', fontSize: '15px' },
  uploadSub:   { margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' },
  uploadBtn:   { marginLeft: 'auto', background: '#6366f1', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  message:     { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  card:        { background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '16px' },
  cardHeader:  { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  cardTitle:   { fontSize: '15px', fontWeight: '600', margin: '0' },
  infoGrid:    { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  infoLabel:   { fontSize: '12px', color: '#64748b', margin: '0 0 4px' },
  infoValue:   { fontSize: '14px', color: '#e2e8f0', margin: '0' },
  skillsGrid:  { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  skillBadge:  { background: '#6366f122', color: '#818cf8', padding: '4px 12px', borderRadius: '20px', fontSize: '13px' },
  expRow:      { paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #334155' },
  expRole:     { fontSize: '14px', fontWeight: '600', margin: '0 0 4px', color: '#e2e8f0' },
  expCompany:  { fontSize: '13px', color: '#6366f1', margin: '0 0 8px' },
  expDesc:     { fontSize: '13px', color: '#94a3b8', margin: '0', lineHeight: '1.5' },
}