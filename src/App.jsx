import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import {
  LayoutDashboard, FolderKanban, GanttChart as GanttIcon, LogIn, LogOut,
  Users, Plus, Pencil, Trash2, X, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, Pause, Target, Shield, Eye, ArrowLeft, Save,
  RefreshCw, Search, Menu, AlertCircle, ExternalLink, BarChart3,
  ListChecks, FileWarning, Info, ChevronDown, ChevronUp, Sun, Moon,
  Upload, Download, FileSpreadsheet, Presentation, Swords, Flame,
  Trophy, Star, Zap, Crown, ClipboardList, Settings, UserCheck,
  TrendingUp, Calendar, Timer, Award, Hash
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  hashPassword, getSession, setSession, clearSession,
  LEVELS, BADGES, PRIORITIES, STATUSES, PHASES, IMPACTS,
  DEV_STATUSES, UAT_STATUSES, STATUS_COLORS, PRIORITY_COLORS,
  PIE_COLORS, getUserLevel, getXPProgress, calculateStats,
  getEarnedBadges, aggregateByWeek, getTodayInfo, getWeekNumber,
  getMonthName, formatDate, toDateStr, getWorkingDaysInfo,
  exportToCSV, truncate, TRACKER_START_DATE
} from './config'

// ═══════════════════════════════════════════════════════════════
// AUTH CONTEXT — SHA-256 custom auth via users table
// ═══════════════════════════════════════════════════════════════
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    const hash = await hashPassword(password)
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role, email')
      .eq('username', username.toLowerCase().trim())
      .eq('password_hash', hash)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('Invalid username or password')
    const session = { id: data.id, username: data.username, fullName: data.full_name, role: data.role, email: data.email || '' }
    setSession(session)
    setUser(session)
    return session
  }

  const logout = () => { clearSession(); setUser(null) }
  const isAdmin = user?.role === 'admin'
  const isLoggedIn = !!user

  return <AuthCtx.Provider value={{ user, loading, login, logout, isAdmin, isLoggedIn }}>{children}</AuthCtx.Provider>
}

// ═══════════════════════════════════════════════════════════════
// THEME CONTEXT
// ═══════════════════════════════════════════════════════════════
const ThemeCtx = createContext(null)
const useTheme = () => useContext(ThemeCtx)

function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ebs_theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    document.body.classList.toggle('light', !dark)
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('ebs_theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = () => setDark(p => !p)
  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════
const inputCls = 'w-full px-3 py-2.5 rounded-xl border bg-[var(--bg-card)] text-sm border-[var(--border-light)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-colors'
const selectCls = inputCls
const textareaCls = inputCls + ' resize-none'

function Badge({ children, colors }) {
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
    {colors.dot && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}{children}
  </span>
}
function StatusBadge({ status }) { return <Badge colors={STATUS_COLORS[status] || STATUS_COLORS['On Track']}>{status}</Badge> }
function PriorityBadge({ priority }) { return <Badge colors={PRIORITY_COLORS[priority] || PRIORITY_COLORS['Medium']}>{priority}</Badge> }

function CatBadge({ category }) {
  const cls = category === 'Support' ? 'cat-support' : category === 'Testing' ? 'cat-testing' : 'cat-project'
  const icons = { Support: '🛡️', Testing: '🧪', Project: '🚀' }
  return <span className={`cat-badge ${cls}`}>{icons[category]} {category}</span>
}

function ProgressBar({ value, className = '', height = 'h-2' }) {
  const num = value === 'Ongoing' ? 50 : parseInt(value) || 0
  const color = num >= 100 ? 'bg-blue-500' : num >= 75 ? 'bg-emerald-500' : num >= 40 ? 'bg-amber-500' : 'bg-amber-600'
  return <div className={`flex items-center gap-2 ${className}`}>
    <div className={`flex-1 ${height} bg-[var(--bg-surface)] rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(num, 100)}%` }} />
    </div>
    <span className="text-xs font-semibold text-[var(--text-3)] w-12 text-right">{value === 'Ongoing' ? 'Ongoing' : `${num}%`}</span>
  </div>
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] modal-backdrop" onClick={onClose}>
    <div className={`bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-light)] ${wide ? 'max-w-4xl' : 'max-w-2xl'} w-full mx-4 max-h-[85vh] flex flex-col animate-fade-in`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold font-display text-[var(--text-1)]">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-3)] transition-colors"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </div>
  </div>
}

function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop" onClick={onClose}>
    <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-900/30 rounded-xl"><AlertTriangle className="text-red-400" size={20} /></div>
        <h3 className="text-lg font-bold text-[var(--text-1)]">{title}</h3>
      </div>
      <p className="text-[var(--text-2)] mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] font-semibold text-sm">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold text-sm">Delete</button>
      </div>
    </div>
  </div>
}

function FormField({ label, children, className = '' }) {
  return <div className={className}><label className="block text-sm font-semibold text-[var(--text-3)] mb-1.5">{label}</label>{children}</div>
}

function Spinner() { return <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-amber-500" size={28} /></div> }

function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 bg-[var(--bg-surface)] rounded-2xl mb-4 border border-[var(--border)]"><Icon className="text-[var(--text-3)]" size={32} /></div>
    <h3 className="text-lg font-bold text-[var(--text-1)] mb-1">{title}</h3>
    <p className="text-sm text-[var(--text-3)] mb-4 max-w-sm">{description}</p>
    {action}
  </div>
}

