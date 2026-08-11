import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Background from "@/components/Background";
import { OnboardingGate } from "@/components/OnboardingOverlay";
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
    <div key={location.pathname} className="h-full animate-fade-in-up">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/browser" element={<Browser />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
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
      <a href="#main-content" className="skip-link">
        跳到主内容
      </a>
      <div className="relative h-full">
        <main id="main-content" className="h-full">
          <AnimatedRoutes />
        </main>
      </div>
      <OnboardingGate />
    </Router>
  );
}
