const currentUser = JSON.parse(sessionStorage.getItem("nv_user") || "null");
const DEMO_USER_ID = "skillgap-demo-user";
const userId = currentUser?.id || DEMO_USER_ID;
const isDemoMode = !currentUser?.id;
let savedProfileRoles = [];
const queryParams = new URLSearchParams(window.location.search);
const queryRole = queryParams.get("role") || "";

document.addEventListener("DOMContentLoaded", () => {
  initializeSavedProfileAnalyzer();
});

async function initializeSavedProfileAnalyzer() {
  const note = document.getElementById("savedProfileNote");
  const box = document.getElementById("savedProfileBox");
  const profileOnlyMessage = document.getElementById("profileOnlyMessage");
  const countBadge = document.getElementById("profile-count");

  if (isDemoMode) {
    profileOnlyMessage.innerText = "Demo mode active: seeded skill-gap profiles are loaded automatically.";
  }

  try {
    const response = await fetch(`/api/profile/${userId}`);
    if (!response.ok) {
      box.style.display = "block";
      note.textContent = "Could not fetch saved profiles. Please try again.";
      return;
    }

    const data = await response.json();
    savedProfileRoles = Array.isArray(data.roles) ? data.roles : [];
    countBadge.textContent = `${savedProfileRoles.length} profile${savedProfileRoles.length !== 1 ? "s" : ""}`;

    if (!savedProfileRoles.length) {
      box.style.display = "block";
      note.textContent = "No saved role profiles found. Please create one from Skills page.";
      profileOnlyMessage.innerText = "No manual input is required here. Save role data first, then come back.";
      return;
    }

    renderSavedProfileCards();

    box.style.display = "block";
    note.textContent = isDemoMode
      ? "Previewing seeded demo profiles. Login to analyze your own saved roles."
      : `Logged in as ${currentUser?.name || currentUser?.username || "User"}.`;

    // Direct flow from URL: analyze selected role if present.
    if (queryRole && savedProfileRoles.some((profile) => profile.role === queryRole)) {
      const queryIndex = savedProfileRoles.findIndex((profile) => profile.role === queryRole);
      await analyzeSavedProfile(queryRole, queryIndex);
    }
  } catch (error) {
    console.error("Unable to load saved profiles:", error);
    box.style.display = "block";
    note.textContent = "Unable to load saved profiles right now.";
  }
}

