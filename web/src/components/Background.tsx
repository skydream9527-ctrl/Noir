import { useSettingsStore } from "@/store/useSettingsStore";

/**
 * 全屏氛围背景：径向渐变 + 模糊光斑 + 噪点纹理。
 * 跟随主题变化。
 */
export default function Background() {
  const theme = useSettingsStore((s) => s.theme);

  if (theme === "light") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-100 via-white to-ink-200" />
        <div
          className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl animate-blob-drift"
          style={{ background: "radial-gradient(circle, #ec4899, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full opacity-25 blur-3xl animate-blob-drift"
          style={{
            background: "radial-gradient(circle, #38bdf8, transparent 70%)",
            animationDelay: "-6s",
          }}
        />
      </div>
    );
  }

  if (theme === "sepia") {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1410] via-[#221a13] to-[#1a1410]" />
        <div
          className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl animate-blob-drift"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 基底渐变 */}
      <div className="absolute inset-0 bg-ink-950" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139, 92, 246, 0.18), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(56, 189, 248, 0.12), transparent 60%), radial-gradient(ellipse 60% 50% at 0% 80%, rgba(236, 72, 153, 0.14), transparent 60%)",
        }}
      />
      {/* 漂浮光斑 */}
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl animate-blob-drift"
        style={{
          background: "radial-gradient(circle, #ec4899, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/4 -right-40 h-[480px] w-[480px] rounded-full opacity-30 blur-3xl animate-blob-drift"
        style={{
          background: "radial-gradient(circle, #38bdf8, transparent 70%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl animate-blob-drift"
        style={{
          background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
          animationDelay: "-12s",
        }}
      />
      {/* 噪点纹理 */}
      <div className="absolute inset-0 bg-noise opacity-[0.04] mix-blend-overlay" />
      {/* 网格 */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
        }}
      />
    </div>
  );
}
