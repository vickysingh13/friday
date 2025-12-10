import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";

export default function ProtectedRoute() {
  const { loading, isAdmin, user } = useAdmin();

  if (loading) return <div>Checking permissions...</div>;

  // Not logged in → go login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but not admin → go user dashboard
  if (!isAdmin) return <Navigate to="/" replace />;

  // Admin → allow nested routes to render!
  return <Outlet />;
}
