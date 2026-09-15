import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { prefetchDepartmentsImages } from '../../utils/imagePrefetch';

const DEPARTMENTS_CACHE_KEY = '@cache_home_departments';

export interface Department {
  id: number;
  name_en: string;
  name_ar: string;
  display_name?: string | null;
  url_slug: string;
  image: string;
  status: number;
}

export const departmentService = {
  getDepartments: async () => {
    try {
      const { data } = await apiClient.get('/departments');

      if (data?.success === false || data?.error) {
        throw new Error('Failed to fetch departments');
      }

      if (data?.data && Array.isArray(data.data)) {
        AsyncStorage.setItem(DEPARTMENTS_CACHE_KEY, JSON.stringify(data)).catch(() => {});
        prefetchDepartmentsImages(data.data);
      }

      return data;
    } catch (error: any) {
      try {
        const cached = await AsyncStorage.getItem(DEPARTMENTS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.data?.length) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore
      }

      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to fetch departments',
        );
      }
      throw error;
    }
  },

  getCachedDepartments: async () => {
    try {
      const cached = await AsyncStorage.getItem(DEPARTMENTS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }
    return null;
  },
};