function renderSavedProfileCards() {
  const grid = document.getElementById("profile-grid");

  grid.innerHTML = "";
  savedProfileRoles.forEach((profile, index) => {
    const skillList = Array.isArray(profile.technicalSkills) ? profile.technicalSkills : [];

    const card = document.createElement("div");
    card.className = "roleCard";
    card.id = `profile-${index}`;
    card.innerHTML = `
      <div class="card-top-row">
        <div class="card-role-name">${profile.role}</div>
        <span class="profile-chip ${profile.cgpa >= 8 ? "chip-elite" : profile.cgpa >= 7 ? "chip-strong" : "chip-growth"}">
          ${profile.cgpa >= 8 ? "Elite" : profile.cgpa >= 7 ? "Strong" : "Growth"}
        </span>
      </div>
      <div class="card-meta">
        <span class="meta-pill">CGPA ${profile.cgpa}</span>
        <span class="meta-pill">INTERNSHIP ${profile.internshipMonths}mo</span>
        <span class="meta-pill">SKILLS ${skillList.length}</span>
      </div>
      <div class="card-cgpa-track">
        <span class="cgpa-label">Readiness by CGPA</span>
        <div class="cgpa-bar-bg">
          <div class="cgpa-bar-fill" style="width:${Math.max(0, Math.min(100, (Number(profile.cgpa) / 10) * 100))}%"></div>
        </div>
      </div>
      <div class="card-skills-label">Technical Skills</div>
      <div class="card-skills-list">
        ${skillList.map((skill) => `
          <span class="card-skill-tag">${skill.skill}<span class="tag-level">${skill.level}</span></span>
        `).join("")}
      </div>
      <div class="cardBtns">
        <button class="card-btn btn-score" onclick="analyzeSavedProfile('${profile.role.replace(/'/g, "\\'")}', ${index})">Analyze Skill Gap</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

function resetForm() {
  document.querySelectorAll(".roleCard").forEach((card) => card.classList.remove("active"));
  document.getElementById("result").style.display = "none";
  console.log('✅ View reset');
}

function buildResultFromSkillGapApi(data) {
  // skillGapController already returns properly formatted data
  return {
    targetRole: data.targetRole,
    cgpa: data.cgpa,
    cgpaStatus: data.cgpaStatus,
    compatibilityScore: data.compatibilityScore,
    matchedSkills: data.matchedSkills,
    missingSkills: data.missingSkills,
    missingSkillsWithTutorials: data.missingSkillsWithTutorials,
    recommendation: data.recommendation,
  };
}

function renderResults(data) {
  document.getElementById("result").style.display = "block";
  document.getElementById("roleTitle").innerText = data.targetRole;
  document.getElementById("scoreText").innerText = data.compatibilityScore + "%";
  document.getElementById("progressBar").style.width = data.compatibilityScore + "%";
  document.getElementById("cgpaInfo").innerText = `CGPA: ${data.cgpa} - ${data.cgpaStatus}`;
  document.getElementById("recommendation").innerText = `Tip: ${data.recommendation}`;

  const matched = document.getElementById("matched");
  const missing = document.getElementById("missing");
  const tutorialList = document.getElementById("tutorialList");

  matched.innerHTML = "";
  missing.innerHTML = "";
  tutorialList.innerHTML = "";

  data.matchedSkills.forEach(skill => {
    matched.innerHTML += `<li class="skill-matched">✓ ${skill}</li>`;
  });

  data.missingSkills.forEach(skill => {
    missing.innerHTML += `<li class="skill-missing">✗ ${skill}</li>`;
  });

  if (data.missingSkillsWithTutorials && data.missingSkillsWithTutorials.length > 0) {
    const tutorialData = data.missingSkillsWithTutorials;

    const renderTutorialDetail = (item) => {
      const safeReviews = Array.isArray(item.reviews) ? item.reviews.slice(0, 2) : [];
      const safePrerequisites = Array.isArray(item.prerequisites) ? item.prerequisites.slice(0, 2) : [];
      const safePath = Array.isArray(item.learningPath) ? item.learningPath.slice(0, 3) : [];
      const reviewBlocks = safeReviews.length
        ? safeReviews.map(r => `<li>${r.reviewer}: ${r.rating}/5 - ${r.comment}</li>`).join("")
        : "<li>No reviews yet</li>";
      const prereqBlocks = safePrerequisites.length
        ? safePrerequisites.map(p => `<li>${p}</li>`).join("")
        : "<li>Not required</li>";
      const pathBlocks = safePath.length
        ? safePath.map(step => `<li>${step}</li>`).join("")
        : "<li>Self-paced</li>";

      return `
        <div class="tutorial-card dynamic-open-card">
          <div class="tutorial-head">
            <a class="tutorial-title" href="${item.tutorial}" target="_blank" rel="noopener">Learn ${item.skill}</a>
            <span class="tutorial-rating">⭐ ${item.averageRating ?? "N/A"}</span>
          </div>
          <p class="tutorial-desc">${item.description || "Curated learning material."}</p>
          <div class="tutorial-meta-row">
            <span class="tutorial-pill">⏱ ${item.averageCompletionTime || "3-5 hours"}</span>
            <span class="tutorial-pill">🧭 ${item.difficulty || "Beginner"}</span>
            <span class="tutorial-pill">🗣 ${safeReviews.length} reviews</span>
          </div>
          <div class="tutorial-block-grid">
            <div class="tutorial-block">
              <div class="tutorial-block-title">Prerequisites</div>
              <ul>${prereqBlocks}</ul>
            </div>
            <div class="tutorial-block">
              <div class="tutorial-block-title">Learning Path</div>
              <ul>${pathBlocks}</ul>
            </div>
            <div class="tutorial-block tutorial-block-wide">
              <div class="tutorial-block-title">Top Reviews</div>
              <ul>${reviewBlocks}</ul>
            </div>
          </div>
        </div>
      `;
    };

    const tabs = tutorialData
      .map((item, index) => `
        <button class="tutorial-skill-btn ${index === 0 ? "active" : ""}" data-index="${index}" type="button">
          ${item.skill}
        </button>
      `)
      .join("");

    tutorialList.innerHTML = `
      <div class="tutorial-skill-strip">${tabs}</div>
      <div id="tutorialDetailCard"></div>
    `;

    const detailCard = document.getElementById("tutorialDetailCard");
    detailCard.innerHTML = renderTutorialDetail(tutorialData[0]);

    tutorialList.querySelectorAll(".tutorial-skill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = Number(btn.getAttribute("data-index"));
        tutorialList.querySelectorAll(".tutorial-skill-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        detailCard.innerHTML = renderTutorialDetail(tutorialData[index]);
      });
    });
  } else {
    tutorialList.innerHTML = `<div class="tutorial-card tutorial-empty">No tutorial recommendations found.</div>`;
  }

  window.currentResults = data;
}

async function analyzeSavedProfile(selectedRole, cardIndex = -1) {
  if (!userId) {
    alert("Please login first.");
    return;
  }

  const role = selectedRole;
  if (!role) {
    alert("Please select a saved role profile.");
    return;
  }

  document.querySelectorAll(".roleCard").forEach((card) => card.classList.remove("active"));
  if (cardIndex >= 0) {
    const activeCard = document.getElementById(`profile-${cardIndex}`);
    if (activeCard) activeCard.classList.add("active");
  }

  const note = document.getElementById("savedProfileNote");
  note.textContent = `Analyzing saved profile for ${role}...`;

  try {
    const profileIndex = savedProfileRoles.findIndex(p => p.role === role);
    if (profileIndex === -1) {
      throw new Error("Profile not found in saved data");
    }

    const response = await fetch(`/api/skill-gap/${encodeURIComponent(userId)}?role=${encodeURIComponent(role)}`);

    if (!response.ok) {
      throw new Error(`Unable to analyze saved profile (${response.status})`);
    }

    const data = await response.json();
    const transformed = buildResultFromSkillGapApi(data);
    renderResults(transformed);
    note.textContent = `Showing analysis for ${role}.`;
  } catch (error) {
    console.error("Saved profile analysis failed:", error);
    alert("Could not analyze saved profile. Please try again.");
  }
}

function downloadResults() {
  if (!window.currentResults) {
    alert('Please analyze your skills first!');
    return;
  }

  const data = window.currentResults;
  
  const report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        SKILL GAP ANALYSIS REPORT
                            NeuroVision © 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ANALYSIS RESULTS
─────────────────────────────────────────────────────────────────────────────

🎯 TARGET ROLE: ${data.targetRole}
📈 SKILL MATCH: ${data.compatibilityScore}%
🎓 CGPA: ${data.cgpa}/10 (${data.cgpaStatus})
⏰ Generated: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RECOMMENDATION:
${data.recommendation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SKILLS MATCHED (${data.matchedSkills.length}):
${data.matchedSkills.map(s => `   ✓ ${s}`).join('\n')}

⚠️ MISSING SKILLS (${data.missingSkills.length}):
${data.missingSkills.map(s => `   ✗ ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 LEARNING RESOURCES:
${data.missingSkillsWithTutorials.map(item => `   🔗 ${item.skill}: ${item.tutorial}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
1. Focus on learning your top 3 missing skills
2. Build projects to demonstrate your expertise
3. Gain practical experience through internships
4. Re-evaluate your skills quarterly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            For more info, visit: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;

  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
  element.setAttribute('download', `NeuroVision_SkillGap_${data.targetRole.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  console.log('✅ Report downloaded successfully');
}

function shareResults() {
  if (!window.currentResults) {
    alert('Please analyze your skills first!');
    return;
  }

  const data = window.currentResults;
  const shareText = `🎯 I analyzed my skills for ${data.targetRole}!\n\n📈 Skill Match: ${data.compatibilityScore}%\n🎓 CGPA: ${data.cgpa}/10\n\n💡 "${data.recommendation.substring(0, 100)}..."\n\n✨ Powered by NeuroVision - Career Intelligence Platform`;
  
  if (navigator.share) {
    navigator.share({
      title: 'NeuroVision Skill Gap Analysis',
      text: shareText,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err));
  } else {
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      alert('✅ Results copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Share text: ' + shareText);
    });
  }
}