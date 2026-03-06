const currentUser = JSON.parse(sessionStorage.getItem("nv_user") || "null");

if (!currentUser) {
  window.location.href = "/index.html";
}

const userId   = currentUser ? currentUser.id       : "guest";
const userName = currentUser ? currentUser.name     : "Guest";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("navUserName");
  const roleEl = document.getElementById("navUserRole");
  if (nameEl) nameEl.textContent = userName;
  if (roleEl) roleEl.textContent = currentUser?.role || "Candidate";
});

const roleSkills = {
  "Backend Developer":         ["Node.js", "Express", "MongoDB", "PostgreSQL", "Redis"],
  "Frontend Developer":        ["React", "Next.js", "Redux", "Tailwind", "TypeScript"],
  "Full Stack Developer":      ["React", "Node.js", "MongoDB", "Express", "Next.js"],
  "Data Analyst":              ["SQL", "Excel", "PowerBI", "Python", "Tableau"],
  "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "Scikit-Learn", "NumPy"]
};

let internshipMonths = 0;
let technicalSkills  = [];
let editingRole      = null;  

const roleSelect = document.getElementById("role");
Object.keys(roleSkills).forEach(r => {
  roleSelect.innerHTML += `<option value="${r}">${r}</option>`;
});

roleSelect.addEventListener("change", updateSkillDropdown);
updateSkillDropdown();

function updateSkillDropdown() {
  const skillSelect = document.getElementById("skillSelect");
  skillSelect.innerHTML = "";
  roleSkills[roleSelect.value].forEach(skill => {
    skillSelect.innerHTML += `<option value="${skill}">${skill}</option>`;
  });
}

function changeInternship(val) {
  internshipMonths = Math.max(0, internshipMonths + val);
  document.getElementById("internshipMonths").innerText =
    internshipMonths + (internshipMonths === 1 ? " Month" : " Months");
}

function resetInternship() {
  internshipMonths = 0;
  document.getElementById("internshipMonths").innerText = "0 Months";
}

function addSkill() {
  const skill = document.getElementById("skillSelect").value;
  const level = parseInt(document.getElementById("skillLevel").value);

  if (!skill) return showToast("Please select a skill.", "error");
  if (!level || level < 1 || level > 10) return showToast("Enter a level between 1 and 10.", "error");

  if (technicalSkills.find(s => s.skill === skill)) {
    return showToast(`${skill} is already added.`, "error");
  }

  technicalSkills.push({ skill, level });
  document.getElementById("skillLevel").value = "";
  renderSkills();
}

function renderSkills() {
  const div = document.getElementById("skillsList");
  div.innerHTML = "";
  technicalSkills.forEach((s, i) => {
    const chip = document.createElement("div");
    chip.className = "skill-chip";
    chip.innerHTML = `
      ${s.skill}
      <span class="level-badge">Lvl ${s.level}</span>
      <button class="chip-delete" onclick="deleteSkill(${i})" title="Remove">✕</button>
    `;
    div.appendChild(chip);
  });
}

function deleteSkill(i) {
  technicalSkills.splice(i, 1);
  renderSkills();
}

function resetForm() {
  internshipMonths = 0;
  technicalSkills  = [];
  editingRole      = null;
  document.getElementById("cgpa").value = "";
  document.getElementById("internshipMonths").innerText = "0 Months";
  roleSelect.selectedIndex = 0;
  updateSkillDropdown();
  renderSkills();

  const btn = document.querySelector(".btn-submit");
  if (btn) btn.textContent = "Save Profile →";

  showToast("Form cleared.", "");
}

