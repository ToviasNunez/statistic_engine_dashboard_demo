import { geoEquirectangular } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { useEffect, useMemo, useState } from "react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const mapWidth = 980;
const mapHeight = 540;
const mapCenter = [0, 10];
const mapScale = 156;
const liveAnimationFreshnessMs = 20000;

const COLORS = {
  background: "#faf8f5",
  primary: "#D95C12",
  tertiary: "#2c1810",
  muted: "#6d4c41",
  ocean: "#f8fafc",
  landDefault: "#f1f5f9",
  stroke: "#e2e8f0",
  source: "#D95C12",
  service: "#F0B400",
  storage: "#2f855a",
  query: "#2563eb",
  viewer: "#7c3aed",
  packet: "#2c1810",
  baseline: "#c9b8af",
  rabbit: "#f59e0b",
  register: "#22c55e",
  validation: "#c62828",
};

const STATIONS = {
  einbeck: { id: "einbeck", label: "KWS Einbeck", role: "source", coordinates: [9.9667, 51.8167], region: "Germany", country: "Germany" },
  inject: { id: "inject", label: "ETL Inject", role: "service", coordinates: [-46.6333, -23.5505], region: "South America", country: "Brazil" },
  postgresql: { id: "postgresql", label: "PostgreSQL", role: "storage", coordinates: [-3.7038, 40.4168], region: "Europe", country: "Spain" },
  rabbitmq: { id: "rabbitmq", label: "RabbitMQ", role: "service", coordinates: [36.8219, -1.2921], region: "Africa", country: "Kenya" },
  exporter: { id: "exporter", label: "ETL Export", role: "service", coordinates: [77.209, 28.6139], region: "Asia", country: "India" },
  minio: { id: "minio", label: "MinIO", role: "storage", coordinates: [151.2093, -33.8688], region: "Oceania", country: "Australia" },
  register: { id: "register", label: "ETL Register", role: "service", coordinates: [139.6917, 35.6895], region: "East Asia", country: "Japan" },
  iceberg: { id: "iceberg", label: "Iceberg", role: "storage", coordinates: [-21.8174, 64.1265], region: "North Atlantic", country: "Iceland" },
  trino: { id: "trino", label: "Trino", role: "query", coordinates: [55.2708, 25.2048], region: "Middle East", country: "United Arab Emirates" },
  dashboard: { id: "dashboard", label: "Dashboard", role: "viewer", coordinates: [-122.4194, 37.7749], region: "West Coast", country: "United States" },
};

const routeOrder = ["inject", "postgresql", "rabbitmq", "exporter", "minio", "register", "iceberg"];
const baselineOverviewRoutes = [["einbeck", "inject"], ["iceberg", "trino"], ["trino", "dashboard"]];

const projection = geoEquirectangular().translate([mapWidth / 2, mapHeight / 2]).center(mapCenter).scale(mapScale);

function getRoleColor(role) {
  switch (role) {
    case "source":
      return COLORS.source;
    case "service":
      return COLORS.service;
    case "storage":
      return COLORS.storage;
    case "query":
      return COLORS.query;
    case "viewer":
      return COLORS.viewer;
    default:
      return COLORS.muted;
  }
}

function statusColor(status) {
  switch (status) {
    case "processing":
      return "#0a6cff";
    case "completed":
      return "#10924b";
    case "failed":
      return COLORS.validation;
    case "retrying":
      return "#d97706";
    default:
      return COLORS.muted;
  }
}

function isRabbitNotificationStep(step) {
  return String(step ?? "").startsWith("rabbitmq-");
}

function uniqueEvents(events) {
  const seen = new Set();
  const result = [];

  for (const event of events) {
    const key = [event.trackingId, event.step, event.timestamp, event.source, event.target].join("::");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(event);
    }
  }

  return result;
}

function projectCoordinates(coordinates) {
  const projected = projection(coordinates);
  return projected ? [projected[0], projected[1]] : [0, 0];
}

function buildArcControlPoint(from, to) {
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const lift = Math.max(26, distance * 0.22);
  return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 - lift];
}

function buildArcPath(from, to) {
  const projectedFrom = projectCoordinates(from);
  const projectedTo = projectCoordinates(to);
  const controlPoint = buildArcControlPoint(projectedFrom, projectedTo);
  return `M ${projectedFrom[0]} ${projectedFrom[1]} Q ${controlPoint[0]} ${controlPoint[1]} ${projectedTo[0]} ${projectedTo[1]}`;
}

