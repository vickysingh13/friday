import { Navigate } from "react-router-dom";
import { useAdmin } from "../contexts/AdminContext";

export default function RoleRedirect() {
  const { loading, isSuperAdmin, isOrgAdmin, isRefiller } = useAdmin();

  if (loading) return <div>Loading...</div>;

  if (isSuperAdmin) return <Navigate to="/super" replace />;
  if (isOrgAdmin) return <Navigate to="/admin" replace />;
  if (isRefiller) return <Navigate to="/dashboard" replace />;

  return <Navigate to="/login" replace />;
}
