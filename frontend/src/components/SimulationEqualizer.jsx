import React, { useState } from "react";

/* =======================
  TAILWIND STYLE TOKENS
   ======================= */
const cardBase =
  "rounded-2xl border shadow-lg backdrop-blur-md " +
  "bg-white/70 border-white/40 shadow-black/5 " +
  "dark:bg-zinc-900/50 dark:border-white/10 dark:shadow-black/20";
const subLabel = "text-[11px] text-zinc-500 dark:text-zinc-400";
const valueMono = "text-[11px] font-mono text-zinc-700 dark:text-zinc-200";
const chipBtn =
  "inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full " +
  "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 " +
  "dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30";

/* =======================
  EXPLANATIONS
  ======================= */
const VAR_EXPLANATIONS = {
  onprem_pct: "Prozentualer Anteil der Daten/Jobs, die On-Premises verarbeitet werden. 0% = alles Cloud, 100% = alles OnPrem. Steuert die Kostenverteilung.",
  cloud_pct: "Prozentualer Anteil der Daten/Jobs, die in der Cloud verarbeitet werden. 0% = alles OnPrem, 100% = alles Cloud. Steuert die Kostenverteilung.",
  // Databricks spezifisch
  databricks_storage_cost_per_tb: "Databricks Storage cost per TB per day (in EUR). [Databricks]",
  databricks_query_cost_per_tb: "Databricks Query cost per TB scanned (in EUR). [Databricks]",
  databricks_dbu_cost_per_hour: "Databricks DBU cost per hour (in USD). [Databricks]",
  databricks_cluster_multiplier: "Cluster cost multiplier for Databricks jobs. [Databricks]",
  // On-Prem spezifisch
  tier_rates: "Storage cost per tier (hot/warm/cold) in €/TB/day. [On-Prem]",
  compute_cost_per_server: "Compute cost per server per day (€/day). [On-Prem]",
  num_servers: "Number of physical servers in use. [On-Prem]",
  utilization_factor: "CPU utilization factor per job weight. [On-Prem]",
  power_kw_per_server: "Power usage per server (kW). [On-Prem]",
  price_per_kwh: "Electricity price (€/kWh). [On-Prem]",
  hardware_cost_total: "Total capital cost of hardware infrastructure (€). [On-Prem]",
  depreciation_years: "Hardware depreciation period (years). [On-Prem]",
  //AWS spezifisch
  eur_to_eur: "EUR→EUR exchange rate applied to all costs.",
  athena_cost_per_tb_eur: "Cost per TB scanned in Athena (in EUR).",
  num_queries: "Number of queries per file; directly affects Athena and transfer costs.",
  query_fraction: "Fraction of files that will be queried (in %).",
  query_repeat: "Average number of repetitions per queried file.",
  heavy_hitter_fraction: "Fraction of queried files that are heavy hitters (queried many times).",
  heavy_hitter_multiplier: "Repetition multiplier for heavy hitters.",
  random_seed: "Seed for randomness in file selection for queries.",
  egress_tiers: "Monthly egress price tiers (GB, €/GB).",
  transfer_monthly_free_gb: "Monthly free transfer GB before costs apply.",
  egress_price_1_eur: "Price per GB for the first egress tier.",
  egress_price_2_eur: "Price per GB for the second egress tier.",
  egress_price_3_eur: "Price per GB for the third egress tier.",
  egress_price_4_eur: "Price per GB for the fourth egress tier.",
  result_egress_ratio: "Fraction of the file egressed per query (result size).",
  transfer_weights: "Relative weight for transfer cost calculation by job type.",
  athena_weight_multiplier: "Global multiplier for Athena weight.",
  transfer_weight_multiplier: "Global multiplier for transfer weight.",
  s3_storage_cost_eur: "S3 storage cost per TB per month.",
  s3_request_cost_per_1000_eur: "S3 cost per 1000 requests.",
  glacier_storage_cost_eur: "Glacier storage cost per TB per month.",
  glacier_retrieval_cost_per_gb_eur: "Glacier retrieval cost per GB.",
  hot_days: "Retention days in the Hot tier.",
  warm_days: "Retention days in the Warm tier.",
  size_multiplier: "Global multiplier for the size of all files.",
  target_total_size_gb: "Force the total simulated dataset size (global rescale).",
  download_multiplier: "Global multiplier for download time.",
  bandwidth_mbps: "Simulated bandwidth (Mbps); limits minimum download time.",
  force_job_type: "Force the job type for all files (Query, ETL, ML).",
  scan_ratio_per_query: "Fraction of the file scanned per query (Athena).",
  s3_rate_multiplier: "Multiplier for storage cost per tier.",
  job_weights: "Relative weight of each job type (Query, ETL, ML) for cost calculation.",
};

