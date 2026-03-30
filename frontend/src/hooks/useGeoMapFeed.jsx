import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STEP_DELAY_MS = 5000;
const NEXT_RUN_DELAY_MS = 3000;
const EVENT_BUFFER_SIZE = 300;
const VALIDATION_BUFFER_SIZE = 60;

const STORAGE_KEYS = {
  events: 'demo_tracking_events',
  validations: 'demo_tracking_validations',
};

const PROCESS_STEPS = [
  {
    step: 'etl-inject',
    source: 'incoming',
    target: 'etl-inject',
    message: 'Incoming dataset started injection',
    sizeMultiplier: 1.0,
    route: ['einbeck', 'inject', 'postgresql'],
  },
  {
    step: 'rabbitmq-notify-export',
    source: 'etl-inject',
    target: 'rabbitmq',
    message: 'Inject notified RabbitMQ',
    sizeMultiplier: 1.0,
    route: ['inject', 'rabbitmq'],
  },
  {
    step: 'rabbitmq-trigger-export',
    source: 'rabbitmq',
    target: 'etl-export',
    message: 'RabbitMQ triggered export',
    sizeMultiplier: 1.0,
    route: ['rabbitmq', 'exporter'],
  },
  {
    step: 'etl-export',
    source: 'postgresql',
    target: 'minio',
    message: 'Exporting dataset to MinIO',
    sizeMultiplier: 0.92,
    route: ['postgresql', 'exporter', 'minio'],
  },
  {
    step: 'rabbitmq-notify-register',
    source: 'etl-export',
    target: 'rabbitmq',
    message: 'Export notified RabbitMQ',
    sizeMultiplier: 0.92,
    route: ['exporter', 'rabbitmq'],
  },
  {
    step: 'rabbitmq-trigger-register',
    source: 'rabbitmq',
    target: 'etl-register',
    message: 'RabbitMQ triggered register',
    sizeMultiplier: 0.92,
    route: ['rabbitmq', 'register'],
  },
  {
    step: 'etl-register',
    source: 'minio',
    target: 'iceberg',
    message: 'Registering dataset in Iceberg',
    sizeMultiplier: 0.92,
    route: ['minio', 'register', 'iceberg'],
  },
  {
    step: 'trino-query-start',
    source: 'iceberg',
    target: 'trino',
    message: 'Trino query started',
    sizeMultiplier: 0.1,
    route: ['iceberg', 'trino'],
  },
  {
    step: 'trino-query-finish',
    source: 'trino',
    target: 'dashboard',
    message: 'Dashboard received results',
    sizeMultiplier: 0.02,
    route: ['trino', 'dashboard'],
  },
];

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore demo storage issues
  }
}

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
    .slice(-EVENT_BUFFER_SIZE);
}

function mergeValidationRequests(currentRecords, nextRecords) {
  const merged = new Map();

  for (const record of currentRecords) {
    merged.set(record.request_id, record);
  }

  for (const record of nextRecords) {
    merged.set(record.request_id, record);
  }

  return Array.from(merged.values())
    .sort((left, right) => new Date(right.checked_at).getTime() - new Date(left.checked_at).getTime())
    .slice(0, VALIDATION_BUFFER_SIZE);
}

function normalizeTrackingEvent(event, index) {
  const rawId = String(event.tracking_id ?? '');
  const numbersOnly = rawId.replace(/\D/g, ''); // quita todo menos números
  const shortTrackingId = numbersOnly.slice(-4); // últimos 4 números // 👈 últimos 4

  return {
    id: `${event.tracking_id}-${event.step}-${event.timestamp}-${index}`,
    timestamp: event.timestamp,
    trackingId: shortTrackingId,
    fullTrackingId: event.tracking_id,
    datasetId: event.dataset_id,
    label: event.message || event.step,
    payload: event.size_bytes ? `${Math.round(event.size_bytes / 1024)} KB` : 'live',
    route: event.route ?? [],
    kind: String(event.step ?? '').startsWith('trino') ? 'analytics' : 'ingest',
    status: event.status,
    step: event.step,
    source: event.source,
    target: event.target,
    rawEvent: event,
  };
}

