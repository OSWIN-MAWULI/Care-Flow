import React, { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PatientDashboard } from './pages/patient/PatientDashboard'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { StaffDashboard } from './pages/staff/StaffDashboard'
import { AppLayout } from './layout/AppLayout'
import { MyAppointments, BookAppointment, MyRecords, DepartmentsDirectory } from './pages/patient/PatientPages'
import { DoctorSubPages } from './pages/doctor/DoctorSubPages'
import { AdminSubPages } from './pages/admin/AdminSubPages'
import { StaffSubPages } from './pages/staff/StaffSubPages'

const queryClient = new QueryClient()

type User = {
  id: string
  email: string
  role: 'patient' | 'doctor' | 'admin' | 'staff'
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  loading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="skeleton h-8 w-8 rounded-full" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />

  return <>{children}</>
}

function DashboardRouter() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case 'patient': return <Navigate to="/patient" replace />
    case 'doctor': return <Navigate to="/doctor" replace />
    case 'admin': return <Navigate to="/admin" replace />
    case 'staff': return <Navigate to="/staff" replace />
    default: return <Navigate to="/login" replace />
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.id) setUser(data)
          else { setToken(null); sessionStorage.removeItem('token') }
        })
        .catch(() => { setToken(null); sessionStorage.removeItem('token') })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    if (!res.ok) { const err = await res.json(); throw new Error(err.message) }
    const data = await res.json()
    setToken(data.accessToken)
    setUser(data.user)
    sessionStorage.setItem('token', data.accessToken)
  }

  const register = async (input: any) => {
    const res = await fetch('http://localhost:5000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) { const err = await res.json(); throw new Error(err.message) }
  }

  const logout = () => {
    fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('token')
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
            <Route path="/" element={<DashboardRouter />} />

            <Route path="/patient/*" element={<ProtectedRoute roles={['patient']}><AppLayout role="patient"><Routes>
              <Route index element={<PatientDashboard />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="appointments" element={<MyAppointments />} />
              <Route path="book" element={<BookAppointment />} />
              <Route path="records" element={<MyRecords />} />
              <Route path="departments" element={<DepartmentsDirectory />} />
            </Routes></AppLayout></ProtectedRoute>} />

            <Route path="/doctor/*" element={<ProtectedRoute roles={['doctor']}><AppLayout role="doctor"><DoctorSubPages /></AppLayout></ProtectedRoute>} />

            <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AppLayout role="admin"><AdminSubPages /></AppLayout></ProtectedRoute>} />

            <Route path="/staff/*" element={<ProtectedRoute roles={['staff']}><AppLayout role="staff"><StaffSubPages /></AppLayout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  )
}
