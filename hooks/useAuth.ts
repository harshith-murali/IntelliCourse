import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isLoading, isAuthenticated, login, signup, logout, setUser } =
    useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    setUser,
  };
};
