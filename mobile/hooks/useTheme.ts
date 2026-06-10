import { create } from 'zustand';
import { ThemeColors, Spacing, Radii, Elevation } from '../theme/palette';

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
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;
  const shadow = isDark ? Elevation.dark : Elevation.light;

  return {
    isDark,
    toggleTheme: useThemeStore((state) => state.toggleTheme),
    colors,
    spacing: Spacing,
    radii: Radii,
    shadow,
  };
};
export type AppTheme = ReturnType<typeof useTheme>;
