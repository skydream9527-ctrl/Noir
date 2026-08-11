import { useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { path: "/", label: "主页", icon: Home },
  { path: "/browser", label: "多窗口", icon: LayoutGrid },
  { path: "/favorites", label: "收藏", icon: Star },
  { path: "/profile", label: "我的", icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="pointer-events-auto sticky bottom-0 z-20 mt-8 border-t border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
        {items.map((it) => {
          const active =
            it.path === "/" ? pathname === "/" : pathname.startsWith(it.path);
          const Icon = it.icon;
          return (
            <button
              key={it.path}
              onClick={() => navigate(it.path)}
              className={cn(
                "group relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors",
                active ? "text-ink-50" : "text-ink-500 hover:text-ink-200",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  active
                    ? "bg-neon-gradient text-white shadow-glow"
                    : "group-hover:bg-white/5",
                )}
              >
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
