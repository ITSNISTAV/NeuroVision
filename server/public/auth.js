// ── Auth API (same-origin, single port) ────────────────────────
const AUTH_API   = "/api/auth";
const SKILLS_URL = "/login.html";

async function login(email, password) {
  const res  = await fetch(`${AUTH_API}/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (!res.ok) {
    // Throw so the calling UI handler can show it in the form error element
    throw new Error(data.error || "Invalid credentials");
  }

  sessionStorage.setItem("nv_user", JSON.stringify(data.user));
  window.location.href = SKILLS_URL;
}

async function register(name, email, password) {
  const res  = await fetch(`${AUTH_API}/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, email, password })
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  // Registration successful — calling code switches to login tab
}