import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) }
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ username: '', email: '', displayName: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [k]: e.target.value })
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(form.username, form.email, form.password, form.displayName)
      navigate('/', { replace: true })
    } catch { /* handled */ }
  }

  return (
    <div className="min-h-screen bg-pampas flex flex-col">
      <div className="p-4">
        <Link to="/">
          <Button size="sm" variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-crail flex items-center justify-center">
              <span className="text-white text-lg font-bold font-serif">C</span>
            </div>
            <span className="font-serif text-2xl font-semibold">Crail</span>
          </div>

          <h1 className="font-serif text-2xl font-bold text-center mb-1">Create an account</h1>
          <p className="text-center text-cloudy-500 text-sm mb-8">Join the Crail community</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-sm mb-1.5 block">Display name</Label>
              <Input id="displayName" value={form.displayName} onChange={set('displayName')}
                placeholder="How you appear to others" required autoFocus />
            </div>

            <div>
              <Label htmlFor="username" className="text-sm mb-1.5 block">Username</Label>
              <Input id="username" value={form.username} onChange={set('username')}
                placeholder="your_username" required pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers and underscores only" />
              <p className="text-xs text-cloudy-400 mt-1">crail.app/@{form.username || 'you'}</p>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm mb-1.5 block">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={set('email')}
                placeholder="you@example.com" required autoComplete="email" />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm mb-1.5 block">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Choose a strong password" required className="pr-10"
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cloudy-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {form.password && (
                <div className="mt-2 space-y-1">
                  {requirements.map(({ label, test }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${test(form.password) ? 'text-green-600' : 'text-cloudy-400'}`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-xs text-cloudy-400 mt-4">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>

          <p className="text-center text-sm text-cloudy-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-crail font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
