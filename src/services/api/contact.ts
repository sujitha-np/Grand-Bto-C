import apiClient from './client';

export interface ContactData {
  phone?: string;
  mobilo?: string;
  address_en?: string;
  address_ar?: string;
  whatsapp_no?: string;
  email?: string;
  [key: string]: any;
}

export interface ContactResponse {
  success: boolean;
  data: ContactData;
  message?: string;
}

export const contactService = {
  getContact: async (): Promise<ContactResponse> => {
    try {
      const response = await apiClient.get<ContactResponse>('/contact');
      return response.data;
    } catch (error: any) {
      console.error('getContact error:', error);
      throw error;
    }
  },
};
