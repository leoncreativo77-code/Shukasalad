import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white brightness-100 active:brightness-90 disabled:opacity-40",
  secondary:
    "bg-white text-neutral-800 border border-neutral-300 active:bg-neutral-100 disabled:text-neutral-400",
  danger: "bg-red-600 text-white active:bg-red-700 disabled:bg-red-300",
  ghost: "bg-transparent text-neutral-700 active:bg-neutral-200",
};

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

// Botón base para toda la UI de mostrador: grande, con feedback táctil claro
// (active:) en vez de hover, ya que en pantalla táctil no hay hover.
export function TouchButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: TouchButtonProps) {
  return (
    <button
      className={`min-h-14 rounded-xl px-5 py-3 text-lg font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:shadow-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
