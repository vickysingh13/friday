import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";

export function useSuperAdminKPIs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState({
    totalOrganisations: 0,
    activeOrganisations: 0,
    suspendedOrganisations: 0,
    totalMachines: 0,
    assignedMachines: 0,
    unassignedMachines: 0,
    disabledMachines: 0,
    totalAdmins: 0,
    totalRefillers: 0,
    totalRefills: 0,
    refillsLast7Days: 0,
  });

  useEffect(() => {
    loadKPIs();
  }, []);

  async function loadKPIs() {
    setLoading(true);
    setError(null);

    try {
      const sevenDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      const [
        orgSnap,
        machineSnap,
        adminSnap,
        refillerSnap,
        refillSnap,
        recentRefillSnap,
      ] = await Promise.all([
        getDocs(collection(db, "organisations")),
        getDocs(collection(db, "machines")),
        getDocs(query(collection(db, "users"), where("role", "==", "admin"))),
        getDocs(query(collection(db, "users"), where("role", "==", "refiller"))),
        getDocs(collection(db, "refill_logs")),
        getDocs(
          query(
            collection(db, "refill_logs"),
            where("createdAt", ">=", sevenDaysAgo)
          )
        ),
      ]);

      let activeOrgs = 0;
      let suspendedOrgs = 0;
      orgSnap.forEach((d) => {
        d.data().status === "active" ? activeOrgs++ : suspendedOrgs++;
      });

      let assigned = 0;
      let unassigned = 0;
      let disabled = 0;
      machineSnap.forEach((d) => {
        const m = d.data();
        if (m.status === "disabled") disabled++;
        else if (m.assigned) assigned++;
        else unassigned++;
      });

      setKpis({
        totalOrganisations: orgSnap.size,
        activeOrganisations: activeOrgs,
        suspendedOrganisations: suspendedOrgs,
        totalMachines: machineSnap.size,
        assignedMachines: assigned,
        unassignedMachines: unassigned,
        disabledMachines: disabled,
        totalAdmins: adminSnap.size,
        totalRefillers: refillerSnap.size,
        totalRefills: refillSnap.size,
        refillsLast7Days: recentRefillSnap.size,
      });
    } catch (err) {
      console.error("❌ KPI load failed", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  // Returning 'stats' to match your component's destructuring
  return { 
    kpis, 
    stats: {
        organisations: kpis.totalOrganisations,
        machines: kpis.totalMachines,
        admins: kpis.totalAdmins,
        refills: kpis.totalRefills
    },
    loading, 
    error, 
    reloadKPIs: loadKPIs 
  };
}