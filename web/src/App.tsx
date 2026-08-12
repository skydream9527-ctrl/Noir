import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Background from "@/components/Background";
import { OnboardingGate } from "@/components/OnboardingOverlay";
import Home from "@/pages/Home";
import { useSettingsStore } from "@/store/useSettingsStore";

// 路由级懒加载：首屏仅 Home，其余按需加载
const Browser = lazy(() => import("@/pages/Browser"));
const Reading = lazy(() => import("@/pages/Reading"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const Favorites = lazy(() => import("@/pages/Favorites"));

function RouteFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-neon-pink" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="h-full animate-fade-in-up">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route
          path="/browser"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Browser />
            </Suspense>
          }
        />
        <Route
          path="/reading"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Reading />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Settings />
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="/favorites"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Favorites />
            </Suspense>
          }
        />
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
