// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";

export default function Login() {
  const nav = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // REAL Firebase Login
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user; // REAL FIREBASE UID

      // Read user profile from Firestore
      let profile = {};
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) profile = snap.data();

      // Save real sm_user
      const sm_user = {
        uid: user.uid, // MUST BE REAL UID
        email: user.email,
        role: profile.role || "refiller",
      };

      localStorage.setItem("sm_user", JSON.stringify(sm_user));

      // Redirect
      if (sm_user.role === "admin") nav("/admin");
      else nav("/");

    } catch (err) {
      console.error(err);
      if (err.code?.includes("auth/user-not-found")) setError("User not found.");
      else if (err.code?.includes("auth/wrong-password")) setError("Incorrect password.");
      else setError("Invalid login");
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <main className="login-card" role="main" aria-labelledby="login-heading">

        <h1 id="login-heading" className="brand">SNACKMASTER</h1>
        <p className="muted">Sign in to manage machines & refills</p>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
          
          {/* EMAIL */}
          <label className="field">
            <span className="label-text">Email</span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          {/* PASSWORD */}
          <label className="field">
            <span className="label-text">Password</span>
            <input
              type="password"
              required
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {/* REMEMBER + FORGOT */}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8}}>
            
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <input id="remember" type="checkbox" />
              <label htmlFor="remember" style={{fontSize:13, color:"#666"}}>
                Remember me
              </label>
            </div>

            <div style={{fontSize:13}}>
              <a 
                href="mailto:vdsofficial@snackmaster.in?subject=Forgot%20UserID%20or%20Password" 
                className="link-small"
              >
                Forgot user id / password?
              </a>
            </div>

          </div>

          {/* ERROR */}
          {error && <div className="error">{error}</div>}

          {/* SUBMIT */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* HELP */}
        <div className="help-text">
          Need help?{" "}
          <a className="link-small" href="mailto:vdsofficial@snackmaster.in">
            Contact tech team
          </a>
        </div>

      </main>
    </div>
  );
}
