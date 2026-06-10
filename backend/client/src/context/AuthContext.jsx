import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const normalizeUser = (user) => {
  if (!user) return user;
  const avatarUrl = user.avatarUrl || user.avatar || '';
  return {
    ...user,
    id: user.id || user._id || '',
    avatar: avatarUrl,
    avatarUrl,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/user/profile');
        setUser(normalizeUser(data.data));
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/user/signin', { email, password });
    const nextUser = normalizeUser(data.user);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    const { data } = await api.post('/user/signup', payload);
    const nextUser = normalizeUser(data.user);
    setUser(nextUser);
    return nextUser;
  };

  const updateUser = (nextUser) => {
    setUser(normalizeUser(nextUser));
  };

  const logout = async () => {
    try {
      await api.post('/user/signout');
    } catch {
      // Clear local auth state even if the network request fails.
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