function findValidationForEvent(event, validationRequests) {
  if (!event) return null;

  return validationRequests.find(
    (record) =>
      record.tracking_id === event.fullTrackingId &&
      record.dataset_id === event.datasetId,
  ) ?? null;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTrackingRun() {
  const now = Date.now();
  const trackingId = `thread-${now}-${Math.random().toString(36).slice(2, 7)}`;
  const datasetId = `dataset-${new Date(now).toISOString().slice(0, 10)}-${randomBetween(100, 999)}`;
  const baseSizeBytes = randomBetween(120 * 1024 * 1024, 900 * 1024 * 1024);

  return {
    tracking_id: trackingId,
    dataset_id: datasetId,
    started_at: new Date(now).toISOString(),
    size_bytes: baseSizeBytes,
  };
}

function createEvent(run, stepConfig, status = 'processing') {
  return {
    tracking_id: run.tracking_id,
    dataset_id: run.dataset_id,
    step: stepConfig.step,
    timestamp: new Date().toISOString(),
    status,
    source: stepConfig.source,
    target: stepConfig.target,
    message: stepConfig.message,
    size_bytes: Math.round(run.size_bytes * stepConfig.sizeMultiplier),
    route: stepConfig.route,
  };
}

function createValidationRecord(run) {
  const passed = Math.random() > 0.08;

  return {
    request_id: `val-${run.tracking_id}`,
    tracking_id: run.tracking_id,
    dataset_id: run.dataset_id,
    checked_at: new Date().toISOString(),
    status: passed ? 'passed' : 'warning',
    message: passed
      ? 'Validation completed successfully'
      : 'Validation completed with minor schema warning',
    rule_count: randomBetween(4, 12),
  };
}

export function useGeoMapFeed() {
  const [liveEvents, setLiveEvents] = useState(() => readStorage(STORAGE_KEYS.events, []));
  const [validationRequests, setValidationRequests] = useState(() => readStorage(STORAGE_KEYS.validations, []));
  const [currentEvent, setCurrentEvent] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cancelledRef = useRef(false);

  const persistEvents = useCallback((updater) => {
    setLiveEvents((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      writeStorage(STORAGE_KEYS.events, next);
      return next;
    });
  }, []);

  const persistValidations = useCallback((updater) => {
    setValidationRequests((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      writeStorage(STORAGE_KEYS.validations, next);
      return next;
    });
  }, []);

  const triggerRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const storedEvents = readStorage(STORAGE_KEYS.events, []);
      const storedValidations = readStorage(STORAGE_KEYS.validations, []);
      setLiveEvents(storedEvents);
      setValidationRequests(storedValidations);
      setCurrentEvent(storedEvents[storedEvents.length - 1] ?? null);
      setError(null);
    } catch (refreshError) {
      setError(refreshError.message || 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const runSingleThread = useCallback(async () => {
    const run = createTrackingRun();

    setActiveThread(run);
    setActiveStep(PROCESS_STEPS[0]?.step ?? null);

    for (const stepConfig of PROCESS_STEPS) {
      if (cancelledRef.current) {
        return;
      }

      const processingEvent = createEvent(run, stepConfig, 'processing');

      setCurrentEvent(processingEvent);
      setActiveStep(stepConfig.step);
      persistEvents((current) => mergeEvents(current, [processingEvent]));

      console.log(
        '[THREAD]',
        run.tracking_id,
        '| status: processing',
        '| step:',
        stepConfig.step,
        '| route:',
        stepConfig.route.join(' -> ')
      );

      await sleep(STEP_DELAY_MS);

      if (cancelledRef.current) {
        return;
      }

      const completedEvent = createEvent(run, stepConfig, 'completed');

      setCurrentEvent(completedEvent);
      persistEvents((current) => mergeEvents(current, [completedEvent]));

      if (stepConfig.step === 'etl-register') {
        const validation = createValidationRecord(run);
        persistValidations((current) => mergeValidationRequests(current, [validation]));
      }
    }

    if (!cancelledRef.current) {
      await sleep(NEXT_RUN_DELAY_MS);
    }
  }, [persistEvents, persistValidations]);

  useEffect(() => {
    cancelledRef.current = false;

    const startLoop = async () => {
      await triggerRefresh();

      while (!cancelledRef.current) {
        try {
          await runSingleThread();
        } catch (loopError) {
          console.error('❌ simulation loop failed:', loopError);
          setError(loopError.message || 'Simulation loop failed');
          await sleep(2000);
        }
      }
    };

    void startLoop();

    return () => {
      cancelledRef.current = true;
    };
  }, [runSingleThread, triggerRefresh]);

  const recentEvents = useMemo(() => {
    return liveEvents.map((event, index) => normalizeTrackingEvent(event, index));
  }, [liveEvents]);

  const normalizedCurrentEvent = useMemo(() => {
    if (!currentEvent) return null;
    return normalizeTrackingEvent(currentEvent, 0);
  }, [currentEvent]);

  const currentValidation = findValidationForEvent(currentEvent, validationRequests);

  return {
    recentEvents,
    currentEvent: normalizedCurrentEvent,
    currentValidation,
    activeThread,
    activeStep,
    loading,
    error,
    triggerRefresh,
  };
}