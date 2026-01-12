// frontend/src/contexts/AdminContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log("🔐 AUTH STATE:", u?.uid, u?.email);

      if (!u) {
        setUser(null);
        setRole(null);
        setOrgId(null);
        setLoading(false);
        return;
      }

      setUser(u);

      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.error("❌ USER DOC MISSING FOR UID:", u.uid);
          throw new Error("User profile not found");
        }

        const data = snap.data();
        console.log("✅ USER DOC LOADED:", data);

        setRole(data.role);
        setOrgId(data.orgId);
      } catch (err) {
        console.error("❌ AdminContext load failed:", err);
        setRole(null);
        setOrgId(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        user,
        role,
        orgId,
        isSuperAdmin: role === "super_admin",
        isAdmin: role === "admin",
        isRefiller: role === "refiller",
        loading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
