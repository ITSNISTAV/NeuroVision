// ─── Session user ──────────────────────────────────────────────
const currentUser = JSON.parse(sessionStorage.getItem("nv_user") || "null");
if (!currentUser) {
  window.location.href = "/login.html";
}
const userId = currentUser._id || currentUser.id;   // both possible
const userName = currentUser.name || "Guest";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl   = document.getElementById("nav-username");
  if (nameEl) nameEl.textContent = userName;

  const initial = userName.charAt(0).toUpperCase();
  let pic = null;
  if (currentUser && currentUser.profilePic) pic = currentUser.profilePic;

  const navAvatar = document.getElementById('nav-avatar');
  const navProfilePic = document.getElementById('nav-profile-pic');
  if (pic && navProfilePic) {
    if (navAvatar) navAvatar.style.display = 'none';
    navProfilePic.style.display = 'block';
    navProfilePic.src = pic;
  } else if (navAvatar) {
    navAvatar.textContent = initial;
  }
});

async function uploadAvatarFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!userId || userId === 'guest') {
    alert("Please login first to change your avatar.");
    return;
  }

  const formData = new FormData();
  formData.append("avatar", file);
  formData.append("userId", userId);

  try {
    const res = await fetch("/api/auth/upload-avatar", {
      method: "POST",
      body: formData
    });
    if (!res) {
      throw new Error("No response from server");
    }
    const data = await res.json();
    if (res.ok) {
      if (data.user) {
        sessionStorage.setItem("nv_user", JSON.stringify(data.user));
        location.reload();
      } else {
        alert("Invalid response from server");
      }
    } else {
      alert(data.error || "Failed to upload avatar");
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("An error occurred during upload.");
  }
}

// ─── Fallback role skills (as per your new schema) ────────────
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

// Cache for role skills fetched from backend
const roleSkillsCache = new Map();

async function fetchRoleSkills(roleName) {
  if (roleSkillsCache.has(roleName)) return roleSkillsCache.get(roleName);
  try {
    const res = await fetch(`/api/roles/${encodeURIComponent(roleName)}`);
    if (res && res.ok) {
      const data = await res.json();
      if (data.skills && Array.isArray(data.skills)) {
        const skills = data.skills.map(s => ({ name: s.name, requiredLevel: s.requiredLevel, weight: s.weight }));
        roleSkillsCache.set(roleName, skills);
        return skills;
      }
    }
    throw new Error("Backend endpoint failed or role not found");
  } catch (err) {
    console.warn(`Failed to fetch skills for role ${roleName}:`, err);
    const fallback = FALLBACK_ROLE_SKILLS[roleName] || [];
    roleSkillsCache.set(roleName, fallback);
    return fallback;
  }
}

// Weighted score calculation (user level 1-10 → requiredLevel 1-5)
function computeScore(profile, roleSkills) {
  const userSkills = profile.technicalSkills || [];
  let totalWeight = 0, earnedWeight = 0;
  const breakdown = [];

  for (const rs of roleSkills) {
    const userSkill = userSkills.find(us => us.skill === rs.name);
    let userLevelNorm = 0;
    if (userSkill && userSkill.level) {
      userLevelNorm = userSkill.level;
    }
    const contribution = userLevelNorm >= rs.requiredLevel ? 1 : Math.max(0, userLevelNorm / rs.requiredLevel);
    totalWeight += rs.weight;
    earnedWeight += contribution * rs.weight;
    breakdown.push({
      name: rs.name,
      requiredLevel: rs.requiredLevel,
      userLevel: userSkill?.level || null,
      userLevelNorm,
      weight: rs.weight,
      contribution,
    });
  }
  const finalScore = totalWeight === 0 ? 0 : (earnedWeight / totalWeight) * 100;
  return { finalScore, breakdown };
}

function getScoreLevel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Intermediate";
  if (score >= 30) return "Basic";
  return "Weak";
}

