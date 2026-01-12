// src/main.jsx
console.log("🔥 MAIN JSX RELOADED");

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ───────── AUTH / CONTEXT ───────── */
import { AdminProvider, useAdmin } from "./contexts/AdminContext";

/* ───────── AUTH PAGES ───────── */
import Login from "./pages/Login";

/* ───────── COMMON PAGES ───────── */
import Dashboard from "./pages/Dashboard";
import MachinePage from "./pages/MachinePage";

/* ───────── ADMIN ───────── */
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMachines from "./pages/admin/AdminMachines";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminRefillLogs from "./pages/admin/AdminRefillLogs";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAssignMachines from "./pages/admin/AdminAssignMachines";
import AdminMachineSlots from "./pages/admin/AdminMachineSlots";

/* ───────── REFILLER ───────── */
import RefillerMachineSlots from "./pages/refiller/RefillerMachineSlots";

/* ───────── SUPER ADMIN ───────── */
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import SuperAdminDashboard from "./pages/super/SuperAdminDashboard";
import SuperAdminInsights from "./pages/super/SuperAdminInsights"; // <--- NEW IMPORT
import SuperAdminOrganisations from "./pages/super/SuperAdminOrganisations";
import SuperAdminOrgCreate from "./pages/super/SuperAdminOrgCreate";
import SuperAdminAdmins from "./pages/super/SuperAdminAdmins";
import SuperAdminAdminCreate from "./pages/super/SuperAdminAdminCreate";
import SuperAdminMachines from "./pages/super/SuperAdminMachines";
import SuperAdminMachineCreate from "./pages/super/SuperAdminMachineCreate";
import SuperAdminAuditLogs from "./pages/super/SuperAdminAuditLogs";

/* ───────── ROUTE GUARDS ───────── */
import RequireAdmin from "./components/RequireAdmin";
import RequireSuperAdmin from "./components/RequireSuperAdmin";

/* ───────── STYLES ───────── */
import "./styles.css";

/* ─────────────────────────────
   ROUTES
───────────────────────────── */
function AppRoutes() {
  const { user, role, loading } = useAdmin();

  if (loading) {
    return <div style={{ padding: 32 }}>Initializing session…</div>;
  }

  return (
    <Routes>
      {/* ───────── LOGIN ───────── */}
      <Route path="/login" element={<Login />} />

      {/* ───────── ROOT REDIRECT ───────── */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : role === "super_admin" ? (
            <Navigate to="/super" replace />
          ) : role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : (
            <Dashboard />
          )
        }
      />

      {/* ───────── REFILLER ───────── */}
      <Route path="/machine/:id" element={<MachinePage />} />
      <Route
        path="/refiller/machines/:machineId/slots"
        element={<RefillerMachineSlots />}
      />

      {/* ───────── SUPER ADMIN ───────── */}
      <Route
        path="/super"
        element={
          <RequireSuperAdmin>
            <SuperAdminLayout />
          </RequireSuperAdmin>
        }
      >
        {/* Dashboard */}
        <Route index element={<SuperAdminDashboard />} />
        
        {/* Insights (NEW) */}
        <Route path="insights" element={<SuperAdminInsights />} />

        {/* Organisations */}
        <Route path="orgs" element={<SuperAdminOrganisations />} />
        <Route path="orgs/create" element={<SuperAdminOrgCreate />} />

        {/* Admins */}
        <Route path="admins" element={<SuperAdminAdmins />} />
        <Route path="admins/create" element={<SuperAdminAdminCreate />} />

        {/* Machines */}
        <Route path="machines" element={<SuperAdminMachines />} />
        <Route path="machines/create" element={<SuperAdminMachineCreate />} />

        {/* Audit Logs */}
        <Route path="audit" element={<SuperAdminAuditLogs />} />
      </Route>

      {/* ───────── ADMIN ───────── */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="machines" element={<AdminMachines />} />
        <Route path="machines/assign" element={<AdminAssignMachines />} />
        <Route path="machines/:machineId/slots" element={<AdminMachineSlots />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="refill-logs" element={<AdminRefillLogs />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* ───────── FALLBACK ───────── */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

/* ─────────────────────────────
   APP BOOTSTRAP
───────────────────────────── */
function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AdminProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);