/* =======================
  EQUALIZER DEFINITION
  ======================= */
const VARS = [
  // Hybrid spezifisch
  { key: "onprem_pct", label: "OnPrem Anteil (%)", icon: "🏢", type: "slider", min: 0, max: 100, step: 1, unit: "%", group: "hybrid", default: 70 },
  { key: "cloud_pct", label: "Cloud Anteil (%)", icon: "☁️", type: "slider", min: 0, max: 100, step: 1, unit: "%", group: "hybrid", default: 30 },
  // On-Prem spezifisch
  { key: "tier_rates", label: "Tier Rates", icon: "🏷️", type: "custom", group: "onprem" },
  { key: "compute_cost_per_server", label: "Compute €/Server/Day", icon: "🖥️", type: "number", min: 0, max: 1000, step: 1, unit: "€", group: "onprem", default: 0 },
  { key: "num_servers", label: "#Servers", icon: "🖥️", type: "number", min: 1, max: 100, step: 1, unit: "", group: "onprem", default: 2 },
  { key: "utilization_factor", label: "Utilization Factor", icon: "⚡", type: "number", min: 0, max: 1, step: 0.001, unit: "", group: "onprem", default: 0 },
  { key: "power_kw_per_server", label: "Power kW/Server", icon: "🔌", type: "number", min: 0, max: 10, step: 0.01, unit: "kW", group: "onprem", default: 0 },
  { key: "price_per_kwh", label: "Price €/kWh", icon: "💡", type: "number", min: 0, max: 1, step: 0.01, unit: "€", group: "onprem", default: 0 },
  { key: "hardware_cost_total", label: "Hardware Cost €", icon: "💾", type: "number", min: 0, max: 1000000, step: 100, unit: "€", group: "onprem", default: 0 },
  { key: "depreciation_years", label: "Depreciation Years", icon: "📉", type: "number", min: 1, max: 20, step: 1, unit: "y", group: "onprem", default: 5 },
  // Lakehouse-OnPrem spezifisch
  { key: "internal_maintenance_cost_per_day", label: "Maintenance €/Day", icon: "🛠️", type: "number", min: 0, max: 1000, step: 1, unit: "€", group: "lakehouse_onprem", default: 15 },
  { key: "lambda_cost_per_execution", label: "Lambda Cost/Exec", icon: "🧬", type: "number", min: 0, max: 10, step: 0.01, unit: "€", group: "lakehouse_onprem", default: 0 },
  { key: "s3_cost_per_day", label: "S3 Cost/Day", icon: "🪣", type: "number", min: 0, max: 10, step: 0.01, unit: "€", group: "lakehouse_onprem", default: 0 },
  { key: "athena_cost_per_day", label: "Athena Cost/Day", icon: "🧮", type: "number", min: 0, max: 10, step: 0.01, unit: "€", group: "lakehouse_onprem", default: 0 },
  { key: "lifespan_days", label: "Hardware Lifespan (Days)", icon: "📆", type: "number", min: 1, max: 3650, step: 1, unit: "d", group: "lakehouse_onprem", default: 1825 },
  // Databricks spezifisch
  { key: "databricks_storage_cost_per_tb", label: "Databricks Storage €/TB/Day", icon: "🗄️", type: "number", min: 0, max: 2, step: 0.01, unit: "€", group: "databricks", default: 0.55 },
  { key: "databricks_query_cost_per_tb", label: "Databricks Query €/TB", icon: "🔎", type: "number", min: 0, max: 10, step: 0.01, unit: "€", group: "databricks", default: 4.6 },
  { key: "databricks_dbu_cost_per_hour", label: "DBU Cost $/h", icon: "💲", type: "number", min: 0, max: 2, step: 0.01, unit: "$", group: "databricks", default: 0.55 },
  { key: "databricks_cluster_multiplier", label: "Cluster Multiplier", icon: "🖧", type: "number", min: 1, max: 2, step: 0.01, unit: "x", group: "databricks", default: 1.2 },
  // Base
  { key: "eur_to_eur", label: "EUR→EUR", icon: "💶", type: "number", min: 1, max: 1, step: 0.01, unit: "", group: "base", default: 1 },
  { key: "athena_cost_per_tb_eur", label: "Athena €/TB", icon: "🧮", type: "number", min: 0, max: 20, step: 0.1, unit: "€", group: "base", default: 0 },

  // Query/Job
  { key: "num_queries", label: "#Queries", icon: "🔢", type: "number", min: 0, max: 1000, step: 1, unit: "", group: "query", default: 0 },
  { key: "query_fraction", label: "%Files Query", icon: "📊", type: "slider", min: 0, max: 100, step: 1, unit: "%", group: "query", default: 0 },
  { key: "query_repeat", label: "Repeat", icon: "🔁", type: "number", min: 0, max: 100, step: 1, unit: "", group: "query", default: 0 },
  { key: "heavy_hitter_fraction", label: "HH %", icon: "🔥", type: "slider", min: 0, max: 100, step: 1, unit: "%", group: "query", default: 0 },
  { key: "heavy_hitter_multiplier", label: "HH Mult", icon: "💥", type: "number", min: 0, max: 20, step: 1, unit: "x", group: "query", default: 0 },
  { key: "random_seed", label: "Seed", icon: "🎲", type: "number", min: 0, max: 9999, step: 1, unit: "", group: "query", default: 0 },

  // Egress/Transfer
  { key: "egress_tiers", label: "Egress Tiers", icon: "📈", type: "custom", group: "egress" },
  { key: "transfer_monthly_free_gb", label: "Free GB/mo", icon: "🎁", type: "number", min: 0, max: 10000, step: 1, unit: "GB", group: "egress", default: 0 },
  { key: "egress_price_1_eur", label: "Egress €1", icon: "💸", type: "number", min: 0, max: 1, step: 0.01, unit: "€", group: "egress", default: 0 },
  { key: "egress_price_2_eur", label: "Egress €2", icon: "💸", type: "number", min: 0, max: 1, step: 0.01, unit: "€", group: "egress", default: 0 },
  { key: "egress_price_3_eur", label: "Egress €3", icon: "💸", type: "number", min: 0, max: 1, step: 0.01, unit: "€", group: "egress", default: 0 },
  { key: "egress_price_4_eur", label: "Egress €4", icon: "💸", type: "number", min: 0, max: 1, step: 0.01, unit: "€", group: "egress", default: 0 },

  // Transfer-Logic
  { key: "result_egress_ratio", label: "Result Egress %", icon: "📤", type: "slider", min: 0, max: 100, step: 1, unit: "%", group: "transfer", default: 0 },
  { key: "transfer_weights", label: "Transfer Weights", icon: "⚖️", type: "custom", group: "transfer" },

  // Multipliers
  { key: "athena_weight_multiplier", label: "Athena Mult", icon: "🧮", type: "slider", min: 0, max: 5, step: 0.01, unit: "x", group: "mult", default: 0 },
  { key: "transfer_weight_multiplier", label: "Transf. Mult", icon: "⚡", type: "slider", min: 0, max: 5, step: 0.01, unit: "x", group: "mult", default: 0 },

  // Storage & Lifecycle
  { key: "s3_storage_cost_eur", label: "S3 €/TB/Month", icon: "🪣", type: "number", min: 0, max: 10, step: 0.01, unit: "€", group: "storage", default: 0 },
  { key: "s3_request_cost_per_1000_eur", label: "S3 €/1000 Requests", icon: "🧮", type: "number", min: 0, max: 1, step: 0.001, unit: "€", group: "storage", default: 0 },
  { key: "glacier_storage_cost_eur", label: "Glacier €/TB/Month", icon: "🧊", type: "number", min: 0, max: 10, step: 0.01, unit: "€", group: "storage", default: 0 },
  { key: "glacier_retrieval_cost_per_gb_eur", label: "Glacier Retrieval €/GB", icon: "🧊", type: "number", min: 0, max: 1, step: 0.001, unit: "€", group: "storage", default: 0 },
  { key: "hot_days", label: "Hot Days", icon: "🔥", type: "number", min: 0, max: 365, step: 1, unit: "d", group: "storage", default: 0 },
  { key: "warm_days", label: "Warm Days", icon: "🌤️", type: "number", min: 0, max: 365, step: 1, unit: "d", group: "storage", default: 0 },

  // Size & Bandwidth
  { key: "size_multiplier", label: "Size Mult", icon: "📦", type: "slider", min: 0, max: 5, step: 0.01, unit: "x", group: "size", default: 0 },
  { key: "target_total_size_gb", label: "Target Size", icon: "🎯", type: "number", min: 0, max: 100000, step: 1, unit: "GB", group: "size", default: 0 },
  { key: "download_multiplier", label: "DL Mult", icon: "⬇️", type: "slider", min: 0, max: 5, step: 0.01, unit: "x", group: "size", default: 0 },
  { key: "bandwidth_mbps", label: "Bandwidth", icon: "🌐", type: "number", min: 0, max: 10000, step: 1, unit: "Mbps", group: "size", default: 0 },

  // Job
  { key: "force_job_type", label: "Job Type", icon: "👷", type: "select", options: ["", "Query", "ETL", "ML"], group: "job", default: 0 },

  // Scan
  { key: "scan_ratio_per_query", label: "Scan Ratio", icon: "🔍", type: "slider", min: 0, max: 100, step: 1, unit: "%", group: "scan", default: 0 },

  // S3 Rate Multipliers
  { key: "s3_rate_multiplier", label: "S3 Mult", icon: "🪣", type: "custom", group: "s3" },

  // Job Weights
  { key: "job_weights", label: "Job Weights", icon: "⚖️", type: "custom", group: "job" },
];