function convertLocalScoreToApiShape(profile, local) {
  const finalScore = Math.round(local.finalScore * 10) / 10;

  const skillBreakdown = local.breakdown.map(skill => {
    const isMissing = skill.userLevel === null;
    const isMatched = !isMissing && skill.userLevelNorm >= skill.requiredLevel;

    return {
      skill: skill.name,
      status: isMissing ? "missing" : isMatched ? "matched" : "needs_improvement",
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
    };
  });

  const matchedSkills = skillBreakdown
    .filter(s => s.status === "matched" || s.status === "needs_improvement")
    .map(s => s.skill);

  const missingSkills = skillBreakdown
    .filter(s => s.status === "missing")
    .map(s => s.skill);

  const earnedScore = skillBreakdown.reduce((sum, s) => sum + s.earned, 0);
  const totalWeight = skillBreakdown.reduce((sum, s) => sum + s.max, 0);

  return {
    message: "success",
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
  };
}

// ─── Load user profiles from backend ───────────────────────────
async function loadUserProfiles() {
  try {
    const res = await fetch(`/api/profile/${userId}`);
    if (res.ok) {
      const data = await res.json();
      return data.roles || [];
    }
  } catch (err) {
    console.error("Failed to load profiles:", err);
  }
  return [];
}

// ─── Render profile cards (using .roleCard, same as skills page) ──
const container = document.getElementById("rolesDisplay");
const emptyState = document.getElementById("emptyState");
const countBadge = document.getElementById("roleCount");
if (!container || !emptyState || !countBadge) {
  console.error("Required DOM elements not found. Please ensure rolesDisplay, emptyState, and roleCount elements exist in HTML.");
}
async function renderProfiles() {
  if (!container || !emptyState || !countBadge) {
    console.error("Required DOM elements not found.");
    return;
  }
  const profiles = await loadUserProfiles();
  if (!profiles.length) {
    emptyState.classList.add("visible");
    countBadge.textContent = "0 profiles";
    container.innerHTML = "";
    return;
  }
  emptyState.classList.remove("visible");
  countBadge.textContent = `${profiles.length} profile${profiles.length !== 1 ? "s" : ""}`;
  container.innerHTML = "";

  for (let idx = 0; idx < profiles.length; idx++) {
    const p = profiles[idx];
    const skillsList = p.technicalSkills || [];
    const internship = p.internshipMonths ?? 0;

    const card = document.createElement("div");
    card.className = "roleCard";
    card.id = `role-${idx}`;
    card.innerHTML = `
      <div class="card-role-name">${p.role}</div>
      <div class="card-meta">
        <div class="meta-pill"><span class="meta-label">CGPA</span>&nbsp;${p.cgpa}</div>
        <div class="meta-pill"><span class="meta-label">Internship</span>&nbsp;${internship} mo</div>
        <div class="meta-pill"><span class="meta-label">Skills</span>&nbsp;${skillsList.length}</div>
      </div>
      <div class="card-skills-label">Technical Skills</div>
      <div class="card-skills-list">
        ${skillsList.map(s => `<span class="card-skill-tag">${s.skill}<span class="tag-level">${s.level}</span></span>`).join("")}
      </div>
      <div class="cardBtns">
        <button class="card-btn btn-score" data-index="${idx}">⚡ Score</button>
      </div>
    `;
    container.appendChild(card);
  }

  // Attach score button listeners
  document.querySelectorAll(".btn-score").forEach(btn => {
    btn.removeEventListener("click", scoreHandler);
    btn.addEventListener("click", scoreHandler);
  });
}

