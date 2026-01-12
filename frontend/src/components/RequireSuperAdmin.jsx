import React from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";

export default function RequireSuperAdmin({ children }) {
  const { loading, isSuperAdmin } = useAdmin();

  if (loading) return <div>Loading…</div>;

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
