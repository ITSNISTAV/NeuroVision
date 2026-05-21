import { useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }) =>
  `nav-link${isActive ? ' nav-link-active' : ''}`

export default function Navbar() {
  const { user, login, logout } = useAuth()
  const fileRef = useRef(null)

  const name = user?.name || 'User'
  const initial = name.charAt(0).toUpperCase()
  const pic = user?.profilePic

  async function onAvatar(e) {
    const file = e.target.files?.[0]
    if (!file || !user?._id) return
    const fd = new FormData()
    fd.append('avatar', file)
    fd.append('userId', user._id)
    try {
      const { data } = await api.post('/auth/upload-avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      login(data.user)
    } catch {
      window.alert('Failed to upload avatar.')
    }
    e.target.value = ''
  }

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="logo">
        <span className="logo-symbol">✦</span>
        <span className="logo-text">NeuroVision</span>
      </Link>
      <div className="nav-links">
        <NavLink to="/dashboard" className={navClass}>
          Home
        </NavLink>
        <NavLink to="/skills" className={navClass}>
          Profile
        </NavLink>
        <NavLink to="/skill-gap" className={navClass}>
          Skill Gap
        </NavLink>
        <NavLink to="/score" className={navClass}>
          Score
        </NavLink>
      </div>
      <div className="nav-user-row">
        <button
          type="button"
          className="user-pill"
          onClick={() => fileRef.current?.click()}
          title="Change avatar"
        >
          <div>
            <div className="user-name">{name}</div>
            <div className="user-label">Candidate</div>
          </div>
          {pic ? (
            <img className="avatar-img" src={pic} alt="" />
          ) : (
            <div className="avatar">{initial}</div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onAvatar}
        />
        <button type="button" className="logout-btn" onClick={logout} title="Logout">
          ⏻
        </button>
      </div>
    </nav>
  )
}
