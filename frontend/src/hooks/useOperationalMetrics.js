import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseClient";

export function useOperationalMetrics(days = 7) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    machines: {
      active: 0,
      disabled: 0,
      unassigned: 0,
      stale: [], // Changed from stale7d to generic 'stale'
    },
    refills: {
      avgPercent: 0,
    },
    organisations: [], // Changed to array for full list
  });

  useEffect(() => {
    loadMetrics();
  }, [days]); // Reload when 'days' changes

  async function loadMetrics() {
    setLoading(true);

    try {
      const [machineSnap, orgSnap, refillSnap] = await Promise.all([
        getDocs(collection(db, "machines")),
        getDocs(collection(db, "organisations")),
        getDocs(collection(db, "refill_logs")),
      ]);

      /* ───── MACHINES ───── */
      let active = 0;
      let disabled = 0;
      let unassigned = 0;
      const stale = [];

      const now = Date.now();
      const STALE_THRESHOLD = days * 24 * 60 * 60 * 1000;

      machineSnap.forEach((doc) => {
        const m = doc.data();

        if (m.status === "active") active++;
        else if (m.status === "disabled") disabled++;
        else unassigned++;

        // Check for stale machines based on the selected 'days'
        if (
          m.last_refill_at &&
          now - m.last_refill_at.toDate().getTime() > STALE_THRESHOLD
        ) {
          stale.push({
            id: doc.id,
            name: m.name,
            orgId: m.orgId,
          });
        }
      });

      /* ───── REFILLS ───── */
      let totalPercent = 0;
      let refillCount = 0;

      refillSnap.forEach((doc) => {
        const r = doc.data();
        if (typeof r.newPercent === "number") {
          totalPercent += r.newPercent;
          refillCount++;
        }
      });

      /* ───── ORGS ───── */
      const organisations = [];
      orgSnap.forEach((doc) => {
        organisations.push({ id: doc.id, ...doc.data() });
      });

      setData({
        machines: {
          active,
          disabled,
          unassigned,
          stale,
        },
        refills: {
          avgPercent: refillCount
            ? Math.round(totalPercent / refillCount)
            : 0,
        },
        organisations,
      });
    } catch (err) {
      console.error("❌ Failed to load operational metrics", err);
    } finally {
      setLoading(false);
    }
  }

  return { loading, data };
}