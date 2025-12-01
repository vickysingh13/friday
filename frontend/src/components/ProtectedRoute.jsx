// frontend/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";

export default function ProtectedRoute({ children }) {
  const { loading, isAdmin, user } = useAdmin();

  if (loading) return <div>Checking permissions...</div>;

  // If not logged in
  if (!user) return <Navigate to="/login" />;

  // If logged in but not admin
  if (!isAdmin) return <Navigate to="/" />;

  // Admin → allow access
  return children;
}
