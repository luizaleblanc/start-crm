import type { CSSProperties } from "react";
import { cn } from "./cn";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

const MASK_URL = "url(/brand/app-icon-mark.png)";

export function LogoMark({ size = 28, className }: LogoMarkProps) {
  const maskStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: "currentColor",
    WebkitMaskImage: MASK_URL,
    maskImage: MASK_URL,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  return (
    <span
      role="img"
      aria-label="Start CRM"
      className={cn("inline-block shrink-0", className)}
      style={maskStyle}
    />
  );
}
