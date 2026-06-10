import { create } from 'zustand';
import { User, AuthState } from '../types';
import { apiService } from '../services/api';
import { useCourseStore } from './courseStore';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, role: 'student' | 'instructor', password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateProfile: (name: string, bio: string, email: string, avatarUri?: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  profileVersion: Date.now(),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { user, token } = await apiService.loginUser(email, password);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (email: string, name: string, role: 'student' | 'instructor', password: string) => {
    set({ isLoading: true });
    try {
      const { user, token } = await apiService.signupUser(email, name, role, password);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, profileVersion: Date.now() });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: user !== null, profileVersion: Date.now() });
  },

  updateProfile: async (name: string, bio: string, email: string, avatarUri?: string) => {
    const previousUser = get().user;
    set({ isLoading: true });
    try {
      if (previousUser) {
        set({
          user: {
            ...previousUser,
            name,
            bio,
            email,
            avatar: avatarUri || previousUser.avatar,
          },
          profileVersion: Date.now(),
        });
      }

      const user = await apiService.updateUserProfile(name, bio, email, avatarUri);
      // Update auth state FIRST — this must always run, even if the sync below fails
      set({ user, isLoading: false, profileVersion: Date.now() });
      // Then propagate instructor name/avatar changes to cached course cards
      useCourseStore.getState().syncInstructorProfile(user.id, user);
    } catch (error) {
      set({ user: previousUser, isLoading: false, profileVersion: Date.now() });
      throw error;
    }
  },
}));
