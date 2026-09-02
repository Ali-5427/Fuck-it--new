import { useEffect } from 'react';

export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    // Save original body overflow style
    const originalOverflow = window.getComputedStyle(document.body).overflow;
    
    // Lock scrolling on the body
    document.body.style.overflow = 'hidden';

    // Cleanup on unmount or when lock state changes
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLocked]);
}
