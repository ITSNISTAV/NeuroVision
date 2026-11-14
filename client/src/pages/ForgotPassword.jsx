import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
    } catch {
      /* still show success — anti-enumeration */
    } finally {
      setLoading(false)
      setDone(true)
    }
  }

  return (
    <div className="auth-page">
      <div className="bg-orb orb1" aria-hidden />
      <div className="bg-orb orb2" aria-hidden />
      <div className="grid-overlay" aria-hidden />
      <div className="auth-panel single-auth">
        <div className="auth-card glass-card narrow-card">
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="form-header">
              <h2>Reset password</h2>
              <p>We&apos;ll email you a link if an account exists for this address.</p>
            </div>
            <div className="field-group">
              <label htmlFor="fp-email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  id="fp-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            {done ? (
              <div className="form-success">
                If that email exists, a reset link was sent.
              </div>
            ) : null}
            <button type="submit" className="btn-primary" disabled={loading}>
              <span className="btn-label">Send reset link</span>
              <span className="btn-arrow">→</span>
            </button>
            <p className="form-switch">
              <Link to="/login">← Back to Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
