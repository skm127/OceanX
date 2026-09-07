/**
 * TimeAnimator — Play/Pause/Speed controls for time-step animation.
 * Auto-advances through time steps when playing.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import './TimeAnimator.css';

interface TimeAnimatorProps {
  timeIndex: number;
  timeSteps: number;
  dates: string[];
  loading: boolean;
  onTimeChange: (timeIndex: number) => void;
}

const SPEED_OPTIONS = [
  { label: '0.5x', ms: 2000 },
  { label: '1x', ms: 1000 },
  { label: '2x', ms: 500 },
  { label: '5x', ms: 200 },
];

export default function TimeAnimator({
  timeIndex,
  timeSteps,
  dates,
  loading,
  onTimeChange,
}: TimeAnimatorProps) {
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // Default 1x
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDate = dates[timeIndex] || `Step ${timeIndex + 1}`;

  // Animation loop
  useEffect(() => {
    if (playing && !loading) {
      intervalRef.current = setInterval(() => {
        onTimeChange((timeIndex + 1) % timeSteps);
      }, SPEED_OPTIONS[speedIdx].ms);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, loading, timeIndex, timeSteps, speedIdx, onTimeChange]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIdx((i) => (i + 1) % SPEED_OPTIONS.length);
  }, []);

  const stepBack = useCallback(() => {
    setPlaying(false);
    onTimeChange((timeIndex - 1 + timeSteps) % timeSteps);
  }, [timeIndex, timeSteps, onTimeChange]);

  const stepForward = useCallback(() => {
    setPlaying(false);
    onTimeChange((timeIndex + 1) % timeSteps);
  }, [timeIndex, timeSteps, onTimeChange]);

  return (
    <div className="time-animator">
      <div className="time-controls">
        <button className="time-btn" onClick={stepBack} title="Previous">
          ◀◀
        </button>
        <button
          className={`time-btn play-btn ${playing ? 'active' : ''}`}
          onClick={togglePlay}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button className="time-btn" onClick={stepForward} title="Next">
          ▶▶
        </button>
        <button className="time-btn speed-btn" onClick={cycleSpeed} title="Speed">
          {SPEED_OPTIONS[speedIdx].label}
        </button>
      </div>

      <div className="time-slider-group">
        <input
          type="range"
          className="time-slider"
          min={0}
          max={timeSteps - 1}
          value={timeIndex}
          onChange={(e) => {
            setPlaying(false);
            onTimeChange(Number(e.target.value));
          }}
        />
        <span className="time-date">{currentDate}</span>
      </div>

      <div className="time-progress">
        {Array.from({ length: timeSteps }, (_, i) => (
          <div
            key={i}
            className={`time-dot ${i === timeIndex ? 'active' : ''} ${i < timeIndex ? 'past' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
