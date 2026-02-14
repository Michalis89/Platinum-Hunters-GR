'use client';

import { useEffect, useState, useRef } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Use requestAnimationFrame to throttle scroll updates
      if (rafId.current !== null) return;

      rafId.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
        setProgress(pct);
        rafId.current = null;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div className="fixed left-0 top-0 z-50 h-0.5 w-full bg-transparent">
      <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  );
}
