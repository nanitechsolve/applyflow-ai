import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Jobs from './pages/Jobs'
import Logs from './pages/Logs'
import Documents from './pages/Documents'
import { LayoutDashboard, User, Briefcase, FileText, File } from 'lucide-react'

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const pages = {
    dashboard: <Dashboard />,
    profile:   <Profile />,
    jobs:      <Jobs />,
    documents: <Documents />,
    logs:      <Logs />
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile',   label: 'Profile',   icon: User },
    { id: 'jobs',      label: 'Jobs',      icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: File },
    { id: 'logs',      label: 'Logs',      icon: FileText },
  ]

  return (
    <div style={styles.container}>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <Briefcase size={22} color="#6366f1" />
          <span style={styles.logoText}>ApplyFlow AI</span>
        </div>

        <nav>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                ...styles.navBtn,
                background: activePage === item.id ? '#6366f1' : 'transparent',
                color:      activePage === item.id ? '#fff' : '#94a3b8',
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {pages[activePage]}
      </div>

    </div>
  )
}

const styles = {
  container: {
    display:       'flex',
    height:        '100vh',
    background:    '#0f172a',
    color:         '#e2e8f0',
    fontFamily:    'system-ui, sans-serif',
  },
  sidebar: {
    width:         '220px',
    background:    '#1e293b',
    padding:       '24px 12px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    borderRight:   '1px solid #334155',
  },
  logo: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    padding:        '0 12px 24px',
    borderBottom:   '1px solid #334155',
    marginBottom:   '12px',
  },
  logoText: {
    fontSize:   '16px',
    fontWeight: '600',
    color:      '#e2e8f0',
  },
  navBtn: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    width:          '100%',
    padding:        '10px 12px',
    border:         'none',
    borderRadius:   '8px',
    cursor:         'pointer',
    fontSize:       '14px',
    textAlign:      'left',
    transition:     'all 0.2s',
  },
  main: {
    flex:       1,
    overflow:   'auto',
    padding:    '32px',
  }
}