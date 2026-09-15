import { useEffect, useState } from "react";
import { Skull, Compass } from "lucide-react";

const LOADING_MESSAGES = [
  "Uncharting the Seven Seas...",
  "Calculating doubloon reserves...",
  "Navigating archipelago charts...",
  "Restocking rum & gunpowder...",
  "Raising Captain's Ledger...",
];

export default function LoadingGate({ onFinish }: { onFinish?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsExiting(true);
          setTimeout(() => onFinish?.(), 600);
          return 100;
        }
        const diff = Math.floor(Math.random() * 12) + 6;
        return Math.min(prev + diff, 100);
      });
    }, 120);

    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [onFinish]);

  return (
    <div className={`entry-gate ${isExiting ? "gate-exit" : ""}`} aria-label="Loading Captain's Ledger">
      <div className="gate-backdrop" />
      <div className="gate-vignette" />
      <div className="gate-content">
        <div className="gate-emblem-wrap">
          <div className="gate-compass-ring">
            <Compass size={86} />
          </div>
          <div className="gate-skull-core">
            <Skull size={34} />
          </div>
        </div>

        <div className="gate-title">
          <span className="pirate-gothic">PIRATE</span>
          <span className="cinzel-title">TREASURE TRACKER</span>
        </div>

        <div className="gate-bar-wrap">
          <div className="gate-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="gate-status">
          <span>{LOADING_MESSAGES[msgIndex]}</span>
          <b>{progress}%</b>
        </div>
      </div>
    </div>
  );
}
