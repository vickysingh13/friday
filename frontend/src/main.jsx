// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // keep your real Dashboard
import MachinePage from "./pages/MachinePage";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMachines from "./pages/admin/AdminMachines";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminRefillLogs from "./pages/admin/AdminRefillLogs";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminUsers from "./pages/admin/AdminUsers";

import { AdminProvider } from "./contexts/AdminContext";

import "./styles.css";

function App() {
  const isLoggedIn = !!localStorage.getItem("sm_user");

  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />

          <Route path="/machine/:id" element={isLoggedIn ? <MachinePage /> : <Navigate to="/login" />} />

          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="machines" element={<AdminMachines />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="refill-logs" element={<AdminRefillLogs />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
