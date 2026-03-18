import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      setError('No account found with that email address.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pampas flex flex-col">
      <div className="p-4">
        <Link to="/login">
          <Button size="sm" variant="ghost" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="w-14 h-14 rounded-full bg-crail-50 border border-crail-100 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-6 w-6 text-crail" />
          </div>

          {sent ? (
            <div className="text-center">
              <h1 className="font-serif text-2xl font-bold mb-2">Check your inbox</h1>
              <p className="text-cloudy-500 text-sm">
                We've sent a password reset link to <strong>{email}</strong>.
                It may take a few minutes to arrive.
              </p>
              <p className="text-xs text-cloudy-400 mt-4">
                Didn't receive it?{' '}
                <button className="text-crail" onClick={() => setSent(false)}>Try again</button>
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl font-bold text-center mb-2">Forgot password?</h1>
              <p className="text-center text-cloudy-500 text-sm mb-8">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm mb-1.5 block">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
