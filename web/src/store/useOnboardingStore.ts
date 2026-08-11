import { create } from "zustand";
import { persist } from "zustand/middleware";

type OnboardingState = {
  completed: boolean;
  complete: () => void;
  reset: () => void;
};

/**
 * 首次访问引导状态：完成标志持久化到 localStorage。
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      complete: () => set({ completed: true }),
      reset: () => set({ completed: false }),
    }),
    { name: "noir_onboarding" },
  ),
);
