import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BASE_URL } from '../../constants/api';

export interface CustomerProfile {
  id: number;
  employee_code: string | null;
  name_en: string;
  name_ar: string | null;
  mobile: string;
  email: string;
  qid: string | null;
  gender: string;
  dob: string;
  photo: string | null;
  designation: string | null;
  status: number;
  wallet_balance: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder_name: string | null;
  bank_ifsc_code: string | null;
  bank_branch: string | null;
  cutoff_time: string | null;
  use_custom_settings: number;
  registration_source: string;
  is_approved: number;
  otp: string | null;
  otp_expiration: string | null;
  access_token: string | null;
  device_token: string | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  approved_by: number | null;
  approved_at: string | null;
  is_verified: number;
  verified_by: number | null;
  verified_at: string | null;
}

export interface CustomerProfileResponse {
  success: boolean;
  data: CustomerProfile;
  message?: string;
}

export const customerService = {
  getProfile: async (customerId: string): Promise<CustomerProfileResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Profile API - Token:', token ? 'Found' : 'NOT FOUND');
      console.log('Profile API - Customer ID:', customerId);

      const url = `${BASE_URL}/api/customer/profile/${customerId}`;
      console.log('Profile API - Making request to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `bearer ${token}`,
          bearer: `${token}`,
          token: `${token}`,
        },
      });

      const data = await response.json();
      console.log('Profile API - Response:', data);
      console.log('Profile API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return data;
    } catch (error: any) {
      console.log('Profile API - Error:', error);
      console.log('Profile API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to fetch profile');
    }
  },

  updateProfile: async (
    customerId: string,
    profileData: Partial<CustomerProfile> & { photo?: any },
  ): Promise<CustomerProfileResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}/api/customer/profile/update`;

      console.log('Update Profile API - Token:', token ? 'Found' : 'NOT FOUND');
      console.log('Update Profile API - URL:', url);
      console.log('Update Profile API - Data:', {
        customer_id: customerId,
        ...profileData,
      });

      let headers: any = {
        Accept: 'application/json',
        Authorization: `bearer ${token}`,
        bearer: `${token}`,
      };

      let body: any;

      // Check if photo is an object representing a local file to upload
      const hasPhotoUpload =
        profileData.photo &&
        typeof profileData.photo === 'object' &&
        profileData.photo.uri;

      if (hasPhotoUpload) {
        const formData = new FormData();
        formData.append('customer_id', customerId);

        if (profileData.name_en !== undefined) {
          formData.append('name_en', profileData.name_en);
        }
        if (profileData.mobile !== undefined) {
          formData.append('mobile', profileData.mobile);
        }
        if (profileData.email !== undefined) {
          formData.append('email', profileData.email);
        }
        if (profileData.gender !== undefined) {
          formData.append('gender', profileData.gender);
        }
        if (profileData.dob !== undefined) {
          formData.append('dob', profileData.dob);
        }

        // Append photo
        const uri = profileData.photo.uri;
        formData.append('photo', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: profileData.photo.name || 'profile.png',
          type: profileData.photo.type || 'image/png',
        } as any);

        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          customer_id: customerId,
          ...profileData,
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      const data = await response.json();
      console.log('Update Profile API - Response:', data);
      console.log('Update Profile API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return data;
    } catch (error: any) {
      console.log('Update Profile API - Error:', error);
      console.log('Update Profile API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to update profile');
    }
  },
};
