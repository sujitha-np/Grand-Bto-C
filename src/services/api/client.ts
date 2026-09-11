import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';
import { authEvents } from './authEvents';

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60000,
});

apiClient.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    console.log(
      'Interceptor - Token retrieved:',
      token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
    );
    console.log('Interceptor - Request URL:', config.url);
    if (token) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `bearer ${token}`);
        config.headers.set('bearer', `${token}`);
        config.headers.set('token', `${token}`);
      } else if (config.headers) {
        config.headers['Authorization'] = `bearer ${token}`;
        config.headers['bearer'] = `${token}`;
        config.headers['token'] = `${token}`;
      }
      console.log('Interceptor - Authorization headers set');
    }
  } catch (error) {
    console.log('Interceptor - Error getting token:', error);
    // Ignore storage errors
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint =
        url.includes('/login') ||
        url.includes('/register') ||
        url.includes('/send-otp') ||
        url.includes('/verify-otp') ||
        url.includes('/forgot-password') ||
        url.includes('/reset-password');

      const token = await AsyncStorage.getItem('userToken');
      if (token && !isAuthEndpoint) {
        console.log(
          'Axios Interceptor - 401 Unauthorized detected on protected route:',
          url,
        );
        authEvents.emitUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
