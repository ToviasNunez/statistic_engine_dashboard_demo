import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const liveRefreshIntervalMs = 5000;
const websocketReconnectDelayMs = 3000;
const websocketHeartbeatIntervalMs = 20000;
const liveBootstrapEventLimit = 400;
const liveEventBufferSize = 600;
const liveValidationRequestLimit = 60;

const trackingApiBaseUrl = (import.meta.env.VITE_TRACKING_API_URL ?? 'http://localhost:8124');
const trackingWebsocketBaseUrl = trackingApiBaseUrl.startsWith('https://')
  ? trackingApiBaseUrl.replace('https://', 'wss://')
  : trackingApiBaseUrl.replace('http://', 'ws://');

function eventKey(event) {
  return [
    event.tracking_id,
    event.step,
    event.timestamp,
    event.status,
    event.source,
    event.target,
  ].join('::');
}

function mergeEvents(currentEvents, nextEvents) {
  const merged = new Map();

  for (const event of currentEvents) {
    merged.set(eventKey(event), event);
  }

  for (const event of nextEvents) {
    merged.set(eventKey(event), event);
  }

  return Array.from(merged.values())
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
    .slice(-liveEventBufferSize);
}

function mergeValidationRequests(currentRecords, nextRecords) {
  const merged = new Map();

  for (const record of currentRecords) {
    merged.set(record.request_id, record);
  }

  for (const record of nextRecords) {
    merged.set(record.request_id, record);
  }

  return Array.from(merged.values()).sort(
    (left, right) => new Date(right.checked_at).getTime() - new Date(left.checked_at).getTime(),
  );
}

function resolveStationId(rawStationId) {
  if (rawStationId === 'incoming') {
    return 'einbeck';
  }

  if (rawStationId === 'etl-inject') {
    return 'inject';
  }

  if (rawStationId === 'etl-export') {
    return 'exporter';
  }

  if (rawStationId === 'etl-register') {
    return 'register';
  }

  if (rawStationId === 'trino') {
    return 'trino';
  }

  if (rawStationId === 'dashboard') {
    return 'dashboard';
  }

  return rawStationId;
}

function buildEventRoute(event) {
  if (!event) {
    return [];
  }

  if (event.step === 'rabbitmq-notify-export') {
    return ['inject', 'rabbitmq'];
  }

  if (event.step === 'rabbitmq-trigger-export') {
    return ['rabbitmq', 'exporter'];
  }

  if (event.step === 'rabbitmq-notify-register') {
    return ['exporter', 'rabbitmq'];
  }

  if (event.step === 'rabbitmq-trigger-register') {
    return ['rabbitmq', 'register'];
  }

  if (event.step === 'etl-inject') {
    return ['einbeck', 'inject', 'postgresql'];
  }

  if (event.step === 'etl-export') {
    return ['postgresql', 'exporter', 'minio'];
  }

  if (event.step === 'etl-register') {
    return ['minio', 'register', 'iceberg'];
  }

  if (event.step.startsWith('trino')) {
    return ['iceberg', 'trino', 'dashboard'];
  }

  return [event.source, event.step, event.target]
    .map((stationId) => resolveStationId(stationId))
    .filter((stationId, index, list) => Boolean(stationId) && list.indexOf(stationId) === index);
}

function normalizeTrackingEvent(event, index) {
  return {
    id: `${event.tracking_id}-${event.step}-${event.timestamp}-${index}`,
    timestamp: event.timestamp,
    trackingId: event.tracking_id,
    datasetId: event.dataset_id,
    label: event.message || event.step,
    payload: event.size_bytes ? `${Math.round(event.size_bytes / 1024)} KB` : 'live',
    route: buildEventRoute(event),
    kind: event.step.startsWith('trino') ? 'analytics' : 'ingest',
    status: event.status,
    step: event.step,
    source: event.source,
    target: event.target,
    rawEvent: event,
  };
}

function findValidationForEvent(event, validationRequests) {
  if (!event) {
    return null;
  }

  return validationRequests.find((record) => (
    record.tracking_id === event.tracking_id && record.dataset_id === event.dataset_id
  )) ?? null;
}

export function useGeoMapFeed() {
  const [liveEvents, setLiveEvents] = useState([]);
  const [validationRequests, setValidationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestTimestampRef = useRef(null);

  const refreshValidationRequests = useCallback(async () => {
    const response = await axios.get(`${trackingApiBaseUrl}/tracking/validation/requests`, {
      params: { limit: liveValidationRequestLimit },
    });

    setValidationRequests((current) => mergeValidationRequests(current, response.data));
  }, []);

  const triggerRefresh = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axios.get(`${trackingApiBaseUrl}/tracking/events`, {
        params: latestTimestampRef.current
          ? { since: latestTimestampRef.current }
          : { limit: liveBootstrapEventLimit },
      });

      const payload = Array.isArray(response.data) ? response.data : [];
      await refreshValidationRequests();
      setLiveEvents((current) => mergeEvents(current, payload));

      if (payload.length > 0) {
        latestTimestampRef.current = payload[payload.length - 1].timestamp;
      }

      setError(null);
    } catch (fetchError) {
      console.error('❌ useGeoMapFeed failed against tracking-app backend:', fetchError);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [refreshValidationRequests]);

  useEffect(() => {
    triggerRefresh();
    const intervalId = window.setInterval(triggerRefresh, liveRefreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [triggerRefresh]);

  useEffect(() => {
    let isCancelled = false;
    let socket = null;
    let reconnectTimerId = null;
    let heartbeatTimerId = null;

    const clearTimers = () => {
      if (reconnectTimerId !== null) {
        window.clearTimeout(reconnectTimerId);
        reconnectTimerId = null;
      }

      if (heartbeatTimerId !== null) {
        window.clearInterval(heartbeatTimerId);
        heartbeatTimerId = null;
      }
    };

    const connect = () => {
      if (isCancelled) {
        return;
      }

      socket = new WebSocket(`${trackingWebsocketBaseUrl}/tracking/live`);

      socket.onopen = () => {
        heartbeatTimerId = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, websocketHeartbeatIntervalMs);
      };

      socket.onmessage = (messageEvent) => {
        const payload = JSON.parse(messageEvent.data);
        latestTimestampRef.current = payload.timestamp;
        setLiveEvents((current) => mergeEvents(current, [payload]));

        if (payload.step === 'etl-register' && payload.status === 'completed') {
          void refreshValidationRequests().catch((refreshError) => {
            setError(refreshError.message);
          });
        }
      };

      socket.onerror = () => {
        if (!isCancelled) {
          setError('Tracking-app live socket failed');
        }
      };

      socket.onclose = () => {
        clearTimers();

        if (isCancelled) {
          return;
        }

        reconnectTimerId = window.setTimeout(connect, websocketReconnectDelayMs);
      };
    };

    connect();

    return () => {
      isCancelled = true;
      clearTimers();
      socket?.close();
    };
  }, [refreshValidationRequests]);

  const recentEvents = useMemo(() => {
    return liveEvents.map((event, index) => normalizeTrackingEvent(event, index));
  }, [liveEvents]);

  const currentTrackingEvent = liveEvents[liveEvents.length - 1] ?? null;
  const currentValidation = findValidationForEvent(currentTrackingEvent, validationRequests);

  return {
    recentEvents,
    currentEvent: recentEvents[recentEvents.length - 1] ?? null,
    currentValidation,
    loading,
    error,
    triggerRefresh,
  };
}