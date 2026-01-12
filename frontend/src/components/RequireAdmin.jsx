import React from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";

export default function RequireAdmin({ children }) {
  const { loading, isAdmin, isSuperAdmin } = useAdmin();

  if (loading) return <div>Loading…</div>;

  if (!(isAdmin || isSuperAdmin)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
