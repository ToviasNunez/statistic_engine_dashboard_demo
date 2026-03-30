import { useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import HeartbeatPulse from "./HeartbeatPulse";

export default function Header({ 
  pulseTrigger, 
  startDate, 
  endDate, 
  setStartDate, 
  setEndDate,
  mode = 'real', // Add mode prop with default
  onModeChange, // Add mode change handler
  loading = false // Add loading state
}) {
  const [showPicker, setShowPicker] = useState(false);

  function formatDate(date) {
    if (date instanceof Date && !isNaN(date)) {
      return date.toLocaleDateString('sv-SE'); // 'YYYY-MM-DD' in local time
    }
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.slice(0, 10);
    }
    return "";
  }

  const handleToggleMode = () => {
    const newMode = mode === 'real' ? 'predicted' : 'real';
    console.log(`🔄 Header: Current mode: ${mode}, New mode: ${newMode}`); // Add debug log
    console.log('🔄 Header: onModeChange function:', onModeChange); // Check if function exists
    onModeChange?.(newMode);
  };

  // Format: YYYY-MM-DD - YYYY-MM-DD
  const formattedRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-card-white rounded-2xl shadow-enterprise-lg border border-gray-100 relative gap-4 sm:gap-0">
      <div className="flex items-center gap-2 px-4 py-2 bg-background-lightGray rounded-lg border text-text-dark font-medium text-sm sm:text-base order-2 sm:order-1">
        <svg className="w-4 h-4 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formattedRange}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto order-1 sm:order-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-orange to-accent-gold rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🌽</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-accent-orange to-accent-gold bg-clip-text text-transparent">
            KWS Dashboard
          </div>
        </div>
        
        {/* Mode Toggle Switch */}
        <div className="flex items-center gap-3 px-4 py-2 bg-card-white rounded-xl shadow-enterprise border border-gray-100">
          <span className={`text-xs sm:text-sm font-medium transition-colors ${
            mode === 'real' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            Real
          </span>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mode === 'predicted'}
              onChange={handleToggleMode}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"></div>
          </label>
          
          <span className={`text-xs sm:text-sm font-medium transition-colors ${
            mode === 'predicted' ? 'text-blue-600' : 'text-gray-500'
          }`}>
            Predicted
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-text-light order-3 sm:order-3 self-end sm:self-auto">
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs sm:text-sm">{mode}...</span>
          </div>
        )}

        {/* Services accordion menu (top-right, emoji only) */}
        <div className="relative">
          <details className="relative group">
            <summary className="list-none cursor-pointer select-none text-xl leading-none">
              ⚙️
            </summary>
            <div className="absolute right-0 mt-2 w-52 bg-card-white border border-gray-100 rounded-xl shadow-enterprise-lg p-2 z-50">
              <a href="http://localhost:8502/"  target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-lg text-sm text-text-dark hover:bg-background-lightGray">Mock Simulation</a>
              <a href="http://localhost:8081/" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-lg text-sm text-text-dark hover:bg-background-lightGray">ETL-JOB-Monitoring</a>
              <a href="http://localhost:8082/ui/#" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-lg text-sm text-text-dark hover:bg-background-lightGray">Trino Dashboard</a>
              <a href="http://localhost:8001/targets" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-lg text-sm text-text-dark hover:bg-background-lightGray">Prometheus Monitoring</a>
              <a href="http://localhost:3001/dashboards" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-lg text-sm text-text-dark hover:bg-background-lightGray">Grafana Dashboard</a>
              <a href="http://localhost:5173/" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-lg text-sm text-text-dark hover:bg-background-lightGray">Query</a>
               <a href="http://localhost:9002/browser/lakehouse" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 rounded-lg text-sm text-text-dark hover:bg-background-lightGray">Minio</a>
            </div>
          </details>
        </div>
        
       {/** <button
          onClick={() => setShowPicker((prev) => !prev)}
          className="px-2 py-1 bg-white text-sm rounded shadow hover:bg-gray-100"
        >
          📅 Select Range
        </button> */}
        <HeartbeatPulse pulseTrigger={pulseTrigger} />
      </div>

      {showPicker && (
        <div className="absolute top-20 right-4 z-50">
        
          {/*
            <DateRange
            editableDateInputs={true}
            onChange={(item) => {
              setStartDate(item.selection.startDate);
              setEndDate(item.selection.endDate);
            }}
            moveRangeOnFirstSelection={false}
            ranges={[{
              startDate,
              endDate,
              key: 'selection',
            }]}
          />
          
          */}
        </div>
      )}

      {/** Debug log in render **/}
      {console.log('🎯 Header render - Current mode:', mode, 'Loading:', loading)}
    </header>
  );
}
