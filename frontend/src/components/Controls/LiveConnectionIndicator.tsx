import React from 'react';
import './LiveConnectionIndicator.css';

interface Props {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastUpdated: string | null;
}

export const LiveConnectionIndicator: React.FC<Props> = ({ status, lastUpdated }) => {
  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connecting to Live Feed...';
      case 'connected': return lastUpdated ? 'Live \u00B7 Updated just now' : 'Live \u00B7 Receiving Stream';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Offline \u2014 Showing Cached Data';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className={`live-conn-indicator ${status}`} aria-live="polite" aria-atomic="true">
      <span className="live-conn-dot" />
      <span className="live-conn-text">{getStatusText()}</span>
    </div>
  );
};
