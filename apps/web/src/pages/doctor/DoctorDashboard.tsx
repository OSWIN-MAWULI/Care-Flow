import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../App'
import { Calendar, Clock, Users, ArrowRightLeft, FlaskConical, Activity } from 'lucide-react'
import { Link, Route, Routes } from 'react-router-dom'

export function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ today: 0, pending: 0, patients: 0, referrals: 0 })
  const [todayAppts, setTodayAppts] = useState<any[]>([])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    apiFetch(`/appointments/doctor?date=${today}`).then((data: any[]) => {
      setTodayAppts(data)
      setStats(s => ({ ...s, today: data.length, pending: data.filter(a => a.status === 'pending' || a.status === 'confirmed').length }))
    }).catch(() => {})
    apiFetch('/referrals/my').then((data: any[]) => {
      setStats(s => ({ ...s, referrals: data.length }))
    }).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Calendar className="text-primary" size={20} /></div><div><p className="text-2xl font-bold">{stats.today}</p><p className="text-xs text-muted-foreground">Today's Patients</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Clock className="text-amber-600 dark:text-amber-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Waiting</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><ArrowRightLeft className="text-blue-600 dark:text-blue-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.referrals}</p><p className="text-xs text-muted-foreground">Referrals</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Activity className="text-emerald-600 dark:text-emerald-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.patients}</p><p className="text-xs text-muted-foreground">Total Patients</p></div></div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="glass-panel">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Today's Schedule</h3>
            <Link to="schedule" className="text-sm text-primary hover:underline">Full schedule</Link>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {todayAppts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No appointments today</p>
              </div>
            ) : todayAppts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-xs font-mono text-muted-foreground w-14 flex-shrink-0">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.patient?.user?.email || 'Patient'}</p>
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  </div>
                </div>
                <span className={`text-xs capitalize px-2 py-1 rounded-full flex-shrink-0 ${a.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : a.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary/10 text-primary'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid gap-3">
            <Link to="schedule" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"><div className="flex items-center gap-3"><Calendar size={18} className="text-primary" /><span className="text-sm font-medium">Manage Schedule</span></div></Link>
            <Link to="patients" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"><div className="flex items-center gap-3"><Users size={18} className="text-primary" /><span className="text-sm font-medium">Patient Records</span></div></Link>
            <Link to="referrals" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"><div className="flex items-center gap-3"><ArrowRightLeft size={18} className="text-primary" /><span className="text-sm font-medium">Create Referral</span></div></Link>
            <Link to="lab-orders" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"><div className="flex items-center gap-3"><FlaskConical size={18} className="text-primary" /><span className="text-sm font-medium">Order Lab Test</span></div></Link>
          </div>
        </div>
      </div>
    </div>
  )
}
