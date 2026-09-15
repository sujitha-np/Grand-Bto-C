import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { prefetchCategoriesImages } from '../../utils/imagePrefetch';

const CATEGORIES_CACHE_KEY = '@cache_home_categories';

export interface Category {
  id: number;
  department_id: number;
  name_en: string;
  url_slug: string;
  name_ar: string;
  image: string;
  status: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  department: {
    id: number;
    name_en: string;
    url_slug: string;
    name_ar: string;
    image: string;
    status: number;
    created_by: number;
    updated_by: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export const categoryService = {
  getCategories: async () => {
    try {
      const { data } = await apiClient.get('/categories');

      if (data?.success === false || data?.error) {
        throw new Error('Failed to fetch categories');
      }

      if (data?.data && Array.isArray(data.data)) {
        AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(data)).catch(() => {});
        prefetchCategoriesImages(data.data);
      }

      return data;
    } catch (error: any) {
      console.log('Categories API error:', error);
      // Fallback to cached categories on failure
      try {
        const cached = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.data?.length) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore cache parse errors
      }

      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to fetch categories',
        );
      }
      throw error;
    }
  },

  getCachedCategories: async () => {
    try {
      const cached = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }
    return null;
  },
};
