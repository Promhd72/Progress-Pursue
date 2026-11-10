import { Check, Delete } from "lucide-react";
import { keyHaptic } from "@/lib/native";

/**
 * On-screen number pad for the iOS app. The iPhone's own number keyboard has
 * no return key, so answers couldn't be submitted, and it covers half the
 * screen. This keeps the question visible and feels like a native game pad.
 */
export function NumericKeypad({
  onDigit,
  onBackspace,
  onSubmit,
  disabled,
  submitLabel = "Submit answer",
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitLabel?: string;
}) {
  const press = (fn: () => void) => () => {
    if (disabled) return;
    keyHaptic();
    fn();
  };

  const keyBase =
    "flex h-14 select-none items-center justify-center rounded-2xl text-2xl font-semibold tabular transition active:scale-95 disabled:opacity-40";

  return (
    <div
      className="mx-auto mt-8 grid w-full max-w-xs grid-cols-3 gap-2.5"
      role="group"
      aria-label="Number pad"
    >
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
        <button
          key={d}
          type="button"
          disabled={disabled}
          onClick={press(() => onDigit(d))}
          className={`${keyBase} bg-muted font-display text-foreground active:bg-muted-foreground/20`}
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={press(onBackspace)}
        aria-label="Delete"
        className={`${keyBase} bg-transparent text-muted-foreground active:bg-muted`}
      >
        <Delete className="h-6 w-6" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={press(() => onDigit("0"))}
        className={`${keyBase} bg-muted font-display text-foreground active:bg-muted-foreground/20`}
      >
        0
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={press(onSubmit)}
        aria-label={submitLabel}
        className={`${keyBase} bg-primary text-primary-foreground active:bg-primary/80`}
      >
        <Check className="h-7 w-7" />
      </button>
    </div>
  );
}
