import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../App'
import { Calendar, Clock, FileText, Activity, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PatientDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ appointments: 0, records: 0, upcoming: 0 })
  const [upcoming, setUpcoming] = useState<any[]>([])

  useEffect(() => {
    apiFetch('/appointments/my').then((data: any[]) => {
      setStats(s => ({ ...s, appointments: data.length, upcoming: data.filter(a => a.status === 'pending' || a.status === 'confirmed').length }))
      setUpcoming(data.filter(a => a.status === 'pending' || a.status === 'confirmed').slice(0, 5))
    }).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Calendar className="text-primary" size={20} /></div>
            <div><p className="text-2xl font-bold">{stats.upcoming}</p><p className="text-xs text-muted-foreground">Upcoming</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Activity className="text-emerald-600 dark:text-emerald-400" size={20} /></div>
            <div><p className="text-2xl font-bold">{stats.appointments}</p><p className="text-xs text-muted-foreground">Total Visits</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><FileText className="text-blue-600 dark:text-blue-400" size={20} /></div>
            <div><p className="text-2xl font-bold">{stats.records}</p><p className="text-xs text-muted-foreground">Records</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <div className="glass-panel">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Upcoming Appointments</h3>
            <Link to="appointments" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {upcoming.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming appointments</p>
                <Link to="book" className="text-sm text-primary hover:underline mt-1 inline-block">Book one now</Link>
              </div>
            ) : upcoming.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{new Date(a.scheduledAt).toLocaleDateString()} at {new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-muted-foreground">{a.doctor?.specialization} {a.doctor?.user?.email ? `- Dr. ${a.doctor.user.email}` : ''}</p>
                  </div>
                </div>
                <span className="text-xs capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid gap-3">
            <Link to="book" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3"><Calendar size={18} className="text-primary" /><span className="text-sm font-medium">Book Appointment</span></div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
            <Link to="records" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3"><FileText size={18} className="text-primary" /><span className="text-sm font-medium">View Medical Records</span></div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
            <Link to="departments" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3"><Activity size={18} className="text-primary" /><span className="text-sm font-medium">Browse Departments</span></div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
