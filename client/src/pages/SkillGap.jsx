import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function SkillGap() {
  const { user } = useAuth()
  const userId = user?._id
  const [searchParams] = useSearchParams()
  const queryRole = searchParams.get('role') || ''

  const [savedRoles, setSavedRoles] = useState([])
  const [note, setNote] = useState('')
  const [result, setResult] = useState(null)
  const [activeTutorial, setActiveTutorial] = useState(null)
  const [practiceProgress, setPracticeProgress] = useState({})
  const resultRef = useRef(null)

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  function getProgressKey(skill) {
    return `nv_practice_${userId}_${result?.targetRole || 'role'}_${result?.selectedStack || 'stack'}_${skill}`
  }

  function loadSkillProgress(skill) {
    try {
      return JSON.parse(localStorage.getItem(getProgressKey(skill)) || '{}')
    } catch {
      return {}
    }
  }

  function updateSkillProgress(skill, field, value) {
    const key = getProgressKey(skill)
    const current = loadSkillProgress(skill)
    const updated = { ...current, [field]: value }

    localStorage.setItem(key, JSON.stringify(updated))

    setPracticeProgress((prev) => ({
      ...prev,
      [skill]: updated
    }))
  }

  const learningProgress = useMemo(() => {
    const skills = result?.missingSkillsWithTutorials || []

    if (!skills.length) {
      return {
        percent: 100,
        completedSkills: 0,
        totalSkills: 0
      }
    }

    let completedChecks = 0
    let completedSkills = 0

    skills.forEach((item) => {
      const saved = practiceProgress[item.skill] || {}
      const count = [saved.basics, saved.task, saved.revision].filter(Boolean).length

      completedChecks += count
      if (count === 3) completedSkills++
    })

    const totalChecks = skills.length * 3

    return {
      percent: Math.round((completedChecks / totalChecks) * 100),
      completedSkills,
      totalSkills: skills.length
    }
  }, [result, practiceProgress])

  useEffect(() => {
    if (!result?.missingSkillsWithTutorials) return

    const initial = {}

    result.missingSkillsWithTutorials.forEach((item) => {
      initial[item.skill] = loadSkillProgress(item.skill)
    })

    setPracticeProgress(initial)
  }, [result])

  const analyzeRole = useCallback(
    async (role) => {
      if (!userId || !role) return

      setNote(`Analyzing saved profile for ${role}…`)

      try {
        const { data } = await api.get(`/skill-gap/${userId}/${encodeURIComponent(role)}`)

        setResult(data)

        const first = data.missingSkillsWithTutorials?.[0]
        setActiveTutorial(first || null)

        setNote(`Showing analysis for ${role}.`)
      } catch (e) {
        setNote(`Analysis failed: ${e.response?.data?.error || e.message}`)
      }
    },
    [userId]
  )

  const loadProfiles = useCallback(async () => {
    if (!userId) {
      setNote('Login required. Save a role profile from the Profile page first.')
      return
    }

    try {
      const { data } = await api.get(`/profile/${userId}`)
      const roles = data.roles || []

      setSavedRoles(roles)
      setNote(roles.length ? `Logged in as ${user?.name || 'User'}.` : 'No saved role profiles yet.')

      if (queryRole && roles.some((r) => r.role === queryRole)) {
        await analyzeRole(queryRole)
      }
    } catch {
      setNote('Could not load saved profiles.')
    }
  }, [userId, user?.name, queryRole, analyzeRole])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  function resetView() {
    setResult(null)
    setActiveTutorial(null)
    setPracticeProgress({})
  }

  function downloadResults() {
    if (!result) {
      window.alert('Please analyze your skills first!')
      return
    }

    const report = `
NeuroVision Skill Gap — ${result.targetRole}
Stack: ${result.selectedStack || 'Not selected'}
Match: ${result.compatibilityScore}%
${result.recommendation || ''}

Matched: ${(result.matchedSkills || []).join(', ')}
Missing: ${(result.missingSkills || []).join(', ')}

Learning Progress: ${learningProgress.percent}%
`

    const a = document.createElement('a')
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(report)}`
    a.download = `NeuroVision_SkillGap_${result.targetRole.replace(/\s+/g, '_')}.txt`
    a.click()
  }

  function shareResults() {
    if (!result) {
      window.alert('Please analyze your skills first!')
      return
    }

    const text = `Skill match for ${result.targetRole} (${result.selectedStack || 'Stack'}): ${result.compatibilityScore}% — NeuroVision`

    if (navigator.share) {
      navigator.share({ title: 'NeuroVision', text, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => window.alert('Copied to clipboard.'))
    }
  }

  const activeSavedProgress = activeTutorial ? practiceProgress[activeTutorial.skill] || {} : {}

  return (
    <div className="page-wrapper skillgap-page">
      <div className="glass-card form-section">
        <div className="section-header">
          <h2>Skill Gap Analysis</h2>
          <p className="section-sub">
            Analyze your saved profiles to check compatibility and missing skills
          </p>
        </div>

        {userId && savedRoles.length > 0 ? (
          <div className="profile-analyze-box">
            <div className="section-row">
              <span className="section-title">Saved Role Profiles</span>
              <span className="count-badge">
                {savedRoles.length} profile{savedRoles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div
              className="profile-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '20px'
              }}
            >
              {savedRoles.map((profile, index) => (
                <div
                  key={`${profile.role}-${profile.selectedStack || index}`}
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      width: '100%',
                      marginBottom: '14px'
                    }}
                  >
                    <div>
                      <div
                        className="card-role-name"
                        style={{
                          fontSize: '17px',
                          fontWeight: 700,
                          color: '#fff',
                          letterSpacing: '-0.2px'
                        }}
                      >
                        {profile.role}
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--purple-300)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {profile.selectedStack || 'Stack not selected'}
                      </span>
                    </div>
                  </div>

                  <div
                    className="card-meta"
                    style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}
                  >
                    <div
                      className="meta-pill"
                      style={{
                        background: 'rgba(168, 85, 247, 0.08)',
                        border: '1px solid rgba(168,85,247,0.15)',
                        color: 'var(--purple-200)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px'
                      }}
                    >
                      <span className="meta-label" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        CGPA:
                      </span>{' '}
                      <strong>{profile.cgpa}</strong>
                    </div>

                    <div
                      className="meta-pill"
                      style={{
                        background: 'rgba(168, 85, 247, 0.08)',
                        border: '1px solid rgba(168,85,247,0.15)',
                        color: 'var(--purple-200)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px'
                      }}
                    >
                      <span className="meta-label" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Internship:
                      </span>{' '}
                      <strong>{profile.internshipMonths ?? 0}m</strong>
                    </div>

                    <div
                      className="meta-pill"
                      style={{
                        background: 'rgba(168, 85, 247, 0.08)',
                        border: '1px solid rgba(168,85,247,0.15)',
                        color: 'var(--purple-200)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px'
                      }}
                    >
                      <span className="meta-label" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Skills:
                      </span>{' '}
                      <strong>{(profile.technicalSkills || []).length}</strong>
                    </div>
                  </div>

                  <div
                    className="card-skills-label"
                    style={{
                      fontSize: '11px',
                      color: 'var(--purple-300)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      marginBottom: '8px'
                    }}
                  >
                    Mapped Core Skills
                  </div>

                  <div
                    className="card-skills-list"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}
                  >
                    {(profile.technicalSkills || []).slice(0, 5).map((s) => (
                      <span
                        key={s.skill}
                        className="card-skill-tag"
                        style={{
                          fontSize: '10.5px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {s.skill}
                        <span
                          className="tag-level"
                          style={{
                            color: 'var(--accent)',
                            fontWeight: 700,
                            fontSize: '9px',
                            background: 'rgba(168,85,247,0.08)',
                            padding: '1px 4px',
                            borderRadius: '4px'
                          }}
                        >
                          L{s.level}
                        </span>
                      </span>
                    ))}

                    {(profile.technicalSkills || []).length > 5 && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          alignSelf: 'center',
                          marginLeft: '2px'
                        }}
                      >
                        +{profile.technicalSkills.length - 5} more
                      </span>
                    )}
                  </div>

                  <div
                    className="cardBtns"
                    style={{
                      marginTop: 'auto',
                      paddingTop: '16px',
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    <button
                      type="button"
                      className="card-btn btn-score"
                      onClick={() => analyzeRole(profile.role)}
                      disabled={!profile.selectedStack}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: profile.selectedStack ? 'var(--purple-500)' : 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: '#fff',
                        padding: '10px 0',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        boxShadow: profile.selectedStack ? '0 4px 12px rgba(168, 85, 247, 0.2)' : 'none',
                        cursor: profile.selectedStack ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {profile.selectedStack ? 'Analyze Skill Gap' : 'Stack Missing'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="profile-note">{note}</div>
          </div>
        ) : (
          <div className="info-box">{note || 'Loading…'}</div>
        )}

        <div className="info-box subtle" style={{ marginTop: '24px' }}>
          Analysis runs from your saved role profile data.
        </div>

        <div className="button-group" style={{ marginTop: '24px' }}>
          <button type="button" onClick={resetView}>
            ↺ Reset View
          </button>
        </div>
      </div>

      {result ? (
        <div ref={resultRef} className="glass-card sg-result form-section" style={{ marginTop: 48 }}>
          <div className="section-header">
            <h2>{result.targetRole} Analysis</h2>
            <p className="section-sub">
              {result.selectedStack ? `${result.selectedStack} focused compatibility and training` : 'Compatibility score, matched highlights, and recommended tutorials'}
            </p>
          </div>

          <div className="info-box">
            <p>
              CGPA: {result.cgpa} — {result.cgpaStatus}
            </p>
          </div>

          {result.recommendation ? (
            <div className="recommendation">
              <p>Tip: {result.recommendation}</p>
            </div>
          ) : null}

          <div className="progress-container">
            <div className="progress-bar-bg">
              <div className="progress-bar" style={{ width: `${result.compatibilityScore}%` }} />
            </div>
            <div className="progress-text">
              <span>Skill Match</span>
              <span>{result.compatibilityScore}%</span>
            </div>
          </div>

          <div
            style={{
              margin: '24px 0',
              padding: '18px',
              borderRadius: '12px',
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.18)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--purple-100)' }}>Learning Progress</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {learningProgress.completedSkills}/{learningProgress.totalSkills} skills fully practiced
                </div>
              </div>

              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--purple-200)' }}>
                {learningProgress.percent}%
              </div>
            </div>

            <div
              style={{
                height: '10px',
                borderRadius: '999px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)'
              }}
            >
              <div
                style={{
                  width: `${learningProgress.percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--purple-500), var(--accent))',
                  transition: 'width 0.25s ease'
                }}
              />
            </div>
          </div>

          <div className="skills-grid">
  <div className="skills-box">
    <h3>✅ Skills Matched</h3>
    <ul className="sg-list">
      {(result.matchedSkills || []).map((s) => (
        <li key={s} className="skill-matched">✓ {s}</li>
      ))}
    </ul>
  </div>

  <div className="skills-box">
    <h3>🛠 Needs Improvement</h3>
    <ul className="sg-list">
      {(result.needsImprovementSkills || []).map((s) => (
        <li key={s} style={{ color: '#fbbf24' }}>⚠ {s}</li>
      ))}
    </ul>
  </div>

  <div className="skills-box">
    <h3>⚠️ Missing Skills</h3>
    <ul className="sg-list">
      {(result.missingSkills || []).map((s) => (
        <li key={s} className="skill-missing">✗ {s}</li>
      ))}
    </ul>
  </div>