async function saveProfile() {
  const role = roleSelect.value;
  const cgpa = parseFloat(document.getElementById("cgpa").value);

  if (!role)                           return showToast("Please select a role.", "error");
  if (!cgpa || cgpa < 1 || cgpa > 10) return showToast("Enter a valid CGPA (1–10).", "error");
  if (technicalSkills.length === 0)   return showToast("Add at least one skill.", "error");

  try {

    if (editingRole) {
      await fetch(`/api/profile/${userId}/${encodeURIComponent(editingRole)}`, {
        method: "DELETE"
      });
      editingRole = null;
    }

    const response = await fetch(`/api/profile/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, cgpa, internshipMonths, technicalSkills })
    });

    const result = await response.json();

    if (!response.ok) {
      return showToast(result.message || "Error saving profile.", "error");
    }

    showToast(result.message || "Profile saved!", "success");
    resetForm();
    loadRoles();

  } catch (err) {
    showToast("Failed to save. Is the server running?", "error");
  }
}

async function loadRoles() {
  try {
    const res  = await fetch(`/api/profile/${userId}`);
    const data = await res.json();

    const container  = document.getElementById("rolesDisplay");
    const emptyState = document.getElementById("emptyState");
    const countBadge = document.getElementById("roleCount");

    container.innerHTML = "";

    if (!data.roles || data.roles.length === 0) {
      emptyState.classList.add("visible");
      countBadge.textContent = "0 profiles";
      return;
    }

    emptyState.classList.remove("visible");
    countBadge.textContent = `${data.roles.length} profile${data.roles.length !== 1 ? "s" : ""}`;

    data.roles.forEach((role, idx) => {
      const card = document.createElement("div");
      card.className = "roleCard";
      card.style.animationDelay = `${idx * 0.06}s`;

      const skillsHTML = role.technicalSkills.map(s =>
        `<span class="card-skill-tag">${s.skill}<span class="tag-level">${s.level}</span></span>`
      ).join("");

      card.innerHTML = `
        <div class="card-role-name">${role.role}</div>
        <div class="card-meta">
          <div class="meta-pill"><span class="meta-label">CGPA</span>&nbsp;${role.cgpa}</div>
          <div class="meta-pill"><span class="meta-label">Internship</span>&nbsp;${role.internshipMonths} mo</div>
          <div class="meta-pill"><span class="meta-label">Skills</span>&nbsp;${role.technicalSkills.length}</div>
        </div>
        <div class="card-skills-label">Technical Skills</div>
        <div class="card-skills-list">${skillsHTML}</div>
        <div class="cardBtns">
          <button class="card-btn btn-delete" onclick="deleteRole('${role.role}')">🗑 Delete</button>
          <button class="card-btn btn-edit"   onclick="editRole('${role.role}')">✏ Edit</button>
          <button class="card-btn btn-score"  onclick="window.location.href='score.html?role=${encodeURIComponent(role.role)}&uid=${userId}'">Analyze Skill Gap</button>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    showToast("Could not load profiles.", "error");
  }
}

async function deleteRole(role) {
  if (!confirm(`Delete profile for "${role}"?`)) return;
  try {
    await fetch(`/api/profile/${userId}/${encodeURIComponent(role)}`, { method: "DELETE" });
    showToast(`"${role}" deleted.`, "success");
    loadRoles();
  } catch {
    showToast("Failed to delete.", "error");
  }
}

async function editRole(roleName) {
  try {
    const res  = await fetch(`/api/profile/${userId}`);
    const data = await res.json();
    const found = data.roles.find(r => r.role === roleName);
    if (!found) return showToast("Profile not found.", "error");

    roleSelect.value = found.role;
    updateSkillDropdown();
    document.getElementById("cgpa").value = found.cgpa;

    internshipMonths = found.internshipMonths || 0;
    document.getElementById("internshipMonths").innerText =
      internshipMonths + (internshipMonths === 1 ? " Month" : " Months");

    technicalSkills = [...found.technicalSkills];
    renderSkills();

    editingRole = roleName;

    const btn = document.querySelector(".btn-submit");
    if (btn) btn.textContent = "Update Profile →";

    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Editing "${roleName}" — make changes and click Update.`, "");

  } catch {
    showToast("Could not load profile for editing.", "error");
  }
}

function logout() {
  sessionStorage.removeItem("nv_user");
  window.location.href = "/index.html";
}

let toastTimer;
function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
loadRoles();