function Toast({ message, type = 'success' }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  return <div className="fixed top-5 right-5 z-[100] animate-slide-in">
    <div className="toast">{icons[type]} {message}</div>
  </div>
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  const el = toast ? <Toast message={toast.message} type={toast.type} /> : null
  return [show, el]
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT — Sidebar + Main Content + Bottom Nav
// ═══════════════════════════════════════════════════════════════
function Layout() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth()
  const { dark, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sidebar XP state
  const [lvl, setLvl] = useState(LEVELS[0])
  const [xp, setXp] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('task_logs').select('hours_spent').eq('user_id', user.id).then(({ data }) => {
      const total = (data || []).reduce((s, l) => s + parseFloat(l.hours_spent || 0), 0)
      setLvl(getUserLevel(total))
      setXp(getXPProgress(total))
    })
  }, [user, location.pathname])

  const projectNav = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/gantt', label: 'Gantt', icon: GanttIcon },
  ]

  const trackerNav = [
    { path: '/tracker', label: 'Work Log', icon: ClipboardList },
    { path: '/tracker/log', label: 'Log Task', icon: Plus },
    { path: '/tracker/performance', label: 'My Performance', icon: TrendingUp },
    { path: '/tracker/tasks', label: 'My Tasks', icon: ListChecks },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const initials = user ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : ''

  return <div className="flex h-screen overflow-hidden">
    {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

    {/* Sidebar */}
    <aside className={`fixed lg:static z-40 h-full w-64 bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Swords className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-1)] font-display tracking-tight">EBS Platform</h1>
            <p className="text-[10px] text-[var(--text-3)] font-semibold tracking-wider uppercase">Projects & Tracker</p>
          </div>
        </div>
      </div>

      {/* User card (if logged in) */}
      {isLoggedIn && (
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 lvl-ring-${lvl.level}`}
              style={{ background: `${lvl.color}20`, color: lvl.color }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-1)] truncate">{user.fullName}</p>
              <p className="text-[10px] font-semibold" style={{ color: lvl.color }}>{lvl.icon} {lvl.name} · Lv.{lvl.level}</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-[var(--text-3)] font-semibold mb-1">
              <span>XP</span><span>{xp}%</span>
            </div>
            <div className="xp-track"><div className={`xp-fill xp-fill-${lvl.level}`} style={{ width: `${xp}%` }} /></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest">Portfolio</p>
        {projectNav.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5 ${isActive(path) ? 'bg-amber-500/15 text-amber-400' : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)]'}`}>
            <Icon size={17} />{label}
          </Link>
        ))}

        <div className="my-4 border-t border-[var(--border)]" />

        <p className="px-3 mb-2 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest">Work Tracker</p>
        {trackerNav.map(({ path, label, icon: Icon }) => {
          const needsAuth = true
          return <Link key={path} to={isLoggedIn ? path : '/login'} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5 ${isActive(path) ? 'bg-amber-500/15 text-amber-400' : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)]'}`}>
            <Icon size={17} />{label}
            {!isLoggedIn && <LogIn size={12} className="ml-auto text-[var(--text-3)]" />}
          </Link>
        })}

        {isAdmin && <>
          <div className="my-4 border-t border-[var(--border)]" />
          <p className="px-3 mb-2 text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest">Admin</p>
          <Link to="/admin" onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5 ${isActive('/admin') ? 'bg-amber-500/15 text-amber-400' : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)]'}`}>
            <Crown size={17} />Admin Panel
          </Link>
        </>}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[var(--border)] space-y-1">
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)] w-full transition-all">
          {dark ? <Sun size={17} /> : <Moon size={17} />}{dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        {isLoggedIn ? (
          <button onClick={() => { logout(); setSidebarOpen(false) }} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 w-full transition-all">
            <LogOut size={17} />Sign Out
          </button>
        ) : (
          <Link to="/login" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-[var(--text-3)] hover:text-amber-400 hover:bg-amber-500/10 w-full transition-all">
            <LogIn size={17} />Sign In
          </Link>
        )}
      </div>
    </aside>

    {/* Main content */}
    <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-[var(--text-3)]"><Menu size={22} /></button>
        <div className="flex items-center gap-2">
          <Swords className="text-amber-500" size={18} />
          <h1 className="text-sm font-bold text-[var(--text-1)] font-display">EBS Platform</h1>
        </div>
        <button onClick={toggleTheme} className="p-1.5 text-[var(--text-3)]">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <Routes>
          {/* Project Tracker — public */}
          <Route path="/" element={<ProjectDashboard />} />
          <Route path="/projects" element={<ProjectTracker />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/gantt" element={<GanttChartPage />} />
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          {/* EBS Tracker — auth required */}
          <Route path="/tracker" element={<AuthGuard><EBSDashboard /></AuthGuard>} />
          <Route path="/tracker/log" element={<AuthGuard><LogTaskPage /></AuthGuard>} />
          <Route path="/tracker/performance" element={<AuthGuard><PerformancePage /></AuthGuard>} />
          <Route path="/tracker/tasks" element={<AuthGuard><TasksPage /></AuthGuard>} />
          {/* Admin */}
          <Route path="/admin" element={<AdminGuard><AdminPanel /></AdminGuard>} />
        </Routes>
      </div>
    </main>

    {/* Mobile bottom nav */}
    <div className="bottom-nav lg:hidden">
      <Link to="/" className={isActive('/') && !location.pathname.startsWith('/tracker') ? 'active' : ''}><LayoutDashboard size={20} /><span>Portfolio</span></Link>
      <Link to="/projects" className={isActive('/projects') ? 'active' : ''}><FolderKanban size={20} /><span>Projects</span></Link>
      <Link to={isLoggedIn ? '/tracker' : '/login'} className={isActive('/tracker') ? 'active' : ''}><ClipboardList size={20} /><span>Tracker</span></Link>
      {isAdmin ? (
        <Link to="/admin" className={isActive('/admin') ? 'active' : ''}><Crown size={20} /><span>Admin</span></Link>
      ) : (
        <Link to="/login" className={isActive('/login') ? 'active' : ''}><LogIn size={20} /><span>Login</span></Link>
      )}
    </div>
  </div>
}

function AuthGuard({ children }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { if (!isLoggedIn) navigate('/login') }, [isLoggedIn])
  return isLoggedIn ? children : null
}

function AdminGuard({ children }) {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { if (!isAdmin) navigate('/login') }, [isAdmin])
  return isAdmin ? children : null
}

// ═══════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════
function LoginPage() {
  const { login, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (isLoggedIn) navigate('/') }, [isLoggedIn])

  const handleLogin = async (e) => {
    e?.preventDefault(); setError(''); setLoading(true)
    try {
      const session = await login(username, password)
      navigate(session.role === 'admin' ? '/admin' : '/tracker')
    } catch (err) { setError(err.message || 'Invalid credentials') }
    setLoading(false)
  }

  return <div className="flex items-center justify-center min-h-[75vh]">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
          <Swords className="text-white" size={28} />
        </div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-1)]">Enter the Arena</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Sign in to access the Work Tracker</p>
      </div>
      <div className="card p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="bg-red-900/20 border border-red-700/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
          <FormField label="Username"><input className={inputCls} type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required /></FormField>
          <FormField label="Password"><input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></FormField>
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all">
            {loading ? '⏳ Authenticating…' : '⚔️ Enter the Arena'}
          </button>
        </form>
      </div>
      <p className="text-center mt-4 text-xs text-[var(--text-3)]">
        <Link to="/" className="hover:text-amber-400 transition-colors">← Back to Portfolio (no login needed)</Link>
      </p>
    </div>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// PROJECT DASHBOARD — Public landing page
