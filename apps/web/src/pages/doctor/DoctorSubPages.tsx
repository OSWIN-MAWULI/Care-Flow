import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../App'
import { Route, Routes, Link } from 'react-router-dom'
import { Calendar, Clock, Users, ArrowRightLeft, FlaskConical, FileText, CheckCircle, XCircle, Activity, MessageSquare, Pill, Bed, Plus, ChevronRight } from 'lucide-react'

// --- Doctor Schedule ---
function DoctorSchedule() {
  const [appointments, setAppointments] = useState<any[]>([])
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    apiFetch(`/appointments/doctor?date=${today}`).then(setAppointments).catch(() => {})
  }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a))
    } catch {}
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Today's Schedule</h1>
      <div className="glass-panel overflow-hidden">
        <div className="divide-y">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Calendar size={40} className="mx-auto mb-3 opacity-50" />
              <p>No appointments today</p>
            </div>
          ) : appointments.map((a: any) => (
            <div key={a.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="text-sm font-mono text-muted-foreground w-16">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div>
                  <p className="text-sm font-medium">{a.patient?.user?.email || 'Patient'}</p>
                  <p className="text-xs text-muted-foreground">{a.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs capitalize px-2 py-1 rounded-full ${
                  a.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  a.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'
                }`}>{a.status}</span>
                {a.status === 'confirmed' && <button onClick={() => updateStatus(a.id, 'in_progress')} className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200">Start</button>}
                {a.status === 'in_progress' && <button onClick={() => updateStatus(a.id, 'completed')} className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Complete</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Doctor Patients ---
function DoctorPatients() {
  const [patients, setPatients] = useState<any[]>([])
  useEffect(() => {
    apiFetch('/users?role=patient&limit=50').then((d: any) => setPatients(d.users || [])).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Patients</h1>
      <div className="glass-panel overflow-hidden">
        <div className="divide-y">
          {patients.map((p: any) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{p.email?.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="text-sm font-medium">{p.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.role}</p>
                </div>
              </div>
              <Link to={`/doctor/patients`} className="text-xs text-primary hover:underline">View records</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Doctor Referrals ---
function DoctorReferrals() {
  const [referrals, setReferrals] = useState<any[]>([])
  useEffect(() => { apiFetch('/referrals/my').then(setReferrals).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Referrals</h1>
      <div className="glass-panel overflow-hidden">
        <div className="divide-y">
          {referrals.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ArrowRightLeft size={40} className="mx-auto mb-3 opacity-50" />
              <p>No referrals yet</p>
            </div>
          ) : referrals.map((r: any) => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium">To: {r.referredToDepartment?.name}</p>
                <p className="text-xs text-muted-foreground">{r.patient?.user?.email} • {r.reason?.slice(0, 60)}</p>
              </div>
              <span className={`text-xs capitalize px-2 py-1 rounded-full ${
                r.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                r.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Doctor Lab Orders ---
function DoctorLabOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientId: '', departmentId: '', testName: '' })
  const [patients, setPatients] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    apiFetch('/users?role=patient&limit=50').then((d: any) => setPatients(d.users || [])).catch(() => {})
    apiFetch('/departments').then(setDepartments).catch(() => {})
    apiFetch('/lab-orders/department/placeholder').then(setOrders).catch(() => {})
  }, [])

  const handleCreate = async () => {
    try {
      await apiFetch('/lab-orders', { method: 'POST', body: JSON.stringify(form) })
      setShowForm(false)
      setForm({ patientId: '', departmentId: '', testName: '' })
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lab Orders</h1>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium hover:bg-primary/90"><Plus size={16} className="mr-1" />New Order</button>
      </div>

      {showForm && (
        <div className="glass-panel p-4 mb-6 space-y-3">
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((p: any) => <option key={p.id} value={p.id}>{p.email}</option>)}</select>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}><option value="">Select lab department</option>{departments.filter((d: any) => d.name.toLowerCase().includes('laboratory')).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Test name (e.g. Full Blood Count)" value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} />
          <button onClick={handleCreate} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Submit Order</button>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="divide-y">
          {orders.map((o: any) => (
            <div key={o.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div><p className="text-sm font-medium">{o.testName}</p><p className="text-xs text-muted-foreground">{o.patient?.user?.email}</p></div>
              <span className={`text-xs capitalize px-2 py-1 rounded-full ${
                o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                o.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Doctor Analytics ---
function DoctorAnalytics() {
  const [data, setData] = useState<any>(null)
  useEffect(() => { apiFetch('/analytics/dashboard').then(setData).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="stat-card"><p className="text-sm text-muted-foreground mb-1">Appointments (30d)</p><p className="text-2xl font-bold">{data.appointments?.total || 0}</p></div>
          <div className="stat-card"><p className="text-sm text-muted-foreground mb-1">Avg Wait Time</p><p className="text-2xl font-bold">{data.waitTimes?.averageWaitMinutes || 0} min</p></div>
        </div>
      )}
      {data?.diagnoses && (
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-3">Common Diagnoses</h3>
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
    </div>
  )
}

// --- Admissions ---
function DoctorAdmissions() {
  const [admissions, setAdmissions] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])
  const [showAdmit, setShowAdmit] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [form, setForm] = useState({ patientId: '', wardId: '', reason: '' })

  useEffect(() => {
    apiFetch('/admissions').then(setAdmissions).catch(() => {})
    apiFetch('/admissions/wards').then(setWards).catch(() => {})
    apiFetch('/users?role=patient&limit=50').then((d: any) => setPatients(d.users || [])).catch(() => {})
  }, [])

  const handleAdmit = async () => {
    try { await apiFetch('/admissions', { method: 'POST', body: JSON.stringify(form) }); setShowAdmit(false) } catch {}
  }

  const handleDischarge = async (id: string) => {
    try { await apiFetch(`/admissions/${id}/discharge`, { method: 'PUT' }); setAdmissions(admissions.filter(a => a.id !== id)) } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admissions</h1>
        <button onClick={() => setShowAdmit(!showAdmit)} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium"><Plus size={16} className="mr-1" />Admit</button>
      </div>

      {showAdmit && (
        <div className="glass-panel p-4 mb-6 space-y-3">
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((p: any) => <option key={p.id} value={p.patient?.id || p.id}>{p.email}</option>)}</select>
          <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.wardId} onChange={(e) => setForm({ ...form, wardId: e.target.value })}><option value="">Select ward</option>{wards.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({w.beds?.filter((b: any) => b.status === 'available').length || 0} beds free)</option>)}</select>
          <input className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Reason for admission" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <button onClick={handleAdmit} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Admit Patient</button>
        </div>
      )}

      {/* Ward Map */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {wards.map((w: any) => (
          <div key={w.id} className="glass-panel p-4">
            <h3 className="font-semibold mb-2">{w.name}</h3>
            <div className="grid grid-cols-3 gap-2">
              {w.beds?.map((b: any) => (
                <div key={b.id} className={`p-2 rounded text-center text-xs font-medium ${
                  b.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  b.status === 'occupied' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700'
                }`}>
                  {b.bedNumber}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Active Admissions */}
      <div className="glass-panel overflow-hidden">
        <h3 className="font-semibold p-4 border-b">Active Admissions</h3>
        <div className="divide-y">
          {admissions.filter(a => a.status === 'admitted').map((a: any) => (
            <div key={a.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium">{a.patient?.user?.email}</p>
                <p className="text-xs text-muted-foreground">Ward: {a.bed?.ward?.name} • Bed {a.bed?.bedNumber} • {a.reason?.slice(0, 50)}</p>
              </div>
              <button onClick={() => handleDischarge(a.id)} className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Discharge</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Messages (shared) ---
function Messages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')

  useEffect(() => { apiFetch('/messaging/conversations').then(setConversations).catch(() => {}) }, [])

  const selectConv = async (id: string) => {
    setSelectedConv(id)
    try {
      const msgs = await apiFetch(`/messaging/conversations/${id}/messages`)
      setMessages(msgs)
    } catch {}
  }

  const sendMsg = async () => {
    if (!newMsg.trim() || !selectedConv) return
    try {
      const msg = await apiFetch(`/messaging/conversations/${selectedConv}/messages`, {
        method: 'POST', body: JSON.stringify({ content: newMsg })
      })
      setMessages([...messages, msg])
      setNewMsg('')
    } catch {}
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      <div className="w-72 flex-shrink-0 glass-panel overflow-hidden flex flex-col">
        <div className="p-3 border-b"><h3 className="font-semibold">Conversations</h3></div>
        <div className="flex-1 overflow-y-auto divide-y">
          {conversations.map((c: any) => (
            <button key={c.id} onClick={() => selectConv(c.id)} className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${selectedConv === c.id ? 'bg-muted' : ''}`}>
              <p className="text-sm font-medium truncate">{c.type} {c._count?.messages ? `(${c._count.messages})` : ''}</p>
              <p className="text-xs text-muted-foreground truncate">{c.participants?.map((p: any) => p.user.email).join(', ')}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 glass-panel flex flex-col">
        {selectedConv ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.senderId === selectedConv ? '' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${m.senderId === selectedConv ? 'bg-muted' : 'bg-primary/10'}`}>
                    <p className="text-xs text-muted-foreground mb-1">{m.sender?.email}</p>
                    <p className="text-sm">{m.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3 flex gap-2">
              <input className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Type a message..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMsg()} />
              <button onClick={sendMsg} className="inline-flex h-10 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <MessageSquare size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Main export with Routes
export function DoctorSubPages() {
  return (
    <Routes>
      <Route index element={<DoctorSchedule />} />
      <Route path="schedule" element={<DoctorSchedule />} />
      <Route path="patients" element={<DoctorPatients />} />
      <Route path="referrals" element={<DoctorReferrals />} />
      <Route path="lab-orders" element={<DoctorLabOrders />} />
      <Route path="admissions" element={<DoctorAdmissions />} />
      <Route path="analytics" element={<DoctorAnalytics />} />
      <Route path="messages" element={<Messages />} />
    </Routes>
  )
}

export function StaffSubPages() {
  return (
    <Routes>
      <Route path="referrals" element={<StaffReferrals />} />
      <Route path="lab-worklist" element={<StaffLabWorklist />} />
      <Route path="inventory" element={<StaffInventory />} />
      <Route path="messages" element={<Messages />} />
    </Routes>
  )
}

// --- Staff Referrals ---
function StaffReferrals() {
  const [referrals, setReferrals] = useState<any[]>([])
  useEffect(() => { apiFetch('/referrals/department/placeholder').then(setReferrals).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Incoming Referrals</h1>
      <div className="space-y-3">
        {referrals.map((r: any) => (
          <div key={r.id} className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{r.patient?.user?.email}</p>
              <p className="text-xs text-muted-foreground">From: {r.referringDoctor?.user?.email} • {r.reason?.slice(0, 60)}</p>
            </div>
            <span className={`text-xs capitalize px-2 py-1 rounded-full ${
              r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
              r.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Staff Lab Worklist ---
function StaffLabWorklist() {
  const [orders, setOrders] = useState<any[]>([])
  const [resultForm, setResultForm] = useState<Record<string, string>>({})

  useEffect(() => { apiFetch('/lab-orders/department/placeholder').then(setOrders).catch(() => {}) }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/lab-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
    } catch {}
  }

  const addResult = async (orderId: string) => {
    if (!resultForm[orderId]) return
    try {
      await apiFetch(`/lab-orders/${orderId}/results`, {
        method: 'POST', body: JSON.stringify({ resultSummary: resultForm[orderId] })
      })
      updateStatus(orderId, 'completed')
      setResultForm({ ...resultForm, [orderId]: '' })
    } catch {}
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Lab Worklist</h1>
      <div className="space-y-3">
        {orders.map((o: any) => (
          <div key={o.id} className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">{o.testName}</p>
                <p className="text-xs text-muted-foreground">Patient: {o.patient?.user?.email} • Ordered: {new Date(o.orderedAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs capitalize px-2 py-1 rounded-full ${
                o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                o.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>{o.status}</span>
            </div>
            {o.status !== 'completed' && (
              <div className="flex gap-2">
                <input className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="Enter result summary..." value={resultForm[o.id] || ''} onChange={(e) => setResultForm({ ...resultForm, [o.id]: e.target.value })} />
                <button onClick={() => addResult(o.id)} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium">Add Result</button>
                {o.status === 'ordered' && <button onClick={() => updateStatus(o.id, 'in_progress')} className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm">Start</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Staff Inventory ---
function StaffInventory() {
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
                <span className={`text-sm font-medium ${i.quantityInStock <= i.reorderLevel ? 'text-red-600 dark:text-red-400' : ''}`}>{i.quantityInStock} {i.unit}</span>
                {i.quantityInStock <= i.reorderLevel && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Low</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
