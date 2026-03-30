import {
  ClientSideRowModelModule,
  ModuleRegistry,
  createGrid
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useEffect, useRef, useState } from "react";
import ReactPaginate from "react-paginate";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const columnDefs = [
  { field: "gsid", headerName: "GSID", minWidth: 120 },
  { field: "source", headerName: "Source", minWidth: 180 },
  { field: "table_name", headerName: "Table", minWidth: 150 },
  { field: "rows", headerName: "Rows", minWidth: 100 },
  { field: "columns", headerName: "Columns", minWidth: 100 },
  { field: "query_time_sec", headerName: "Query Time (s)", minWidth: 130 },
  { field: "memory_usage_kb", headerName: "Memory (KB)", minWidth: 130 },
  { field: "storage_size_kb", headerName: "Storage (KB)", minWidth: 130 },
  { field: "status", headerName: "Status", minWidth: 100 },
  { field: "created_at", headerName: "Created At", minWidth: 170 },
];

export function DatabricksStatsTable({ 
  stats, 
  n_Data,
  loading = false,
  currentPage,
  totalPages,
  goToPage,
  pageSize,
  setCurrentPage,
}) {
  const gridRef = useRef(null);
  const gridApiRef = useRef(null);
  const [search, setSearch] = useState("");

  // Fix: stats is already an array, not an object with items property
  const items = Array.isArray(stats) ? stats : [];
  
  console.log("🔍 DatabricksStatsTable - stats received:", stats);
  console.log("🔍 DatabricksStatsTable - items length:", items.length);
  console.log("🔍 DatabricksStatsTable - first item:", items[0]);

  // Initialize AG Grid
  useEffect(() => {
    if (!gridRef.current || gridApiRef.current) return;

    const gridApi = createGrid(gridRef.current, {
      columnDefs,
      rowData: [],
      defaultColDef: {
        resizable: true,
        sortable: true,
        filter: true,
      },
      getRowStyle: (params) => ({
        backgroundColor: params.node.rowIndex % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
        color: "#1E293B",
        borderBottom: "1px solid #E2E8F0",
        fontSize: "14px",
        fontWeight: "500",
      }),
      onFirstDataRendered: (params) => params.api.sizeColumnsToFit(),
    });

    gridApiRef.current = gridApi;
  }, []);

  useEffect(() => {
    if (gridApiRef.current) {
      console.log("🔍 Setting grid data with", items.length, "items");
      gridApiRef.current.updateGridOptions({ rowData: items || [] });
      console.log("🔍 Grid row count after update:", gridApiRef.current.getDisplayedRowCount());
    }
  }, [items]);

  // Search filtering
  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.updateGridOptions({ quickFilterText: search });
    }
    return () => {
      if (gridApiRef.current) {
        gridApiRef.current.updateGridOptions({ quickFilterText: "" }); // Reset on unmount
      }
    };
  }, [search]);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected); // Update local page only, triggers parent state change
  };

  return (
    <div className="bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 p-8 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.79 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.79 4 8 4s8-1.79 8-4M4 7c0-2.21 3.79-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Databricks Hub
            </h2>
            <p className="text-sm text-gray-500 mt-1">Cloud data platform analytics</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold border border-purple-200">
          {items.length} records
        </div>
      </div>

      {loading && <div className="text-center text-sm mb-2">⏳ Loading...</div>}
      {!loading && items.length === 0 && (
        <div className="text-center text-sm mb-2">No data found.</div>
      )}

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-sm bg-gray-50 hover:bg-white shadow-sm"
        />
      </div>

      <div
        ref={gridRef}
        id="databricksGrid"
        className="ag-theme-alpine"
        style={{ height: window.innerWidth < 640 ? 400 : 500, width: "100%" }}
      ></div>

      <div className="flex justify-center mt-4 overflow-x-auto">
        <ReactPaginate
          previousLabel={
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </div>
          }
          nextLabel={
            <div className="flex items-center gap-2">
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          }
          breakLabel={"..."}
          forcePage={Math.max(0, Math.min(currentPage || 0, Math.max(0, (totalPages || 1) - 1)))}
          pageCount={totalPages || 1}
          onPageChange={handlePageClick}
          containerClassName={"flex gap-2 text-sm font-medium"}
          pageClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md min-w-[44px] text-center"}
          activeClassName="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25"
          previousClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"}
          nextClassName={"px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"}
          disabledClassName={"opacity-40 cursor-not-allowed hover:bg-white hover:shadow-sm"}
        />
      </div>

      {/* Debug section - remove in production */}
      {items.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs sm:text-sm text-gray-600">
            🔍 Debug: Show first 3 records (click to expand)
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32 w-full">
            {JSON.stringify(items.slice(0, 3), null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}