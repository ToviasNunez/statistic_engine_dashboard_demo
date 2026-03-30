import { useEffect, useState } from "react";
import "../styles/heartbeat.css";

export default function HeartbeatPulse({ pulseTrigger }) {
  const [points, setPoints] = useState(Array(200).fill(50)); // baseline flat line

  // Shift the line forward to simulate movement
  useEffect(() => {
    const interval = setInterval(() => {
      setPoints((prev) => [...prev.slice(1), 50]); // add flat point
    }, 60); // langsamer!
    return () => clearInterval(interval);
  }, []);

  // Add a heartbeat spike when new data comes in
  useEffect(() => {
    if (!pulseTrigger) return;

    const spike = [
      // Vor dem Spike (flach)
      50, 50, 50, 50, 50, 50, 50, 50,
      // P-Welle (kleine Vorwelle)
      52, 54, 56, 54, 52, 50,
      // Q (kurzes Tal)
      45, 40,
      // R (sehr hoher, schmaler Peak)
      20, 8,
      // S (schneller Abfall)
      30, 45,
      // T-Welle (Recovery, breite Nachwelle)
      55, 60, 62, 60, 58, 55, 52, 50,
      // Nach dem Spike wieder Basislinie (flach)
      50, 50, 50, 50, 50, 50, 50, 50, 50, 50
    ];

    setPoints((prev) => {
      const newPoints = [...prev.slice(spike.length), ...spike];
      return newPoints;
    });
  }, [pulseTrigger]);

  // Für die Richtung rechts → links (NICHT spiegeln!):
  const path = points.map((y, i) => `${i},${y}`).join(" ");

  return (
    <div className="heartbeat-container">
      <svg viewBox="0 0 200 100" className="heartbeat-svg">
        <polyline points={path} className="heartbeat-line" />
      </svg>
    </div>
  );
}
