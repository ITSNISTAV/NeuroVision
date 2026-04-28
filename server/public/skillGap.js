const currentUser = JSON.parse(sessionStorage.getItem("nv_user") || "null");
const userId = currentUser?.id || null;
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

  if (!userId) {
    box.style.display = "block";
    countBadge.textContent = "0 profiles";
    note.textContent = "Login required. Please login and save a role profile first.";
    profileOnlyMessage.innerText = "This page works only with saved profiles from profile.json.";
    return;
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
    note.textContent = `Logged in as ${currentUser?.name || currentUser?.username || "User"}.`;

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
      <div class="card-role-name">${profile.role}</div>
      <div class="card-meta">
        <span class="meta-pill">CGPA ${profile.cgpa}</span>
        <span class="meta-pill">INTERNSHIP ${profile.internshipMonths}mo</span>
        <span class="meta-pill">SKILLS ${skillList.length}</span>
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
    data.missingSkillsWithTutorials.forEach(item => {
      tutorialList.innerHTML += `<li><a href="${item.tutorial}" target="_blank" rel="noopener">Learn ${item.skill}</a></li>`;
    });
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
    // Find the saved profile for this role to get cgpa and technicalSkills
    const profileIndex = savedProfileRoles.findIndex(p => p.role === role);
    if (profileIndex === -1) {
      throw new Error("Profile not found in saved data");
    }
    
    const profile = savedProfileRoles[profileIndex];
    const technicalSkills = profile.technicalSkills ? profile.technicalSkills.map(s => s.skill) : [];
    
    const response = await fetch(`/api/skill-gap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        targetRole: role,
        cgpa: profile.cgpa,
        technicalSkills,
        tools: []
      }),
    });

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