import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';
import { triggerClearAuth } from './authEvents';

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000, // aumentar a 15 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores globalmente
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Reintentar hasta 2 veces si es Network Error
    if (!error.response && config && !config._retryCount) {
      config._retryCount = 1;
      return client(config);
    }

    if (!error.response && config && config._retryCount < 2) {
      config._retryCount += 1;
      return client(config);
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('role');
      await AsyncStorage.removeItem('token_expiry');
      triggerClearAuth();
    }

    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
      const { Alert } = require('react-native');
      Alert.alert(
        'Suscripción vencida',
        'Tu suscripción ha vencido. Contacta al administrador para renovarla.',
        [{ text: 'OK' }]
      );
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('role');
      await AsyncStorage.removeItem('token_expiry');
      triggerClearAuth();
    }

    if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_DEACTIVATED') {
      const { Alert } = require('react-native');
      Alert.alert(
        'Cuenta desactivada',
        'Tu cuenta ha sido desactivada. Contacta al administrador.',
        [{ text: 'OK' }]
      );
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('role');
      await AsyncStorage.removeItem('token_expiry');
      triggerClearAuth();
    }
    return Promise.reject(error);
  }
);

export default client;