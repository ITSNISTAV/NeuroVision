// ─── Session user ────────────────────────────────────────────────────────────

const currentUser = JSON.parse(sessionStorage.getItem("nv_user") || "null");
const userId = currentUser?.id ?? "guest";

// Populate navbar from session
const displayName = currentUser?.name || currentUser?.username || "Guest";
document.getElementById("nav-username").textContent = displayName;
document.getElementById("nav-avatar").textContent = displayName.charAt(0).toUpperCase();

// ─── Fallback sample data ─────────────────────────────────────────────────────

const PROFILES = [
  { id: 1, role: "Backend Developer",    cgpa: 5, internship: 0, skills: [{ name: "Node.js", level: 4 }] },
  { id: 2, role: "Frontend Developer",   cgpa: 1, internship: 0, skills: [{ name: "Tailwind", level: 5 }] },
  { id: 3, role: "Full Stack Developer", cgpa: 6, internship: 7, skills: [{ name: "React.js", level: 5 }] },
];

const ROLE_SKILLS = {
  "Backend Developer": [
    { name: "Node.js",            requiredLevel: 4, weight: 25 },
    { name: "Express.js",         requiredLevel: 4, weight: 20 },
    { name: "MongoDB",            requiredLevel: 3, weight: 20 },
    { name: "REST APIs",          requiredLevel: 4, weight: 15 },
    { name: "JWT Authentication", requiredLevel: 3, weight: 10 },
    { name: "Git",                requiredLevel: 3, weight: 10 },
  ],
  "Frontend Developer": [
    { name: "HTML",               requiredLevel: 4, weight: 20 },
    { name: "CSS",                requiredLevel: 4, weight: 20 },
    { name: "JavaScript",         requiredLevel: 4, weight: 25 },
    { name: "React.js",           requiredLevel: 4, weight: 20 },
    { name: "Responsive Design",  requiredLevel: 3, weight: 10 },
    { name: "Git",                requiredLevel: 3, weight:  5 },
  ],
  "Full Stack Developer": [
    { name: "HTML",       requiredLevel: 4, weight: 10 },
    { name: "CSS",        requiredLevel: 4, weight: 10 },
    { name: "JavaScript", requiredLevel: 4, weight: 15 },
    { name: "React.js",   requiredLevel: 4, weight: 15 },
    { name: "Node.js",    requiredLevel: 4, weight: 15 },
    { name: "Express.js", requiredLevel: 3, weight: 10 },
    { name: "MongoDB",    requiredLevel: 3, weight: 10 },
    { name: "REST APIs",  requiredLevel: 3, weight: 10 },
    { name: "Git",        requiredLevel: 3, weight:  5 },
  ],
};

// ─── Scoring logic ────────────────────────────────────────────────────────────

function computeScore(profile) {
  const roleSkills = ROLE_SKILLS[profile.role] || [];
  const skills = profile.technicalSkills || profile.skills || [];
  let earned = 0, total = 0;

  const breakdown = roleSkills.map(rs => {
    total += rs.weight;
    // technicalSkills use { skill, level }, fallback skills use { name, level }
    const userSkill = skills.find(s => (s.skill || s.name) === rs.name);
    const userLevel = userSkill?.level;
    // Cap skill contribution at 100% (don't exceed required level)
    const skillPercentage = userLevel !== undefined ? Math.min(userLevel / rs.requiredLevel, 1) : 0;
    earned += skillPercentage * rs.weight;
    return { ...rs, userLevel };
  });

  return { finalScore: Math.min((earned / total) * 100, 100), breakdown };
}

// ─── Load profiles from backend ───────────────────────────────────────────────

async function loadUserProfiles() {
  try {
    if (userId === "guest" || !userId) {
      console.warn("User not authenticated (userId: " + userId + "). Using sample data.");
      return [];
    }
    const res = await fetch(`/api/profile/${userId}`);
    if (res.ok) {
      const data = await res.json();
      console.log("Loaded profiles:", data);
      return data.roles || [];
    } else {
      console.error("Failed to load profiles. Status:", res.status);
    }
  } catch (err) {
    console.error("Failed to load profiles:", err);
  }
  return [];
}

// ─── Render profile cards ─────────────────────────────────────────────────────

const grid = document.getElementById("profile-grid");

loadUserProfiles().then(userProfiles => {
  const profiles = userProfiles.length > 0 ? userProfiles : PROFILES;
  document.getElementById("profile-count").textContent = `${profiles.length} profiles`;

  profiles.forEach((profile, index) => {
    const skillList = profile.technicalSkills || profile.skills || [];
    const internship = profile.internshipMonths ?? profile.internship;

    const card = document.createElement("div");
    card.className = "roleCard";
    card.id = `profile-${index}`;
    card.innerHTML = `
      <div class="card-role-name">${profile.role}</div>
      <div class="card-meta">
        <span class="meta-pill"><span class="meta-label">CGPA</span> ${profile.cgpa}</span>
        <span class="meta-pill"><span class="meta-label">INTERNSHIP</span> ${internship}mo</span>
        <span class="meta-pill"><span class="meta-label">SKILLS</span> ${skillList.length}</span>
      </div>
      <div class="card-skills-label">Technical Skills</div>
      <div class="card-skills-list">
        ${skillList.map(s => `
          <span class="card-skill-tag">${s.skill || s.name}<span class="tag-level">${s.level}</span></span>
        `).join("")}
      </div>
      <div class="cardBtns">
        <button class="card-btn btn-score" onclick="handleScore(${index})">⚡ Score</button>
      </div>
    `;
    grid.appendChild(card);
  });
});

