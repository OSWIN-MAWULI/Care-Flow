import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../App'
import { Calendar, Clock, FileText, ArrowRightLeft, FlaskConical, Pill, MessageSquare, CheckCircle, XCircle, Activity, Users } from 'lucide-react'

// --- My Appointments Page ---
export function MyAppointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const { user } = useAuth()

  useEffect(() => {
    apiFetch('/appointments/my').then(setAppointments).catch(() => {})
  }, [])

  const handleCancel = async (id: string) => {
    try {
      await apiFetch(`/appointments/${id}/cancel`, { method: 'PUT' })
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    } catch {}
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
      <div className="glass-panel overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-3 opacity-50" />
            <p>No appointments found</p>
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((a: any) => (
              <div key={a.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold">{new Date(a.scheduledAt).getDate()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.scheduledAt).toLocaleString('en', { month: 'short' })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-muted-foreground">{a.doctor?.specialization || 'Doctor'} • {a.doctor?.department?.name || ''}</p>
                    {a.reason && <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs capitalize px-2 py-1 rounded-full ${
                    a.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    a.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    a.status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    a.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-primary/10 text-primary'
                  }`}>{a.status}</span>
                  {(a.status === 'pending' || a.status === 'confirmed') && (
                    <button onClick={() => handleCancel(a.id)} className="text-xs text-red-500 hover:underline">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Book Appointment Page ---
export function BookAppointment() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/users/doctors').then(setDoctors).catch(() => {})
  }, [])

  const loadSlots = async (doctorId: string) => {
    setSelectedDoctor(doctorId)
    setSelectedSlot('')
    setSlots([])
    if (!doctorId) return
    try {
      const data = await apiFetch(`/appointments/availability?doctorId=${doctorId}`)
      if (data.length > 0) setSlots(data[0].availableTimes || [])
    } catch {}
  }

  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot) return
    setLoading(true)
    setError('')
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({ doctorId: selectedDoctor, scheduledAt: selectedSlot, reason }),
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle size={48} className="text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Appointment Booked!</h2>
        <p className="text-muted-foreground">You'll receive a confirmation soon.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Book Appointment</h1>
      <div className="max-w-lg">
        <div className="glass-panel p-6 space-y-4">
          {error && <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Doctor</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedDoctor}
              onChange={(e) => loadSlots(e.target.value)}
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>{d.specialization} - {d.user?.email} {d.department?.name ? `(${d.department.name})` : ''}</option>
              ))}
            </select>
          </div>

          {slots.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Available Times</label>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(s)}
                    className={`p-2 text-xs rounded border text-center transition-colors ${selectedSlot === s ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:border-primary'}`}
                  >
                    {new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief description of your visit..."
            />
          </div>

          <button
            onClick={handleBook}
            disabled={loading || !selectedDoctor || !selectedSlot}
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Medical Records ---
export function MyRecords() {
  const [records, setRecords] = useState<any[]>([])

  useEffect(() => {
    apiFetch('/medical-records/my').then(setRecords).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Medical Records</h1>
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="glass-panel p-12 text-center text-muted-foreground">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p>No medical records yet</p>
          </div>
        ) : records.map((r: any) => (
          <div key={r.id} className="glass-panel p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium">{r.diagnosis}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()} • Dr. {r.doctor?.user?.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{r.doctor?.department?.name}</span>
            </div>
            {r.notes && <p className="text-sm text-muted-foreground mb-3">{r.notes}</p>}
            {r.prescriptions?.length > 0 && (
              <div className="border-t pt-3 mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Prescriptions</p>
                <div className="space-y-1">
                  {r.prescriptions.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <Pill size={14} className="text-primary" />
                      <span className="font-medium">{p.medication}</span>
                      <span className="text-muted-foreground">• {p.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Departments Directory ---
export function DepartmentsDirectory() {
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    apiFetch('/departments').then(setDepartments).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Departments</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d: any) => (
          <div key={d.id} className="glass-panel p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{d.name}</h3>
                <p className="text-xs text-muted-foreground">{d._count?.doctors || d.doctors?.length || 0} doctors</p>
              </div>
            </div>
            {d.description && <p className="text-sm text-muted-foreground mb-3">{d.description}</p>}
            {d.headDoctor && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Users size={12} />
                Head: {d.headDoctor.specialization}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
