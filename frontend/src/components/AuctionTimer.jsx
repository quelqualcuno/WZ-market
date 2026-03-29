import { useState, useEffect } from 'react';

function getTimeRemaining(endsAt) {
  const total = new Date(endsAt).getTime() - Date.now();
  if (total <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor(total / 1000 / 60 / 60);
  return { total, hours, minutes, seconds };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function AuctionTimer({ endsAt }) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(endsAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(endsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (remaining.total <= 0) {
    return <span className="text-red-400 font-semibold text-sm">Ended</span>;
  }

  const totalMs = remaining.total;
  const colorClass =
    totalMs < 3_600_000
      ? 'text-red-400 animate-pulse'
      : totalMs < 86_400_000
      ? 'text-amber-400'
      : 'text-slate-300';

  return (
    <span className={`font-mono font-semibold text-sm ${colorClass}`}>
      {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
    </span>
  );
}
