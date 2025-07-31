import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  darkMode: false,
  setUser: (user) => set({ user }),
  setDarkMode: (darkMode) => set({ darkMode }),
}));