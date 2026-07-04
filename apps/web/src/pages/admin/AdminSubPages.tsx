import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Route, Routes, Link } from 'react-router-dom'
import { Users, Building2, BarChart3, Pill, Activity, ChevronRight, UserPlus } from 'lucide-react'

import { AdminDashboard } from './AdminDashboard'

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState<'doctor' | 'staff' | null>(null)
  const [form, setForm] = useState<any>({})

  useEffect(() => { apiFetch('/users?limit=100').then((d: any) => setUsers(d.users || [])).catch(() => {}) }, [])

  const handleCreate = async (type: 'doctor' | 'staff') => {
    try {
      await apiFetch(type === 'doctor' ? '/users/doctors' : '/users/staff', {
        method: 'POST', body: JSON.stringify(form),
      })
      setShowCreate(null)
      setForm({})
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate('doctor')} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium"><UserPlus size={16} className="mr-1" />Add Doctor</button>
          <button onClick={() => setShowCreate('staff')} className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-muted">Add Staff</button>
        </div>
      </div>

      {showCreate && (
        <div className="glass-panel p-4 mb-6 space-y-3">
          <h3 className="font-semibold">Create {showCreate}</h3>
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" type="password" placeholder="Password (min 6 chars)" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {showCreate === 'doctor' && (
            <>
              <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Specialization" value={form.specialization || ''} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="License Number" value={form.licenseNumber || ''} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </>
          )}
          {showCreate === 'staff' && (
            <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Position (e.g. Nurse, Lab Technician)" value={form.position || ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          )}
          <button onClick={() => handleCreate(showCreate)} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Create</button>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="divide-y">
          {users.map((u: any) => (
            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{u.email?.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="text-sm font-medium">{u.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                </div>
              </div>
              <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminDepartments() {
  const [departments, setDepartments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => { apiFetch('/departments').then(setDepartments).catch(() => {}) }, [])

  const handleCreate = async () => {
    try { await apiFetch('/departments', { method: 'POST', body: JSON.stringify(form) }); setShowForm(false); setForm({ name: '', description: '' }) } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium">{showForm ? 'Cancel' : 'Add Department'}</button>
      </div>

      {showForm && (
        <div className="glass-panel p-4 mb-6 space-y-3">
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button onClick={handleCreate} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Create</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d: any) => (
          <div key={d.id} className="glass-panel p-4">
            <h3 className="font-semibold">{d.name}</h3>
            {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
            <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
              <span>{d._count?.doctors || 0} doctors</span>
              <span>{d._count?.staff || 0} staff</span>
              <span>{d._count?.wards || 0} wards</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminAnalytics() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { apiFetch('/analytics/dashboard').then(setData).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="stat-card"><p className="text-sm text-muted-foreground">Appointments</p><p className="text-2xl font-bold mt-1">{data.appointments?.total || 0}</p></div>
            <div className="stat-card"><p className="text-sm text-muted-foreground">Avg Wait Time</p><p className="text-2xl font-bold mt-1">{data.waitTimes?.averageWaitMinutes || 0} min</p></div>
            <div className="stat-card"><p className="text-sm text-muted-foreground">Revenue (30d)</p><p className="text-2xl font-bold mt-1">GHS {data.revenue?.totalRevenue?.toFixed(2) || '0.00'}</p></div>
            <div className="stat-card"><p className="text-sm text-muted-foreground">Completed Appts</p><p className="text-2xl font-bold mt-1">{data.appointments?.byStatus?.completed || 0}</p></div>
          </div>
          {data.diagnoses && (
            <div className="glass-panel p-4">
              <h3 className="font-semibold mb-3">Top Diagnoses</h3>
              <div className="space-y-2">
                {data.diagnoses.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{d.diagnosis}</span>
                    <span className="text-sm font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          <Activity size={40} className="mx-auto mb-3 opacity-50" />
          <p>Loading analytics...</p>
        </div>
      )}
    </div>
  )
}

function AdminInventory() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => { apiFetch('/inventory').then(setItems).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      <div className="glass-panel overflow-hidden">
        <div className="divide-y">
          {items.map((i: any) => (
            <div key={i.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.category} • {i.department?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${i.quantityInStock <= i.reorderLevel ? 'text-red-600' : ''}`}>{i.quantityInStock} {i.unit}</span>
                {i.quantityInStock <= i.reorderLevel && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Low</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AdminSubPages() {
  return (
    <Routes>
      <Route index element={<AdminUsers />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="departments" element={<AdminDepartments />} />
      <Route path="analytics" element={<AdminAnalytics />} />
      <Route path="inventory" element={<AdminInventory />} />
    </Routes>
  )
}