/* =======================
  DISABLE RULES
  ======================= */
function isDisabled(key, values) {
  const queryParams = ["query_fraction", "query_repeat", "heavy_hitter_fraction", "heavy_hitter_multiplier", "random_seed"];
  if (key && queryParams.includes(key) && values.num_queries) return true;

  const egressPriceKeys = [
    "transfer_monthly_free_gb",
    "egress_price_1_eur",
    "egress_price_2_eur",
    "egress_price_3_eur",
    "egress_price_4_eur",
    "egress_price_1_usd",
    "egress_price_2_usd",
    "egress_price_3_usd",
    "egress_price_4_usd",
  ];
  if (key && egressPriceKeys.includes(key) && values.egress_tiers) return true;

  if (key === "transfer_weights" && values.result_egress_ratio) return true;
  if (key === "job_weights" && values.force_job_type) return true;
  if (key === "force_job_type" && values.job_weights && Object.values(values.job_weights).some((v) => v > 0)) return true;

  return false;
}

/* =======================
  ATOMIC COMPONENTS (redesigned)
  ======================= */
const Label = ({ children }) => <span className={subLabel}>{children}</span>;
const Value = ({ children }) => <span className={valueMono}>{children}</span>;

const FieldShell = ({ disabled, children }) => (
  <div
    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border ${
      disabled ? "opacity-50" : ""
    } border-zinc-200 bg-white/70 dark:bg-zinc-950/40 dark:border-white/10`}
  >
    {children}
  </div>
);

const CompactBar = ({ label, value, min, max, step, unit, icon, onChange, disabled }) => (
  <FieldShell disabled={disabled}>
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <Label>{label}</Label>
    </div>
    <div className="flex-1 mx-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500"
        disabled={disabled}
      />
    </div>
    <Value>
      {value}
      {unit}
    </Value>
  </FieldShell>
);

const CompactNumber = ({ label, value, min, max, step, unit, icon, onChange, disabled }) => {
  const [inputValue, setInputValue] = useState(value === null || value === undefined ? "" : value);
  const [lastValid, setLastValid] = useState(value);

  React.useEffect(() => {
    // Wenn value sich von außen ändert, aktualisiere das Input-Feld und den Cache
    setInputValue(value === null || value === undefined ? "" : value);
    if (value !== null && value !== undefined && value !== "") {
      setLastValid(value);
    }
  }, [value]);

  const handleInput = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (val === "") {
      // Zeige im UI leer, aber übergebe den letzten gültigen Wert an die Simulation
      onChange(lastValid);
    } else {
      const num = Number(val);
      setLastValid(num);
      onChange(num);
    }
  };

  return (
    <FieldShell disabled={disabled}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <Label>{label}</Label>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={inputValue}
        onChange={handleInput}
        className="w-28 text-right border rounded-lg px-2 py-1 bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700"
        disabled={disabled}
      />
      <Value>{unit}</Value>
    </FieldShell>
  );
};

const CompactSelect = ({ label, value, options, icon, onChange, disabled }) => (
  <FieldShell disabled={disabled}>
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <Label>{label}</Label>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-28 border rounded-lg px-2 py-1 bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700 text-sm"
      disabled={disabled}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt || "(auto)"}
        </option>
      ))}
    </select>
    <div className="w-6" />
  </FieldShell>
);

/* ==== Custom dialogs with chip style ==== */
const customFieldDefs = {
  egress_tiers: [
    { name: "tier1_limit_gb", label: "Tier 1 Limit (GB)", type: "number", min: 0, default: 0 },
  { name: "tier1_price", label: "Tier 1 Price (€/GB)", type: "number", min: 0, step: 0.01, default: 0 },
    { name: "tier2_limit_gb", label: "Tier 2 Limit (GB)", type: "number", min: 0, default: 0 },
  { name: "tier2_price", label: "Tier 2 Price (€/GB)", type: "number", min: 0, step: 0.01, default: 0 },
    { name: "tier3_limit_gb", label: "Tier 3 Limit (GB)", type: "number", min: 0, default: 0 },
  { name: "tier3_price", label: "Tier 3 Price (€/GB)", type: "number", min: 0, step: 0.01, default: 0 },
  { name: "tier4_price", label: "Tier 4 Price (€/GB)", type: "number", min: 0, step: 0.01, default: 0 },
  ],
  transfer_weights: [
    { name: "intra_weight", label: "Intra Weight", type: "number", min: 0, step: 0.01, default: 0 },
    { name: "inter_weight", label: "Inter Weight", type: "number", min: 0, step: 0.01, default: 0 },
  ],
  s3_rate_multiplier: [
    { name: "hot", label: "Hot Multiplier", type: "number", min: 0, step: 0.01, default: 0 },
    { name: "warm", label: "Warm Multiplier", type: "number", min: 0, step: 0.01, default: 0 },
    { name: "archive", label: "Archive Multiplier", type: "number", min: 0, step: 0.01, default: 0 },
  ],
  job_weights: [
    { name: "query", label: "Query Weight", type: "number", min: 0, step: 0.01, default: 0 },
    { name: "etl", label: "ETL Weight", type: "number", min: 0, step: 0.01, default: 0 },
    { name: "ml", label: "ML Weight", type: "number", min: 0, step: 0.01, default: 0 },
  ],
  tier_rates: [
    { name: "hot", label: "Hot Tier Rate (€/TB/day)", type: "number", min: 0, step: 0.01, default: 0.55 },
    { name: "cool", label: "Cool Tier Rate (€/TB/day)", type: "number", min: 0, step: 0.01, default: 0.31 },
    { name: "archive", label: "Archive Tier Rate (€/TB/day)", type: "number", min: 0, step: 0.01, default: 0.06 },
  ],
};

const CustomPlaceholder = ({ label, icon, value, onChange, fieldKey, disabled }) => {
  const [open, setOpen] = useState(false);
  const def = customFieldDefs[fieldKey] || [];
  const getDefault = () => {
    const obj = {};
    def.forEach((f) => (obj[f.name] = f.default ?? 0));
    return obj;
  };
  const [editValue, setEditValue] = useState(() => (value && Object.keys(value).length ? { ...value } : getDefault()));
  const handleInput = (name, val) => setEditValue((v) => ({ ...v, [name]: val }));
  const handleSave = () => {
    onChange(editValue);
    setOpen(false);
  };

  return (
    <FieldShell disabled={disabled}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <Label>{label}</Label>
      </div>
      <button className={chipBtn} onClick={() => setOpen((v) => !v)} disabled={disabled}>
        ✨ CUSTOM
      </button>
      <div className="w-6" />

      {open && !disabled && (
        <div className={`${cardBase} mt-3 p-4 w-full max-w-xl mx-auto`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-lg">
              <span>{icon}</span>
              <span className="font-semibold">{label}</span>
            </div>
            <button className={chipBtn} onClick={handleSave}>
              Save
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {def.length === 0 && <div className="text-xs text-zinc-500">No form defined.</div>}
            {def.map((f) => (
              <label key={f.name} className="text-xs space-y-1">
                <span className={subLabel}>{f.label}</span>
                <input
                  type={f.type}
                  min={f.min}
                  step={f.step}
                  value={editValue[f.name] ?? f.default ?? 0}
                  onChange={(e) => handleInput(f.name, e.target.value === "" ? 0 : Number(e.target.value))}
                  className="w-full border rounded-lg px-2 py-1 bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700"
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              className="px-3 py-1 rounded-lg border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </FieldShell>
  );
};

/* =======================
  GROUP MAP → EMOJI/TITLE
  ======================= */
const groupOrder = ["hybrid", "base", "query", "egress", "transfer", "mult", "storage", "size", "job", "scan", "s3", "onprem", "lakehouse_onprem", "databricks"];
const groupMeta = {
  hybrid: { title: "Hybrid Parameters", emoji: "🔀" },
  onprem: { title: "On-Prem Parameters", emoji: "🏢" },
  lakehouse_onprem: { title: "Lakehouse-OnPrem Parameter", emoji: "🏠" },
  databricks: { title: "Databricks Parameters", emoji: "🧊" },
  base: { title: "Base & Currency", emoji: "€" },
  query: { title: "Query / Job", emoji: "🧮" },
  egress: { title: "Egress / Transfer", emoji: "🚀" },
  transfer: { title: "Transfer Logic", emoji: "⚖️" },
  mult: { title: "Multipliers", emoji: "⚡" },
  storage: { title: "Storage & Lifecycle", emoji: "🌡️" },
  size: { title: "Size & Bandwidth", emoji: "📦" },
  job: { title: "Job Types", emoji: "👤" },
  scan: { title: "Scan / Query", emoji: "🔍" },
  s3: { title: "S3 Rate / Job Weights", emoji: "🪣" },
};

/* =======================
  ACCORDION (with Info button)
  ======================= */
const AccordionItem = ({
  id,
  title,
  emoji,
  summary,
  onInfo,
  defaultOpen = false,
  singleOpen = false,
  openId,
  setOpenId,
  children,
}) => {
  const isOpen = singleOpen ? openId === id : undefined;
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const expanded = singleOpen ? isOpen : localOpen;

  const toggle = () => {
    if (singleOpen) setOpenId(expanded ? null : id);
    else setLocalOpen(!expanded);
  };

  return (
    <div className={`${cardBase}`}>
      {/* Header */}
      <div className="w-full px-3 py-2 flex items-center justify-between rounded-2xl">
        <button
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls={`${id}-panel`}
          className="flex-1 text-left flex items-center gap-3"
        >
          <span className="text-xl">{emoji}</span>
          <span className="text-[15px] font-semibold">{title}</span>
          {summary ? (
            <span className="ml-2 text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
              {summary}
            </span>
          ) : null}
        </button>
  {/* Info button — opens the group modal */}
        <button
          onClick={onInfo}
          className="ml-2 w-6 h-6 grid place-items-center rounded-full border border-zinc-300 text-zinc-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 dark:border-zinc-700 dark:text-zinc-400"
          title="Info"
        >
          i
        </button>
      </div>

  {/* Panel with animation */}
      <div
        id={`${id}-panel`}
        className={`grid transition-[grid-template-rows] duration-300 ease-out overflow-hidden ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="px-4 pb-4 space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

/* =======================
  MAIN COMPONENT
  ======================= */
const SimulationEqualizer = ({ equalizerValues, updateEqualizerValue }) => {

  const getDefaultValues = () => {
    const obj = {};
    VARS.forEach((v) => {
      if (v.type !== "custom") obj[v.key] = v.default ?? null;
    });
    return obj;
  };

  const [values, setValues] = useState(() => {
    const defaults = getDefaultValues();
    const merged = { ...defaults, ...equalizerValues };
    // Wenn ein Wert null ist, bleibt das Feld leer
    Object.keys(merged).forEach((k) => {
      if (merged[k] === undefined) merged[k] = null;
    });
    return merged;
  });
  const [infoGroup, setInfoGroup] = useState(null);

  // Accordion: only one open
  const [openId, setOpenId] = useState(null);
  const singleOpen = true;

  // Synchronisiere Hybrid-Slider
  const handleChange = (key, val) => {
    if (key === "onprem_pct" || key === "cloud_pct") {
      const newOnprem = key === "onprem_pct" ? val : 100 - val;
      const newCloud = 100 - newOnprem;
      setValues((v) => ({ ...v, onprem_pct: newOnprem, cloud_pct: newCloud }));
      updateEqualizerValue("onprem_pct", newOnprem);
      updateEqualizerValue("cloud_pct", newCloud);
    } else {
      setValues((v) => ({ ...v, [key]: val }));
      updateEqualizerValue(key, val);
    }
  };

  // Agrupar
  const groups = {};
  VARS.forEach((v) => {
    if (!groups[v.group]) groups[v.group] = [];
    groups[v.group].push(v);
  });

  // Compact summary per group (how many fields changed)
  const groupSummary = (groupKey) => {
    const items = groups[groupKey] ?? [];
    const changed = items.filter((v) => {
      const current = values[v.key];
      const def = v.default ?? 0;
      const isObj = typeof current === "object" && current !== null;
      return isObj ? Object.keys(current).length > 0 : current !== def;
    }).length;
  return changed ? `${changed} changed` : "no changes";
  };

  return (
    <div className="rounded-3xl p-4 md:p-6 space-y-3 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 border border-white/60 dark:border-white/10">
      <div className="grid gap-3">
        {groupOrder.map((group) =>
          groups[group] ? (
            <AccordionItem
              key={group}
              id={group}
              title={groupMeta[group]?.title ?? group}
              emoji={groupMeta[group]?.emoji ?? "🎛️"}
              summary={groupSummary(group)}
              singleOpen={singleOpen}
              openId={openId}
              setOpenId={setOpenId}
              onInfo={() => setInfoGroup(group)}   // <-- Info button activates the modal
            >
              {/* Contenido del grupo */}
              {groups[group].map((v) => {
                const disabled = isDisabled(v.key, values);
                // Spread ohne key, key explizit setzen
                const { key, ...rest } = v;
                if (v.type === "slider") {
                  return (
                    <CompactBar
                      key={key}
                      {...rest}
                      value={values[key] === null || values[key] === undefined ? "" : values[key]}
                      onChange={(val) => handleChange(key, val)}
                      disabled={disabled}
                    />
                  );
                } else if (v.type === "number") {
                  return (
                    <CompactNumber
                      key={key}
                      {...rest}
                      value={values[key] === null || values[key] === undefined ? "" : values[key]}
                      onChange={(val) => handleChange(key, val)}
                      disabled={disabled}
                    />
                  );
                } else if (v.type === "select") {
                  return (
                    <CompactSelect
                      key={key}
                      {...rest}
                      value={values[key] ?? v.options[0]}
                      onChange={(val) => handleChange(key, val)}
                      disabled={disabled}
                    />
                  );
                } else if (v.type === "custom") {
                  return (
                    <CustomPlaceholder
                      key={key}
                      {...rest}
                      value={values[key]}
                      onChange={(val) => handleChange(key, val)}
                      fieldKey={key}
                      disabled={disabled}
                    />
                  );
                }
                return null;
              })}
            </AccordionItem>
          ) : null
        )}
      </div>

  {/* Group info modal */}
      {infoGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50 p-4">
          <div className={`${cardBase} w-[720px] max-w-full p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-lg">
                <span>{groupMeta[infoGroup]?.emoji ?? "ℹ️"}</span>
                <span className="font-semibold">{groupMeta[infoGroup]?.title ?? infoGroup}</span>
              </div>
              <button className={chipBtn} onClick={() => setInfoGroup(null)}>
                Close
              </button>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {(groups[infoGroup] ?? []).map((v) => (
                <li key={v.key} className={`${cardBase} p-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{v.icon}</span>
                      <span className="font-medium text-sm">{v.label}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">[{v.key}]</span>
                  </div>
                  <p className="mt-2 text-[12px] text-zinc-700 dark:text-zinc-300">
                    {VAR_EXPLANATIONS[v.key] || "No description."}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationEqualizer;
