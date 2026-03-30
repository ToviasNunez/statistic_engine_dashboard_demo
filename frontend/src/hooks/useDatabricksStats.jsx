import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config/api';

export const useDatabricksStats = ({ limit = 100, page = 0 } = {}) => {
  const [allStats, setAllStats] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const lastIdsRef = useRef(new Set()); // 🚀 Track previously seen IDs

  const triggerRefresh = useCallback(() => {
    setLoading(true);
    
    // Fetch from backend Databricks endpoint
    axios.get(`${API_BASE_URL}/mock/databricks-stats-mock.json`, {
      params: {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last year
        endDate: new Date().toISOString().split('T')[0]
      },
    })
      .then((res) => {
        console.log("✅ useDatabricksStats response:", res.data);
        const data = Array.isArray(res.data?.data) ? res.data.data : res.data;

        if (!Array.isArray(data)) throw new Error("Databricks stats response malformed");

        // Data is already in object format, no need to transform from array
        const transformedData = data.map(item => ({
          gsid: item.gsid,
          source: item.source, 
          table_name: item.table_name,
          data_column: item.data_column,
          created_at: item.created_at,
          start_time: item.start_time,
          end_time: item.end_time,
          query_time_sec: item.query_time_sec,
          fetch_timestamp: item.fetch_timestamp,
          rows: item.rows,
          columns: item.columns,
          memory_usage_kb: item.memory_usage_kb,
          storage_size_kb: item.storage_size_kb,
          status: item.status || 'SUCCESS'
        }));

        const currentIds = new Set(transformedData.map(d => d.gsid));
        const oldIds = lastIdsRef.current;

        // Check for new data
        const hasNewData = transformedData.some(d => !oldIds.has(d.gsid));
        if (hasNewData) {
          console.log("🔄 New Databricks data detected, updating state");
        }

        setAllStats(transformedData);
        setTotalCount(transformedData.length);
        lastIdsRef.current = currentIds;
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ useDatabricksStats failed:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [limit]);

  // Client-side pagination effect
  useEffect(() => {
    if (allStats.length > 0) {
      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const paginatedStats = allStats.slice(startIndex, endIndex);
      setStats(paginatedStats);
      console.log(`📄 Page ${page}: showing ${paginatedStats.length} of ${allStats.length} total records`);
    }
  }, [allStats, page, limit]);

  return {
    stats,
    loading,
    error,
    totalCount,
    triggerRefresh,
  };
};