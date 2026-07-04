import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../App'
import { FlaskConical, ArrowRightLeft, Pill, MessageSquare, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

export function StaffDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ labOrders: 0, referrals: 0, lowStock: 0 })

  useEffect(() => {
    apiFetch('/lab-orders/department/placeholder').then(d => setStats(s => ({ ...s, labOrders: Array.isArray(d) ? d.length : 0 }))).catch(() => {})
    apiFetch('/inventory/low-stock').then((d: any[]) => setStats(s => ({ ...s, lowStock: d.length }))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><FlaskConical className="text-primary" size={20} /></div><div><p className="text-2xl font-bold">{stats.labOrders}</p><p className="text-xs text-muted-foreground">Lab Orders</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><ArrowRightLeft className="text-amber-600 dark:text-amber-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.referrals}</p><p className="text-xs text-muted-foreground">Incoming Referrals</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><Pill className="text-red-600 dark:text-red-400" size={20} /></div><div><p className="text-2xl font-bold">{stats.lowStock}</p><p className="text-xs text-muted-foreground">Low Stock Items</p></div></div></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid gap-3">
            <Link to="lab-worklist" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><FlaskConical size={18} className="text-primary" /><span className="text-sm font-medium">Lab Worklist</span></div></Link>
            <Link to="referrals" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><ArrowRightLeft size={18} className="text-primary" /><span className="text-sm font-medium">Referral Inbox</span></div></Link>
            <Link to="inventory" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><Pill size={18} className="text-primary" /><span className="text-sm font-medium">Manage Inventory</span></div></Link>
            <Link to="messages" className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"><div className="flex items-center gap-3"><MessageSquare size={18} className="text-primary" /><span className="text-sm font-medium">Messages</span></div></Link>
          </div>
        </div>

        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Live Activity</h3>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Activity size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Department activity feed</p>
            <p className="text-xs">Connect to see real-time updates</p>
          </div>
        </div>
      </div>
    </div>
  )
}
