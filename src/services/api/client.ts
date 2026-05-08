import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../constants/api';

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
});

apiClient.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    // Ignore storage errors
  }
  return config;
});

export default apiClient;
