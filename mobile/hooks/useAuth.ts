import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isLoading, isAuthenticated, profileVersion, login, signup, logout, setUser, updateProfile } =
    useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    profileVersion,
    login,
    signup,
    logout,
    setUser,
    updateProfile,
  };
};
