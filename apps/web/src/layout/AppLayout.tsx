import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { useThemeStore } from '../lib/store'
import {
  Calendar, Users, Activity, FileText, Pill, BarChart3, MessageSquare,
  ClipboardList, LogOut, Menu, X, Sun, Moon, Hospital, Bell,
  ArrowRightLeft, FlaskConical, Warehouse, UserCog
} from 'lucide-react'
import { cn } from '../lib/utils'

const roleNav: Record<string, { to: string; label: string; icon: React.ReactNode }[]> = {
  patient: [
    { to: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
    { to: 'appointments', label: 'My Appointments', icon: <Calendar size={18} /> },
    { to: 'records', label: 'Medical Records', icon: <FileText size={18} /> },
    { to: 'book', label: 'Book Appointment', icon: <Users size={18} /> },
    { to: 'departments', label: 'Departments', icon: <Hospital size={18} /> },
  ],
  doctor: [
    { to: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
    { to: 'schedule', label: 'My Schedule', icon: <Calendar size={18} /> },
    { to: 'patients', label: 'Patients', icon: <Users size={18} /> },
    { to: 'referrals', label: 'Referrals', icon: <ArrowRightLeft size={18} /> },
    { to: 'lab-orders', label: 'Lab Orders', icon: <FlaskConical size={18} /> },
    { to: 'admissions', label: 'Admissions', icon: <Warehouse size={18} /> },
    { to: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { to: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  ],
  admin: [
    { to: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
    { to: 'users', label: 'Users', icon: <UserCog size={18} /> },
    { to: 'departments', label: 'Departments', icon: <Hospital size={18} /> },
    { to: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { to: 'inventory', label: 'Inventory', icon: <Pill size={18} /> },
    { to: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  ],
  staff: [
    { to: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
    { to: 'referrals', label: 'Referrals', icon: <ArrowRightLeft size={18} /> },
    { to: 'lab-worklist', label: 'Lab Worklist', icon: <FlaskConical size={18} /> },
    { to: 'inventory', label: 'Inventory', icon: <Pill size={18} /> },
    { to: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  ],
}

export function AppLayout({ children, role }: { children: React.ReactNode; role: string }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useThemeStore()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const navigate = useNavigate()

  const navItems = roleNav[role] || roleNav.patient

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col border-r bg-[var(--sidebar-bg)] text-[var(--sidebar-foreground)] transition-transform lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <Hospital size={24} className="text-primary" />
          <span className="text-lg font-bold tracking-tight">CareSync</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === 'dashboard'}
              className={({ isActive }) =>
                cn('sidebar-link', isActive ? 'sidebar-link-active' : 'sidebar-link-inactive text-[var(--sidebar-foreground)]/70 hover:text-[var(--sidebar-foreground)] hover:bg-white/5')
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <div className="px-3 py-2 text-xs text-[var(--sidebar-foreground)]/50">
            {user?.email}
            <div className="capitalize mt-0.5">{role}</div>
          </div>
          <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive text-[var(--sidebar-foreground)]/70 w-full">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors relative">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">3</span>
          </button>

          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {user?.email.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
