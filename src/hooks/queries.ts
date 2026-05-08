import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/api/department';
import { productService } from '../services/api/product';
import { cartService } from '../services/api/cart';
import Toast from 'react-native-toast-message';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getDepartments(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('Fetching products...');
      const data = await productService.getProducts();
      console.log('Products fetched:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProductsByDepartment = (departmentId?: number) => {
  return useQuery({
    queryKey: ['products', 'department', departmentId],
    queryFn: async () => {
      if (!departmentId) return { data: [] };
      console.log(`Fetching products for department ${departmentId}...`);
      const data = await productService.getProductsByDepartment(departmentId);
      console.log(`Products fetched for department ${departmentId}:`, data);
      return data;
    },
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCart = (customerId?: string, preorderDate?: string) => {
  return useQuery({
    queryKey: ['cart', customerId, preorderDate],
    queryFn: async () => {
      if (!customerId || !preorderDate) return { data: { carts: [] } };
      console.log(`Fetching cart for customer ${customerId} on ${preorderDate}...`);
      const data = await cartService.getCart(customerId, preorderDate);
      console.log(`Cart fetched:`, data);
      return data;
    },
    enabled: !!customerId && !!preorderDate,
    staleTime: 0, // Always fetch latest cart
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { customerId: string; productId: string; quantity: string; preorderDate: string }) => {
      return cartService.addToCart(
        params.customerId,
        params.productId,
        params.quantity,
        params.preorderDate
      );
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Added to Cart',
          text2: data.message || 'Product added to cart successfully!',
        });
        // Invalidate cart query to refetch
        queryClient.invalidateQueries({
          queryKey: ['cart', variables.customerId, variables.preorderDate],
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to add product to cart.',
        });
      }
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while adding to cart.',
      });
    },
  });
};
