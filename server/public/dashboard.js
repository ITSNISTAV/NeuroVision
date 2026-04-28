const SESSION_KEY = 'nv_user';
const BASE = '';

// roleData duplicated client-side only for score-impact calculation
const ROLE_DATA = {
  "Backend Developer": [
   { "name": "Node.js", "requiredLevel": 5, "weight": 30 },
        { "name": "Express", "requiredLevel": 4, "weight": 25 },
        { "name": "MongoDB", "requiredLevel": 4, "weight": 15 },
        { "name": "PostgreSQL", "requiredLevel": 4, "weight": 15 },
        { "name": "Redis", "requiredLevel": 3, "weight": 15 }
  ],
  "Frontend Developer": [
    { "name": "React", "requiredLevel": 5, "weight": 30 },
        { "name": "TypeScript", "requiredLevel": 4, "weight": 20 },
        { "name": "Next.js", "requiredLevel": 4, "weight": 20 },
        { "name": "Redux", "requiredLevel": 3, "weight": 15 },
        { "name": "Tailwind", "requiredLevel": 3, "weight": 15 }
  ],
  "Full Stack Developer": [
     { "name": "React", "requiredLevel": 4, "weight": 20 },
        { "name": "Node.js", "requiredLevel": 4, "weight": 20 },
        { "name": "MongoDB", "requiredLevel": 3, "weight": 20 },
        { "name": "Express", "requiredLevel": 3, "weight": 20 },
        { "name": "Next.js", "requiredLevel": 3, "weight": 20 }
  ],
  "Data Analyst": [
     { "name": "SQL", "requiredLevel": 4, "weight": 25 },
        { "name": "Python", "requiredLevel": 4, "weight": 25 },
        { "name": "Excel", "requiredLevel": 3, "weight": 20 },
        { "name": "PowerBI", "requiredLevel": 3, "weight": 15 },
        { "name": "Tableau", "requiredLevel": 3, "weight": 15 }
  ],
  "Machine Learning Engineer": [
    { "name": "Python", "requiredLevel": 5, "weight": 30 },
        { "name": "TensorFlow", "requiredLevel": 4, "weight": 20 },
        { "name": "PyTorch", "requiredLevel": 4, "weight": 20 },
        { "name": "Scikit-Learn", "requiredLevel": 4, "weight": 15 },
        { "name": "NumPy", "requiredLevel": 4, "weight": 15 }
  ]
};

const TUTORIAL_BASE = 'https://www.geeksforgeeks.org/search/?q=';

let profileData = null;
let roleResults = {};

function getUserId() {
  try {
    const u = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return u?.id || null;
  } catch { return null; }
}

function scoreColor(v) {
  if (v >= 70) return '#86c44a';
  if (v >= 40) return '#f0a500';
  return '#f87171';
}

// ── score impact: how much would learning a missing skill boost the score
function computeScoreImpact(roleName, skillName, userSkills) {
  const roleSkills = ROLE_DATA[roleName];
  if (!roleSkills) return 0;
  const totalWeight = roleSkills.reduce((s, r) => s + r.weight, 0);
  const rs = roleSkills.find(r => r.name === skillName);
  if (!rs) return 0;
  // assume learning at requiredLevel exactly
  return (rs.weight / totalWeight) * 100;
}

// ── collect missing skills across all roles with their max impact
function buildLearnNext() {
  if (!profileData) return;
  const skillMap = {}; // skillName → { roles:[], maxImpact, tutorial }

  profileData.roles.forEach(roleObj => {
    const res = roleResults[roleObj.role] || {};
    const userSkillNames = roleObj.technicalSkills.map(s => s.skill.toLowerCase());
    const roleSkills = ROLE_DATA[roleObj.role] || [];

    roleSkills.forEach(rs => {
      if (!userSkillNames.includes(rs.name.toLowerCase())) {
        const impact = computeScoreImpact(roleObj.role, rs.name, roleObj.technicalSkills);
        if (!skillMap[rs.name]) {
          skillMap[rs.name] = { roles: [], maxImpact: 0, tutorial: TUTORIAL_BASE + encodeURIComponent(rs.name) };
        }
        skillMap[rs.name].roles.push(roleObj.role);
        skillMap[rs.name].maxImpact = Math.max(skillMap[rs.name].maxImpact, impact);
      }
    });

    // merge tutorial links from gapRes if available
    (res.missingSkillsWithTutorials || []).forEach(s => {
      if (skillMap[s.skill]) skillMap[s.skill].tutorial = s.tutorial;
    });
  });

  const sorted = Object.entries(skillMap)
    .sort((a, b) => b[1].maxImpact - a[1].maxImpact)
    .slice(0, 6);

  const el = document.getElementById('learn-items');
  if (!sorted.length) {
    el.innerHTML = '<div style="font-size:13px;color:var(--muted)">No missing skills — you have full coverage!</div>';
    return;
  }

  el.innerHTML = sorted.map(([skill, data]) => `
    <div class="learn-item">
      <div class="learn-item-top">
        <div class="learn-skill-name">${skill}</div>
        <div class="learn-boost">+${Math.round(data.maxImpact)}% score boost</div>
      </div>
      <div class="learn-roles">Needed for: ${data.roles.join(', ')}</div>
      <a class="learn-link" href="${data.tutorial}" target="_blank">Learn ${skill} ↗</a>
    </div>
  `).join('');
}

