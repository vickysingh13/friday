import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseClient";

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Watch auth login/logout
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(u);
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setRole(snap.data().role || "refiller");
        } else {
          setRole("refiller");
        }
      } catch (err) {
        console.error("Failed loading role:", err);
        setRole("refiller");
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const isAdmin = role === "admin";

  return (
    <AdminContext.Provider value={{ user, role, isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
