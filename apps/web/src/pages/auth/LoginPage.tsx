import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../App'
import { Hospital } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-700 to-teal-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Hospital size={48} className="mb-6" />
          <h1 className="text-4xl font-bold mb-4">CareSync HMS</h1>
          <p className="text-teal-100 text-lg leading-relaxed">
            A modern hospital management system connecting patients, doctors, and
            staff across every department. Secure, fast, and built for Ghana.
          </p>
          <div className="mt-8 space-y-3">
            {['Patient Portal', 'Doctor Dashboard', 'Admin Control Panel'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-teal-200">
                <div className="h-2 w-2 rounded-full bg-teal-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Hospital size={32} className="mx-auto mb-3 text-primary" />
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your CareSync account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="patient@caresync.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </p>

          <div className="mt-8 rounded-lg border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Demo accounts</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Patient: kofi.mensah@gmail.com / Password123</p>
              <p>Doctor: cardio.doc@caresync.com / Password123</p>
              <p>Staff: nurse@caresync.com / Password123</p>
              <p>Admin: admin@caresync.com / Password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