function interpolateArcPoint(from, to, progress) {
  const projectedFrom = projectCoordinates(from);
  const projectedTo = projectCoordinates(to);
  const [controlX, controlY] = buildArcControlPoint(projectedFrom, projectedTo);
  const inverse = 1 - progress;
  return [
    inverse * inverse * projectedFrom[0] + 2 * inverse * progress * controlX + progress * progress * projectedTo[0],
    inverse * inverse * projectedFrom[1] + 2 * inverse * progress * controlY + progress * progress * projectedTo[1],
  ];
}

function segmentIcon(event, segmentIndex, totalSegments) {
  if (isRabbitNotificationStep(event.step)) return "MQ";
  if (event.step === "etl-inject") return "IN";
  if (event.step === "etl-export") return segmentIndex === totalSegments - 1 ? "EX" : "PK";
  if (event.step === "etl-register") return segmentIndex === totalSegments - 1 ? "RG" : "EX";
  if (String(event.step ?? "").startsWith("trino")) return segmentIndex === totalSegments - 1 ? "UI" : "TR";
  return "PK";
}

function compactStepLabel(step) {
  return String(step ?? "").replace(/^rabbitmq-/, "mq ").replace(/^etl-/, "").replace(/-/g, " ");
}

function eventAccentColor(event) {
  return isRabbitNotificationStep(event.step) ? COLORS.rabbit : statusColor(event.status);
}

function segmentAccentColor(segment) {
  if (isRabbitNotificationStep(segment.event.step)) return COLORS.rabbit;
  if (segment.event.step === "etl-register" && segment.icon === "RG") return COLORS.register;
  return eventAccentColor(segment.event);
}

function isFreshLiveEvent(event, tick, freshnessMs) {
  const eventTime = new Date(event.timestamp).getTime();
  return !Number.isNaN(eventTime) && tick - eventTime <= freshnessMs;
}

function packetLabelWidth(trackingId) {
  return Math.max(54, String(trackingId).length * 6.4 + 14);
}

function buildFallbackEvents() {
  return [
    {
      id: "fallback-1",
      timestamp: new Date().toISOString(),
      trackingId: "SIM-001",
      status: "processing",
      step: "etl-export",
      source: "postgresql",
      target: "minio",
      route: ["postgresql", "exporter", "minio"],
    },
  ];
}

