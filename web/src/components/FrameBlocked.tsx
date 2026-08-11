import { ExternalLink, ShieldOff, BookOpen, RefreshCw, Globe } from "lucide-react";
import { getDomain, prettyUrl } from "@/utils/url";

type Props = {
  url: string;
  onRetry: () => void;
  onRetryWithProxy?: () => void;
  onReadingMode?: () => void;
  reason?: "pre-blocked" | "timeout";
};

/**
 * iframe 无法嵌入时的占位卡。
 * 提供「在新窗口打开」+「通过代理重试」+「阅读模式」+「重试」四个出口。
 */
export default function FrameBlocked({
  url,
  onRetry,
  onRetryWithProxy,
  onReadingMode,
  reason = "pre-blocked",
}: Props) {
  const domain = getDomain(url);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/60 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
          <ShieldOff size={28} />
        </div>
        <h3 className="font-display text-lg font-bold text-ink-50">
          该站点禁止嵌入
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">
          <span className="font-mono text-ink-200">{prettyUrl(url)}</span>{" "}
          设置了 <code className="rounded bg-white/5 px-1 py-0.5 text-xs">X-Frame-Options</code>
          {reason === "timeout" ? "，或加载超时" : ""}，无法在 iframe 中显示。
        </p>

        <div className="mt-6 space-y-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full justify-center"
          >
            <ExternalLink size={16} /> 在新窗口打开 {domain}
          </a>
          {onRetryWithProxy && (
            <button
              onClick={onRetryWithProxy}
              className="btn-ghost w-full justify-center border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/5"
            >
              <Globe size={15} /> 通过代理重试（移除嵌入限制）
            </button>
          )}
          {onReadingMode && (
            <button
              onClick={onReadingMode}
              className="btn-ghost w-full justify-center"
            >
              <BookOpen size={15} /> 切换到阅读模式提取正文
            </button>
          )}
          <button onClick={onRetry} className="btn-ghost w-full justify-center">
            <RefreshCw size={15} /> 重试嵌入
          </button>
        </div>

        <p className="mt-6 text-xs text-ink-500">
          💡 可在「设置 → 通用」中开启代理服务，自动剥离 X-Frame-Options
        </p>
      </div>
    </div>
  );
}
