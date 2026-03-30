import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { useCallback, useState } from 'react';

export default function usePieChartCapacity() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const triggerRefresh = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/mock/piechart-capacity-mock.json`)
      .then(res => {
        console.log("✅ usePieChart:", res.data);
        const dbUsage = res.data; // <-- direkt das Root-Objekt nehmen
        if (!dbUsage || typeof dbUsage.used_gb !== "number") {
          throw new Error("Invalid DB usage data");
        }
        setUsage(dbUsage);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ usePieChart failed:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return {
    usage,        // { used_gb, free_gb, total_gb, used_percent }
    loading,
    error,
    triggerRefresh
  };
}
