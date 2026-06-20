import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import { BASE_URL } from '../../constants/api';

export interface SavedAddress {
  id: number;
  customer_id: number;
  address_type: string;
  label: string;
  phone_no: string | null;
  name: string | null;
  address_label: string | null;
  phone: string | null;
  building: string | null;
  street: string | null;
  zone: string | null;
  apartment: string | null;
  floor: string | null;
  flat: string | null;
  additional_directions: string | null;
  coordinates: string | null;
  is_default: number;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  formatted_address: string | null;
}

export interface SavedAddressResponse {
  success: boolean;
  data: SavedAddress[];
  message?: string;
}

export interface DefaultAddressResponse {
  success: boolean;
  data: SavedAddress | null;
  message?: string;
}

export interface SaveAddressPayload {
  customerId: string;
  name: string;
  phoneNo: string;
  building: string;
  street: string;
  zone?: string;
  addressType: string;
  label: string;
  additionalDirections: string;
  apartment?: string;
  floor?: string;
  coordinates?: string;
}

export interface SaveAddressResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const normalizeAddresses = (payload: any): SavedAddress[] => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (payload?.data && typeof payload.data === 'object') {
    return [payload.data];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

export const addressService = {
  getSavedAddresses: async (
    customerId?: string,
  ): Promise<SavedAddressResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (!customerId) {
        return {
          success: true,
          data: [],
          message: 'No customer ID provided',
        };
      }

      const url = `${BASE_URL}/api/customer/address/list/${customerId}`;

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

      // 404 means no addresses found - treat as empty list, not error
      if (response.status === 404) {
        return {
          success: true,
          data: [],
          message: data?.message || 'No saved addresses found',
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return {
        ...data,
        success: data?.success !== false,
        data: normalizeAddresses(data),
      };
    } catch (error: any) {
      console.log('Address API - Error:', error);
      console.log('Address API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to fetch saved addresses');
    }
  },

  addAddress: async (params: {
    customerId: string;
    addressType: string;
    label?: string;
    phone?: string;
    name?: string;
    building?: string;
    street?: string;
    zone?: string;
    apartment?: string;
    floor?: string;
    flat?: string;
    additionalDirections?: string;
    coordinates?: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append('customer_id', params.customerId);
      formData.append('address_type', params.addressType);

      if (params.label) formData.append('label', params.label);
      if (params.phone) formData.append('phone', params.phone);
      if (params.name) formData.append('name', params.name);
      if (params.building) formData.append('building', params.building);
      if (params.street) formData.append('street', params.street);
      if (params.zone) formData.append('zone', params.zone);
      if (params.apartment) formData.append('apartment', params.apartment);
      if (params.floor) formData.append('floor', params.floor);
      if (params.flat) formData.append('flat', params.flat);
      if (params.additionalDirections)
        formData.append('additional_directions', params.additionalDirections);
      if (params.coordinates)
        formData.append('coordinates', params.coordinates);

      console.log('Add Address API - Making request with params:', params);

      const { data } = await apiClient.post('/customer/address/add', formData);

      console.log('Add Address API - Response:', data);

      return data;
    } catch (error: any) {
      console.log('Add Address API - Error:', error);
      console.log('Add Address API - Error response:', error.response?.data);
      if (error.response?.data) {
        throw new Error(
          error.response.data?.message || 'Failed to add address',
        );
      }

      throw error;
    }
  },

  saveNewAddress: async (
    payload: SaveAddressPayload,
  ): Promise<SaveAddressResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Save Address API - Token:', token ? 'Found' : 'NOT FOUND');
      console.log('Save Address API - Payload:', payload);

      const formData = new FormData();
      formData.append('customer_id', payload.customerId);
      formData.append('name', payload.name);
      formData.append('phone_no', payload.phoneNo);
      formData.append('building', payload.building);
      formData.append('street', payload.street);
      formData.append('zone', payload.zone);
      formData.append('address_type', payload.addressType);
      formData.append('label', payload.label);
      formData.append('additional_directions', payload.additionalDirections);

      if (payload.apartment) {
        formData.append('apartment', payload.apartment);
      }
      if (payload.floor) {
        formData.append('floor', payload.floor);
      }
      if (payload.coordinates) {
        formData.append('coordinates', payload.coordinates);
      }

      // Log FormData contents
      console.log('Save Address API - FormData contents:');
      for (let pair of (formData as any).getParts()) {
        console.log(`  ${pair.fieldName}: ${pair.string}`);
      }

      console.log(
        'Save Address API - Making request to:',
        `${BASE_URL}/api/customer/address/add`,
      );

      const response = await fetch(`${BASE_URL}/api/customer/address/add`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `bearer ${token}`,
          bearer: `${token}`,
          token: `${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Save Address API - Response:', data);
      console.log('Save Address API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return {
        success: data?.success !== false,
        message: data?.message,
        data: data?.data,
      };
    } catch (error: any) {
      console.log('Save Address API - Error:', error);
      console.log('Save Address API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to save address');
    }
  },

  updateAddress: async (
    payload: SaveAddressPayload & { addressId: string },
  ): Promise<SaveAddressResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Update Address API - Token:', token ? 'Found' : 'NOT FOUND');
      console.log('Update Address API - Payload:', payload);

      const formData = new FormData();
      formData.append('address_id', payload.addressId);
      formData.append('customer_id', payload.customerId);
      formData.append('name', payload.name);
      formData.append('phone_no', payload.phoneNo);
      formData.append('building', payload.building);
      formData.append('street', payload.street);
      formData.append('address_type', payload.addressType);
      formData.append('label', payload.label);
      formData.append('additional_directions', payload.additionalDirections);

      if (payload.zone) {
        formData.append('zone', payload.zone);
      }

      if (payload.apartment) {
        formData.append('apartment', payload.apartment);
      }
      if (payload.floor) {
        formData.append('floor', payload.floor);
      }
      if (payload.coordinates) {
        formData.append('coordinates', payload.coordinates);
      }

      // Log FormData contents
      console.log('Update Address API - FormData contents:');
      for (let pair of (formData as any).getParts()) {
        console.log(`  ${pair.fieldName}: ${pair.string}`);
      }

      console.log(
        'Update Address API - Making request to:',
        `${BASE_URL}/api/customer/address/update`,
      );

      const response = await fetch(`${BASE_URL}/api/customer/address/update`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `bearer ${token}`,
          bearer: `${token}`,
          token: `${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Update Address API - Response:', data);
      console.log('Update Address API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return {
        success: data?.success !== false,
        message: data?.message,
        data: data?.data,
      };
    } catch (error: any) {
      console.log('Update Address API - Error:', error);
      console.log('Update Address API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to update address');
    }
  },

  setDefaultAddress: async (params: {
    addressId: string;
    customerId: string;
  }): Promise<SaveAddressResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log(
        'Set Default Address API - Token:',
        token ? 'Found' : 'NOT FOUND',
      );
      console.log('Set Default Address API - Params:', params);

      const formData = new FormData();
      formData.append('address_id', params.addressId);
      formData.append('customer_id', params.customerId);

      console.log(
        'Set Default Address API - Making request to:',
        `${BASE_URL}/api/customer/address/default/set`,
      );

      const response = await fetch(
        `${BASE_URL}/api/customer/address/default/set`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `bearer ${token}`,
            bearer: `${token}`,
            token: `${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();
      console.log('Set Default Address API - Response:', data);
      console.log('Set Default Address API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      return {
        success: data?.success !== false,
        message: data?.message,
        data: data?.data,
      };
    } catch (error: any) {
      console.log('Set Default Address API - Error:', error);
      console.log('Set Default Address API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to set default address');
    }
  },

  getDefaultAddress: async (
    customerId: string,
  ): Promise<DefaultAddressResponse> => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log(
        'Get Default Address API - Token:',
        token ? 'Found' : 'NOT FOUND',
      );
      console.log('Get Default Address API - Customer ID:', customerId);

      const formData = new FormData();
      formData.append('customer_id', customerId);

      console.log(
        'Get Default Address API - Making request to:',
        `${BASE_URL}/api/customer/address/default/get`,
      );

      const response = await fetch(
        `${BASE_URL}/api/customer/address/default/get`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `bearer ${token}`,
            bearer: `${token}`,
            token: `${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();
      console.log('Get Default Address API - Response:', data);
      console.log('Get Default Address API - Status:', response.status);

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`,
        );
      }

      // Return data as-is since API returns single object in data field
      return {
        success: data?.success !== false,
        data: data?.data || null,
        message: data?.message,
      };
    } catch (error: any) {
      console.log('Get Default Address API - Error:', error);
      console.log('Get Default Address API - Error message:', error.message);
      throw new Error(error?.message || 'Failed to get default address');
    }
  },
};
