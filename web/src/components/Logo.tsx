import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  /** 是否带圆角深色背景板（默认 true） */
  withBackground?: boolean;
};

/**
 * Noir 品牌 Logo。
 * 复用原 Android 项目 ic_launcher_foreground.xml 的矢量 path
 * （对称书签/蝴蝶结造型），配色改为霓虹渐变，契合 Web 端暗黑美学。
 */
export default function Logo({ size = 48, className, withBackground = true }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 108 108"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Noir"
    >
      <defs>
        <linearGradient id="noir-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#090d16" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="noir-logo-neon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {withBackground && (
        <rect width="108" height="108" rx="22" fill="url(#noir-logo-bg)" />
      )}
      <path
        d="M38,30L38,78L54,70L70,78L70,30L54,38L38,30z"
        fill="url(#noir-logo-neon)"
      />
    </svg>
  );
}
