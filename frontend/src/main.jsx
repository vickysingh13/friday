import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MachinePage from "./pages/MachinePage";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMachines from "./pages/admin/AdminMachines";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminRefillLogs from "./pages/admin/AdminRefillLogs";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAssignMachines from "./pages/admin/AdminAssignMachines";
import AdminMachineSlots from "./pages/admin/AdminMachineSlots";

import { AdminProvider } from "./contexts/AdminContext";
import "./styles.css";

function App() {
  const smUser = JSON.parse(localStorage.getItem("sm_user") || "{}");
  const isLoggedIn = !!smUser?.uid;
  const isAdmin = smUser?.role === "admin";

  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* USER HOME */}
          <Route
            path="/"
            element={
              isLoggedIn
                ? isAdmin
                  ? <Navigate to="/admin" />
                  : <Dashboard />
                : <Navigate to="/login" />
            }
          />

          {/* USER MACHINE PAGE */}
          <Route
            path="/machine/:id"
            element={
              isLoggedIn
                ? isAdmin
                  ? <Navigate to="/admin" />
                  : <MachinePage />
                : <Navigate to="/login" />
            }
          />

          {/* ADMIN ROUTES — PROTECTED */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="machines" element={<AdminMachines />} />
              <Route path="machines/assign" element={<AdminAssignMachines />} />
              <Route path="machines/:machineId/slots" element={<AdminMachineSlots />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="refill-logs" element={<AdminRefillLogs />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Route>

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
