import apiClient from './client';

export interface AboutData {
  about_en?: string;
  about_ar?: string;
  [key: string]: any;
}

export interface AboutResponse {
  success: boolean;
  data: AboutData;
  message?: string;
}

export const aboutService = {
  getAbout: async (): Promise<AboutResponse> => {
    try {
      const response = await apiClient.get<AboutResponse>('/about');
      return response.data;
    } catch (error: any) {
      console.error('getAbout error:', error);
      throw error;
    }
  },
};
