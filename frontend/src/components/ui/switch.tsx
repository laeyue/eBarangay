import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePointerDown = () => setIsPressed(true);
  const handlePointerUp = () => setIsPressed(false);

  return (
    <SwitchPrimitives.Root
      className={cn(
        // Base styles with iOS-like proportions (52x32 for medium size)
        "peer relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        // Smooth transitions matching iOS timing
        "transition-all duration-300 ease-out",
        // Focus states with accessible ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // iOS-like colors: Apple Green for ON, neutral gray for OFF
        "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-200",
        "dark:data-[state=checked]:bg-emerald-400 dark:data-[state=unchecked]:bg-gray-700",
        // Hover effects with subtle scale
        "hover:scale-[1.03] hover:shadow-md",
        "data-[state=checked]:hover:bg-emerald-600 data-[state=unchecked]:hover:bg-gray-300",
        "dark:data-[state=checked]:hover:bg-emerald-500 dark:data-[state=unchecked]:hover:bg-gray-600",
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none",
        // Reduce motion support
        "motion-reduce:transition-none motion-reduce:hover:scale-100",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          // iOS-like thumb (24px for medium size)
          "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0",
          // Smooth transform animation with iOS-like timing
          "transition-all duration-300 ease-out transform",
          // Perfect positioning for 52x32 track
          "data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
          // Pressed state scaling
          isPressed ? "scale-[0.92]" : "scale-100",
          // Enhanced shadow on hover/focus
          "group-hover:shadow-xl",
          // Subtle border for definition
          "border border-gray-100 dark:border-gray-200",
          // Reduce motion support
          "motion-reduce:transition-none motion-reduce:transform-none"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
