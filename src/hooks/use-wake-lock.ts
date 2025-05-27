import * as React from "react";

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

export function useWakeLock(): WakeLockState {
  const [isActive, setIsActive] = React.useState(false);
  const wakeLockRef = React.useRef<WakeLockSentinel | null>(null);

  // Check if Wake Lock API is supported
  const isSupported =
    typeof navigator !== "undefined" && "wakeLock" in navigator;

  const request = React.useCallback(async () => {
    if (!isSupported) {
      console.warn("Wake Lock API is not supported in this browser");
      return;
    }

    try {
      // Release any existing wake lock first
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
      }

      // Request a new wake lock
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      setIsActive(true);

      // Listen for wake lock release
      wakeLockRef.current.addEventListener("release", () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });
    } catch (error) {
      console.error("Failed to request wake lock:", error);
      setIsActive(false);
    }
  }, [isSupported]);

  const release = React.useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
      } catch (error) {
        console.error("Failed to release wake lock:", error);
      }
    }
  }, []);

  // Auto-release wake lock on component unmount
  React.useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  // Handle visibility change (re-request wake lock when page becomes visible again)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        isActive &&
        !wakeLockRef.current
      ) {
        request();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, request]);

  return {
    isSupported,
    isActive,
    request,
    release,
  };
}