// ── role fit horizontal bars
function renderFitBars() {
  const el = document.getElementById('fit-bars');
  const entries = profileData.roles.map(r => ({
    role: r.role,
    score: roleResults[r.role]?.finalScore ?? null
  })).filter(e => e.score !== null).sort((a, b) => b.score - a.score);

  if (!entries.length) {
    el.innerHTML = '<div class="loading">Scoring…</div>';
    return;
  }

  el.innerHTML = entries.map(e => `
    <div class="fit-bar-row">
      <div class="fit-bar-top">
        <span class="fit-bar-label">${e.role}</span>
        <span class="fit-bar-pct" style="color:${scoreColor(e.score)}">${Math.round(e.score)}%</span>
      </div>
      <div class="fit-bar-track">
        <div class="fit-bar-fill" style="width:${Math.round(e.score)}%;background:${scoreColor(e.score)}"></div>
      </div>
    </div>
  `).join('');
}

// ── radar chart for the best-scoring role
function renderRadar() {
  const el = document.getElementById('radar-wrap');

  // find best role by finalScore
  const best = profileData.roles
    .filter(r => roleResults[r.role]?.finalScore != null)
    .sort((a, b) => roleResults[b.role].finalScore - roleResults[a.role].finalScore)[0];

  if (!best) { el.innerHTML = '<div class="loading">Calculating…</div>'; return; }

  const roleSkills = ROLE_DATA[best.role] || [];
  if (!roleSkills.length) return;

  const size = 220;
  const cx = size / 2, cy = size / 2;
  const maxR = 80;
  const n = roleSkills.length;

  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i, r) => ({
    x: cx + r * Math.sin(i * angleStep),
    y: cy - r * Math.cos(i * angleStep)
  });

  // grid rings
  let rings = '';
  [0.25, 0.5, 0.75, 1].forEach(t => {
    const pts = Array.from({ length: n }, (_, i) => getPoint(i, maxR * t));
    rings += `<polygon points="${pts.map(p => `${p.x},${p.y}`).join(' ')}"
      fill="none" stroke="rgba(168,85,247,0.15)" stroke-width="0.5"/>`;
  });

  // axes
  let axes = '';
  roleSkills.forEach((_, i) => {
    const p = getPoint(i, maxR);
    axes += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}"
      stroke="rgba(168,85,247,0.15)" stroke-width="0.5"/>`;
  });

  // user data polygon
  const userSkillMap = {};
  best.technicalSkills.forEach(s => { userSkillMap[s.skill.toLowerCase()] = s.level; });

  const dataPoints = roleSkills.map((rs, i) => {
    const userLevel = userSkillMap[rs.name.toLowerCase()] ?? 0;
    const ratio = Math.min(userLevel / 10, 1);
    return getPoint(i, maxR * ratio);
  });
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // labels
  let labels = '';
  roleSkills.forEach((rs, i) => {
    const p = getPoint(i, maxR + 16);
    const userLevel = userSkillMap[rs.name.toLowerCase()];
    const color = userLevel != null ? '#AFA9EC' : 'rgba(226,217,243,0.3)';
    labels += `<text x="${p.x}" y="${p.y}" text-anchor="middle"
      dominant-baseline="middle" font-size="9" fill="${color}"
      font-family="Inter,sans-serif">${rs.name}</text>`;
  });

  // level dots
  let dots = '';
  dataPoints.forEach(p => {
    dots += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#7F77DD"/>`;
  });

  el.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${rings}${axes}
      <polygon points="${polyPoints}"
        fill="rgba(127,119,221,0.2)" stroke="#7F77DD" stroke-width="1.5"/>
      ${dots}${labels}
    </svg>
    <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:8px">${best.role}</div>
  `;
  el.style.flexDirection = 'column';
}

// ── update candidate card stats
function updateCard() {
  const scores = Object.entries(roleResults)
    .filter(([, r]) => r.finalScore != null)
    .sort((a, b) => b[1].finalScore - a[1].finalScore);

  if (scores.length) {
    const [bestRole, bestRes] = scores[0];
    document.getElementById('card-best-role').textContent = bestRole;
    document.getElementById('stat-best').textContent = Math.round(bestRes.finalScore) + '%';
    document.getElementById('stat-best').style.color = scoreColor(bestRes.finalScore);
  }
}

async function fetchScore(userId, role) {
  const res = await fetch(`${BASE}/api/score/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error();
  return res.json();
}

