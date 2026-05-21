import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api/api'

export default function ResetPassword() {
  const location = useLocation()
  const token = useMemo(() => new URLSearchParams(location.search).get('token'), [location.search])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Invalid or missing reset link.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="bg-orb orb1" aria-hidden />
      <div className="bg-orb orb3" aria-hidden />
      <div className="grid-overlay" aria-hidden />
      <div className="auth-panel single-auth">
        <div className="auth-card glass-card narrow-card">
          {success ? (
            <div className="auth-form">
              <div className="form-header">
                <h2>Password reset!</h2>
                <p>You can now sign in with your new password.</p>
              </div>
              <Link to="/login" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={onSubmit}>
              <div className="form-header">
                <h2>New password</h2>
                <p>Choose a strong password for your account.</p>
              </div>
              <div className="field-group">
                <label htmlFor="np">New password</label>
                <div className="input-wrapper">
                  <span className="input-icon">◉</span>
                  <input
                    id="np"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="npc">Confirm password</label>
                <div className="input-wrapper">
                  <span className="input-icon">◉</span>
                  <input
                    id="npc"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>
              {error ? <div className="form-error visible">{error}</div> : null}
              <button type="submit" className="btn-primary" disabled={loading}>
                <span className="btn-label">Reset password</span>
                <span className="btn-arrow">→</span>
              </button>
              <p className="form-switch">
                <Link to="/login">← Back to Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
