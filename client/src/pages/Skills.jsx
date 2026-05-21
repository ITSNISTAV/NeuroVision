import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2,
  Edit3,
  BarChart3,
  Target,
  ChevronDown,
  ChevronUp,
  Award,
  Terminal,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  GraduationCap
} from 'lucide-react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import Chatbot from './Chatbot'

export default function Skills() {
  const { user } = useAuth()
  const userId = user?._id
  const [savedRoles, setSavedRoles] = useState([])
  const [editingProfileData, setEditingProfileData] = useState(null)
  const [expandedRoles, setExpandedRoles] = useState([])
  const [toast, setToast] = useState({ msg: '', type: '' })
  const [deleteConfirmRole, setDeleteConfirmRole] = useState(null)

  function toggleExpandRole(roleId) {
    setExpandedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((x) => x !== roleId) : [...prev, roleId]
    )
  }

  async function loadSaved() {
    if (!userId) return
    try {
      const { data } = await api.get(`/profile/${userId}`)
      setSavedRoles(data.roles || [])
    } catch {
      showToast('Could not load profiles.', 'error')
    }
  }

  useEffect(() => {
    loadSaved()
  }, [userId])

  function showToast(msg, type = '') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  function deleteRole(roleName) {
    setDeleteConfirmRole(roleName)
  }

  async function confirmDeleteRole(roleName) {
    try {
      await api.delete(`/profile/${userId}/${encodeURIComponent(roleName)}`)
      showToast(`"${roleName}" deleted.`, 'success')
      loadSaved()

      if (editingProfileData?.role === roleName) {
        setEditingProfileData(null)
      }
    } catch {
      showToast('Failed to delete.', 'error')
    }
  }

  async function editRole(roleName) {
    try {
      const { data } = await api.get(`/profile/${userId}`)
      const found = (data.roles || []).find((r) => r.role === roleName)
      if (!found) return showToast('Profile not found.', 'error')

      setEditingProfileData(found)
      showToast(`Loaded "${roleName}" in chatbot review summary!`, '')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      showToast('Could not load profile for editing.', 'error')
    }
  }

  const handleProfileSaved = () => {
    setEditingProfileData(null)
    loadSaved()
    showToast('Profile saved successfully!', 'success')
  }

  const handleCancelEdit = () => {
    setEditingProfileData(null)
    showToast('Editing cancelled.', '')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="page-wrapper"
      style={{
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '36px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}
    >
      <AnimatePresence>
        {toast.msg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`toast show ${toast.type}`}
            style={{ zIndex: 100 }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Onboarding Profile Builder */}
      <section className="chatbot-section">
        <Chatbot
          editProfileData={editingProfileData}
          onProfileSaved={handleProfileSaved}
          onCancelEdit={handleCancelEdit}
        />
      </section>

      {/* Saved Profiles List */}
      <section className="display-section" style={{ marginTop: '12px' }}>
        <div className="display-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.3px', margin: 0 }}>
              Saved Role Profiles
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Manage your targets, review parameters, and run deep skill analysis.
            </p>
          </div>
          <span className="badge" style={{ padding: '6px 14px', background: 'rgba(168,85,247,0.1)', color: 'var(--accent)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '100px', fontSize: '12px', fontWeight: 600 }}>
            {savedRoles.length} Target{savedRoles.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="roles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          <AnimatePresence mode="popLayout">
            {savedRoles.map((r, idx) => {
              const roleId = `${r.role}-${idx}`
              const isExpanded = expandedRoles.includes(roleId)
              return (
                <motion.div
                  layout
                  key={roleId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3 }}
                  className="roleCard"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius)',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '14px' }}>
                    <div>
                      <div className="card-role-name" style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
                        {r.role}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Target Objective
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpandRole(roleId)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'var(--purple-300)',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isExpanded ? 'Collapse' : 'Expand'}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  <div className="card-meta" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div className="meta-pill" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'var(--purple-200)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px' }}>
                      <span className="meta-label" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>CGPA:</span> <strong>{r.cgpa}</strong>
                    </div>
                    <div className="meta-pill" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'var(--purple-200)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px' }}>
                      <span className="meta-label" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Internship:</span> <strong>{r.internshipMonths}m</strong>
                    </div>
                    <div className="meta-pill" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168,85,247,0.15)', color: 'var(--purple-200)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px' }}>
                      <span className="meta-label" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Skills:</span> <strong>{r.technicalSkills?.length || 0}</strong>
                    </div>
                  </div>

                  <div className="card-skills-label" style={{ fontSize: '11px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                    Mapped Core Skills
                  </div>
                  <div className="card-skills-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {(r.technicalSkills || []).slice(0, 5).map((s) => (
                      <span key={s.skill} className="card-skill-tag" style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {s.skill}
                        <span className="tag-level" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '9px', background: 'rgba(168,85,247,0.08)', padding: '1px 4px', borderRadius: '4px' }}>L{s.level}</span>
                      </span>
                    ))}
                    {(r.technicalSkills || []).length > 5 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '2px' }}>
                        +{r.technicalSkills.length - 5} more
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      style={{ borderTop: '1px solid var(--glass-border)', marginTop: '12px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                        {r.preferredStack && <div><span style={{ color: 'var(--text-secondary)' }}>Stack:</span> <strong style={{ color: '#fff' }}>{r.preferredStack}</strong></div>}
                        {r.githubUsername && <div><span style={{ color: 'var(--text-secondary)' }}>GitHub:</span> <a href={`https://github.com/${r.githubUsername}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{r.githubUsername} ↗</a></div>}
                        <div><span style={{ color: 'var(--text-secondary)' }}>DSA Level:</span> <strong style={{ color: '#fff' }}>{r.dsa?.level || 'Beginner'}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>DSA Solved:</span> <strong style={{ color: '#fff' }}>{r.dsa?.problemsSolvedRange || '0-25'}</strong></div>
                      </div>

                      {r.coreSubjects && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <GraduationCap size={12} /> CS Competencies
                          </span>
                          <div style={{ fontSize: '11px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '8px 4px', borderRadius: '6px', textAlign: 'center' }}>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>OOP</div><strong style={{ color: 'var(--accent)' }}>{r.coreSubjects.oop || 1}</strong></div>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>DBMS</div><strong style={{ color: 'var(--accent)' }}>{r.coreSubjects.dbms || 1}</strong></div>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>OS</div><strong style={{ color: 'var(--accent)' }}>{r.coreSubjects.os || 1}</strong></div>
                            <div><div style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>CN</div><strong style={{ color: 'var(--accent)' }}>{r.coreSubjects.cn || 1}</strong></div>
                          </div>
                        </div>
                      )}

                      {r.tools && r.tools.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Terminal size={12} /> Tools & Technologies
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {r.tools.map(t => <span key={t} style={{ fontSize: '9px', background: 'rgba(217, 70, 239, 0.08)', border: '1px solid rgba(217,70,239,0.12)', color: 'var(--purple-200)', padding: '2px 8px', borderRadius: '4px' }}>{t}</span>)}
                          </div>
                        </div>
                      )}

                      {r.strengths && r.strengths.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Award size={12} /> Strengths
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {r.strengths.map(s => <span key={s} style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16,185,129,0.12)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>)}
                          </div>
                        </div>
                      )}

                      {r.projects && r.projects.length > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--purple-300)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FolderKanban size={12} /> Projects ({r.projects.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {r.projects.map((proj, pIdx) => (
                              <div
                                key={pIdx}
                                style={{
                                  background: 'rgba(168, 85, 247, 0.03)',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(168, 85, 247, 0.15)',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff' }}>{proj.name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--accent)', marginTop: '2px', fontWeight: 600 }}>{proj.type || 'Full Stack'}</div>
                                <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', margin: '6px 0' }}>{proj.problemSolved}</p>
                                {proj.techStack && proj.techStack.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                    {proj.techStack.map(stackItem => (
                                      <span
                                        key={stackItem}
                                        style={{
                                          fontSize: '8px',
                                          background: 'rgba(255, 255, 255, 0.05)',
                                          border: '1px solid rgba(255, 255, 255, 0.08)',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          color: 'var(--text-muted)'
                                        }}
                                      >
                                        {stackItem}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="cardBtns" style={{ marginTop: 'auto', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <button
                      type="button"
                      className="card-btn btn-delete"
                      onClick={() => deleteRole(r.role)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239,68,68,0.12)', color: '#f87171', padding: '8px 0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                    <button
                      type="button"
                      className="card-btn btn-edit"
                      onClick={() => editRole(r.role)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--purple-200)', padding: '8px 0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <Link
                      to={`/score?role=${encodeURIComponent(r.role)}`}
                      className="card-btn btn-score"
                      style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--purple-500)', border: 'none', color: '#fff', padding: '10px 0', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)' }}
                    >
                      <BarChart3 size={13} /> Analyze Score
                    </Link>
                    <Link
                      to={`/skill-gap?role=${encodeURIComponent(r.role)}`}
                      className="card-btn btn-score"
                      style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', color: 'var(--purple-200)', padding: '9px 0', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}
                    >
                      <Target size={13} /> Analyze Skill Gap
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {savedRoles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="empty-state visible"
            >
              <div className="empty-icon">◈</div>
              <p>
                No profiles saved yet.
                <br />
                Use the guided chatbot above to create your first career role profile!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Delete Confirmation Overlay Modal */}
      {deleteConfirmRole && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'rgba(10, 0, 20, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)'
            }}
          >
            <h3 style={{ margin: 0, color: 'var(--error)', fontSize: '18px', fontWeight: 700 }}>Delete Saved Profile?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              Are you sure you want to delete your profile mapping for <strong>{deleteConfirmRole}</strong>? This action is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '4px' }}>
              <button
                type="button"
                className="btn-reset"
                onClick={() => setDeleteConfirmRole(null)}
                style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer', borderRadius: '6px' }}
              >
                No, Keep It
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={() => {
                  const roleToDelete = deleteConfirmRole;
                  setDeleteConfirmRole(null);
                  confirmDeleteRole(roleToDelete);
                }}
                style={{ padding: '8px 16px', fontSize: '12px', background: 'var(--error)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
              >
                Yes, Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
