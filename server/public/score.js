 // ─── Data ───────────────────────────────────────────────────────────────────

    const PROFILES = [
      { id: 1, role: "Backend Developer",   cgpa: 5, internship: 0, skills: [{ name: "Node.js", level: 4 }] },
      { id: 2, role: "Frontend Developer",  cgpa: 1, internship: 0, skills: [{ name: "Tailwind", level: 5 }] },
      { id: 3, role: "Full Stack Developer",cgpa: 6, internship: 7, skills: [{ name: "React.js", level: 5 }] },
    ];

    const ROLE_SKILLS = {
      "Backend Developer": [
        { name: "Node.js",           requiredLevel: 4, weight: 25 },
        { name: "Express.js",        requiredLevel: 4, weight: 20 },
        { name: "MongoDB",           requiredLevel: 3, weight: 20 },
        { name: "REST APIs",         requiredLevel: 4, weight: 15 },
        { name: "JWT Authentication",requiredLevel: 3, weight: 10 },
        { name: "Git",               requiredLevel: 3, weight: 10 },
      ],
      "Frontend Developer": [
        { name: "HTML",              requiredLevel: 4, weight: 20 },
        { name: "CSS",               requiredLevel: 4, weight: 20 },
        { name: "JavaScript",        requiredLevel: 4, weight: 25 },
        { name: "React.js",          requiredLevel: 4, weight: 20 },
        { name: "Responsive Design", requiredLevel: 3, weight: 10 },
        { name: "Git",               requiredLevel: 3, weight:  5 },
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

    // ─── Scoring logic (mirrors backend) ────────────────────────────────────────

    function computeScore(profile) {
      const roleSkills = ROLE_SKILLS[profile.role] || [];
      let earned = 0, total = 0;
      const breakdown = roleSkills.map(rs => {
        total += rs.weight;
        const userSkill = profile.skills.find(s => s.name === rs.name);
        const userLevel = userSkill?.level;
        const skillEarned = userLevel !== undefined
          ? (userLevel / rs.requiredLevel) * rs.weight
          : 0;
        earned += skillEarned;
        return { ...rs, userLevel };
      });
      return { finalScore: (earned / total) * 100, breakdown };
    }

    // ─── Render profile cards ────────────────────────────────────────────────────

    const grid = document.getElementById("profile-grid");
    document.getElementById("profile-count").textContent = `${PROFILES.length} profiles`;

    PROFILES.forEach(profile => {
      const card = document.createElement("div");
      card.className = "profile-card";
      card.id = `profile-${profile.id}`;
      card.innerHTML = `
        <h3>${profile.role}</h3>
        <div class="tags">
          <span class="tag">CGPA <strong>${profile.cgpa}</strong></span>
          <span class="tag">INTERNSHIP <strong>${profile.internship}mo</strong></span>
          <span class="tag">SKILLS <strong>${profile.skills.length}</strong></span>
        </div>
        <div class="skills-label">Technical Skills</div>
        <div class="skill-chips">
          ${profile.skills.map(s => `<span class="skill-chip">${s.name} ${s.level}</span>`).join("")}
        </div>
        <button class="btn-score" onclick="handleScore(${profile.id})">⚡ Score</button>
      `;
      grid.appendChild(card);
    });

    // ─── Score handler ───────────────────────────────────────────────────────────

    let activeProfileId = null;

    async function handleScore(profileId) {
      const profile = PROFILES.find(p => p.id === profileId);

      // highlight active card
      document.querySelectorAll(".profile-card").forEach(c => c.classList.remove("active"));
      document.getElementById(`profile-${profileId}`).classList.add("active");
      activeProfileId = profileId;

      // disable buttons while loading
      document.querySelectorAll(".btn-score").forEach(b => {
        b.disabled = true;
        b.textContent = b.closest(".profile-card").id === `profile-${profileId}` ? "Scoring..." : "⚡ Score";
      });

      let finalScore, breakdown, showWarning = false;

      try {
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: profile.role, skills: profile.skills }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        finalScore = data.finalScore;
        breakdown = computeScore(profile).breakdown; // for visual breakdown
      } catch {
        showWarning = true;
        const local = computeScore(profile);
        finalScore = local.finalScore;
        breakdown = local.breakdown;
      }

      renderResult(profile, finalScore, breakdown, showWarning);

      document.querySelectorAll(".btn-score").forEach(b => {
        b.disabled = false;
        b.textContent = "⚡ Score";
      });
    }

    // ─── Render result ───────────────────────────────────────────────────────────

    function renderResult(profile, finalScore, breakdown, showWarning) {
      const resultCard = document.getElementById("result-card");
      resultCard.classList.add("visible");
      resultCard.scrollIntoView({ behavior: "smooth", block: "start" });

      // warning banner
      const warning = document.getElementById("api-warning");
      if (showWarning) {
        warning.style.display = "block";
        warning.textContent = "⚠ Could not reach scoring API. Showing client-side preview.";
      } else {
        warning.style.display = "none";
      }

      // score circle
      const circumference = 2 * Math.PI * 54; // 339.3
      const filled = (finalScore / 100) * circumference;
      const color = finalScore >= 70 ? "#a855f7" : finalScore >= 40 ? "#f59e0b" : "#ef4444";

      const arc = document.getElementById("score-arc");
      arc.setAttribute("stroke-dasharray", `${filled} ${circumference}`);
      arc.setAttribute("stroke", color);
      document.getElementById("score-text").textContent = `${Math.round(finalScore)}%`;

      // fit label
      const labelEl = document.getElementById("fit-label");
      const label = finalScore >= 70 ? "Strong Fit" : finalScore >= 40 ? "Partial Fit" : "Weak Fit";
      const labelColor = finalScore >= 70 ? "#4ade80" : finalScore >= 40 ? "#f59e0b" : "#f87171";
      labelEl.textContent = label;
      labelEl.style.color = labelColor;
      labelEl.style.background = `${labelColor}18`;
      labelEl.style.borderColor = `${labelColor}40`;

      document.getElementById("result-role-name").textContent = profile.role;

      // skill bars
      const barsEl = document.getElementById("skill-bars");
      barsEl.innerHTML = breakdown.map(s => {
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