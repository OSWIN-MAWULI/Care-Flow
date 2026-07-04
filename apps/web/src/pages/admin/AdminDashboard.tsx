import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../App'
import { Users, Activity, Calendar, Building2, Plus, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ users: 0, doctors: 0, appointments: 0, departments: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  useEffect(() => {
    apiFetch('/users?limit=5').then((data: any) => {
      setStats(s => ({ ...s, users: data.total || 0 }))
      setRecentUsers(data.users || [])
    }).catch(() => {})
    apiFetch('/users/doctors').then((data: any[]) => setStats(s => ({ ...s, doctors: data.length }))).catch(() => {})
    apiFetch('/analytics/dashboard').then((data: any) => {
      setStats(s => ({ ...s, appointments: data.appointments?.total || 0 }))
    }).catch(() => {})
    apiFetch('/departments').then((data: any[]) => setStats(s => ({ ...s, departments: data.length }))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview & management</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="text-primary" size={20} /></div><div><p className="text-2xl font-bold">{stats.users}</p><p className="text-xs text-muted-foreground">Total Users</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Activity className="text-blue-600 dark:text-blue-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.doctors}</p><p className="text-xs text-muted-foreground">Doctors</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Calendar className="text-emerald-600 dark:text-emerald-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.appointments}</p><p className="text-xs text-muted-foreground">Appointments (30d)</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Building2 className="text-amber-600 dark:text-amber-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.departments}</p><p className="text-xs text-muted-foreground">Departments</p></div></div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Recent Users</h3>
            <Link to="users" className="text-sm text-primary hover:underline">Manage</Link>
          </div>
          <div className="divide-y">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{u.email?.charAt(0).toUpperCase()}</div>
                  <div><p className="text-sm font-medium">{u.email}</p><p className="text-xs text-muted-foreground capitalize">{u.role}</p></div>
                </div>
                <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid gap-3">
            <Link to="users" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><Plus size={18} className="text-primary" /><span className="text-sm font-medium">Add Doctor / Staff</span></div><ChevronRight size={16} className="text-muted-foreground" /></Link>
            <Link to="departments" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><Building2 size={18} className="text-primary" /><span className="text-sm font-medium">Manage Departments</span></div><ChevronRight size={16} className="text-muted-foreground" /></Link>
            <Link to="analytics" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><Activity size={18} className="text-primary" /><span className="text-sm font-medium">View Analytics</span></div><ChevronRight size={16} className="text-muted-foreground" /></Link>
            <Link to="inventory" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><Users size={18} className="text-primary" /><span className="text-sm font-medium">Manage Inventory</span></div><ChevronRight size={16} className="text-muted-foreground" /></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
