import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      isAuthenticated: false,
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      clearUser: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
      
      // Getters
      getUser: () => get().user,
      isLoggedIn: () => get().isAuthenticated,
    }),
    {
      name: "mindmate-auth-storage",
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);