import { NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
  showClaim?: boolean;
  size?: "sm" | "md";
}

export function BrandLockup({
  className,
  showClaim = true,
  size = "md",
}: BrandLockupProps) {
  const mark = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const icon = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const title = size === "sm" ? "text-base" : "text-xl";

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm",
          mark,
        )}
        aria-hidden="true"
      >
        <NotebookPen className={icon} strokeWidth={1.5} />
      </div>
      <h1
        className={cn(
          "mt-4 font-semibold tracking-tight text-content-base",
          title,
        )}
      >
        OpenBerichtsheft
      </h1>
      {showClaim && (
        <p className="mt-1 text-sm text-content-muted">
          Digitale Ausbildungsdokumentation
        </p>
      )}
    </div>
  );
}
