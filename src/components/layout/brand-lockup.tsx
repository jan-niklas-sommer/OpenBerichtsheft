import { NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandSize = "sm" | "md";

interface BrandMarkProps {
  className?: string;
  size?: BrandSize;
}

export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const box = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const icon = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm",
        box,
        className,
      )}
      aria-hidden="true"
    >
      <NotebookPen className={icon} strokeWidth={1.5} />
    </div>
  );
}

interface BrandLockupProps {
  className?: string;
  showClaim?: boolean;
  size?: BrandSize;
}

export function BrandLockup({
  className,
  showClaim = true,
  size = "md",
}: BrandLockupProps) {
  const title = size === "sm" ? "text-base" : "text-xl";

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <BrandMark size={size} />
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