async function fetchSkillGap(roleObj) {
  const res = await fetch(`${BASE}/api/skill-gap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetRole: roleObj.role,
      cgpa: roleObj.cgpa,
      technicalSkills: roleObj.technicalSkills.map(s => s.skill),
      tools: []
    })
  });
  if (!res.ok) throw new Error();
  return res.json();
}

async function loadRoleData(userId, roleObj) {
  try {
    const [scoreRes, gapRes] = await Promise.all([
      fetchScore(userId, roleObj.role),
      fetchSkillGap(roleObj)
    ]);
    roleResults[roleObj.role] = {
      finalScore: scoreRes.finalScore,
      compatibilityScore: gapRes.compatibilityScore,
      matchedSkills: gapRes.matchedSkills,
      missingSkillsWithTutorials: gapRes.missingSkillsWithTutorials,
      recommendation: gapRes.recommendation,
      cgpaStatus: gapRes.cgpaStatus
    };
  } catch {
    roleResults[roleObj.role] = roleResults[roleObj.role] || {};
  }

  // re-render all output panels after each role resolves
  updateCard();
  renderFitBars();
  renderRadar();
  buildLearnNext();
}

async function init() {
  const userId = getUserId();
  const errorBanner = document.getElementById('error-banner');

  if (!userId) {
    errorBanner.style.display = 'block';
    errorBanner.textContent = 'Not logged in — showing demo data.';
    profileData = {
      id: 'demo',
      username: 'Harshit',
      roles: [
        { role: 'Backend Developer', cgpa: 5, internshipMonths: 0,
          technicalSkills: [{ skill: 'Node.js', level: 4 }, { skill: 'Express.js', level: 3 }, { skill: 'MongoDB', level: 5 }] },
        { role: 'Frontend Developer', cgpa: 8, internshipMonths: 2,
          technicalSkills: [{ skill: 'React.js', level: 7 }, { skill: 'HTML', level: 8 }, { skill: 'CSS', level: 7 }, { skill: 'JavaScript', level: 6 }] },
      ]
    };
  } else {
    try {
      const res = await fetch(`${BASE}/api/profile/${userId}`);
      if (!res.ok) throw new Error();
      profileData = await res.json();
    } catch {
      errorBanner.style.display = 'block';
      errorBanner.textContent = 'Could not load profile. Make sure /api/profile/:id is running.';
      return;
    }
  }

  const name = profileData.username || 'User';
  const initial = name.charAt(0).toUpperCase();

  document.getElementById('nav-username').textContent = name;
  document.getElementById('nav-avatar').textContent = initial;
  document.getElementById('card-avatar').textContent = initial;
  document.getElementById('card-name').textContent = name;

  const totalSkills = profileData.roles.reduce((s, r) => s + r.technicalSkills.length, 0);
  const totalInternship = profileData.roles.reduce((s, r) => s + (r.internshipMonths || 0), 0);
  document.getElementById('stat-roles').textContent = profileData.roles.length;
  document.getElementById('stat-skills').textContent = totalSkills;
  document.getElementById('stat-internship').textContent = totalInternship;

  // fire all role requests in parallel
  profileData.roles.forEach(r => loadRoleData(profileData.id, r));
}

init();