</div>

{(result.missingSkillsWithTutorials || []).length > 0 ? (
  <div
    className="tutorial-section"
    style={{
      marginTop: '28px',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      paddingTop: '20px'
    }}
  >
    <h3>⚔ Skill Training Zone</h3>

    <div className="tutorial-pills">
      {(result.missingSkillsWithTutorials || []).map((item) => (
        <button
          key={item.skill}
          type="button"
          className={`tutorial-pill${activeTutorial?.skill === item.skill ? ' active' : ''}`}
          onClick={() => setActiveTutorial(item)}
        >
          {item.status === 'needs_improvement' ? '⚠ ' : '✗ '}
          {item.skill.toUpperCase()}
        </button>
      ))}
    </div>

    {activeTutorial ? (
      <div
        className="tutorial-detail-card"
        style={{
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>Learn {activeTutorial.skill}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Current Level: {activeTutorial.currentLevel} / Required Level: {activeTutorial.requiredLevel}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '4px 9px', borderRadius: '999px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>
              {activeTutorial.status === 'needs_improvement' ? 'Needs Improvement' : 'Missing'}
            </span>
            <span style={{ fontSize: '11px', padding: '4px 9px', borderRadius: '999px', background: 'rgba(168,85,247,0.12)', color: 'var(--purple-200)' }}>
              {activeTutorial.difficulty || 'Medium'}
            </span>
            <span style={{ fontSize: '11px', padding: '4px 9px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
              ⏱ {activeTutorial.averageCompletionTime || '2-3 days'}
            </span>
          </div>
        </div>

        {activeTutorial.description ? (
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {activeTutorial.description}
          </p>
        ) : null}

        {activeTutorial.dependencyChain?.length > 0 ? (
          <div style={{ marginBottom: '18px' }}>
            <strong style={{ fontSize: '12px', color: 'var(--purple-300)' }}>⛓ Dependency Chain</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {activeTutorial.dependencyChain.map((dep, index) => (
                <span
                  key={`${dep}-${index}`}
                  style={{
                    fontSize: '11px',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: 'rgba(168,85,247,0.10)',
                    border: '1px solid rgba(168,85,247,0.20)',
                    color: 'var(--purple-200)'
                  }}
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {activeTutorial.practiceTask ? (
          <div
            style={{
              background: 'rgba(168,85,247,0.04)',
              border: '1px solid rgba(168,85,247,0.16)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '18px'
            }}
          >
            <strong style={{ fontSize: '12px', color: 'var(--purple-300)', display: 'block', marginBottom: '8px' }}>
              🎯 Practice Assignment
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {activeTutorial.practiceTask}
            </p>

            <div style={{ marginTop: '16px' }}>
              <strong style={{ fontSize: '12px', color: 'var(--purple-300)', display: 'block', marginBottom: '8px' }}>
                ✅ Practice Progress
              </strong>

              {[
                ['basics', 'Read basics'],
                ['task', 'Built mini task'],
                ['revision', 'Revised once']
              ].map(([field, label]) => (
                <label
                  key={field}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(activeSavedProgress[field])}
                    onChange={(e) =>
                      updateSkillProgress(activeTutorial.skill, field, e.target.checked)
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {activeTutorial.miniProjects?.length > 0 ? (
          <div style={{ marginBottom: '18px' }}>
            <strong style={{ fontSize: '12px', color: 'var(--purple-300)', display: 'block', marginBottom: '8px' }}>
              🚀 Mini Projects
            </strong>

            <div style={{ display: 'grid', gap: '8px' }}>
              {activeTutorial.miniProjects.map((project, index) => (
                <div
                  key={`${project}-${index}`}
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  ⚒️ {project}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTutorial.tutorial ? (
          <a
            href={activeTutorial.tutorial}
            target="_blank"
            rel="noreferrer"
            className="tutorial-link-btn"
            style={{
              display: 'inline-flex',
              background: 'var(--purple-500)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none'
            }}
          >
            Start Learning ↗
          </a>
        ) : null}
      </div>
    ) : null}
  </div>
) : null}

          <div className="button-group" style={{ marginTop: 32 }}>
            <button type="button" onClick={downloadResults}>
              📥 Download Report
            </button>
            <button type="button" className="btn-accent" onClick={shareResults}>
              📤 Share Results
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}