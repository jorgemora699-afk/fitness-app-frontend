import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { ENDPOINTS } from '../utils/constants';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { setAuthClearer } from '../api/authEvents';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    setAuthClearer(clearAuth);
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedRole = await AsyncStorage.getItem('role');
      const storedExpiry = await AsyncStorage.getItem('token_expiry');

      if (storedToken && storedUser && storedExpiry) {
        const expiry = new Date(storedExpiry);
        const now = new Date();

        // Si el token aún es válido, mantener sesión
        if (now < expiry) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setRole(storedRole);
        } else {
          // Token expirado, limpiar sesión
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginTrainer = async (email, password) => {
    const response = await client.post(ENDPOINTS.LOGIN_TRAINER, { email, password });
    const { token, trainer } = response.data;
    await saveAuth(token, trainer, 'trainer');
    return response.data;
  };

  const loginUser = async (email, password) => {
    const response = await client.post(ENDPOINTS.LOGIN_USER, { email, password });
    const { token, user } = response.data;
    await saveAuth(token, user, 'user');
    registerPushToken();
    return response.data;
  };

  const registerUser = async (data) => {
    const response = await client.post(ENDPOINTS.REGISTER_USER, data);
    const { token, user } = response.data;
    await saveAuth(token, user, 'user');
    registerPushToken();
    return response.data;
  };

  const saveAuth = async (token, userData, userRole) => {
    // Calcular expiración (30 días desde ahora)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('role', userRole);
    await AsyncStorage.setItem('token_expiry', expiry.toISOString());

    setToken(token);
    setUser(userData);
    setRole(userRole);
  };

  const registerPushToken = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      const finalToken = token || 'ExponentPushToken[simulator-test]';
      await client.post(ENDPOINTS.SAVE_PUSH_TOKEN, { push_token: finalToken });
    } catch (error) {
      console.log('Error registering push token:', error.message);
    }
  };

  const clearAuth = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('role');
    await AsyncStorage.removeItem('token_expiry');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const updateUser = async (newUserData) => {
    setUser(newUserData);

    await AsyncStorage.setItem(
      'user',
      JSON.stringify(newUserData)
    );
  };

  const logout = async () => {
    await clearAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      token,
      loading,
      loginTrainer,
      loginUser,
      registerUser,
      logout,
      setUser,
      updateUser,
      registerPushToken,
      clearAuth  
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);