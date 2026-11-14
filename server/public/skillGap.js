// ─── Session user ──────────────────────────────────────────────
const currentUser = JSON.parse(sessionStorage.getItem("nv_user") || "null");
const userId = currentUser?._id || null;   // ✅ use _id, not id
let savedProfileRoles = [];
const queryParams = new URLSearchParams(window.location.search);
const queryRole = queryParams.get("role") || "";

document.addEventListener("DOMContentLoaded", () => {
  initializeSavedProfileAnalyzer();
  initNavbar();
});

function initNavbar() {
  const nameEl   = document.getElementById("nav-username");
  const userName = currentUser ? currentUser.name || currentUser.username : "Guest";
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
}

function logout() {
  sessionStorage.removeItem("nv_user");
  window.location.href = "/login.html";
}

async function uploadAvatarFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!userId) {
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
    const data = await res.json();
    if (res.ok) {
      sessionStorage.setItem("nv_user", JSON.stringify(data.user));
      location.reload();
    } else {
      alert(data.error || "Failed to upload avatar");
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("An error occurred during upload.");
  }
}

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
  if (!grid) return;

  grid.innerHTML = "";
  savedProfileRoles.forEach((profile, index) => {
    const skillList = Array.isArray(profile.technicalSkills) ? profile.technicalSkills : [];

    const card = document.createElement("div");
    card.className = "roleCard";
    card.id = `profile-${index}`;
    card.innerHTML = `
      <div class="card-role-name">${escapeHtml(profile.role)}</div>
      <div class="card-meta">
        <span class="meta-pill">CGPA ${profile.cgpa}</span>
        <span class="meta-pill">INTERNSHIP ${profile.internshipMonths}mo</span>
        <span class="meta-pill">SKILLS ${skillList.length}</span>
      </div>
      <div class="card-skills-label">Technical Skills</div>
      <div class="card-skills-list">
        ${skillList.map((skill) => `
          <span class="card-skill-tag">${escapeHtml(skill.skill)}<span class="tag-level">${skill.level}</span></span>
        `).join("")}
      </div>
      <div class="cardBtns">
        <button class="card-btn btn-score" onclick="analyzeSavedProfile('${escapeHtml(profile.role).replace(/'/g, "\\'")}', ${index})">Analyze Skill Gap</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Helper to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

function resetForm() {
  document.querySelectorAll(".roleCard").forEach((card) => card.classList.remove("active"));
  const resultDiv = document.getElementById("result");
  if (resultDiv) resultDiv.style.display = "none";
  console.log('✅ View reset');
}

// ─── New: use backend skill‑gap API with userId and role ──────
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

  // Highlight active card
  document.querySelectorAll(".roleCard").forEach((card) => card.classList.remove("active"));
  if (cardIndex >= 0) {
    const activeCard = document.getElementById(`profile-${cardIndex}`);
    if (activeCard) activeCard.classList.add("active");
  }

  const note = document.getElementById("savedProfileNote");
  note.textContent = `Analyzing saved profile for ${role}...`;

  try {
    // ✅ CALL NEW ENDPOINT: GET /api/skill-gap/:userId/:targetRole
    const response = await fetch(`/api/skill-gap/${userId}/${encodeURIComponent(role)}`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    // data structure from backend: targetRole, cgpa, cgpaStatus, compatibilityScore,
    // matchedSkills, missingSkills, missingSkillsWithTutorials, recommendation
    renderResults(data);
    note.textContent = `Showing analysis for ${role}.`;
  } catch (error) {
    console.error("Saved profile analysis failed:", error);
    alert(`Could not analyze saved profile: ${error.message}`);
    note.textContent = `Analysis failed for ${role}. Please try again.`;
  }
}

function renderResults(data) {
  const resultDiv = document.getElementById("result");
  if (resultDiv) resultDiv.style.display = "block";

  // Update UI elements (make sure your HTML has these ids)
  const roleTitle = document.getElementById("roleTitle");
  if (roleTitle) roleTitle.innerText = data.targetRole;

  const scoreText = document.getElementById("scoreText");
  if (scoreText) scoreText.innerText = data.compatibilityScore + "%";

  const progressBar = document.getElementById("progressBar");
  if (progressBar) progressBar.style.width = data.compatibilityScore + "%";

  const cgpaInfo = document.getElementById("cgpaInfo");
  if (cgpaInfo) cgpaInfo.innerText = `CGPA: ${data.cgpa} - ${data.cgpaStatus}`;

  const recommendation = document.getElementById("recommendation");
  if (recommendation) recommendation.innerText = `Tip: ${data.recommendation}`;

  const matchedList = document.getElementById("matched");
  const missingList = document.getElementById("missing");
  const tutorialPills = document.getElementById("tutorialPills");
  const detailCard = document.getElementById("tutorialDetailCard");

  if (matchedList) {
    matchedList.innerHTML = "";
    data.matchedSkills.forEach(skill => {
      matchedList.innerHTML += `<li class="skill-matched">✓ ${escapeHtml(skill)}</li>`;
    });
  }

  if (missingList) {
    missingList.innerHTML = "";
    data.missingSkills.forEach(skill => {
      missingList.innerHTML += `<li class="skill-missing">✗ ${escapeHtml(skill)}</li>`;
    });
  }

  if (tutorialPills && data.missingSkillsWithTutorials) {
    tutorialPills.innerHTML = "";
    if (detailCard) detailCard.style.display = "none";

    data.missingSkillsWithTutorials.forEach((item, index) => {
      const pill = document.createElement("button");
      pill.className = "tutorial-pill";
      pill.innerText = item.skill.toUpperCase();
      pill.onclick = () => {
        document.querySelectorAll(".tutorial-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        showTutorialDetail(item);
      };
      tutorialPills.appendChild(pill);
    });

    if (data.missingSkillsWithTutorials.length > 0) {
      const firstPill = tutorialPills.firstChild;
      if (firstPill) firstPill.click();
    }
  }

  // Store data for download/share
  window.currentResults = data;
}

function showTutorialDetail(item) {
  const detailCard = document.getElementById("tutorialDetailCard");
  if (!detailCard) return;

  if (!item.description) {
    detailCard.innerHTML = `
      <div class="tutorial-card-header">
        <div class="tutorial-card-title">Learn ${escapeHtml(item.skill)}</div>
      </div>
      <a href="${escapeHtml(item.tutorial)}" target="_blank" class="tutorial-link-btn">Go to tutorial ↗</a>
    `;
    detailCard.style.display = "block";
    return;
  }

  const reviewsHtml = item.reviews ? item.reviews.map(r => `
    <div class="review-item">
      <strong>${escapeHtml(r.reviewer)}: ${r.rating}/5</strong> - ${escapeHtml(r.comment)}
    </div>
  `).join('') : '';

  const prerequisitesHtml = item.prerequisites ? item.prerequisites.map(p => `
    <div class="prereq-item">${escapeHtml(p)}</div>
  `).join('') : '';

  const learningPathHtml = item.learningPath ? item.learningPath.map(p => `
    <div class="path-item">${escapeHtml(p)}</div>
  `).join('') : '';

  detailCard.innerHTML = `
    <div class="tutorial-card-header">
      <div class="tutorial-card-title">Learn ${escapeHtml(item.skill)} <span class="tutorial-rating">⭐ ${item.reviews ? item.reviews[0]?.rating || 4.5 : 4.5}</span></div>
    </div>
    <p class="tutorial-desc">${escapeHtml(item.description)}</p>
    <div class="tutorial-badges">
      <span class="badge-time">⏱ ${escapeHtml(item.averageCompletionTime)}</span>
      <span class="badge-diff">🎓 ${escapeHtml(item.difficulty)}</span>
      ${item.reviews ? `<span class="badge-reviews">💬 ${item.reviews.length} reviews</span>` : ''}
    </div>
    
    <div class="tutorial-grid">
      <div class="tutorial-box">
        <div class="box-title">PREREQUISITES</div>
        <div class="box-content">${prerequisitesHtml}</div>
      </div>
      <div class="tutorial-box">
        <div class="box-title">LEARNING PATH</div>
        <div class="box-content">${learningPathHtml}</div>
      </div>
    </div>
    
    ${reviewsHtml ? `
      <div class="tutorial-box review-box">
        <div class="box-title">TOP REVIEWS</div>
        <div class="box-content">${reviewsHtml}</div>
      </div>
    ` : ''}
    
    <a href="${escapeHtml(item.tutorial)}" target="_blank" class="tutorial-link-btn" style="display:inline-block; margin-top:12px; padding:8px 16px; background:var(--purple-700); color:white; border-radius:8px; text-decoration:none; font-size:12px;">Start Learning ↗</a>
  `;
  
  detailCard.style.display = "block";

  // Store data for download/share
  window.currentResults = data;
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
    navigator.clipboard.writeText(shareText).then(() => {
      alert('✅ Results copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Share text: ' + shareText);
    });
  }
}