import { useCallback } from "react";
import { Toggle } from "@/components/ui/toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { DeviceMobileIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

// Mobile sleep prevention toggle - only show on mobile devices
export function WakeLockToggle() {
  const isMobile = useIsMobile();
  const wakeLock = useWakeLock();

  // Memoize event handlers
  const handleWakeLockToggle = useCallback(
    async (pressed: boolean) => {
      try {
        if (pressed) {
          await wakeLock.request();
          toast.success("Screen will stay awake");
        } else {
          await wakeLock.release();
          toast.success("Screen can now sleep normally");
        }
      } catch (error) {
        toast.error("Failed to toggle screen wake lock");
        console.error("Wake lock toggle error:", error);
      }
    },
    [wakeLock]
  );

  if (!isMobile || !wakeLock.isSupported) {
    return null;
  }
  return (
    <div className="flex items-center gap-2">
      <Toggle
        pressed={wakeLock.isActive}
        onPressedChange={handleWakeLockToggle}
        variant="outline"
        size="sm"
        aria-label="Keep screen awake"
        className="text-xs"
      >
        <DeviceMobileIcon className="h-3 w-3" />
        {wakeLock.isActive ? "Awake" : "Sleep"}
      </Toggle>
    </div>
  );
}
