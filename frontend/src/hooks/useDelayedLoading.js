import { useEffect, useRef, useState } from 'react';

export function useDelayedLoading(isLoading, options = {}) {
  const { delay = 250, minVisible = 180 } = options;
  const [showLoading, setShowLoading] = useState(false);
  const shownAtRef = useRef(0);

  useEffect(() => {
    let delayTimer;
    let hideTimer;

    if (isLoading) {
      delayTimer = setTimeout(() => {
        shownAtRef.current = Date.now();
        setShowLoading(true);
      }, delay);
    } else if (showLoading) {
      const elapsed = Date.now() - shownAtRef.current;
      const remaining = Math.max(minVisible - elapsed, 0);

      hideTimer = setTimeout(() => {
        setShowLoading(false);
      }, remaining);
    } else {
      setShowLoading(false);
    }

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(hideTimer);
    };
  }, [isLoading, delay, minVisible, showLoading]);

  return showLoading;
}
