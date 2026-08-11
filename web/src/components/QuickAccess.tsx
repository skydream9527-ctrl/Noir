import { motion } from "framer-motion";
import { ENGINES } from "@/data/engines";
import { useSettingsStore } from "@/store/useSettingsStore";

type Props = {
  onOpen: (url: string, name: string) => void;
};

export default function QuickAccess({ onOpen }: Props) {
  const setDefaultEngine = useSettingsStore((s) => s.setDefaultEngine);

  return (
    <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
      {ENGINES.map((e, i) => (
        <motion.button
          key={e.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.4 }}
          whileHover={{ y: -4 }}
          onClick={() => {
            setDefaultEngine(e.name);
            onOpen(e.homeUrl, e.name);
          }}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.05] hover:shadow-glow"
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white transition-transform group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${e.color}, ${e.color}aa)`,
              boxShadow: `0 8px 20px -6px ${e.color}77`,
            }}
          >
            {e.letter}
          </span>
          <span className="text-xs font-medium text-ink-300 group-hover:text-ink-50">
            {e.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
