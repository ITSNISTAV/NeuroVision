import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '314851830663-th9r3ail606i4f970b15qdb6q21uii80.apps.googleusercontent.com'

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Buster',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Matrix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo'
]

function waitForGoogle() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const iv = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(iv)
        resolve()
      }
    }, 50)
    setTimeout(() => {
      clearInterval(iv)
      resolve()
    }, 10000)
  })
}

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [showRegPw, setShowRegPw] = useState(false)
  const [googleLoaded, setGoogleLoaded] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0])
  const googleLoginRef = useRef(null)
  const fileInputRef = useRef(null)
  const googleInit = useRef(false)

  const handleGoogle = useCallback(
    async (response) => {
      setLoginError('')
      setRegisterError('')
      try {
        const { data } = await api.post('/auth/google', {
          credential: response.credential,
        })
        login(data.user)
        navigate('/dashboard', { replace: true })
      } catch {
        const msg = 'Google sign-in failed. Please try again.'
        setLoginError(msg)
        setRegisterError(msg)
      }
    },
    [login, navigate],
  )

  const handleGoogleRef = useRef(handleGoogle)
  handleGoogleRef.current = handleGoogle

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        await waitForGoogle()
        if (cancelled || !window.google?.accounts?.id || googleInit.current) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (r) => handleGoogleRef.current(r),
        })
        googleInit.current = true
        setGoogleLoaded(true)
      })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!googleLoaded || !window.google?.accounts?.id) return
    const el = googleLoginRef.current
    if (!el) return
    el.innerHTML = ''
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'filled_black',
      text: 'signin_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: 340,
    })
  }, [tab, googleLoaded])

  if (user) return <Navigate to="/dashboard" replace />

  async function onLogin(e) {
    e.preventDefault()
    setLoginError('')
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: loginEmail.trim(),
        password: loginPassword,
      })
      login(data.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setRegisterError('Profile picture must be under 2MB.')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedAvatar(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  async function onRegister(e) {
    e.preventDefault()
    setRegisterError('')
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegisterError('Please fill in all fields.')
      return
    }
    if (regPassword.length < 6) {
      setRegisterError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        profilePic: selectedAvatar,
      })
      setTab('login')
      setLoginEmail(regEmail.trim())
      setRegisterError('')
    } catch (err) {
      setRegisterError(err.response?.data?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    const val = regPassword
    let score = 0
    if (val.length >= 6) score++
    if (val.length >= 10) score++
    if (/[A-Z]/.test(val)) score++
    if (/[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#a855f7']
    const widths = ['0%', '20%', '40%', '60%', '80%', '100%']
    return {
      width: val.length ? widths[score] : '0%',
      color: colors[score],
      label: val.length ? levels[score] : '',
    }
  })()

  return (
    <div className="auth-page">
      <div className="bg-orb orb1" aria-hidden />
      <div className="bg-orb orb2" aria-hidden />
      <div className="bg-orb orb3" aria-hidden />
      <div className="grid-overlay" aria-hidden />

      <div className="auth-wrapper">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-symbol">✦</span>
              <span className="logo-text">NeuroVision</span>
            </div>
            <div className="brand-tagline">
              <h1>
                Map Your<br />
                <em>Career DNA</em>
              </h1>
              <p>
                Build intelligent skill profiles, track your growth, and unlock your career potential
                with precision.
              </p>
            </div>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-dot" />
                Role-based skill profiling
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                AI-powered score analysis
              </div>
              <div className="feature-item">
                <span className="feature-dot" />
                Career readiness insights
              </div>
            </div>
            <div className="brand-decoration">
              <div className="deco-ring ring1" />
              <div className="deco-ring ring2" />
              <div className="deco-ring ring3" />
              <span className="deco-symbol">◈</span>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-card glass-card">
            <div className="auth-tabs">
              <button
                type="button"
                className={`tab-btn${tab === 'login' ? ' active' : ''}`}
                onClick={() => setTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn${tab === 'register' ? ' active' : ''}`}
                onClick={() => setTab('register')}
              >
                Sign Up
              </button>
              <div
                className="tab-indicator"
                style={{ transform: tab === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
              />
            </div>

            {tab === 'login' ? (
              <form className="auth-form" onSubmit={onLogin}>
                <div className="form-header">
                  <h2>Welcome back</h2>
                  <p>Sign in to continue your journey</p>
                </div>
                <div className="field-group">
                  <label htmlFor="loginEmail">Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉</span>
                    <input
                      id="loginEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="loginPassword">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">◉</span>
                    <input
                      id="loginPassword"
                      type={showLoginPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      tabIndex={-1}
                      onClick={() => setShowLoginPw((s) => !s)}
                    >
                      👁
                    </button>
                  </div>
                </div>
                <div className="forgot-row">
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
                {loginError ? <div className="form-error visible">{loginError}</div> : null}
                <button type="submit" className="btn-primary" disabled={loading}>
                  <span className="btn-label">Sign In</span>
                  <span className="btn-arrow">→</span>
                  {loading ? <span className="btn-loader spinning" /> : null}
                </button>
                <div className="oauth-divider">
                  <span>or</span>
                </div>
                <div ref={googleLoginRef} className="google-btn-host" />
                <p className="form-switch">
                  Don&apos;t have an account?
                  <a href="#" onClick={(e) => { e.preventDefault(); setTab('register') }}>
                    Create one →
                  </a>
                </p>
              </form>
            ) : (
              <form className="auth-form" onSubmit={onRegister}>
                <div className="form-header">
                  <h2>Create account</h2>
                  <p>Start building your skill profile</p>
                </div>
                <div className="field-group">
                  <label htmlFor="regName">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✦</span>
                    <input
                      id="regName"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="regEmail">Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉</span>
                    <input
                      id="regEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="regPassword">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">◉</span>
                    <input
                      id="regPassword"
                      type={showRegPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      tabIndex={-1}
                      onClick={() => setShowRegPw((s) => !s)}
                    >
                      👁
                    </button>
                  </div>
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>

                {/* Avatar Selection Field Group */}
                <div className="field-group avatar-selector-group">
                  <label>Choose Avatar / Upload Pic</label>
                  <div className="avatar-selection-layout">
                    {/* Selected Avatar Preview */}
                    <div className="avatar-preview-wrapper">
                      <img
                        src={selectedAvatar}
                        alt="Selected Avatar"
                        className="avatar-preview-img"
                      />
                      <div className="avatar-preview-glow" />
                    </div>

                    {/* Presets and Upload button */}
                    <div className="avatar-options-container">
                      <div className="avatar-presets-grid">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`avatar-preset-btn ${selectedAvatar === url ? 'active' : ''}`}
                            onClick={() => setSelectedAvatar(url)}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} />
                          </button>
                        ))}

                        {/* Custom upload button */}
                        <button
                          type="button"
                          className={`avatar-preset-btn upload-btn-icon ${(!PRESET_AVATARS.includes(selectedAvatar)) ? 'active' : ''}`}
                          onClick={() => fileInputRef.current?.click()}
                          title="Upload Custom Image"
                        >
                          <span style={{ fontSize: '16px' }}>⤒</span>
                        </button>
                      </div>
                      <span className="avatar-hint-text">Choose a dev bot or upload custom image</span>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>

                {registerError ? <div className="form-error visible">{registerError}</div> : null}
                <button type="submit" className="btn-primary" disabled={loading}>
                  <span className="btn-label">Create Account</span>
                  <span className="btn-arrow">→</span>
                  {loading ? <span className="btn-loader spinning" /> : null}
                </button>
                <div ref={googleLoginRef} className="google-btn-host" />
                <p className="form-switch">
                  Already have an account?
                  <a href="#" onClick={(e) => { e.preventDefault(); setTab('login') }}>
                    Sign in →
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
