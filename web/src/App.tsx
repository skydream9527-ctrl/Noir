import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Background from "@/components/Background";
import Home from "@/pages/Home";
import Browser from "@/pages/Browser";
import Reading from "@/pages/Reading";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Favorites from "@/pages/Favorites";
import { useSettingsStore } from "@/store/useSettingsStore";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/browser" element={<Browser />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function ThemeApplier() {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "light", "sepia");
    html.classList.add(theme);
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ThemeApplier />
      <Background />
      <div className="relative h-full">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}
