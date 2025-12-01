// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dummy submit for now - replace with firebase signIn later
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate a short delay then navigate (or show error)
    setTimeout(() => {
      setLoading(false);
      // TEMP: treat any non-empty as success
      if (!email || !password) {
        setError("Please enter email and password.");
        return;
      }
      // Save minimal sm_user so your routing logic recognizes logged in
      localStorage.setItem(
        "sm_user",
        JSON.stringify({ uid: "local", email, role: "refiller" })
      );
      nav("/");
    }, 600);
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />
      <main className="login-card" role="main" aria-labelledby="login-heading">
        <h1 id="login-heading" className="brand">SNACKMASTER</h1>
        <p className="muted">Sign in to manage machines & refills</p>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
          <label className="field">
            <span className="label-text">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="label-text">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </label>

          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8}}>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <input id="remember" type="checkbox" />
              <label htmlFor="remember" style={{fontSize:13, color:"#666"}}>Remember me</label>
            </div>

            <div style={{fontSize:13}}>
              <a href="mailto:vdsofficial@snackmaster.in?subject=Forgot%20UserID%20or%20Password" className="link-small">
                Forgot user id / password?
              </a>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="help-text">
          Need help? <a className="link-small" href="mailto:vdsofficial@snackmaster.in">Contact tech team</a>
        </div>
      </main>
    </div>
  );
}
