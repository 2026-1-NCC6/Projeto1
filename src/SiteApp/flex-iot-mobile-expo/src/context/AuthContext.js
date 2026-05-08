import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authApi, apiErrorMessage } from '../services/api';

const AuthContext = createContext(null);

const defaultPreferences = {
  unit: 'C',
  refreshInterval: 15000,
  favoriteEnvironmentIds: [],
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [acceptedLgpd, setAcceptedLgpd] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorage() {
      try {
        const savedToken = await AsyncStorage.getItem('@flexiot:token');
        const savedUser = await AsyncStorage.getItem('@flexiot:user');
        const savedLgpd = await AsyncStorage.getItem('@flexiot:lgpd');
        const savedPreferences = await AsyncStorage.getItem('@flexiot:preferences');

        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedLgpd === 'accepted') setAcceptedLgpd(true);
        if (savedPreferences) setPreferences({ ...defaultPreferences, ...JSON.parse(savedPreferences) });
      } finally {
        setLoading(false);
      }
    }
    loadStorage();
  }, []);

  async function login(email, password) {
    try {
      const { data } = await authApi.login(email, password);
      await AsyncStorage.setItem('@flexiot:token', data.token);
      await AsyncStorage.setItem('@flexiot:user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (error) {
      Alert.alert('Erro no login', apiErrorMessage(error));
      return false;
    }
  }

  async function logout() {
    await AsyncStorage.removeItem('@flexiot:token');
    await AsyncStorage.removeItem('@flexiot:user');
    setToken(null);
    setUser(null);
  }

  async function acceptLgpd() {
    await AsyncStorage.setItem('@flexiot:lgpd', 'accepted');
    setAcceptedLgpd(true);
  }

  async function updatePreferences(nextPreferences) {
    const merged = { ...preferences, ...nextPreferences };
    await AsyncStorage.setItem('@flexiot:preferences', JSON.stringify(merged));
    setPreferences(merged);
  }

  function canAccessAdmin() {
    return user?.role === 'ADMIN';
  }

  function canAccessTechnical() {
    return ['ADMIN', 'TECNICO'].includes(user?.role);
  }

  const value = useMemo(() => ({
    token,
    user,
    loading,
    acceptedLgpd,
    preferences,
    login,
    logout,
    acceptLgpd,
    updatePreferences,
    canAccessAdmin,
    canAccessTechnical,
  }), [token, user, loading, acceptedLgpd, preferences]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
