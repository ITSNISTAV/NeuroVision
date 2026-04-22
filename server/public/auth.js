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

//Google OAuth handler
async function handleGoogleSignIn(response) {
  const errEl = document.getElementById("loginError") || document.getElementById("registerError");
  try {
    const res = await fetch(`${AUTH_API}/google`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();

    if (!res.ok) {
      if (errEl) errEl.textContent = data.error || "Google sign-in failed";
      return;
    }

    sessionStorage.setItem("nv_user", JSON.stringify(data.user));
    window.location.href = SKILLS_URL;
  } catch (err) {
    if (errEl) errEl.textContent = "Google sign-in failed. Please try again.";
    console.error("Google OAuth error:", err);
  }
}