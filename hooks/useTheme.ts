import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));

export const useTheme = () => {
  const { isDark } = useThemeStore();

  return {
    isDark,
    toggleTheme: useThemeStore((state) => state.toggleTheme),
    colors: {
      background: isDark ? '#0f172a' : '#f9fafb',
      surface: isDark ? '#1e293b' : '#fff',
      text: isDark ? '#f1f5f9' : '#111',
      textSecondary: isDark ? '#cbd5e1' : '#666',
      border: isDark ? '#334155' : '#e5e7eb',
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  };
};