// ═══════════════════════════════════════════════════════════════
function ProjectDashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('projects').select('*').order('project_number').then(({ data }) => {
      setProjects(data || []); setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  const total = projects.length
  const byStatus = STATUSES.map(s => ({ name: s, value: projects.filter(p => p.status === s).length })).filter(d => d.value > 0)
  const byPriority = PRIORITIES.map(p => ({ name: p, value: projects.filter(pr => pr.priority === p).length })).filter(d => d.value > 0)
  const byPhase = PHASES.map(ph => ({ name: ph, value: projects.filter(p => p.phase === ph).length })).filter(d => d.value > 0)
  const onTrack = projects.filter(p => p.status === 'On Track').length
  const atRisk = projects.filter(p => p.status === 'At Risk' || p.status === 'Delayed').length
  const completed = projects.filter(p => p.status === 'Completed').length
  const onHold = projects.filter(p => p.status === 'On Hold').length
  const totalCost = projects.reduce((s, p) => s + (parseFloat(p.total_cost_kwd) || 0), 0)

  const summaryCards = [
    { label: 'Total Projects', value: total, icon: FolderKanban, color: 'from-amber-500 to-amber-700' },
    { label: 'On Track', value: onTrack, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-700' },
    { label: 'At Risk / Delayed', value: atRisk, icon: AlertTriangle, color: 'from-red-500 to-red-700' },
    { label: 'Completed', value: completed, icon: Target, color: 'from-blue-500 to-blue-700' },
    { label: 'On Hold', value: onHold, icon: Pause, color: 'from-slate-400 to-slate-600' },
    { label: 'Total Cost (KWD)', value: totalCost.toLocaleString(), icon: BarChart3, color: 'from-violet-500 to-violet-700' },
  ]

  const byDept = {}
  projects.forEach(p => { const d = p.dept_module || 'Unassigned'; byDept[d] = (byDept[d] || 0) + 1 })
  const deptData = Object.entries(byDept).map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 20) + '…' : name, value })).sort((a, b) => b.value - a.value).slice(0, 8)

  return <div className="animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-1)]">Portfolio Dashboard</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">EBS Project Portfolio Overview</p>
      </div>
      {!isAdmin && <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl text-sm font-semibold text-[var(--text-2)] hover:text-amber-400 hover:border-amber-500/30 transition-all">
        <LogIn size={16} /> Admin Login
      </Link>}
    </div>

    {/* Summary cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 stagger">
      {summaryCards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card p-4 animate-fade-in cursor-pointer hover:border-amber-500/30 transition-all" onClick={() => navigate('/projects')}>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
            <Icon className="text-white" size={17} />
          </div>
          <p className="text-2xl font-bold text-[var(--text-1)] font-display">{value}</p>
          <p className="text-[11px] font-semibold text-[var(--text-3)] mt-1">{label}</p>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <div className="card p-5">
        <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">Status Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={byStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
            {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie><RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} /></PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {byStatus.map((d, i) => <span key={d.name} className="text-[10px] font-semibold text-[var(--text-3)] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{d.name} ({d.value})
          </span>)}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">Phase Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byPhase} layout="vertical">
            <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={70} tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
            <RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">By Department</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deptData} layout="vertical">
            <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--text-3)', fontSize: 9 }} />
            <RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Recent projects table */}
    <div className="card p-0">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-1)]">Active Projects</h3>
        <Link to="/projects" className="text-xs font-semibold text-amber-500 hover:text-amber-400">View All →</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-dark">
          <thead><tr><th>#</th><th>Project</th><th>Owner</th><th>Status</th><th>Priority</th><th>Phase</th><th>Progress</th></tr></thead>
          <tbody>
            {projects.filter(p => p.status !== 'Completed').slice(0, 10).map(p => (
              <tr key={p.id} className="cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => navigate(`/projects/${p.id}`)}>
                <td className="text-xs font-mono text-[var(--text-3)]">#{p.project_number}</td>
                <td className="font-semibold text-[var(--text-1)] text-sm max-w-[200px] truncate">{p.project_name}</td>
                <td className="text-xs text-[var(--text-3)]">{p.business_owner}</td>
                <td><StatusBadge status={p.status} /></td>
                <td><PriorityBadge priority={p.priority} /></td>
                <td className="text-xs text-[var(--text-3)]">{p.phase}</td>
                <td><ProgressBar value={p.percent_complete || '0'} className="w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// PROJECT TRACKER — Full table view
// ═══════════════════════════════════════════════════════════════
function ProjectTracker() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [showToast, toastEl] = useToast()

  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('project_number')
    setProjects(data || []); setLoading(false)
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false
      if (priorityFilter && p.priority !== priorityFilter) return false
      if (search) {
        const s = search.toLowerCase()
        return (p.project_name || '').toLowerCase().includes(s) ||
               (p.business_owner || '').toLowerCase().includes(s) ||
               (p.dept_module || '').toLowerCase().includes(s) ||
               String(p.project_number).includes(s)
      }
      return true
    })
  }, [projects, search, statusFilter, priorityFilter])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await supabase.from('projects').delete().eq('id', deleteConfirm)
    setDeleteConfirm(null); loadProjects()
    showToast('Project deleted')
  }

  const handleSave = async (projectData) => {
    if (editProject) {
      await supabase.from('projects').update(projectData).eq('id', editProject.id)
      showToast('Project updated')
    } else {
      const maxNum = Math.max(0, ...projects.map(p => p.project_number || 0))
      await supabase.from('projects').insert({ ...projectData, project_number: maxNum + 1 })
      showToast('Project created')
    }
    setShowForm(false); setEditProject(null); loadProjects()
  }

  if (loading) return <Spinner />

  return <div className="animate-fade-in">
    {toastEl}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-1)]">Project Tracker</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">{filtered.length} of {projects.length} projects</p>
      </div>
      {isAdmin && <button onClick={() => { setEditProject(null); setShowForm(true) }}
        className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16} /> New Project</button>}
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" size={16} />
        <input className={`${inputCls} pl-9`} placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <select className={`${selectCls} w-auto min-w-[140px]`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">All Status</option>
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select className={`${selectCls} w-auto min-w-[140px]`} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
        <option value="">All Priority</option>
        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>

    {/* Table */}
    <div className="card p-0 overflow-x-auto">
      <table className="w-full table-dark">
        <thead><tr><th>#</th><th>Project Name</th><th>Department</th><th>Owner</th><th>Status</th><th>Priority</th><th>Phase</th><th>Progress</th>{isAdmin && <th>Actions</th>}</tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id} className="cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => navigate(`/projects/${p.id}`)}>
              <td className="text-xs font-mono text-[var(--text-3)]">#{p.project_number}</td>
              <td className="font-semibold text-[var(--text-1)] text-sm max-w-[250px]"><span className="truncate block">{p.project_name}</span></td>
              <td className="text-xs text-[var(--text-3)]">{truncate(p.dept_module, 20)}</td>
              <td className="text-xs text-[var(--text-2)]">{p.business_owner}</td>
              <td><StatusBadge status={p.status} /></td>
              <td><PriorityBadge priority={p.priority} /></td>
              <td className="text-xs text-[var(--text-3)]">{p.phase}</td>
              <td><ProgressBar value={p.percent_complete || '0'} className="w-24" /></td>
              {isAdmin && <td onClick={e => e.stopPropagation()}>
                <div className="flex gap-1">
                  <button onClick={() => { setEditProject(p); setShowForm(true) }} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-[var(--text-3)] hover:text-amber-400"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-3)] hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <EmptyState icon={Search} title="No projects found" description="Try adjusting your filters" />}
    </div>

    <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Delete Project" message="This will permanently delete this project and all its milestones and risks." />

    {showForm && <ProjectFormModal project={editProject} onClose={() => { setShowForm(false); setEditProject(null) }} onSave={handleSave} />}
  </div>
}

// ── Project Form Modal ────────────────────────────────────────
function ProjectFormModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project || {
    project_name: '', objective: '', dept_module: '', business_owner: '',
    priority: 'Medium', status: 'On Track', phase: 'Initiation',
    start_date: '', end_date: '', percent_complete: '0',
    total_cost_kwd: 0, business_impact: 'Medium',
    dependencies: '', key_risks: '', mitigation: '', notes_updates: '', actions_needed: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return <Modal open onClose={onClose} title={project ? '✏️ Edit Project' : '➕ New Project'} wide>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Project Name *" className="sm:col-span-2"><input className={inputCls} value={form.project_name} onChange={e => set('project_name', e.target.value)} /></FormField>
      <FormField label="Objective" className="sm:col-span-2"><textarea className={textareaCls} rows={2} value={form.objective || ''} onChange={e => set('objective', e.target.value)} /></FormField>
      <FormField label="Department"><input className={inputCls} value={form.dept_module || ''} onChange={e => set('dept_module', e.target.value)} /></FormField>
      <FormField label="Business Owner"><input className={inputCls} value={form.business_owner || ''} onChange={e => set('business_owner', e.target.value)} /></FormField>
      <FormField label="Priority"><select className={selectCls} value={form.priority} onChange={e => set('priority', e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></FormField>
      <FormField label="Status"><select className={selectCls} value={form.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></FormField>
      <FormField label="Phase"><select className={selectCls} value={form.phase} onChange={e => set('phase', e.target.value)}>{PHASES.map(p => <option key={p}>{p}</option>)}</select></FormField>
      <FormField label="% Complete"><input className={inputCls} value={form.percent_complete || ''} onChange={e => set('percent_complete', e.target.value)} /></FormField>
      <FormField label="Start Date"><input className={inputCls} type="month" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></FormField>
      <FormField label="End Date"><input className={inputCls} type="month" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} /></FormField>
      <FormField label="Total Cost (KWD)"><input className={inputCls} type="number" value={form.total_cost_kwd || 0} onChange={e => set('total_cost_kwd', parseFloat(e.target.value) || 0)} /></FormField>
      <FormField label="Business Impact"><select className={selectCls} value={form.business_impact || ''} onChange={e => set('business_impact', e.target.value)}>{IMPACTS.map(i => <option key={i}>{i}</option>)}</select></FormField>
      <FormField label="Key Risks" className="sm:col-span-2"><textarea className={textareaCls} rows={2} value={form.key_risks || ''} onChange={e => set('key_risks', e.target.value)} /></FormField>
      <FormField label="Notes / Updates" className="sm:col-span-2"><textarea className={textareaCls} rows={2} value={form.notes_updates || ''} onChange={e => set('notes_updates', e.target.value)} /></FormField>
    </div>
    <div className="flex gap-3 justify-end mt-6">
      <button onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] font-semibold text-sm">Cancel</button>
      <button onClick={() => onSave(form)} disabled={!form.project_name} className="btn-gold px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-40"><Save size={14} className="inline mr-1" /> Save</button>
    </div>
  </Modal>
}

// ═══════════════════════════════════════════════════════════════
// PROJECT DETAIL — with time analytics
// ═══════════════════════════════════════════════════════════════
function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [risks, setRisks] = useState([])
  const [timeLogs, setTimeLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('milestones').select('*').eq('project_id', id).order('milestone_number'),
      supabase.from('risks').select('*').eq('project_id', id).order('risk_number'),
      supabase.from('task_logs').select('*, users!task_logs_user_id_fkey(full_name)').eq('project_id', id).order('log_date', { ascending: false }),
    ]).then(([pRes, mRes, rRes, tRes]) => {
      setProject(pRes.data); setMilestones(mRes.data || [])
      setRisks(rRes.data || []); setTimeLogs(tRes.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <Spinner />
  if (!project) return <EmptyState icon={AlertCircle} title="Not Found" description="Project not found" />

  // Time analytics
  const totalHours = timeLogs.reduce((s, l) => s + parseFloat(l.hours_spent || 0), 0)
  const byMember = {}
  timeLogs.forEach(l => {
    const name = l.team_member || 'Unknown'
    if (!byMember[name]) byMember[name] = { name, hours: 0, tasks: 0 }
    byMember[name].hours += parseFloat(l.hours_spent || 0)
    byMember[name].tasks++
  })
  const memberData = Object.values(byMember).sort((a, b) => b.hours - a.hours)

  return <div className="animate-fade-in">
    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-[var(--text-3)] hover:text-amber-400 mb-4 transition-colors">
      <ArrowLeft size={16} /> Back
    </button>

    {/* Header */}
    <div className="card p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-[var(--text-3)]">#{project.project_number}</span>
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
          <h1 className="text-xl font-bold font-display text-[var(--text-1)]">{project.project_name}</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">{project.dept_module} · {project.business_owner}</p>
        </div>
        <ProgressBar value={project.percent_complete || '0'} className="w-40" />
      </div>
      {project.objective && <p className="text-sm text-[var(--text-2)] mt-4 border-t border-[var(--border)] pt-4">{project.objective}</p>}
    </div>

    {/* Info grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="card p-4"><p className="text-[10px] font-bold text-[var(--text-3)] uppercase">Phase</p><p className="text-sm font-bold text-[var(--text-1)] mt-1">{project.phase}</p></div>
      <div className="card p-4"><p className="text-[10px] font-bold text-[var(--text-3)] uppercase">Start</p><p className="text-sm font-bold text-[var(--text-1)] mt-1">{project.start_date || '—'}</p></div>
      <div className="card p-4"><p className="text-[10px] font-bold text-[var(--text-3)] uppercase">End</p><p className="text-sm font-bold text-[var(--text-1)] mt-1">{project.end_date || '—'}</p></div>
      <div className="card p-4"><p className="text-[10px] font-bold text-[var(--text-3)] uppercase">Cost (KWD)</p><p className="text-sm font-bold text-[var(--text-1)] mt-1">{(parseFloat(project.total_cost_kwd) || 0).toLocaleString()}</p></div>
    </div>

    {/* Time Analytics */}
    {timeLogs.length > 0 && <div className="card p-5 mb-6">
      <h3 className="text-sm font-bold text-[var(--text-1)] mb-4 flex items-center gap-2"><Timer size={16} className="text-amber-400" /> Time Invested</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div><p className="text-2xl font-bold text-amber-400 font-display">{totalHours.toFixed(1)}h</p><p className="text-[11px] text-[var(--text-3)]">Total Hours</p></div>
        <div><p className="text-2xl font-bold text-[var(--text-1)] font-display">{memberData.length}</p><p className="text-[11px] text-[var(--text-3)]">Team Members</p></div>
        <div><p className="text-2xl font-bold text-[var(--text-1)] font-display">{timeLogs.length}</p><p className="text-[11px] text-[var(--text-3)]">Log Entries</p></div>
      </div>
      {memberData.length > 0 && <div>
        <p className="text-xs font-bold text-[var(--text-3)] mb-2">Hours by Team Member</p>
        <ResponsiveContainer width="100%" height={Math.max(120, memberData.length * 35)}>
          <BarChart data={memberData} layout="vertical">
            <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
            <RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="hours" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>}
    </div>}

    {/* Milestones */}
    <div className="card p-5 mb-6">
      <h3 className="text-sm font-bold text-[var(--text-1)] mb-4 flex items-center gap-2"><ListChecks size={16} className="text-emerald-400" /> Key Milestones ({milestones.length})</h3>
      {milestones.length === 0 ? <p className="text-sm text-[var(--text-3)]">No milestones yet</p> : (
        <div className="space-y-2">
          {milestones.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <span className="text-xs font-mono text-[var(--text-3)] w-6">#{m.milestone_number}</span>
              <span className="flex-1 text-sm text-[var(--text-1)]">{m.deliverable}</span>
              <span className="text-xs text-[var(--text-3)]">{m.target_date || '—'}</span>
              <Badge colors={STATUS_COLORS[m.development_status === 'Completed' ? 'Completed' : m.development_status === 'Blocked' ? 'Delayed' : m.development_status === 'In Progress' ? 'At Risk' : 'On Hold'] || STATUS_COLORS['On Hold']}>
                {m.development_status || 'Not Started'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Risks */}
    <div className="card p-5 mb-6">
      <h3 className="text-sm font-bold text-[var(--text-1)] mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" /> Risks & Issues ({risks.length})</h3>
      {risks.length === 0 ? <p className="text-sm text-[var(--text-3)]">No risks recorded</p> : (
        <div className="space-y-2">
          {risks.map(r => (
            <div key={r.id} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-[var(--text-3)]">#{r.risk_number}</span>
                <Badge colors={PRIORITY_COLORS[r.impact] || PRIORITY_COLORS['Medium']}>{r.impact} Impact</Badge>
              </div>
              <p className="text-sm text-[var(--text-1)]">{r.description}</p>
              {r.mitigation_action && <p className="text-xs text-[var(--text-3)] mt-1">Mitigation: {r.mitigation_action}</p>}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Notes */}
    {(project.notes_updates || project.actions_needed || project.key_risks) && <div className="card p-5">
      <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">Notes & Updates</h3>
      {project.notes_updates && <div className="mb-3"><p className="text-[10px] font-bold text-[var(--text-3)] uppercase mb-1">Latest Updates</p><p className="text-sm text-[var(--text-2)]">{project.notes_updates}</p></div>}
      {project.actions_needed && <div className="mb-3"><p className="text-[10px] font-bold text-[var(--text-3)] uppercase mb-1">Actions Needed</p><p className="text-sm text-[var(--text-2)]">{project.actions_needed}</p></div>}
      {project.key_risks && <div><p className="text-[10px] font-bold text-[var(--text-3)] uppercase mb-1">Key Risks</p><p className="text-sm text-[var(--text-2)]">{project.key_risks}</p></div>}
    </div>}
  </div>
}

// ═══════════════════════════════════════════════════════════════
// GANTT CHART
// ═══════════════════════════════════════════════════════════════
function GanttChartPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('projects').select('*').order('project_number').then(({ data }) => {
      setProjects((data || []).filter(p => p.start_date && p.end_date)); setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  const parseMonth = (s) => { if (!s) return null; const [y, m] = s.split('-').map(Number); return new Date(y, (m || 1) - 1, 1) }
  const allStarts = projects.map(p => parseMonth(p.start_date)).filter(Boolean)
  const allEnds = projects.map(p => parseMonth(p.end_date)).filter(Boolean)
  if (!allStarts.length) return <EmptyState icon={GanttIcon} title="No timeline data" description="Projects need start and end dates" />

  const minDate = new Date(Math.min(...allStarts))
  const maxDate = new Date(Math.max(...allEnds))
  maxDate.setMonth(maxDate.getMonth() + 1)
  const months = []
  const cur = new Date(minDate)
  while (cur <= maxDate) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1) }
  const totalMonths = months.length

  const statusHex = { 'On Track': '#10b981', 'At Risk': '#f59e0b', 'Delayed': '#ef4444', 'Completed': '#3b82f6', 'On Hold': '#94a3b8' }

  return <div className="animate-fade-in">
    <h1 className="text-2xl font-bold font-display text-[var(--text-1)] mb-6">Gantt Chart</h1>
    <div className="card p-0 overflow-x-auto">
      <div style={{ minWidth: Math.max(800, totalMonths * 60 + 260) }}>
        {/* Header */}
        <div className="flex border-b border-[var(--border)]">
          <div className="w-[250px] shrink-0 p-3 text-xs font-bold text-[var(--text-3)]">Project</div>
          <div className="flex-1 flex">
            {months.map((m, i) => (
              <div key={i} className="flex-1 p-2 text-center text-[10px] font-semibold text-[var(--text-3)] border-l border-[var(--border)]">
                {m.toLocaleDateString('en', { month: 'short', year: '2-digit' })}
              </div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {projects.map(p => {
          const s = parseMonth(p.start_date), e = parseMonth(p.end_date)
          if (!s || !e) return null
          const startIdx = (s.getFullYear() - minDate.getFullYear()) * 12 + s.getMonth() - minDate.getMonth()
          const endIdx = (e.getFullYear() - minDate.getFullYear()) * 12 + e.getMonth() - minDate.getMonth()
          const left = `${(startIdx / totalMonths) * 100}%`
          const width = `${(Math.max(1, endIdx - startIdx + 1) / totalMonths) * 100}%`
          const pct = p.percent_complete === 'Ongoing' ? 50 : parseInt(p.percent_complete) || 0
          return <div key={p.id} className="flex border-b border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
            <div className="w-[250px] shrink-0 p-3 text-xs text-[var(--text-1)] font-semibold truncate">{p.project_name}</div>
            <div className="flex-1 relative py-2">
              <div className="gantt-bar absolute h-6 rounded-md overflow-hidden" style={{ left, width, top: '50%', transform: 'translateY(-50%)', background: `${statusHex[p.status] || '#94a3b8'}30`, border: `1px solid ${statusHex[p.status] || '#94a3b8'}50` }}>
                <div className="h-full rounded-md" style={{ width: `${pct}%`, background: statusHex[p.status] || '#94a3b8', opacity: 0.6 }} />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">{pct}%</span>
              </div>
            </div>
          </div>
        })}
      </div>
    </div>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// EBS DASHBOARD — Team task logs (auth required)
// ═══════════════════════════════════════════════════════════════
function EBSDashboard() {
  const { user, isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('task_logs').select('*, users!task_logs_user_id_fkey(full_name), projects!task_logs_project_id_fkey(project_name, project_number)').order('log_date', { ascending: false }).limit(500),
      supabase.from('users').select('id, full_name').order('full_name'),
    ]).then(([logRes, userRes]) => {
      setLogs(logRes.data || []); setUsers(userRes.data || []); setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterUser && l.user_id !== filterUser) return false
      if (filterCat && l.category !== filterCat) return false
      if (filterMonth && l.month !== filterMonth) return false
      if (search) {
        const s = search.toLowerCase()
        return (l.task_project || '').toLowerCase().includes(s) || (l.team_member || '').toLowerCase().includes(s)
      }
      return true
    })
  }, [logs, filterUser, filterCat, filterMonth, search])

  const months = [...new Set(logs.map(l => l.month))].sort()

  if (loading) return <Spinner />

  return <div className="animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-1)]">📊 Work Log Dashboard</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Team task logs — everyone can view</p>
      </div>
      <Link to="/tracker/log" className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16} /> Log Task</Link>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3 mb-4">
      <select className={`${selectCls} w-auto min-w-[140px]`} value={filterUser} onChange={e => setFilterUser(e.target.value)}>
        <option value="">All Members</option>
        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
      </select>
      <select className={`${selectCls} w-auto min-w-[130px]`} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
        <option value="">All Categories</option>
        <option value="Support">Support</option>
        <option value="Testing">Testing</option>
        <option value="Project">Project</option>
      </select>
      <select className={`${selectCls} w-auto min-w-[130px]`} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
        <option value="">All Months</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" size={16} />
        <input className={`${inputCls} pl-9`} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
    </div>

    {/* Table */}
    <div className="card p-0 overflow-x-auto">
      <div className="px-5 py-3 border-b border-[var(--border)] flex justify-between items-center">
        <span className="text-sm font-bold text-[var(--text-1)]">Task Logs</span>
        <span className="text-xs text-[var(--text-3)]">{filtered.length} entries</span>
      </div>
      <table className="w-full table-dark">
        <thead><tr><th>Date</th><th>Member</th><th>Task</th><th>Category</th><th>Project</th><th>Hours</th><th>Done</th></tr></thead>
        <tbody>
          {filtered.slice(0, 100).map(l => (
            <tr key={l.id}>
              <td className="text-xs whitespace-nowrap">{formatDate(l.log_date)}</td>
              <td className="text-sm font-semibold text-[var(--text-1)]">{l.team_member}</td>
              <td className="text-sm max-w-[200px] truncate">{l.task_project}</td>
              <td><CatBadge category={l.category} /></td>
              <td className="text-xs text-[var(--text-3)]">{l.projects ? `#${l.projects.project_number} ${truncate(l.projects.project_name, 20)}` : '—'}</td>
              <td className="font-bold text-amber-400">{parseFloat(l.hours_spent).toFixed(1)}h</td>
              <td>{l.is_completed ? '✅' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <EmptyState icon={ClipboardList} title="No logs found" description="Try adjusting filters or log your first task" />}
    </div>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// LOG TASK PAGE — with project dropdown
// ═══════════════════════════════════════════════════════════════
function LogTaskPage() {
  const { user } = useAuth()
  const [showToast, toastEl] = useToast()
  const today = getTodayInfo()

  const [form, setForm] = useState({
    taskProject: '', taskDesc: '', category: '', subCategory: '',
    hoursSpent: '', accomplishment: '', comments: '', isCompleted: false,
    logDate: today.date, projectId: ''
  })
  const [subcats, setSubcats] = useState({ Support: [], Testing: [], Project: [] })
  const [projects, setProjects] = useState([])
  const [todayLogs, setTodayLogs] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('support_subcategories').select('name').order('sort_order'),
      supabase.from('testing_subcategories').select('name').order('sort_order'),
      supabase.from('project_subcategories').select('name').order('sort_order'),
      supabase.from('projects').select('id, project_number, project_name').order('project_number'),
    ]).then(([sup, tst, prj, projList]) => {
      setSubcats({
        Support: (sup.data || []).map(r => r.name),
        Testing: (tst.data || []).map(r => r.name),
        Project: (prj.data || []).map(r => r.name),
      })
      setProjects(projList.data || [])
    })
    loadTodayLogs()
  }, [])

  const loadTodayLogs = async () => {
    const { data } = await supabase.from('task_logs').select('*').eq('user_id', user.id).eq('log_date', today.date).order('created_at', { ascending: false })
    setTodayLogs(data || [])
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectSubcat = (name, cat) => {
    setForm(f => ({ ...f, category: cat, subCategory: name }))
  }

  const submit = async () => {
    if (!form.taskProject || !form.subCategory || !form.hoursSpent) {
      showToast('Fill required fields', 'error'); return
    }
    setSubmitting(true)
    const payload = {
      user_id: user.id, team_member: user.fullName,
      log_date: form.logDate, month: getMonthName(form.logDate),
      week_number: getWeekNumber(form.logDate),
      task_project: form.taskProject, task_description: form.taskDesc,
      category: form.category, sub_category: form.subCategory,
      hours_spent: parseFloat(form.hoursSpent),
      accomplishment: form.accomplishment, comments_notes: form.comments,
      is_completed: form.isCompleted,
      project_id: form.projectId ? parseInt(form.projectId) : null,
    }
    const { error } = await supabase.from('task_logs').insert(payload)
    if (error) { showToast('Failed: ' + error.message, 'error') }
    else {
      showToast('Task logged! ⚔️')
      setForm({ taskProject: '', taskDesc: '', category: '', subCategory: '', hoursSpent: '', accomplishment: '', comments: '', isCompleted: false, logDate: today.date, projectId: '' })
      loadTodayLogs()
    }
    setSubmitting(false)
  }

  const catIcons = { Support: '🛡️', Testing: '🧪', Project: '🚀' }
  const todayTotal = todayLogs.reduce((s, l) => s + parseFloat(l.hours_spent || 0), 0)

  return <div className="animate-fade-in max-w-3xl">
    {toastEl}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-1)]">➕ Log a Task</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Record your work — time fields auto-filled</p>
      </div>
    </div>

    <div className="card p-6">
      {/* Date & Member */}
      <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">📅 Who & When</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <FormField label="Team Member"><input className={inputCls} value={user.fullName} readOnly /></FormField>
        <FormField label="Date"><input className={inputCls} type="date" value={form.logDate} onChange={e => set('logDate', e.target.value)} /></FormField>
        <FormField label="Month"><input className={inputCls} value={getMonthName(form.logDate)} readOnly /></FormField>
      </div>

      <div className="border-t border-[var(--border)] my-6" />

      {/* Task details */}
      <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">📝 Task Details</p>
      <FormField label="Task / Project Name *" className="mb-4">
        <input className={inputCls} value={form.taskProject} onChange={e => set('taskProject', e.target.value)} placeholder="e.g. Bug Fix — Login Module" />
      </FormField>
      <FormField label="Description" className="mb-4">
        <textarea className={textareaCls} rows={2} value={form.taskDesc} onChange={e => set('taskDesc', e.target.value)} placeholder="Brief description…" />
      </FormField>

      {/* Link to project (optional) */}
      <FormField label="Link to Project (optional)" className="mb-6">
        <select className={selectCls} value={form.projectId} onChange={e => set('projectId', e.target.value)}>
          <option value="">— No project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>#{p.project_number} — {p.project_name}</option>)}
        </select>
      </FormField>

      <div className="border-t border-[var(--border)] my-6" />

      {/* Category picker */}
      <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">🏷️ Category *</p>
      {['Support', 'Testing', 'Project'].map(cat => (
        <div key={cat} className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: cat === 'Support' ? '#3b82f6' : cat === 'Testing' ? '#8b5cf6' : '#10b981' }}>{catIcons[cat]} {cat}</p>
          <div className="flex flex-wrap gap-2">
            {(subcats[cat] || []).map(name => (
              <button key={name} onClick={() => selectSubcat(name, cat)}
                className={`subcat-card ${form.subCategory === name ? `selected-${cat}` : ''}`}>
                {catIcons[cat]} {name}
              </button>
            ))}
            {(subcats[cat] || []).length === 0 && <p className="text-xs text-[var(--text-3)]">No subcategories. Ask admin to add them.</p>}
          </div>
        </div>
      ))}
      {form.subCategory && <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] mb-4">
        <span className="text-lg">{catIcons[form.category]}</span>
        <span className="text-sm font-semibold text-[var(--text-1)]">{form.subCategory}</span>
        <span className="text-xs text-[var(--text-3)]">→ {form.category}</span>
        <button onClick={() => setForm(f => ({ ...f, category: '', subCategory: '' }))} className="ml-auto text-xs text-[var(--text-3)] hover:text-red-400">✕</button>
      </div>}

      <div className="border-t border-[var(--border)] my-6" />

      {/* Hours */}
      <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">⏱️ Hours Spent *</p>
      <div className="mb-4">
        <input className={`${inputCls} max-w-[160px]`} type="number" min="0.25" max="24" step="0.25" value={form.hoursSpent} onChange={e => set('hoursSpent', e.target.value)} placeholder="0.00" />
        <div className="flex gap-2 mt-2 flex-wrap">
          {[0.5, 1, 1.5, 2, 3, 4, 6, 8].map(h => (
            <button key={h} onClick={() => set('hoursSpent', h)} className="px-3 py-1 rounded-full text-xs font-bold border border-[var(--border-light)] text-[var(--text-2)] hover:border-amber-500/50 hover:text-amber-400 transition-all">{h}h</button>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] my-6" />

      {/* Accomplishments */}
      <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-3">🏆 Accomplishments</p>
      <FormField label="Key Accomplishment" className="mb-4">
        <input className={inputCls} value={form.accomplishment} onChange={e => set('accomplishment', e.target.value)} placeholder="Major contribution today…" />
      </FormField>
      <FormField label="Comments" className="mb-4">
        <textarea className={textareaCls} rows={2} value={form.comments} onChange={e => set('comments', e.target.value)} placeholder="Blockers, next steps…" />
      </FormField>
      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input type="checkbox" checked={form.isCompleted} onChange={e => set('isCompleted', e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
        <span className="text-sm text-[var(--text-2)]">✅ Mark as <strong>completed</strong></span>
      </label>

      <div className="flex gap-3 justify-end">
        <button onClick={() => setForm({ taskProject: '', taskDesc: '', category: '', subCategory: '', hoursSpent: '', accomplishment: '', comments: '', isCompleted: false, logDate: today.date, projectId: '' })}
          className="px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] font-semibold text-sm">🔄 Reset</button>
        <button onClick={submit} disabled={submitting} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
          {submitting ? '⏳ Submitting…' : '⚔️ Submit Task Log'}
        </button>
      </div>
    </div>

    {/* Today's logs */}
    <div className="card p-5 mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-[var(--text-1)]">📋 Today's Logs</h3>
        {todayLogs.length > 0 && <span className="text-xs font-bold text-amber-400">{todayTotal.toFixed(1)}h total</span>}
      </div>
      {todayLogs.length === 0 ? <p className="text-sm text-[var(--text-3)] text-center py-4">No logs yet today</p> : (
        <div className="space-y-2">
          {todayLogs.map(l => (
            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <CatBadge category={l.category} />
              <span className="flex-1 text-sm text-[var(--text-1)] truncate">{l.task_project}</span>
              <span className="text-sm font-bold text-amber-400">{parseFloat(l.hours_spent).toFixed(1)}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE PAGE — RPG stats, badges, charts
// ═══════════════════════════════════════════════════════════════
function PerformancePage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [workInfo, setWorkInfo] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('task_logs').select('*').eq('user_id', user.id).order('log_date'),
      supabase.from('war_day_ranges').select('*'),
      supabase.from('employee_leaves').select('*').eq('user_id', user.id),
    ]).then(([logRes, warRes, leaveRes]) => {
      setLogs(logRes.data || [])
      setWorkInfo(getWorkingDaysInfo(0, leaveRes.data || [], warRes.data || []))
      setLoading(false)
    })
  }, [user.id])

  if (loading) return <Spinner />

  const stats = calculateStats(logs)
  const lvl = getUserLevel(stats.totalHours)
  const xp = getXPProgress(stats.totalHours)
  const badges = getEarnedBadges(stats)
  const weeklyData = aggregateByWeek(logs)
  const efficiency = workInfo && workInfo.expectedHours > 0 ? Math.round((stats.totalHours / workInfo.expectedHours) * 100) : 0

  return <div className="animate-fade-in">
    <h1 className="text-2xl font-bold font-display text-[var(--text-1)] mb-6">⚡ My Performance</h1>

    {/* Level card */}
    <div className="card card-gold p-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2" style={{ borderColor: lvl.color, background: `${lvl.color}15` }}>
          {lvl.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--text-3)]">Current Level</p>
          <p className="text-2xl font-bold font-display" style={{ color: lvl.color }}>{lvl.name} · Lv.{lvl.level}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 xp-track"><div className={`xp-fill xp-fill-${lvl.level}`} style={{ width: `${xp}%` }} /></div>
            <span className="text-xs font-bold text-[var(--text-3)]">{xp}%</span>
          </div>
        </div>
      </div>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 stagger">
      {[
        { label: 'Total Hours', value: `${stats.totalHours}h`, icon: Timer, color: '#f59e0b' },
        { label: 'Tasks Logged', value: stats.totalTasks, icon: ClipboardList, color: '#3b82f6' },
        { label: 'Best Streak', value: `${stats.maxStreak} days`, icon: Flame, color: '#ef4444' },
        { label: 'Efficiency', value: `${efficiency}%`, icon: TrendingUp, color: '#10b981' },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card p-4 animate-fade-in">
          <Icon size={18} style={{ color }} className="mb-2" />
          <p className="text-xl font-bold text-[var(--text-1)] font-display">{value}</p>
          <p className="text-[10px] font-semibold text-[var(--text-3)] mt-1">{label}</p>
        </div>
      ))}
    </div>

    {/* Category breakdown */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {[
        { cat: 'Support', hours: stats.supportHours, count: stats.supportCount, color: '#3b82f6' },
        { cat: 'Testing', hours: stats.testingHours, count: stats.testingCount, color: '#8b5cf6' },
        { cat: 'Project', hours: stats.projectHours, count: stats.projectCount, color: '#10b981' },
      ].map(({ cat, hours, count, color }) => (
        <div key={cat} className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CatBadge category={cat} />
          </div>
          <p className="text-lg font-bold text-[var(--text-1)]">{hours}h</p>
          <p className="text-xs text-[var(--text-3)]">{count} tasks</p>
        </div>
      ))}
    </div>

    {/* Weekly chart */}
    <div className="card p-5 mb-6">
      <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">Weekly Activity</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={weeklyData}>
          <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
          <RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
          <Bar dataKey="hours" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Badges */}
    <div className="card p-5">
      <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">🏅 Badges ({badges.filter(b => b.earned).length}/{badges.length})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {badges.map(b => (
          <div key={b.id} className={`p-3 rounded-xl border text-center transition-all ${b.earned ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[var(--bg-surface)] border-[var(--border)] opacity-40'}`}>
            <span className="text-2xl">{b.icon}</span>
            <p className="text-xs font-bold text-[var(--text-1)] mt-1">{b.name}</p>
            <p className="text-[10px] text-[var(--text-3)]">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// TASKS PAGE — Priority board
// ═══════════════════════════════════════════════════════════════
function TasksPage() {
  const { user, isAdmin } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', due_date: '' })
  const [showToast, toastEl] = useToast()

  const loadTasks = useCallback(async () => {
    const { data } = await supabase.from('priority_tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setTasks(data || []); setLoading(false)
  }, [user.id])

  useEffect(() => { loadTasks() }, [loadTasks])

  const addTask = async () => {
    if (!newTask.title) return
    await supabase.from('priority_tasks').insert({
      user_id: user.id, title: newTask.title,
      priority: newTask.priority, due_date: newTask.due_date || null,
    })
    setNewTask({ title: '', priority: 'Medium', due_date: '' })
    setShowAdd(false); loadTasks()
    showToast('Task added!')
  }

  const toggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    await supabase.from('priority_tasks').update({ status: newStatus }).eq('id', task.id)
    loadTasks()
  }

  const deleteTask = async (id) => {
    await supabase.from('priority_tasks').delete().eq('id', id)
    loadTasks()
  }

  if (loading) return <Spinner />

  const priorities = ['Urgent', 'Important', 'Medium', 'Low']
  const priIcons = { Urgent: '🔴', Important: '🟠', Medium: '🔵', Low: '⚪' }

  return <div className="animate-fade-in">
    {toastEl}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[var(--text-1)]">📌 My Tasks</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Personal priority board</p>
      </div>
      <button onClick={() => setShowAdd(true)} className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16} /> Add Task</button>
    </div>

    {priorities.map(pri => {
      const priTasks = tasks.filter(t => t.priority === pri)
      if (priTasks.length === 0) return null
      return <div key={pri} className="mb-6">
        <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">{priIcons[pri]} {pri} ({priTasks.length})</p>
        <div className="space-y-2">
          {priTasks.map(t => (
            <div key={t.id} className={`card p-4 flex items-center gap-3 priority-${pri.toLowerCase()}`}>
              <button onClick={() => toggleDone(t)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--border-light)]'}`}>
                {t.status === 'done' && <CheckCircle2 size={12} className="text-white" />}
              </button>
              <span className={`flex-1 text-sm font-semibold ${t.status === 'done' ? 'line-through text-[var(--text-3)]' : 'text-[var(--text-1)]'}`}>{t.title}</span>
              {t.due_date && <span className="text-xs text-[var(--text-3)]">{formatDate(t.due_date)}</span>}
              <button onClick={() => deleteTask(t.id)} className="p-1 text-[var(--text-3)] hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    })}

    {tasks.length === 0 && <EmptyState icon={ListChecks} title="No tasks yet" description="Add your first priority task" action={
      <button onClick={() => setShowAdd(true)} className="btn-gold px-4 py-2 rounded-xl text-sm font-bold"><Plus size={14} className="inline mr-1" /> Add Task</button>
    } />}

    {/* Add task modal */}
    <Modal open={showAdd} onClose={() => setShowAdd(false)} title="➕ Add Task">
      <div className="space-y-4">
        <FormField label="Task Title *"><input className={inputCls} value={newTask.title} onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" /></FormField>
        <FormField label="Priority"><select className={selectCls} value={newTask.priority} onChange={e => setNewTask(f => ({ ...f, priority: e.target.value }))}>
          {priorities.map(p => <option key={p}>{p}</option>)}
        </select></FormField>
        <FormField label="Due Date"><input className={inputCls} type="date" value={newTask.due_date} onChange={e => setNewTask(f => ({ ...f, due_date: e.target.value }))} /></FormField>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-2)] font-semibold text-sm">Cancel</button>
          <button onClick={addTask} disabled={!newTask.title} className="btn-gold px-5 py-2 rounded-xl font-bold text-sm disabled:opacity-40">Add Task</button>
        </div>
      </div>
    </Modal>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PANEL — Users, Records, Analytics, Settings
// ═══════════════════════════════════════════════════════════════
function AdminPanel() {
  const [tab, setTab] = useState('users')
  const tabs = [
    { id: 'users', label: '👥 Users', icon: Users },
    { id: 'analytics', label: '📊 Project Analytics', icon: BarChart3 },
    { id: 'records', label: '📋 Records', icon: ClipboardList },
    { id: 'settings', label: '⚙️ Settings', icon: Settings },
  ]

  return <div className="animate-fade-in">
    <h1 className="text-2xl font-bold font-display text-[var(--text-1)] mb-6">👑 Admin Panel</h1>

    {/* Tabs */}
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      {tabs.map(({ id, label }) => (
        <button key={id} onClick={() => setTab(id)}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === id ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-[var(--text-3)] hover:text-[var(--text-1)] border border-transparent'}`}>
          {label}
        </button>
      ))}
    </div>

    {tab === 'users' && <AdminUsers />}
    {tab === 'analytics' && <AdminProjectAnalytics />}
    {tab === 'records' && <AdminRecords />}
    {tab === 'settings' && <AdminSettings />}
  </div>
}

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ fullName: '', username: '', password: '', role: 'user' })
  const [showToast, toastEl] = useToast()

  useEffect(() => {
    supabase.from('users').select('*').order('created_at').then(({ data }) => setUsers(data || []))
  }, [])

  const createUser = async () => {
    if (!newUser.fullName || !newUser.username || !newUser.password) return
    const hash = await hashPassword(newUser.password)
    const { error } = await supabase.from('users').insert({
      username: newUser.username.toLowerCase().trim(),
      password_hash: hash,
      full_name: newUser.fullName,
      role: newUser.role,
    })
    if (error) { showToast(error.message, 'error'); return }
    showToast('User created!')
    setShowCreate(false); setNewUser({ fullName: '', username: '', password: '', role: 'user' })
    const { data } = await supabase.from('users').select('*').order('created_at')
    setUsers(data || [])
  }

  const resetPassword = async (userId) => {
    const newPw = prompt('Enter new password (min 6 chars):')
    if (!newPw || newPw.length < 6) { showToast('Password too short', 'error'); return }
    const hash = await hashPassword(newPw)
    await supabase.from('users').update({ password_hash: hash }).eq('id', userId)
    showToast('Password reset!')
  }

  return <div>
    {toastEl}
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-[var(--text-1)]">Team Members ({users.length})</h3>
      <button onClick={() => setShowCreate(true)} className="btn-gold px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Plus size={14} /> Create User</button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {users.map(u => (
        <div key={u.id} className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text-2)]">
            {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-1)] truncate">{u.full_name}</p>
            <p className="text-xs text-[var(--text-3)]">@{u.username} {u.role === 'admin' && <span className="text-amber-400 font-bold">· Admin</span>}</p>
          </div>
          <button onClick={() => resetPassword(u.id)} className="text-xs text-[var(--text-3)] hover:text-amber-400">🔑</button>
        </div>
      ))}
    </div>

    <Modal open={showCreate} onClose={() => setShowCreate(false)} title="➕ Create User">
      <div className="space-y-4">
        <FormField label="Full Name"><input className={inputCls} value={newUser.fullName} onChange={e => setNewUser(f => ({ ...f, fullName: e.target.value }))} /></FormField>
        <FormField label="Username"><input className={inputCls} value={newUser.username} onChange={e => setNewUser(f => ({ ...f, username: e.target.value }))} /></FormField>
        <FormField label="Password"><input className={inputCls} type="password" value={newUser.password} onChange={e => setNewUser(f => ({ ...f, password: e.target.value }))} /></FormField>
        <FormField label="Role"><select className={selectCls} value={newUser.role} onChange={e => setNewUser(f => ({ ...f, role: e.target.value }))}><option value="user">User</option><option value="admin">Admin</option></select></FormField>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-2)] font-semibold text-sm">Cancel</button>
          <button onClick={createUser} className="btn-gold px-5 py-2 rounded-xl font-bold text-sm">Create</button>
        </div>
      </div>
    </Modal>
  </div>
}