export default function GeoMap({ currentEvent = null, currentValidation = null, recentEvents = [], isLiveMode = true, loading = false, error = null }) {
  const [tick, setTick] = useState(() => Date.now());
  const [tooltip, setTooltip] = useState({ show: false, content: "", x: 0, y: 0 });

  const normalizedEvents = useMemo(() => {
  if (isLiveMode && currentEvent) return [currentEvent];
  if (Array.isArray(recentEvents) && recentEvents.length > 0) return recentEvents;
  if (currentEvent) return [currentEvent];
  return buildFallbackEvents();
}, [currentEvent, recentEvents, isLiveMode]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setTick(Date.now()), 40);
    return () => window.clearInterval(intervalId);
  }, []);

  const baselineRoutes = useMemo(() => {
    const mainChain = routeOrder.slice(0, -1).map((stationId, index) => ({
      id: `${stationId}-${routeOrder[index + 1]}`,
      from: STATIONS[stationId],
      to: STATIONS[routeOrder[index + 1]],
    }));

    const overviewRoutes = baselineOverviewRoutes.map(([fromId, toId]) => ({
      id: `${fromId}-${toId}`,
      from: STATIONS[fromId],
      to: STATIONS[toId],
    }));

    return [...mainChain, ...overviewRoutes];
  }, []);

  const trackedEvents = useMemo(() => {
    const activeEvents = normalizedEvents.filter((event) => {
      if (event.status !== "processing" && event.status !== "retrying") return false;
      return !isLiveMode || isFreshLiveEvent(event, tick, liveAnimationFreshnessMs);
    });

    const prioritizedRabbitEvents = activeEvents.filter((event) => isRabbitNotificationStep(event.step)).slice(-4);
    const recentPrimaryEvents = activeEvents.filter((event) => !isRabbitNotificationStep(event.step)).slice(-8);
    const combinedEvents = uniqueEvents([...recentPrimaryEvents, ...prioritizedRabbitEvents]).slice(-10);

    if (combinedEvents.length > 0) return combinedEvents;
    if (!currentEvent || isLiveMode) return [];
    return [currentEvent];
  }, [currentEvent, isLiveMode, normalizedEvents, tick]);

  const simulatedTransfers = useMemo(() => {
    return trackedEvents
      .map((event, index) => {
        const stationIds = Array.isArray(event.route) && event.route.length > 1 ? event.route : ["postgresql", "exporter", "minio"];
        const transferId = `${event.id}-${index}`;
        const segments = stationIds.slice(0, -1).map((stationId, segmentIndex) => ({
          id: `${transferId}-${stationId}-${stationIds[segmentIndex + 1]}`,
          transferId,
          event,
          from: STATIONS[stationId],
          to: STATIONS[stationIds[segmentIndex + 1]],
          icon: segmentIcon(event, segmentIndex, stationIds.length - 1),
        }));

        return { transferId, event, stationIds, segments };
      })
      .filter((transfer) => transfer.segments.length > 0);
  }, [trackedEvents]);

  const highlightedTransfer = simulatedTransfers[simulatedTransfers.length - 1] ?? null;
  const activeSegments = useMemo(() => simulatedTransfers.flatMap((transfer) => transfer.segments), [simulatedTransfers]);

  const animatedPackets = useMemo(() => {
    return simulatedTransfers.map((transfer, index) => {
      const speedFactor = isRabbitNotificationStep(transfer.event.step)
        ? 2400
        : transfer.event.status === "processing"
          ? 3200
          : 4200;
      const totalSegments = Math.max(transfer.segments.length, 1);
      const overallProgress = ((tick / speedFactor) + index * 0.23) % totalSegments;
      const segmentIndex = Math.min(Math.floor(overallProgress), totalSegments - 1);
      const localProgress = overallProgress - segmentIndex;
      const segment = transfer.segments[segmentIndex];

      return {
        id: transfer.transferId,
        trackingId: transfer.event.trackingId,
        icon: segment.icon,
        screenCoordinates: interpolateArcPoint(segment.from.coordinates, segment.to.coordinates, localProgress),
        accentColor: segmentAccentColor(segment),
        labelWidth: packetLabelWidth(transfer.event.trackingId),
      };
    });
  }, [simulatedTransfers, tick]);

  const activeStationIds = new Set(activeSegments.flatMap((segment) => [segment.from.id, segment.to.id]));
  const highlightedStationIds = new Set(highlightedTransfer?.stationIds ?? []);
  const validationStations = currentValidation ? ["dashboard", "trino", "iceberg", "minio"] : [];
  const validationRoutes = currentValidation
    ? [
        { id: "dashboard-trino", from: STATIONS.dashboard, to: STATIONS.trino },
        { id: "trino-iceberg", from: STATIONS.trino, to: STATIONS.iceberg },
        { id: "iceberg-minio", from: STATIONS.iceberg, to: STATIONS.minio },
      ]
    : [];
  const highlightedPacketId = highlightedTransfer?.transferId ?? null;

  return (
    <div className="relative" style={{ background: COLORS.background, borderRadius: "16px", padding: "16px", border: `2px solid ${COLORS.primary}`, boxShadow: "0 8px 24px rgba(217, 92, 18, 0.1)" }}>
      <div className="relative overflow-hidden" style={{ borderRadius: "12px", background: COLORS.ocean, border: `1px solid ${COLORS.stroke}` }}>
        {loading ? <div className="absolute left-4 top-4 z-10 rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700">Syncing map feed...</div> : null}
        {error ? <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-red-200 bg-white/95 px-3 py-2 text-xs font-medium text-red-700">Map feed error: {error}</div> : null}

        <ComposableMap projection="geoEquirectangular" projectionConfig={{ scale: mapScale, center: mapCenter }} width={mapWidth} height={mapHeight} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) => geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} fill={COLORS.landDefault} stroke={COLORS.stroke} strokeWidth={0.45} style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }} />)}
          </Geographies>

          {baselineRoutes.map((route) => <path key={route.id} d={buildArcPath(route.from.coordinates, route.to.coordinates)} fill="none" stroke={COLORS.baseline} strokeWidth={route.from.id === "einbeck" || route.to.id === "dashboard" ? 1 : 1.25} strokeLinecap="round" strokeDasharray="4 10" opacity={0.28} />)}
          {validationRoutes.map((route) => <path key={route.id} d={buildArcPath(route.from.coordinates, route.to.coordinates)} fill="none" stroke={COLORS.validation} strokeWidth={2.2} strokeLinecap="round" strokeDasharray="8 10" opacity={0.76} style={{ filter: `drop-shadow(0 0 6px ${COLORS.validation})` }} />)}

          {activeSegments.map((segment) => {
            const stroke = segmentAccentColor(segment);
            const isHighlighted = segment.transferId === highlightedTransfer?.transferId;
            return <path key={segment.id} d={buildArcPath(segment.from.coordinates, segment.to.coordinates)} fill="none" stroke={stroke} strokeWidth={isHighlighted ? 2.8 : 2} strokeLinecap="round" strokeDasharray={isRabbitNotificationStep(segment.event.step) ? "6 8" : undefined} opacity={isHighlighted ? 0.9 : 0.6} style={{ filter: `drop-shadow(0 0 6px ${stroke})` }} />;
          })}

          {Object.values(STATIONS).map((station) => {
            const active = activeStationIds.has(station.id);
            const highlighted = highlightedStationIds.has(station.id);
            const validationActive = validationStations.includes(station.id);
            const fill = active ? COLORS.packet : validationActive ? COLORS.validation : getRoleColor(station.role);
            const shouldShowLabel = active || highlighted || validationActive;

            return (
              <Marker key={station.id} coordinates={station.coordinates}>
                <g>
                  {active || validationActive ? <circle r={12} fill="none" stroke={fill} strokeWidth={1.4} style={{ animation: "ping 1.8s ease-out infinite" }} /> : null}
                  <circle r={highlighted || validationActive ? 8 : 6.5} fill={active ? `${fill}18` : `${getRoleColor(station.role)}15`} stroke="none" />
                  <circle r={highlighted || validationActive ? 4.8 : 3.8} fill={fill} stroke="#ffffff" strokeWidth={1.4} style={{ cursor: "pointer" }} onMouseEnter={(event) => setTooltip({ show: true, content: `${station.label} · ${station.region ?? station.country}, ${station.country}`, x: event.clientX, y: event.clientY })} onMouseLeave={() => setTooltip({ show: false, content: "", x: 0, y: 0 })} />
                  {shouldShowLabel ? <g><rect x={-38} y={-24} rx={6} ry={6} width={76} height={14} fill="rgba(255,255,255,0.94)" stroke={COLORS.stroke} strokeWidth={0.8} /><text textAnchor="middle" y={-14} fontSize={8} fontWeight="700" fill={COLORS.tertiary}>{station.label}</text></g> : null}
                </g>
              </Marker>
            );
          })}

          {animatedPackets.map((packet) => (
            <g key={packet.id} transform={`translate(${packet.screenCoordinates[0]}, ${packet.screenCoordinates[1]})`}>
              <rect x={-packet.labelWidth / 2} y={-24} rx={6} ry={6} width={packet.labelWidth} height={12} fill="rgba(255,255,255,0.94)" stroke={COLORS.stroke} strokeWidth={0.7} opacity={packet.id === highlightedPacketId ? 1 : 0.92} />
              <text textAnchor="middle" y={-15} fontSize={8} fontWeight="800" fill={COLORS.tertiary}>{packet.trackingId}</text>
              <circle r={9} fill="rgba(6, 12, 20, 0.94)" stroke={packet.accentColor} strokeWidth={1.5} opacity={0.99} />
              <text textAnchor="middle" y={3} fontSize={7} fontWeight="800" fill={packet.accentColor}>{packet.icon}</text>
            </g>
          ))}
        </ComposableMap>

        <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between gap-3 pointer-events-none">
          <div className="rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">pipeline mesh</div>
          <div className="flex items-center gap-2">
            {highlightedTransfer ? <div className="rounded-full border border-orange-200 bg-white/90 px-3 py-1 text-xs font-semibold text-orange-700">{animatedPackets.length} active · {compactStepLabel(highlightedTransfer.event.step)}</div> : null}
            {currentValidation ? <div className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700">validation path armed</div> : null}
          </div>
        </div>
      </div>

      {tooltip.show ? <div className="fixed z-50 rounded-lg px-3 py-2 text-sm pointer-events-none" style={{ left: tooltip.x + 12, top: tooltip.y - 8, background: COLORS.tertiary, color: COLORS.background, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }}>{tooltip.content}</div> : null}

      <style>{`
        @keyframes ping {
          0% { transform: scale(0.92); opacity: 0.72; }
          70% { transform: scale(1.95); opacity: 0; }
          100% { transform: scale(1.95); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
