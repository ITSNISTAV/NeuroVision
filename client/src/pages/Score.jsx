import { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import './Score.css'

const FALLBACK_ROLE_SKILLS = {
  "Backend Developer": [
    { name: "Node.js", requiredLevel: 4, weight: 25 },
    { name: "Express.js", requiredLevel: 4, weight: 20 },
    { name: "MongoDB", requiredLevel: 3, weight: 20 },
    { name: "REST APIs", requiredLevel: 4, weight: 15 },
    { name: "JWT Authentication", requiredLevel: 3, weight: 10 },
    { name: "Git", requiredLevel: 3, weight: 10 },
  ],
  "Frontend Developer": [
    { name: "HTML", requiredLevel: 4, weight: 20 },
    { name: "CSS", requiredLevel: 4, weight: 20 },
    { name: "JavaScript", requiredLevel: 4, weight: 25 },
    { name: "React.js", requiredLevel: 4, weight: 20 },
    { name: "Responsive Design", requiredLevel: 3, weight: 10 },
    { name: "Git", requiredLevel: 3, weight: 5 },
  ],
  "Full Stack Developer": [
    { name: "HTML", requiredLevel: 4, weight: 10 },
    { name: "CSS", requiredLevel: 4, weight: 10 },
    { name: "JavaScript", requiredLevel: 4, weight: 15 },
    { name: "React.js", requiredLevel: 4, weight: 15 },
    { name: "Node.js", requiredLevel: 4, weight: 15 },
    { name: "Express.js", requiredLevel: 3, weight: 10 },
    { name: "MongoDB", requiredLevel: 3, weight: 10 },
    { name: "REST APIs", requiredLevel: 3, weight: 10 },
    { name: "Git", requiredLevel: 3, weight: 5 },
  ],
};

function getScoreLevel(score) {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Intermediate'
  if (score >= 30) return 'Basic'
  return 'Weak'
}

function scoreColor(v) {
  if (v >= 70) return '#a855f7'
  if (v >= 40) return '#f59e0b'
  return '#ef4444'
}

function computeScore(profile, roleSkills) {
  const userSkills = profile.technicalSkills || []
  let totalWeight = 0
  let earnedWeight = 0
  const breakdown = []

  for (const rs of roleSkills) {
    const userSkill = userSkills.find(
      (us) => us.skill.toLowerCase() === rs.name.toLowerCase()
    )
    let userLevelNorm = 0
    if (userSkill && userSkill.level) {
      userLevelNorm = userSkill.level
    }
    const contribution = userLevelNorm >= rs.requiredLevel ? 1 : Math.max(0, userLevelNorm / rs.requiredLevel)
    totalWeight += rs.weight
    earnedWeight += contribution * rs.weight
    breakdown.push({
      name: rs.name,
      requiredLevel: rs.requiredLevel,
      userLevel: userSkill?.level || null,
      userLevelNorm,
      weight: rs.weight,
      contribution,
    })
  }
  const finalScore = totalWeight === 0 ? 0 : (earnedWeight / totalWeight) * 100
  return { finalScore, breakdown }
}

function convertLocalScoreToApiShape(profile, local) {
  const finalScore = Math.round(local.finalScore * 10) / 10

  const skillBreakdown = local.breakdown.map((skill) => {
    const isMissing = skill.userLevel === null
    const isMatched = !isMissing && skill.userLevelNorm >= skill.requiredLevel

    return {
      skill: skill.name,
      status: isMissing ? 'missing' : isMatched ? 'matched' : 'needs_improvement',
      userLevel: skill.userLevel || 0,
      requiredLevel: skill.requiredLevel,
      weight: skill.weight,
      earned: Math.round((skill.contribution * skill.weight) * 10) / 10,
      max: skill.weight,
      message: isMissing
        ? `${skill.name} is missing from your profile.`
        : isMatched
        ? `${skill.name} meets the required level.`
        : `${skill.name} is present but below required level.`
    }
  })

  const matchedSkills = skillBreakdown
    .filter((s) => s.status === 'matched' || s.status === 'needs_improvement')
    .map((s) => s.skill)

  const missingSkills = skillBreakdown
    .filter((s) => s.status === 'missing')
    .map((s) => s.skill)

  const earnedScore = skillBreakdown.reduce((sum, s) => sum + s.earned, 0)
  const totalWeight = skillBreakdown.reduce((sum, s) => sum + s.max, 0)

  return {
    message: 'success',
    role: profile.role,
    finalScore,
    level: getScoreLevel(finalScore),
    scoreSummary: {
      earnedScore: Math.round(earnedScore * 10) / 10,
      totalWeight,
      matchedSkillsCount: matchedSkills.length,
      missingSkillsCount: missingSkills.length,
      totalRequiredSkills: skillBreakdown.length
    },
    matchedSkills,
    missingSkills,
    skillBreakdown
  }
}

export default function Score() {
  const { user } = useAuth()
  const userId = user?._id || user?.id
  const [searchParams] = useSearchParams()
  const queryRole = searchParams.get('role') || ''

  const [profiles, setProfiles] = useState([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [finalScore, setFinalScore] = useState(null)
  const [scoreLevel, setScoreLevel] = useState('')
  const [selectedStack, setSelectedStack] = useState('')
  const [breakdown, setBreakdown] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [matchedSkills, setMatchedSkills] = useState([])
  const [missingSkills, setMissingSkills] = useState([])
  const [scoreSummary, setScoreSummary] = useState({})
  const [projectQuality, setProjectQuality] = useState(null)
  const [realityGap, setRealityGap] = useState([])
  const [improvementPriorities, setImprovementPriorities] = useState([])
  const [roadmap, setRoadmap] = useState([])
  const [apiWarning, setApiWarning] = useState('')
  const resultRef = useRef(null)

  useEffect(() => {
    if (showResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showResult])

  const calculateScoreForProfile = useCallback(async (profile, idx) => {
    if (!profile || !userId) return
    setLoading(true)
    setActiveIdx(idx)
    setApiWarning('')
    try {
      const res = await api.post(`/score/${userId}`, { role: profile.role })
      const data = res.data

      setFinalScore(data.finalScore)
      setScoreLevel(data.level)
      setSelectedStack(data.selectedStack || profile.selectedStack)
      setBreakdown(data.skillBreakdown || [])
      setMatchedSkills(data.matchedSkills || [])
      setMissingSkills(data.missingSkills || [])
      setScoreSummary(data.scoreSummary || {})
      setProjectQuality(data.projectQuality || null)
      setRealityGap(data.realityGap || [])
      setImprovementPriorities(data.improvementPriorities || [])
      setRoadmap(data.roadmap || [])
      setApiWarning('')
      setShowResult(true)
    } catch (err) {
      console.warn('Score API unavailable. Using client preview:', err)
      setApiWarning('Could not reach scoring API. Showing client-side calculation preview.')

      const roleSkills = FALLBACK_ROLE_SKILLS[profile.role] || []
      const local = computeScore(profile, roleSkills)
      const scoreData = convertLocalScoreToApiShape(profile, local)

      setFinalScore(scoreData.finalScore)
      setScoreLevel(scoreData.level)
      setSelectedStack(profile.selectedStack || '')
      setBreakdown(scoreData.skillBreakdown || [])
      setMatchedSkills(scoreData.matchedSkills || [])
      setMissingSkills(scoreData.missingSkills || [])
      setScoreSummary(scoreData.scoreSummary || {})
      setProjectQuality(null)
      setRealityGap([])
      setImprovementPriorities([])
      setRoadmap([])
      setShowResult(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadProfiles = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await api.get(`/profile/${userId}`)
      const roles = data.roles || []
      setProfiles(roles)
      if (queryRole) {
        const idx = roles.findIndex((p) => p.role === queryRole)
        if (idx >= 0) {
          await calculateScoreForProfile(roles[idx], idx)
        }
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    }
  }, [userId, queryRole, calculateScoreForProfile])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  async function runScore(idx) {
    const profile = profiles[idx]
    await calculateScoreForProfile(profile, idx)
  }

  const circumference = 2 * Math.PI * 54
  const filled = finalScore != null ? (finalScore / 100) * circumference : 0
  const fitLabelText = finalScore >= 70 ? 'Strong Fit' : finalScore >= 40 ? 'Partial Fit' : 'Weak Fit'
  const fitColor = finalScore >= 70 ? '#4ade80' : finalScore >= 40 ? '#f59e0b' : '#f87171'

  const getWhyScoreContent = () => {
    const matchedCount = scoreSummary.matchedSkillsCount || 0
    const totalRequired = scoreSummary.totalRequiredSkills || 0
    if (finalScore >= 70) {
      return (
        <>
          <strong>Why this score?</strong>
          <br />
          Your profile has strong alignment with the selected role. You matched {matchedCount} out of {totalRequired} required skills. Focus now on improving depth, projects, and deployment proof.
        </>
      )
    } else if (finalScore >= 40) {
      return (
        <>
          <strong>Why this score?</strong>
          <br />
          Your profile partially matches the selected role, but some important skills are missing or below the required level. Missing skills include: {missingSkills.slice(0, 4).join(', ') || 'role-specific skills'}.
        </>
      )
    } else {
      return (
        <>
          <strong>Why this score?</strong>
          <br />
          Your current profile has weak alignment with the selected role. Most required skills are either missing or below the required level. Start by fixing the must-have skills first: {missingSkills.slice(0, 4).join(', ') || 'core role skills'}.
        </>
      )
    }
  }

  return (
    <div className="page-wrapper">
      <section className="form-section glass-card">
        <div className="section-header">
          <h2>Score a Profile</h2>
          <p className="section-sub">Select a saved profile to calculate your role fit score</p>
        </div>
        <div className="display-header" style={{ marginTop: '0', marginBottom: '24px' }}>
          <h2>Saved Role Profiles</h2>
          <span className="badge">
            {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="roles-grid">
          {profiles.map((p, idx) => {
            const skillsList = p.technicalSkills || []
            const internship = p.internshipMonths ?? 0
            return (
              <div
                key={idx}
                className={`roleCard${activeIdx === idx ? ' active' : ''}`}
                id={`role-${idx}`}
              >
                <div className="card-role-name">{p.role}</div>
                <div className="card-meta">
                  <div className="meta-pill">
                    <span className="meta-label">CGPA</span>&nbsp;{p.cgpa}
                  </div>
                  <div className="meta-pill">
                    <span className="meta-label">Internship</span>&nbsp;{internship} mo
                  </div>
                  <div className="meta-pill">
                    <span className="meta-label">Skills</span>&nbsp;{skillsList.length}
                  </div>
                </div>
                <div className="card-skills-label">Technical Skills</div>
                <div className="card-skills-list">
                  {skillsList.map((s, sIdx) => (
                    <span key={sIdx} className="card-skill-tag">
                      {s.skill}
                      <span className="tag-level">{s.level}</span>
                    </span>
                  ))}
                </div>
                <div className="cardBtns">
                  <button
                    type="button"
                    className="card-btn btn-score"
                    disabled={loading}
                    onClick={() => runScore(idx)}
                  >
                    {loading && activeIdx === idx ? 'Scoring...' : '⚡ Score'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className={`empty-state${profiles.length ? '' : ' visible'}`}>
          <div className="empty-icon">◈</div>
          <p>
            No profiles saved yet.
            <br />
            Go to Skills page to create one.
          </p>
        </div>
      </section>

      {showResult && profiles[activeIdx] ? (
        <section ref={resultRef} className="form-section glass-card">
          <div className="section-header">
            <h2>Score Result</h2>
            <p className="section-sub">Detailed role-fit analysis based on your saved profile</p>
          </div>

          {apiWarning && (
            <div className="warning-banner">{apiWarning}</div>
          )}

          <div className="result-inner">
            <div className="score-col">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(45,31,78,0.8)" strokeWidth="10" />
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  fill="none"
                  stroke={scoreColor(finalScore)}
                  strokeWidth="10"
                  strokeDasharray={`${filled} ${circumference}`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
                <text x="70" y="65" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
                  {finalScore != null ? `${Math.round(finalScore)}%` : '0%'}
                </text>
                <text x="70" y="85" textAnchor="middle" fill="#a78bfa" fontSize="10" letterSpacing="1">
                  FIT SCORE
                </text>
              </svg>

              <div
                className="fit-label"
                style={{
                  color: fitColor,
                  background: `${fitColor}18`,
                  borderColor: `${fitColor}40`
                }}
              >
                {fitLabelText} · {scoreLevel || getScoreLevel(finalScore)}
              </div>
              <div className="result-role">{profiles[activeIdx].role}</div>
              <div className="result-stack">{selectedStack || 'Stack not selected'}</div>
            </div>

            <div className="breakdown-col">
              <div className="breakdown-header">
                <h3>Score Composition</h3>
                <span className="legend">based on role skill weights</span>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-label">Earned Weight</div>
                  <div className="summary-value">{scoreSummary.earnedScore || 0}</div>
                  <div className="summary-sub">out of {scoreSummary.totalWeight || 0}</div>
                </div>

                <div className="summary-card">
                  <div className="summary-label">Matched Skills</div>
                  <div className="summary-value">{scoreSummary.matchedSkillsCount || 0}</div>
                  <div className="summary-sub">out of {scoreSummary.totalRequiredSkills || 0}</div>
                </div>

                <div className="summary-card">
                  <div className="summary-label">Missing Skills</div>
                  <div className="summary-value">{scoreSummary.missingSkillsCount || 0}</div>
                  <div className="summary-sub">need improvement</div>
                </div>

                <div className="summary-card">
                  <div className="summary-label">Role Level</div>
                  <div className="summary-value">{scoreLevel || getScoreLevel(finalScore)}</div>
                  <div className="summary-sub">current fit</div>
                </div>
              </div>

              <div className="why-score-box">
                {getWhyScoreContent()}
              </div>
            </div>
          </div>

          <div className="analysis-grid">
            <div className="analysis-panel">
              <div className="panel-header">
                <h3>Matched Skills</h3>
                <span className="mini-badge">{matchedSkills.length}</span>
              </div>
              <div className="tag-list">
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((skill) => (
                    <span key={skill} className="analysis-tag good">✓ {skill}</span>
                  ))
                ) : (
                  <span className="analysis-tag">No matched skills yet</span>
                )}
              </div>
            </div>

            <div className="analysis-panel">
              <div className="panel-header">
                <h3>Missing Skills</h3>
                <span className="mini-badge danger">{missingSkills.length}</span>
              </div>
              <div className="tag-list">
                {missingSkills.length > 0 ? (
                  missingSkills.map((skill) => (
                    <span key={skill} className="analysis-tag bad">✕ {skill}</span>
                  ))
                ) : (
                  <span className="analysis-tag good">No major missing skills</span>
                )}
              </div>
            </div>
          </div>

          <div className="skill-breakdown-section">
            <div className="breakdown-header">
              <h3>Skill Breakdown</h3>
              <span className="legend"><span className="legend-mark">│</span> = required level</span>
            </div>
            <div className="skill-bars-wrap">
              {breakdown.map((skill) => {
                const userLevel = Number(skill.userLevel || 0)
                const reqLevel = Number(skill.requiredLevel || 0)
                const userFillPercent = userLevel ? Math.min((userLevel / 5) * 100, 100) : 0
                const reqMarkerPercent = reqLevel ? Math.min((reqLevel / 5) * 100, 100) : 0

                const status = skill.status || (skill.met ? 'matched' : skill.userLevel ? 'needs_improvement' : 'missing')
                const badgeClass = status === 'matched' ? 'met' : status === 'needs_improvement' ? 'partial' : 'unmet'
                const fillClass = status === 'matched' ? 'met' : status === 'needs_improvement' ? 'partial' : 'unmet'
                const levelText = status === 'missing' ? 'missing' : `lvl ${userLevel}`
                const skillName = skill.skill || skill.name

                return (
                  <div key={skillName} className="skill-row">
                    <div className="skill-row-top">
                      <span className="skill-name">{skillName}</span>
                      <div className="skill-meta">
                        <span className="weight-label">{skill.earned}/{skill.max || skill.weight} pts</span>
                        <span className={`level-badge ${badgeClass}`}>
                          {levelText} / req {reqLevel}
                        </span>
                      </div>
                    </div>
                    <div className="bar-track">
                      <div className="bar-req-marker" style={{ left: `${reqMarkerPercent}%` }} />
                      <div
                        className={`bar-fill ${fillClass}`}
                        style={{ width: `${userFillPercent}%` }}
                      />
                    </div>
                    <div className="skill-message">{skill.message || ''}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="project-quality-section">
            <div className="breakdown-header">
              <h3>Project Quality</h3>
              <span className="legend">evidence-based project analysis</span>
            </div>

            <div className="project-quality-grid">
              <div className="project-score-card">
                <div className="project-score-value">{projectQuality ? projectQuality.overallScore : 0}</div>
                <div className="project-score-label">PROJECT QUALITY</div>
                <div className="fit-label" style={{ fontSize: '11px', marginTop: '8px' }}>
                  {projectQuality ? projectQuality.level : 'No Evidence'}
                </div>
              </div>

              <div className="project-evidence-panel">
                <div className="panel-header"><h3>Strengths</h3></div>
                <div className="evidence-list">
                  {projectQuality && projectQuality.strengths && projectQuality.strengths.length > 0 ? (
                    projectQuality.strengths.slice(0, 5).map((str, index) => (
                      <div key={index} className="evidence-item good">✓ {str}</div>
                    ))
                  ) : (
                    <div className="evidence-item">No project strengths detected yet.</div>
                  )}
                </div>
              </div>

              <div className="project-evidence-panel">
                <div className="panel-header"><h3>Weaknesses</h3></div>
                <div className="evidence-list">
                  {projectQuality && projectQuality.weaknesses && projectQuality.weaknesses.length > 0 ? (
                    projectQuality.weaknesses.slice(0, 5).map((weak, index) => (
                      <div key={index} className="evidence-item bad">✕ {weak}</div>
                    ))
                  ) : (
                    <div className="evidence-item good">No major project weaknesses detected.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="reality-gap-section">
            <div className="breakdown-header">
              <h3>Reality Gap</h3>
              <span className="legend">what is blocking role readiness</span>
            </div>

            <div className="reality-gap-list">
              {realityGap && realityGap.length > 0 ? (
                realityGap.map((gap, index) => {
                  const severityClass = String(gap.severity || 'Low').toLowerCase()
                  return (
                    <div key={index} className="gap-card">
                      <div className="gap-top">
                        <div className="gap-title">{gap.type}</div>
                        <div className={`severity-badge ${severityClass}`}>{gap.severity}</div>
                      </div>
                      <div className="gap-message">{gap.message}</div>
                    </div>
                  )
                })
              ) : (
                <div className="gap-card">
                  <div className="gap-top">
                    <div className="gap-title">No Data</div>
                    <div className="severity-badge low">Low</div>
                  </div>
                  <div className="gap-message">No reality gap data available yet.</div>
                </div>
              )}
            </div>
          </div>

          <div className="priority-section">
            <div className="breakdown-header">
              <h3>Improvement Priorities</h3>
              <span className="legend">highest impact improvements first</span>
            </div>

            {improvementPriorities && improvementPriorities.length > 0 ? (
              <>
                <div className="next-action-card">
                  <div className="next-action-title">NEXT BEST ACTION</div>
                  <div className="next-action-heading">
                    {improvementPriorities[0].title}
                  </div>
                  <div className="next-action-text">
                    {improvementPriorities[0].action}
                  </div>
                  <div className="next-action-meta">
                    <div className="next-action-chip">Impact: {improvementPriorities[0].impact}</div>
                    <div className="next-action-chip">Time: {improvementPriorities[0].estimatedTime}</div>
                    <div className="next-action-chip">{improvementPriorities[0].category}</div>
                  </div>
                </div>

                <div className="priority-grid">
                  {improvementPriorities.map((item, index) => {
                    const impactClass =
                      item.impact === 'Very High' || item.impact === 'High'
                        ? 'high'
                        : item.impact === 'Medium'
                        ? 'medium'
                        : 'low'

                    return (
                      <div key={index} className="priority-card">
                        <div className="priority-rank">PRIORITY {index + 1}</div>
                        <div className="priority-name">{item.title}</div>
                        <div className={`priority-impact ${impactClass}`}>{item.impact} Impact</div>
                        <div className="priority-action">{item.action}</div>
                        <div className="priority-fixes">
                          {(item.fixes || []).map((fix, fIdx) => (
                            <div key={fIdx} className="fix-chip">{fix}</div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="next-action-card">
                <div className="next-action-title">NEXT BEST ACTION</div>
                <div className="next-action-heading">No Priorities Detected</div>
                <div className="next-action-text">
                  Congratulations! No improvement priorities detected. You are well-aligned for this role!
                </div>
              </div>
            )}
          </div>

          <div className="roadmap-section">
            <div className="breakdown-header">
              <h3>Personalized Roadmap</h3>
              <span className="legend">phase-wise recovery plan</span>
            </div>

            <div className="roadmap-list">
              {roadmap && roadmap.length > 0 ? (
                roadmap.map((phase, index) => (
                  <div key={index} className="roadmap-card">
                    <div className="roadmap-phase">PHASE {phase.phase}</div>
                    <div className="roadmap-title">{phase.title}</div>
                    <div className="roadmap-meta">Duration: {phase.duration}</div>
                    <div className="roadmap-goal">{phase.goal}</div>
                    <div className="roadmap-tasks">
                      {(phase.tasks || []).map((task, tIdx) => (
                        <div key={tIdx} className="roadmap-task">✓ {task}</div>
                      ))}
                    </div>
                    <div className="roadmap-output">Output: {phase.output}</div>
                  </div>
                ))
              ) : (
                <div className="warning-banner">No roadmap generated yet.</div>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
