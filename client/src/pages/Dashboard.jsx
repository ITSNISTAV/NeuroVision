import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

function scoreColor(v) {
  if (v >= 70) return '#10b981'
  if (v >= 40) return '#f59e0b'
  return '#ef4444'
}

function normalizeSkill(skill = '') {
  return String(skill)
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .trim()
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str).replace(/[&<>]/g, (m) =>
    m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const userId = user?._id

  const [profileRoles, setProfileRoles] = useState([])
  const [roleDefs, setRoleDefs] = useState([])
  const [roleResults, setRoleResults] = useState({})
  const [error, setError] = useState('')

  const name = user?.name || 'User'
  const initial = name.charAt(0).toUpperCase()
  const pic = user?.profilePic

  const getResultKey = (roleObj) => `${roleObj.role}-${roleObj.selectedStack || 'no-stack'}`

  function getStackSkills(roleName, selectedStack) {
    const roleDef = roleDefs.find((r) => r.role === roleName)
    const stack = roleDef?.stacks?.find(
      (s) => normalizeSkill(s.stackName) === normalizeSkill(selectedStack)
    )

    return stack?.skills || []
  }

  const loadGap = useCallback(
    async (roleObj) => {
      if (!userId || !roleObj?.role || !roleObj?.selectedStack) return

      try {
        const { data } = await api.get(`/skill-gap/${userId}/${encodeURIComponent(roleObj.role)}`)

        setRoleResults((prev) => ({
          ...prev,
          [getResultKey(roleObj)]: data
        }))
      } catch (err) {
        console.error('Gap load failed:', err)
      }
    },
    [userId]
  )

  useEffect(() => {
    if (!userId) return

    async function loadDashboard() {
      try {
        const [profileRes, rolesRes] = await Promise.all([
          api.get(`/profile/${userId}`),
          api.get('/roles')
        ])

        const roles = profileRes.data.roles || []

        setProfileRoles(roles)
        setRoleDefs(Array.isArray(rolesRes.data) ? rolesRes.data : [])

        roles.forEach((roleObj) => loadGap(roleObj))
      } catch (err) {
        console.error(err)
        setError('Could not load dashboard. Is the backend running?')
      }
    }

    loadDashboard()
  }, [userId, loadGap])

  const scores = useMemo(() => {
    return Object.entries(roleResults)
      .filter(([, result]) => result.compatibilityScore != null)
      .sort((a, b) => b[1].compatibilityScore - a[1].compatibilityScore)
  }, [roleResults])

  const bestResult = scores[0]?.[1]
  const bestRole = bestResult?.targetRole
  const bestStack = bestResult?.selectedStack
  const bestScore = bestResult?.compatibilityScore

  const bestProfile = useMemo(() => {
    if (!bestRole || !bestStack) return null

    return profileRoles.find(
      (roleObj) =>
        roleObj.role === bestRole &&
        normalizeSkill(roleObj.selectedStack) === normalizeSkill(bestStack)
    )
  }, [profileRoles, bestRole, bestStack])

  const totalSkills = profileRoles.reduce(
    (sum, role) => sum + (role.technicalSkills?.length || 0),
    0
  )

  const totalInternship = profileRoles.reduce(
    (sum, role) => sum + (role.internshipMonths || 0),
    0
  )

  const learnNext = useMemo(() => {
    const map = {}

    Object.values(roleResults).forEach((result) => {
      const trainingSkills = result.missingSkillsWithTutorials || []

      trainingSkills.forEach((skill) => {
        if (!map[skill.skill]) {
          map[skill.skill] = {
            roles: [],
            tutorial: skill.tutorial,
            weight: skill.weight || 0,
            status: skill.status,
            difficulty: skill.difficulty,
            averageCompletionTime: skill.averageCompletionTime
          }
        }

        map[skill.skill].roles.push(`${result.targetRole} (${result.selectedStack || 'Stack'})`)
        map[skill.skill].weight = Math.max(map[skill.skill].weight, skill.weight || 0)
      })
    })

    return Object.entries(map)
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 6)
  }, [roleResults])

  const topLearning = learnNext[0]

  const radarMarkup = useMemo(() => {
    if (!bestProfile || !bestRole || !bestStack) return ''

    const roleSkills = getStackSkills(bestRole, bestStack)

    if (!roleSkills.length) return ''

    const size = 280
    const cx = size / 2
    const cy = size / 2
    const maxR = 95
    const n = roleSkills.length
    const angleStep = (2 * Math.PI) / n

    const getPoint = (i, r) => ({
      x: cx + r * Math.sin(i * angleStep),
      y: cy - r * Math.cos(i * angleStep)
    })

    let rings = ''

    ;[0.25, 0.5, 0.75, 1].forEach((t) => {
      const pts = Array.from({ length: n }, (_, i) => getPoint(i, maxR * t))
      rings += `<polygon points="${pts.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="rgba(168,85,247,0.15)" stroke-width="0.5"/>`
    })

    let axes = ''

    roleSkills.forEach((_, i) => {
      const p = getPoint(i, maxR)
      axes += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="rgba(168,85,247,0.15)" stroke-width="0.5"/>`
    })

    const userSkillMap = {}

    ;(bestProfile.technicalSkills || []).forEach((skill) => {
      userSkillMap[normalizeSkill(skill.skill)] = Number(skill.level) || 0
    })

    const dataPoints = roleSkills.map((requiredSkill, i) => {
      const userLevel = userSkillMap[normalizeSkill(requiredSkill.name)] || 0
      const requiredLevel = Number(requiredSkill.requiredLevel) || 5
      const ratio = Math.min(userLevel / requiredLevel, 1)

      return getPoint(i, maxR * ratio)
    })

    const polyPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

    let labels = ''

    roleSkills.forEach((requiredSkill, i) => {
      const p = getPoint(i, maxR + 26)
      const userLevel = userSkillMap[normalizeSkill(requiredSkill.name)]
      const color = userLevel ? '#c084fc' : 'rgba(196,181,253,0.35)'

      labels += `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="${color}" font-family="DM Sans">${escapeHtml(requiredSkill.name)}</text>`
    })

    let dots = ''

    dataPoints.forEach((p) => {
      dots += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#d946ef" />`
    })

    return `
      ${rings}
      ${axes}
      <polygon points="${polyPoints}" fill="rgba(168,85,247,0.2)" stroke="#a855f7" stroke-width="1.5"/>
      ${dots}
      ${labels}
    `
  }, [bestProfile, bestRole, bestStack, roleDefs])

  return (
    <div className="page-wrapper">
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="glass-card">
        <div className="candidate-card">
          <div className="candidate-identity">
            <div className="candidate-avatar-lg">
              {pic ? <img src={pic} alt="" className="candidate-avatar-img" /> : initial}
            </div>

            <div>
              <div className="candidate-name">{name}</div>
              <div className="candidate-best-role">
                Best match:{' '}
                <span>
                  {bestRole
                    ? `${bestRole} — ${bestStack || 'Stack'}`
                    : profileRoles.length
                      ? 'calculating…'
                      : '—'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                <Link className="learn-link" to="/skills">
                  Edit Profile →
                </Link>

                <Link className="learn-link" to={bestRole ? `/skill-gap?role=${encodeURIComponent(bestRole)}` : '/skill-gap'}>
                  Open Skill Gap →
                </Link>

                <Link className="learn-link" to="/score">
                  View Score →
                </Link>
              </div>
            </div>
          </div>

          <div className="candidate-stats">
            <div className="c-stat">
              <div className="c-stat-value">{profileRoles.length}</div>
              <div className="c-stat-label">Roles</div>
            </div>

            <div className="c-stat">
              <div className="c-stat-value">{totalSkills}</div>
              <div className="c-stat-label">Skills</div>
            </div>

            <div className="c-stat">
              <div
                className="c-stat-value"
                style={{
                  color: bestScore != null ? scoreColor(bestScore) : 'var(--purple-300)'
                }}
              >
                {bestScore != null ? `${Math.round(bestScore)}%` : '—'}
              </div>
              <div className="c-stat-label">Top fit</div>
            </div>

            <div className="c-stat">
              <div className="c-stat-value">{totalInternship}</div>
              <div className="c-stat-label">Intern mo</div>
            </div>
          </div>
        </div>
      </div>

      {topLearning ? (
        <div className="learn-card" style={{ marginBottom: 28 }}>
          <div className="panel-title">🚀 Continue Learning</div>

          <div className="learn-item">
            <div className="learn-item-top">
              <div className="learn-skill-name">{topLearning[0]}</div>
              <div className="learn-boost">Weight {topLearning[1].weight}</div>
            </div>

            <div className="learn-roles">
              Needed for: {topLearning[1].roles.join(', ')}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {topLearning[1].status === 'needs_improvement' ? 'Needs improvement' : 'Missing'} ·{' '}
              {topLearning[1].difficulty || 'Medium'} ·{' '}
              {topLearning[1].averageCompletionTime || '2-3 days'}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              {topLearning[1].tutorial ? (
                <a className="learn-link" href={topLearning[1].tutorial} target="_blank" rel="noreferrer">
                  Start Learning ↗
                </a>
              ) : null}

              <Link
                className="learn-link"
                to={bestRole ? `/skill-gap?role=${encodeURIComponent(bestRole)}` : '/skill-gap'}
              >
                Practice in Skill Gap →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="two-col">
        <div className="panel">
          <div className="panel-title">✨ Skill radar — best stack</div>

          <div className="radar-wrap">
            {radarMarkup ? (
              <>
                <svg
                  width={280}
                  height={280}
                  viewBox="0 0 280 280"
                  dangerouslySetInnerHTML={{ __html: radarMarkup }}
                />

                <div className="radar-caption">
                  {bestRole} · {bestStack}
                </div>
              </>
            ) : (
              <div className="loading">Calculating radar…</div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">🩺 Profile Health</div>

          {profileRoles.length ? (
            profileRoles.map((roleObj) => (
              <div
                key={`${roleObj.role}-${roleObj.selectedStack || 'no-stack'}`}
                className="health-row"
                style={{
                  padding: '14px',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <strong>{roleObj.role}</strong>
                  <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                    {roleObj.selectedStack || 'Stack missing'}
                  </small>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <span className="meta-pill">{roleObj.selectedStack ? '✅ Stack' : '❌ Stack'}</span>
                  <span className="meta-pill">
                    {roleObj.technicalSkills?.length ? '✅ Skills' : '❌ Skills'}
                  </span>
                  <span className="meta-pill">
                    {roleObj.projects?.length ? '✅ Projects' : '❌ Projects'}
                  </span>
                  <span className="meta-pill">
                    {roleObj.githubUsername ? '✅ GitHub' : '❌ GitHub'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="loading">No profile data found.</div>
          )}
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-title">📊 Role fit comparison</div>

          {profileRoles.length === 0 ? (
            <div className="loading">Add profiles on the Profile page.</div>
          ) : (
            profileRoles.map((roleObj) => {
              const key = getResultKey(roleObj)
              const result = roleResults[key]
              const score = result?.compatibilityScore

              return (
                <div key={key} className="fit-bar-row">
                  <div className="fit-bar-top">
                    <span className="fit-bar-label">
                      {roleObj.role}
                      <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                        {roleObj.selectedStack || 'Stack not selected'}
                      </small>
                    </span>

                    <span
                      className="fit-bar-pct"
                      style={{
                        color: score != null ? scoreColor(score) : 'var(--text-muted)'
                      }}
                    >
                      {score != null ? `${Math.round(score)}%` : '…'}
                    </span>
                  </div>

                  <div className="fit-bar-track">
                    <div
                      className="fit-bar-fill"
                      style={{
                        width: score != null ? `${Math.round(score)}%` : '0%',
                        background: score != null ? scoreColor(score) : undefined
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="panel">
          <div className="panel-title">🧠 Readiness Summary</div>

          {bestResult ? (
            <>
              <div className="loading" style={{ textAlign: 'left' }}>
                Strongest profile: <strong>{bestResult.targetRole}</strong>
                <br />
                Stack: <strong>{bestResult.selectedStack}</strong>
                <br />
                Match:{' '}
                <strong style={{ color: scoreColor(bestResult.compatibilityScore) }}>
                  {bestResult.compatibilityScore}%
                </strong>
              </div>

              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                {bestResult.recommendation}
              </p>

              <Link
                to={`/skill-gap?role=${encodeURIComponent(bestResult.targetRole)}`}
                className="learn-link"
              >
                Open skill gap →
              </Link>
            </>
          ) : (
            <div className="loading">Waiting for analysis…</div>
          )}
        </div>
      </div>

      <div className="learn-card">
        <div className="panel-title">🎯 What to learn next</div>

        <div className="learn-items">
          {!learnNext.length ? (
            <div className="loading" style={{ gridColumn: '1 / -1' }}>
              {profileRoles.length
                ? '✨ No training gaps found yet.'
                : 'Save a role profile to see suggestions.'}
            </div>
          ) : (
            learnNext.map(([skill, data]) => (
              <div key={skill} className="learn-item">
                <div className="learn-item-top">
                  <div className="learn-skill-name">{skill}</div>
                  <div className="learn-boost">Weight {data.weight}</div>
                </div>

                <div className="learn-roles">Needed for: {data.roles.join(', ')}</div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {data.status === 'needs_improvement' ? 'Needs improvement' : 'Missing'} ·{' '}
                  {data.difficulty || 'Medium'} · {data.averageCompletionTime || '2-3 days'}
                </div>

                {data.tutorial ? (
                  <a className="learn-link" href={data.tutorial} target="_blank" rel="noreferrer">
                    📘 Learn {skill} ↗
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
          <Link to="/skills" className="learn-link">
            Edit profiles →
          </Link>
        </p>
      </div>
    </div>
  )
}