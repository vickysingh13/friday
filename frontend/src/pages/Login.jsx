// src/pages/Login.jsx
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
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      let profile = {};
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) profile = snap.data();

      const sm_user = {
        uid: user.uid,
        email: user.email,
        role: profile.role || "refiller",
      };

      localStorage.setItem("sm_user", JSON.stringify(sm_user));

      nav((profile.role || "").toLowerCase() === "admin" ? "/admin" : "/");
    } catch (err) {
      let msg = "Login failed.";
      if (err.code?.includes("auth/user-not-found")) msg = "User not found.";
      if (err.code?.includes("auth/wrong-password")) msg = "Incorrect password.";
      setError(msg);
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-bg"></div>

      <div className="login-card">
        <h1 className="brand">SNACKMASTER</h1>
        <p className="muted">Sign in to manage machines & refills</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span className="label-text">Email</span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="label-text">Password</span>
            <input
              type="password"
              required
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <div style={{ textAlign: "right", marginTop: "-5px" }}>
            <a
              href="mailto:vdsofficial@snackmaster.in?subject=Forgot Credentials"
              className="link-small"
            >
              Forgot user id / password?
            </a>
          </div>

          {error && <div className="error">{error}</div>}

          <button disabled={loading} className="btn-primary">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="help-text">
          Need help?{" "}
          <a className="link-small" href="mailto:vdsofficial@snackmaster.in">
            Contact tech team
          </a>
        </div>
      </div>
    </div>
  );
}