// ─── Score handler ────────────────────────────────────────────────────────────

async function handleScore(profileIndex) {
  const userProfiles = await loadUserProfiles();
  const profile = userProfiles[profileIndex];

  if (!profile) {
    console.error("Profile not found at index:", profileIndex);
    alert("Error: Profile not found. Make sure you've saved your profile first.");
    return;
  }

  // Highlight active card
  document.querySelectorAll(".roleCard").forEach(c => c.classList.remove("active"));
  document.getElementById(`profile-${profileIndex}`).classList.add("active");

  // Show loading state on the clicked button only
  document.querySelectorAll(".btn-score").forEach(btn => {
    btn.disabled = true;
    btn.textContent = btn.closest(".roleCard").id === `profile-${profileIndex}` ? "Scoring..." : "⚡ Score";
  });

  let finalScore, breakdown, showWarning = false;

  try {
    const res = await fetch(`/api/score/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: profile.role }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("API error:", errorData);
      throw new Error(errorData.message || "API error");
    }
    
    const data = await res.json();
    finalScore = data.finalScore;
    breakdown = computeScore(profile).breakdown; // local breakdown for visual bars
    console.log("Score received from API:", finalScore);
  } catch (error) {
    console.error("Scoring error:", error);
    showWarning = true;
    const local = computeScore(profile);
    finalScore = local.finalScore;
    breakdown = local.breakdown;
    console.log("Using client-side calculation:", finalScore);
  }

  renderResult(profile, finalScore, breakdown, showWarning);

  document.querySelectorAll(".btn-score").forEach(btn => {
    btn.disabled = false;
    btn.textContent = "⚡ Score";
  });
}

// ─── Render result ────────────────────────────────────────────────────────────

function renderResult(profile, finalScore, breakdown, showWarning) {
  const resultCard = document.getElementById("result-card");
  resultCard.style.display = "block";
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });

  // Warning banner
  const warning = document.getElementById("api-warning");
  warning.style.display = showWarning ? "block" : "none";
  if (showWarning) warning.textContent = "⚠ Could not reach scoring API. Showing client-side preview.";

  // Score circle
  const circumference = 2 * Math.PI * 54; // ≈ 339.3
  const filled = (finalScore / 100) * circumference;
  const color = finalScore >= 70 ? "#a855f7" : finalScore >= 40 ? "#f59e0b" : "#ef4444";

  document.getElementById("score-arc").setAttribute("stroke-dasharray", `${filled} ${circumference}`);
  document.getElementById("score-arc").setAttribute("stroke", color);
  document.getElementById("score-text").textContent = `${Math.round(finalScore)}%`;

  // Fit label
  const fitLabel   = finalScore >= 70 ? "Strong Fit" : finalScore >= 40 ? "Partial Fit" : "Weak Fit";
  const fitColor   = finalScore >= 70 ? "#4ade80"    : finalScore >= 40 ? "#f59e0b"     : "#f87171";
  const labelEl = document.getElementById("fit-label");
  labelEl.textContent = fitLabel;
  labelEl.style.color = fitColor;
  labelEl.style.background = `${fitColor}18`;
  labelEl.style.borderColor = `${fitColor}40`;

  document.getElementById("result-role-name").textContent = profile.role;

  // Skill bars
  document.getElementById("skill-bars").innerHTML = breakdown.map(s => {
    const userFill = s.userLevel !== undefined ? Math.min((s.userLevel / 10) * 100, 100) : 0;
    const reqFill  = Math.min((s.requiredLevel / 10) * 100, 100);
    const met      = s.userLevel !== undefined && s.userLevel >= s.requiredLevel;
    const levelText = s.userLevel !== undefined ? `lvl ${s.userLevel}` : "missing";

    return `
      <div class="skill-row">
        <div class="skill-row-top">
          <span class="skill-name">${s.name}</span>
          <div class="skill-meta">
            <span class="weight-label">weight ${s.weight}</span>
            <span class="level-badge ${met ? "met" : "unmet"}">${levelText} / req ${s.requiredLevel}</span>
          </div>
        </div>
        <div class="bar-track">
          <div class="bar-req-marker" style="left:${reqFill}%"></div>
          <div class="bar-fill ${met ? "met" : "unmet"}" style="width:${userFill}%"></div>
        </div>
      </div>
    `;
  }).join("");
}