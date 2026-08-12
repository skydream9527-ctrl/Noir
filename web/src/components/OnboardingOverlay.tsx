import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils";

type Step = {
  emoji: string;
  title: string;
  desc: string;
  accent: string;
};

const STEPS: Step[] = [
  {
    emoji: "🗂️",
    title: "多标签浏览",
    desc: "同时打开多个站点，使用快捷键 ⌘/Ctrl + T 新建、⌘/Ctrl + W 关闭、⌘/Ctrl + Tab 切换。书签与历史收纳在左侧抽屉。",
    accent: "#ec4899",
  },
  {
    emoji: "📖",
    title: "阅读模式",
    desc: "粘贴任意文章链接，自动提取正文、生成目录大纲与阅读进度。支持字号调节与深色 / 浅色 / 护眼三种主题。",
    accent: "#38bdf8",
  },
  {
    emoji: "🔒",
    title: "本地隐私",
    desc: "无需登录，所有标签、书签、历史与设置都保存在浏览器本地。广告拦截默认开启，可随时在设置中调整。",
    accent: "#8b5cf6",
  },
];

export default function OnboardingOverlay() {
  const complete = useOnboardingStore((s) => s.complete);
  const [step, setStep] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, true);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function next() {
    if (isLast) {
      complete();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      complete();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="首次使用引导"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none"
    >
      <button
        onClick={complete}
        className="absolute right-4 top-4 rounded-full p-2 text-ink-300 hover:bg-white/10 hover:text-ink-100"
        aria-label="跳过引导"
      >
        <X size={18} />
      </button>

      <div
        key={step}
        className="relative w-full max-w-md animate-scale-in overflow-hidden rounded-3xl border border-white/10 bg-ink-900/90 p-8 shadow-2xl"
      >
        <div
          className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl"
          style={{ background: current.accent }}
        />

        <div className="relative">
          <div
            className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-glow"
            style={{ background: `${current.accent}22` }}
          >
            {current.emoji}
          </div>

          <h2 className="font-display text-2xl font-bold text-ink-50">
            {current.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-300">
            {current.desc}
          </p>

          {/* 进度点 */}
          <div className="mt-7 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`跳到第 ${i + 1} 步`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step
                    ? "w-8 bg-neon-pink"
                    : "w-1.5 bg-white/20 hover:bg-white/40",
                )}
              />
            ))}
            <span className="ml-auto text-xs text-ink-500">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="btn-ghost"
                aria-label="上一步"
              >
                <ArrowLeft size={16} />
                上一步
              </button>
            )}
            <button
              onClick={next}
              className="btn-primary ml-auto justify-center"
              autoFocus
            >
              {isLast ? (
                <>
                  <Check size={16} /> 开始使用
                </>
              ) : (
                <>
                  下一步 <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <button
            onClick={complete}
            className="mt-4 w-full text-center text-xs text-ink-500 hover:text-ink-300"
          >
            跳过引导
          </button>
        </div>
      </div>
    </div>
  );
}

/** 顶层包装：仅在未完成时渲染引导层。 */
export function OnboardingGate() {
  const completed = useOnboardingStore((s) => s.completed);
  if (completed) return null;
  return (
    <div className="animate-fade-in">
      <OnboardingOverlay />
    </div>
  );
}
