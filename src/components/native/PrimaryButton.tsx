import type { ReactNode } from "react";

/** Full-width, thumb-sized button used across the app flows. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="block w-full rounded-2xl bg-primary py-4 text-center text-base font-semibold text-primary-foreground shadow-sm transition active:scale-[0.98] active:bg-primary/90 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
