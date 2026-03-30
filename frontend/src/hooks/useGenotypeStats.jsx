import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

export const useGenotypeStats = ({ limit = 100, page = 0, autoRefresh = false } = {}) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(null);

  const fetchPage = useCallback(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/genotype-stats/paginated`, {
        params: { page, limit },
      })
      .then((res) => {
        console.log("✅ useGenotypeStats success:", res);
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        setStats(items);
        if (typeof res.data.totalCount === "number") {
          setTotalCount(res.data.totalCount);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ useGenotypeStats error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [page, limit]);

  // Load data on mount and when page/limit changes (no auto-refresh)
  useEffect(() => {
    fetchPage();
  }, [fetchPage, page, limit]);

  return {
    stats,
    loading,
    error,
    totalPages: totalCount !== null ? Math.ceil(totalCount / limit) : null,
    triggerRefresh: fetchPage,
  };
};