function AdminProjectAnalytics() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    Promise.all([
      supabase.from('task_logs').select('*, users!task_logs_user_id_fkey(full_name), projects!task_logs_project_id_fkey(project_name, project_number)').not('project_id', 'is', null),
      supabase.from('projects').select('id, project_number, project_name'),
    ]).then(([logRes, projRes]) => {
      setData(logRes.data || []); setProjects(projRes.data || []); setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  // Aggregate hours per project
  const byProject = {}
  data.forEach(l => {
    const pName = l.projects?.project_name || 'Unknown'
    const pNum = l.projects?.project_number || 0
    if (!byProject[pName]) byProject[pName] = { name: pName, number: pNum, hours: 0, tasks: 0, members: new Set() }
    byProject[pName].hours += parseFloat(l.hours_spent || 0)
    byProject[pName].tasks++
    byProject[pName].members.add(l.team_member)
  })
  const projectData = Object.values(byProject).map(p => ({ ...p, memberCount: p.members.size })).sort((a, b) => b.hours - a.hours)

  // Aggregate hours per user across projects
  const byUser = {}
  data.forEach(l => {
    const name = l.team_member || 'Unknown'
    if (!byUser[name]) byUser[name] = { name, hours: 0, projectSet: new Set() }
    byUser[name].hours += parseFloat(l.hours_spent || 0)
    if (l.projects) byUser[name].projectSet.add(l.projects.project_name)
  })
  const userData = Object.values(byUser).map(u => ({ ...u, projectCount: u.projectSet.size })).sort((a, b) => b.hours - a.hours)

  return <div>
    <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">📊 Time Investment by Project</h3>

    {projectData.length === 0 ? <p className="text-sm text-[var(--text-3)]">No task logs linked to projects yet. Users can link tasks when logging.</p> : <>
      <div className="card p-5 mb-6">
        <ResponsiveContainer width="100%" height={Math.max(200, projectData.length * 35)}>
          <BarChart data={projectData.slice(0, 15)} layout="vertical">
            <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={180} tick={{ fill: 'var(--text-2)', fontSize: 10 }} />
            <RTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="hours" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-0 mb-6 overflow-x-auto">
        <table className="w-full table-dark">
          <thead><tr><th>#</th><th>Project</th><th>Hours</th><th>Tasks</th><th>Team Members</th></tr></thead>
          <tbody>
            {projectData.map(p => (
              <tr key={p.name}>
                <td className="text-xs font-mono text-[var(--text-3)]">#{p.number}</td>
                <td className="font-semibold text-[var(--text-1)] text-sm">{p.name}</td>
                <td className="font-bold text-amber-400">{p.hours.toFixed(1)}h</td>
                <td className="text-[var(--text-2)]">{p.tasks}</td>
                <td className="text-[var(--text-2)]">{p.memberCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">👥 Employee Time Across Projects</h3>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full table-dark">
          <thead><tr><th>Employee</th><th>Total Hours</th><th>Projects Involved</th></tr></thead>
          <tbody>
            {userData.map(u => (
              <tr key={u.name}>
                <td className="font-semibold text-[var(--text-1)] text-sm">{u.name}</td>
                <td className="font-bold text-amber-400">{u.hours.toFixed(1)}h</td>
                <td className="text-[var(--text-2)]">{u.projectCount} projects</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>}
  </div>
}

function AdminRecords() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('task_logs').select('*, users!task_logs_user_id_fkey(full_name)').order('log_date', { ascending: false }).limit(200).then(({ data }) => {
      setLogs(data || []); setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  return <div>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-[var(--text-1)]">All Records ({logs.length})</h3>
      <button onClick={() => exportToCSV(logs.map(l => ({
        Date: l.log_date, Member: l.team_member, Task: l.task_project,
        Category: l.category, SubCategory: l.sub_category,
        Hours: l.hours_spent, Accomplishment: l.accomplishment,
        Completed: l.is_completed ? 'Yes' : 'No'
      })), 'ebs_export.csv')} className="px-3 py-2 rounded-xl border border-[var(--border-light)] text-xs font-bold text-[var(--text-2)] hover:text-amber-400 flex items-center gap-1">
        <Download size={14} /> Export CSV
      </button>
    </div>
    <div className="card p-0 overflow-x-auto">
      <table className="w-full table-dark">
        <thead><tr><th>Date</th><th>Member</th><th>Task</th><th>Category</th><th>Hours</th><th>Done</th></tr></thead>
        <tbody>
          {logs.map(l => (
            <tr key={l.id}>
              <td className="text-xs">{formatDate(l.log_date)}</td>
              <td className="text-sm font-semibold text-[var(--text-1)]">{l.team_member}</td>
              <td className="text-sm max-w-[200px] truncate">{l.task_project}</td>
              <td><CatBadge category={l.category} /></td>
              <td className="font-bold text-amber-400">{parseFloat(l.hours_spent).toFixed(1)}h</td>
              <td>{l.is_completed ? '✅' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
}

function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [showToast, toastEl] = useToast()

  useEffect(() => {
    supabase.from('app_settings').select('*').then(({ data }) => {
      const map = {}; (data || []).forEach(s => { map[s.key] = s.value })
      setSettings(map); setLoading(false)
    })
  }, [])

  const saveSetting = async (key, value) => {
    await supabase.from('app_settings').update({ value }).eq('key', key)
    showToast('Setting saved')
  }

  if (loading) return <Spinner />

  return <div>
    {toastEl}
    <h3 className="text-sm font-bold text-[var(--text-1)] mb-4">Tracker Configuration</h3>
    <div className="card p-5 space-y-4">
      <FormField label="Tracker Start Date">
        <div className="flex gap-2">
          <input className={inputCls} type="date" value={settings.tracker_start_date || ''} onChange={e => setSettings(s => ({ ...s, tracker_start_date: e.target.value }))} />
          <button onClick={() => saveSetting('tracker_start_date', settings.tracker_start_date)} className="btn-gold px-3 py-2 rounded-xl text-xs font-bold">Save</button>
        </div>
      </FormField>
      <FormField label="Support Category Label">
        <div className="flex gap-2">
          <input className={inputCls} value={settings.category_name_support || ''} onChange={e => setSettings(s => ({ ...s, category_name_support: e.target.value }))} />
          <button onClick={() => saveSetting('category_name_support', settings.category_name_support)} className="btn-gold px-3 py-2 rounded-xl text-xs font-bold">Save</button>
        </div>
      </FormField>
      <FormField label="Testing Category Label">
        <div className="flex gap-2">
          <input className={inputCls} value={settings.category_name_testing || ''} onChange={e => setSettings(s => ({ ...s, category_name_testing: e.target.value }))} />
          <button onClick={() => saveSetting('category_name_testing', settings.category_name_testing)} className="btn-gold px-3 py-2 rounded-xl text-xs font-bold">Save</button>
        </div>
      </FormField>
      <FormField label="Project Category Label">
        <div className="flex gap-2">
          <input className={inputCls} value={settings.category_name_project || ''} onChange={e => setSettings(s => ({ ...s, category_name_project: e.target.value }))} />
          <button onClick={() => saveSetting('category_name_project', settings.category_name_project)} className="btn-gold px-3 py-2 rounded-xl text-xs font-bold">Save</button>
        </div>
      </FormField>
    </div>
  </div>
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </ThemeProvider>
  )
}