async function scoreHandler(e) {
  const btn = e.currentTarget;
  const idx = parseInt(btn.getAttribute("data-index"), 10);
  const profiles = await loadUserProfiles();
  const profile = profiles[idx];
  if (!profile || !profile.role) {
    console.error("Invalid profile data");
    alert("Unable to load profile data.");
    return;
  }

  // Highlight active card
  document.querySelectorAll(".roleCard").forEach(c => c.classList.remove("active"));
  const activeCard = document.getElementById(`role-${idx}`);
  if (activeCard) activeCard.classList.add("active");

  // Disable all score buttons
  document.querySelectorAll(".btn-score").forEach(b => {
    b.disabled = true;
    b.textContent = b === btn ? "Scoring..." : "⚡ Score";
  });

  let scoreData = null;
  let showWarning = false;

  try {
    const res = await fetch(`/api/score/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role: profile.role })
    });

    if (!res.ok) {
      throw new Error("Score API failed");
    }

    scoreData = await res.json();

  } catch (err) {
    console.warn("Score API unavailable. Using client preview:", err);
    showWarning = true;

    const roleSkills = await fetchRoleSkills(profile.role);
    const local = computeScore(profile, roleSkills);

    scoreData = convertLocalScoreToApiShape(profile, local);
  }

  renderResult(profile, scoreData, showWarning);

  // Re-enable buttons
  document.querySelectorAll(".btn-score").forEach(b => {
    b.disabled = false;
    b.textContent = "⚡ Score";
  });
}

function renderResult(profile, scoreData, showWarning) {
  if (!profile || !scoreData) {
    console.error("Invalid profile or scoreData");
    return;
  }
  const resultCard = document.getElementById("resultCard");
  if (!resultCard) {
    console.error("Result card element not found in DOM");
    return;
  }
  resultCard.style.display = "block";
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });

  const finalScore = Number(scoreData.finalScore || 0);
  const level = scoreData.level || getScoreLevel(finalScore);
  const skillBreakdown = scoreData.skillBreakdown || [];

  const warningEl = document.getElementById("apiWarning");
  warningEl.style.display = showWarning ? "block" : "none";
  if (showWarning) {
    warningEl.textContent = "⚠ Could not reach scoring API. Showing client-side preview.";
  }

  // renderScoreCircle(finalScore, level, scoreData.role || profile.role);
  renderScoreCircle(
  finalScore,
  level,
  scoreData.role || profile.role,
  scoreData.selectedStack || profile.selectedStack
);
  renderScoreSummary(scoreData);
  renderWhyScore(scoreData);
  renderMatchedMissingSkills(scoreData);
  renderSkillBars(skillBreakdown);
  renderProjectQuality(scoreData.projectQuality);
  renderRealityGap(scoreData.realityGap);
  renderImprovementPriorities(scoreData.improvementPriorities);
  renderRoadmap(scoreData.roadmap);
}

function renderRoadmap(roadmap = []) {
  const container = document.getElementById("roadmapList");
  if (!container) return;

  if (!roadmap.length) {
    container.innerHTML = `<div class="warning-banner">No roadmap generated yet.</div>`;
    return;
  }

  container.innerHTML = roadmap.map(phase => `
    <div class="roadmap-card">
      <div class="roadmap-phase">PHASE ${phase.phase}</div>
      <div class="roadmap-title">${phase.title}</div>
      <div class="roadmap-meta">Duration: ${phase.duration}</div>
      <div class="roadmap-goal">${phase.goal}</div>

      <div class="roadmap-tasks">
        ${phase.tasks.map(task => `
          <div class="roadmap-task">✓ ${task}</div>
        `).join("")}
      </div>

      <div class="roadmap-output">
        Output: ${phase.output}
      </div>
    </div>
  `).join("");
}

function renderImprovementPriorities(priorities = []) {

  const nextActionEl = document.getElementById("nextBestAction");
  const gridEl = document.getElementById("priorityGrid");

  if (!nextActionEl || !gridEl) return;

  if (!priorities.length) {
    nextActionEl.innerHTML = `
      <div class="next-action-heading">
        No improvement priorities detected.
      </div>
    `;

    gridEl.innerHTML = "";
    return;
  }

  const best = priorities[0];

  nextActionEl.innerHTML = `
    <div class="next-action-title">
      NEXT BEST ACTION
    </div>

    <div class="next-action-heading">
      ${best.title}
    </div>

    <div class="next-action-text">
      ${best.action}
    </div>

    <div class="next-action-meta">
      <div class="next-action-chip">
        Impact: ${best.impact}
      </div>

      <div class="next-action-chip">
        Time: ${best.estimatedTime}
      </div>

      <div class="next-action-chip">
        ${best.category}
      </div>
    </div>
  `;

  gridEl.innerHTML = priorities.map((item, index) => {

    const impactClass =
      item.impact === "Very High" || item.impact === "High"
        ? "high"
        : item.impact === "Medium"
          ? "medium"
          : "low";

    return `
      <div class="priority-card">

        <div class="priority-rank">
          PRIORITY ${index + 1}
        </div>

        <div class="priority-name">
          ${item.title}
        </div>

        <div class="priority-impact ${impactClass}">
          ${item.impact} Impact
        </div>

        <div class="priority-action">
          ${item.action}
        </div>

        <div class="priority-fixes">
          ${item.fixes.map(fix => `
            <div class="fix-chip">
              ${fix}
            </div>
          `).join("")}
        </div>

      </div>
    `;
  }).join("");
}
function renderRealityGap(realityGap) {
  const container = document.getElementById("realityGapList");
  if (!container) return;

  const gaps = realityGap?.length ? realityGap : [{
    type: "No Data",
    severity: "Low",
    message: "No reality gap data available yet."
  }];

  container.innerHTML = gaps.map(gap => {
    const severityClass = String(gap.severity || "Low").toLowerCase();

    return `
      <div class="gap-card">
        <div class="gap-top">
          <div class="gap-title">${gap.type}</div>
          <div class="severity-badge ${severityClass}">${gap.severity}</div>
        </div>
        <div class="gap-message">${gap.message}</div>
      </div>
    `;
  }).join("");
}

function renderProjectQuality(projectQuality) {
  const quality = projectQuality || {
    overallScore: 0,
    level: "No Evidence",
    strengths: [],
    weaknesses: ["No project evidence found."]
  };

  const score = Number(quality.overallScore || 0);

  document.getElementById("projectQualityScore").textContent = score;
  document.getElementById("projectQualityLevel").textContent = quality.level || "No Evidence";

  const strengthsEl = document.getElementById("projectStrengths");
  const weaknessesEl = document.getElementById("projectWeaknesses");

  strengthsEl.innerHTML = quality.strengths?.length
    ? quality.strengths.slice(0, 5).map(s => `<div class="evidence-item good">✓ ${s}</div>`).join("")
    : `<div class="evidence-item">No project strengths detected yet.</div>`;

  weaknessesEl.innerHTML = quality.weaknesses?.length
    ? quality.weaknesses.slice(0, 5).map(w => `<div class="evidence-item bad">✕ ${w}</div>`).join("")
    : `<div class="evidence-item good">No major project weaknesses detected.</div>`;
}

function renderScoreCircle(finalScore, level, roleName, selectedStack) {
  const circumference = 2 * Math.PI * 54;
  const filled = (finalScore / 100) * circumference;

  const stackEl = document.getElementById("resultStackName");
  if (stackEl) {
    stackEl.textContent = selectedStack || "Stack not selected";
  }

  const color =
    finalScore >= 70 ? "#a855f7" :
    finalScore >= 40 ? "#f59e0b" :
    "#ef4444";

  const arc = document.getElementById("scoreArc");
  arc.setAttribute("stroke-dasharray", `${filled} ${circumference}`);
  arc.setAttribute("stroke", color);

  document.getElementById("scoreText").textContent = `${Math.round(finalScore)}%`;

  const fitLabelText =
    finalScore >= 70 ? "Strong Fit" :
    finalScore >= 40 ? "Partial Fit" :
    "Weak Fit";

  const fitColor =
    finalScore >= 70 ? "#4ade80" :
    finalScore >= 40 ? "#f59e0b" :
    "#f87171";

  const fitLabel = document.getElementById("fitLabel");
  fitLabel.textContent = `${fitLabelText} · ${level}`;
  fitLabel.style.color = fitColor;
  fitLabel.style.background = `${fitColor}18`;
  fitLabel.style.borderColor = `${fitColor}40`;

  document.getElementById("resultRoleName").textContent = roleName;
}

function renderScoreSummary(scoreData) {
  const summary = scoreData.scoreSummary || {};

  const matched = summary.matchedSkillsCount || 0;
  const missing = summary.missingSkillsCount || 0;
  const total = summary.totalRequiredSkills || 0;
  const earned = summary.earnedScore || 0;
  const totalWeight = summary.totalWeight || 0;

  const container = document.getElementById("scoreSummaryGrid");

  container.innerHTML = `
    <div class="summary-card">
      <div class="summary-label">Earned Weight</div>
      <div class="summary-value">${earned}</div>
      <div class="summary-sub">out of ${totalWeight}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">Matched Skills</div>
      <div class="summary-value">${matched}</div>
      <div class="summary-sub">out of ${total}</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">Missing Skills</div>
      <div class="summary-value">${missing}</div>
      <div class="summary-sub">need improvement</div>
    </div>

    <div class="summary-card">
      <div class="summary-label">Role Level</div>
      <div class="summary-value">${scoreData.level || "—"}</div>
      <div class="summary-sub">current fit</div>
    </div>
  `;
}

function renderWhyScore(scoreData) {
  const finalScore = Number(scoreData.finalScore || 0);
  const summary = scoreData.scoreSummary || {};
  const missingSkills = scoreData.missingSkills || [];

  let reason = "";

  if (finalScore >= 70) {
    reason = `
      <strong>Why this score?</strong><br>
      Your profile has strong alignment with the selected role.
      You matched ${summary.matchedSkillsCount || 0} out of ${summary.totalRequiredSkills || 0}
      required skills. Focus now on improving depth, projects, and deployment proof.
    `;
  } else if (finalScore >= 40) {
    reason = `
      <strong>Why this score?</strong><br>
      Your profile partially matches the selected role, but some important skills are missing
      or below the required level. Missing skills include:
      ${missingSkills.slice(0, 4).join(", ") || "role-specific skills"}.
    `;
  } else {
    reason = `
      <strong>Why this score?</strong><br>
      Your current profile has weak alignment with the selected role.
      Most required skills are either missing or below the required level.
      Start by fixing the must-have skills first:
      ${missingSkills.slice(0, 4).join(", ") || "core role skills"}.
    `;
  }

  document.getElementById("whyScoreBox").innerHTML = reason;
}

function renderMatchedMissingSkills(scoreData) {
  const matchedSkills = scoreData.matchedSkills || [];
  const missingSkills = scoreData.missingSkills || [];

  document.getElementById("matchedCount").textContent = matchedSkills.length;
  document.getElementById("missingCount").textContent = missingSkills.length;

  const matchedEl = document.getElementById("matchedSkillsList");
  const missingEl = document.getElementById("missingSkillsList");

  matchedEl.innerHTML = matchedSkills.length
    ? matchedSkills.map(skill => `<span class="analysis-tag good">✓ ${skill}</span>`).join("")
    : `<span class="analysis-tag">No matched skills yet</span>`;

  missingEl.innerHTML = missingSkills.length
    ? missingSkills.map(skill => `<span class="analysis-tag bad">✕ ${skill}</span>`).join("")
    : `<span class="analysis-tag good">No major missing skills</span>`;
}

function renderSkillBars(skillBreakdown) {
  const barsContainer = document.getElementById("skillBars");

  if (!skillBreakdown.length) {
    barsContainer.innerHTML = `
      <div class="warning-banner">
        No skill breakdown available for this role.
      </div>
    `;
    return;
  }

  barsContainer.innerHTML = skillBreakdown.map(skill => {
    const userLevel = Number(skill.userLevel || 0);
    const reqLevel = Number(skill.requiredLevel || 0);

    const userFillPercent = userLevel ? Math.min((userLevel / 5) * 100, 100) : 0;
    const reqMarkerPercent = reqLevel ? Math.min((reqLevel / 5) * 100, 100) : 0;

    const status = skill.status || "missing";

    const badgeClass =
      status === "matched" ? "met" :
      status === "needs_improvement" ? "partial" :
      "unmet";

    const fillClass =
      status === "matched" ? "met" :
      status === "needs_improvement" ? "partial" :
      "unmet";

    const levelText =
      status === "missing"
        ? "missing"
        : `lvl ${userLevel}`;

    return `
      <div class="skill-row">
        <div class="skill-row-top">
          <span class="skill-name">${skill.skill}</span>
          <div class="skill-meta">
            <span class="weight-label">${skill.earned}/${skill.max} pts</span>
            <span class="level-badge ${badgeClass}">
              ${levelText} / req ${reqLevel}
            </span>
          </div>
        </div>

        <div class="bar-track">
          <div class="bar-req-marker" style="left:${reqMarkerPercent}%"></div>
          <div class="bar-fill ${fillClass}" style="width:${userFillPercent}%"></div>
        </div>

        <div class="skill-message">${skill.message || ""}</div>
      </div>
    `;
  }).join("");
}

function logout() {
  sessionStorage.removeItem("nv_user");
  window.location.href = "/login.html";
}

// Initial load
renderProfiles();

// Small helper to show toast if needed (optional)
function showToast(msg, type) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type || 'info'}`;
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#4ade80' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
    max-width: 300px;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}