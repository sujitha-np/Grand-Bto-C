import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../services/api/department';
import { productService } from '../services/api/product';
import { cartService } from '../services/api/cart';
import {
  addressService,
  DefaultAddressResponse,
} from '../services/api/address';
import { checkoutService, CartCheckoutResponse } from '../services/api/checkout';
import { orderService } from '../services/api/order';
import { loyaltyService } from '../services/api/loyalty';
import { customerService } from '../services/api/customer';
import { categoryService } from '../services/api/category';
import { offerService } from '../services/api/offer';
import { wishlistService } from '../services/api/wishlist';
import { promocodeService } from '../services/api/promocode';
import { feedbackService } from '../services/api/feedback';
import { addonsService } from '../services/api/addons';
import { settingsService } from '../services/api/settings';
import Toast from 'react-native-toast-message';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getDepartments(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOffers = () => {
  return useQuery({
    queryKey: ['offers'],
    queryFn: () => offerService.getOffers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOfferedProducts = (offerId: number) => {
  return useQuery({
    queryKey: ['offered-products', offerId],
    queryFn: () => offerService.getOfferedProducts(offerId),
    enabled: !!offerId,
  });
};

export const useCustomerProfile = (customerId?: string) => {
  return useQuery({
    queryKey: ['customer-profile', customerId],
    queryFn: async () => {
      if (!customerId) {
        return { success: false, data: null };
      }
      return customerService.getProfile(customerId);
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateCustomerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      profileData,
    }: {
      customerId: string;
      profileData: any;
    }) => {
      return customerService.updateProfile(customerId, profileData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-profile', variables.customerId],
      });
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error?.message || 'Failed to update profile',
      });
    },
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

export const useSearchProducts = (searchTerm: string) => {
  return useQuery({
    queryKey: ['products', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim() === '') {
        return { data: [] };
      }
      console.log(`Searching products with term: ${searchTerm}...`);
      const data = await productService.searchProducts(searchTerm);
      console.log(`Search results:`, data);
      return data;
    },
    enabled: !!searchTerm && searchTerm.trim() !== '',
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCart = (customerId?: string, preorderDate?: string) => {
  return useQuery({
    queryKey: ['cart', customerId, preorderDate],
    queryFn: async () => {
      if (!customerId || !preorderDate) return { data: { carts: [] } };
      const data = await cartService.getCart(customerId, preorderDate);
      return data;
    },
    enabled: !!customerId && !!preorderDate,
    staleTime: 0, // Always fetch latest cart
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      customerId: string;
      productId: string;
      quantity: string;
      preorderDate: string;
    }) => {
      return cartService.addToCart(
        params.customerId,
        params.productId,
        params.quantity,
        params.preorderDate,
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
    onError: error => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while adding to cart.',
      });
    },
  });
};

export const useUpdateCartQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      customerId: string;
      cartId: string;
      productId: string;
      quantity: string;
      preorderDate: string;
    }) => {
      return cartService.updateCartQuantity(
        params.customerId,
        params.cartId,
        params.productId,
        params.quantity,
      );
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ['cart', variables.customerId, variables.preorderDate],
      });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData([
        'cart',
        variables.customerId,
        variables.preorderDate,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ['cart', variables.customerId, variables.preorderDate],
        (old: any) => {
          if (!old) return old;
          const updatedItems = (old.data?.cart?.items || []).map((item: any) => {
            if (item.product_id === variables.productId) {
              return {
                ...item,
                quantity: variables.quantity,
              };
            }
            return item;
          });

          // Recalculate subtotal and total
          let subtotal = 0;
          updatedItems.forEach((item: any) => {
            subtotal += parseFloat(item.price) * parseInt(item.quantity, 10);
          });
          const total_amount = subtotal;

          return {
            ...old,
            data: {
              ...old.data,
              cart: {
                ...old.data?.cart,
                items: updatedItems,
                subtotal,
                total_amount,
              },
            },
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousCart };
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value if mutation fails
      if (context?.previousCart) {
        queryClient.setQueryData(
          ['cart', variables.customerId, variables.preorderDate],
          context.previousCart,
        );
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while updating quantity.',
      });
    },
    onSuccess: (data) => {
      if (!data.success) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to update quantity.',
        });
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to keep server in sync
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.customerId, variables.preorderDate],
      });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      customerId: string;
      cartId: string;
      productId: string;
      preorderDate: string;
    }) => {
      return cartService.removeFromCart(
        params.customerId,
        params.cartId,
        params.productId,
      );
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ['cart', variables.customerId, variables.preorderDate],
      });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData([
        'cart',
        variables.customerId,
        variables.preorderDate,
      ]);

      // Optimistically update to the new value (remove the item)
      queryClient.setQueryData(
        ['cart', variables.customerId, variables.preorderDate],
        (old: any) => {
          if (!old) return old;
          const updatedItems = (old.data?.cart?.items || []).filter(
            (item: any) => item.product_id !== variables.productId,
          );

          // Recalculate subtotal and total
          let subtotal = 0;
          updatedItems.forEach((item: any) => {
            subtotal += parseFloat(item.price) * parseInt(item.quantity, 10);
          });
          const total_amount = subtotal;

          return {
            ...old,
            data: {
              ...old.data,
              cart: {
                ...old.data?.cart,
                items: updatedItems,
                subtotal,
                total_amount,
              },
            },
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousCart };
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value if mutation fails
      if (context?.previousCart) {
        queryClient.setQueryData(
          ['cart', variables.customerId, variables.preorderDate],
          context.previousCart,
        );
      }
      console.error('Remove from cart error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while removing item.',
      });
    },
    onSuccess: (data) => {
      Toast.show({
        type: 'success',
        text1: 'Item Removed',
        text2: data.message || 'Item removed from cart successfully!',
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to keep server in sync
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.customerId, variables.preorderDate],
      });
    },
  });
};

export const useSpecialRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      cartId: string;
      customerId: string;
      specialRequest: string;
    }) => {
      return cartService.specialRequest(
        params.cartId,
        params.customerId,
        params.specialRequest,
      );
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: 'Special Request Saved',
        text2: data.message || 'Special request added successfully!',
      });
      // Invalidate cart queries to trigger UI update
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.customerId],
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to save special request.',
      });
    },
  });
};

export const useSavedAddresses = (customerId?: string) => {
  return useQuery({
    queryKey: ['saved-addresses', customerId],
    queryFn: async () => {
      if (!customerId) {
        return { success: true, data: [] };
      }

      const data = await addressService.getSavedAddresses(customerId);
      return data;
    },
    enabled: !!customerId,
    staleTime: 60 * 1000,
  });
};

export const useDefaultAddress = (customerId?: string) => {
  return useQuery<DefaultAddressResponse>({
    queryKey: ['default-address', customerId],
    queryFn: async (): Promise<DefaultAddressResponse> => {
      if (!customerId) {
        return { success: true, data: null };
      }

      const data = await addressService.getDefaultAddress(customerId);
      return data;
    },
    enabled: !!customerId,
    staleTime: 60 * 1000,
  });
};

export const useSaveAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
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
    }) => {
      return addressService.saveNewAddress(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate saved addresses query to refetch
      queryClient.invalidateQueries({
        queryKey: ['saved-addresses', variables.customerId],
      });
      // Invalidate default address in case it changed
      queryClient.invalidateQueries({
        queryKey: ['default-address', variables.customerId],
      });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      addressId: string;
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
    }) => {
      return addressService.updateAddress(payload);
    },
    onSuccess: (data, variables) => {
      // Invalidate saved addresses query to refetch
      queryClient.invalidateQueries({
        queryKey: ['saved-addresses', variables.customerId],
      });
      // Invalidate default address in case it changed
      queryClient.invalidateQueries({
        queryKey: ['default-address', variables.customerId],
      });
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { addressId: string; customerId: string }) => {
      return addressService.setDefaultAddress(payload);
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Default address set successfully!',
        });
      }
      // Invalidate saved addresses query to refetch
      queryClient.invalidateQueries({
        queryKey: ['saved-addresses', variables.customerId],
      });
      // Invalidate default address query to refetch
      queryClient.invalidateQueries({
        queryKey: ['default-address', variables.customerId],
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to set default address',
      });
    },
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      customer_id: string;
      cart_id: string;
      address_id: string;
      use_wallet: number;
      payment_type: number;
      promo_code?: string;
    }) => {
      return checkoutService.placeOrder(payload);
    },
    onSuccess: data => {
      if (data.success) {
        if (!data.requires_payment) {
          Toast.show({
            type: 'success',
            text1: 'Order Placed',
            text2: data.message || 'Your order has been placed successfully!',
          });
          // Invalidate cart queries to clear the cart after checkout
          queryClient.invalidateQueries({
            queryKey: ['cart'],
          });
          // Invalidate orders queries to refresh order list
          queryClient.invalidateQueries({
            queryKey: ['orders'],
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to place order.',
        });
      }
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while placing the order.',
      });
    },
  });
};

export const useCartCheckout = () => {
  return useMutation<
    CartCheckoutResponse,
    Error,
    { customer_id: string; cart_id: string; delivery_date: string; delivery_time: string }
  >({
    mutationFn: payload => checkoutService.cartCheckout(payload),
  });
};

export const useOrders = (customerId?: string, orderDate?: string) => {
  return useQuery({
    queryKey: ['orders', customerId, orderDate],
    queryFn: async () => {
      if (!customerId || !orderDate) {
        return { success: true, data: { orders: [] } };
      }
      const data = await orderService.getOrdersByDate(customerId, orderDate);
      return data;
    },
    enabled: !!customerId && !!orderDate,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useOrderHistory = (customerId?: string) => {
  return useQuery({
    queryKey: ['orderHistory', customerId],
    queryFn: async () => {
      if (!customerId) {
        return {
          success: true,
          data: { orders: [], total_orders: 0, total_amount: 0 },
        };
      }
      const data = await orderService.getOrderHistory(customerId);
      return data;
    },
    enabled: !!customerId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useLoyaltyPoints = (customerId?: string) => {
  return useQuery({
    queryKey: ['loyaltyPoints', customerId],
    queryFn: async () => {
      if (!customerId) {
        return {
          success: true,
          data: { total_loyalty_points: 0, points_history: [] },
        };
      }
      const data = await loyaltyService.getLoyaltyPoints(customerId);
      return data;
    },
    enabled: !!customerId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useWishlist = (customerId?: string) => {
  return useQuery({
    queryKey: ['wishlist', customerId],
    queryFn: async () => {
      if (!customerId) {
        return { success: true, data: [] };
      }
      const data = await wishlistService.getWishlist(customerId);
      console.log('Wishlist data fetched:', JSON.stringify(data, null, 2));
      return data;
    },
    enabled: !!customerId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { customerId: string; productId: string }) => {
      return wishlistService.addToWishlist(params.customerId, params.productId);
    },
    onSuccess: async (data, variables) => {
      console.log('Added to wishlist, response:', data);
      Toast.show({
        type: 'success',
        text1: 'Added to Wishlist',
        text2: data.message || 'Product added to wishlist!',
      });
      // Invalidate and refetch wishlist query immediately
      await queryClient.invalidateQueries({
        queryKey: ['wishlist', variables.customerId],
      });
      await queryClient.refetchQueries({
        queryKey: ['wishlist', variables.customerId],
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to add to wishlist',
      });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { customerId: string; productId: string }) => {
      return wishlistService.removeFromWishlist(
        params.customerId,
        params.productId,
      );
    },
    onSuccess: async (data, variables) => {
      console.log('Removed from wishlist, response:', data);
      Toast.show({
        type: 'success',
        text1: 'Removed from Wishlist',
        text2: data.message || 'Product removed from wishlist!',
      });
      // Invalidate and refetch wishlist query immediately
      await queryClient.invalidateQueries({
        queryKey: ['wishlist', variables.customerId],
      });
      await queryClient.refetchQueries({
        queryKey: ['wishlist', variables.customerId],
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to remove from wishlist',
      });
    },
  });
};

export const usePromocodes = () => {
  return useQuery({
    queryKey: ['promocodes'],
    queryFn: async () => {
      const data = await promocodeService.getPromocodes();
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useApplyPromocode = () => {
  return useMutation({
    mutationFn: (params: {
      grandTotal: string | number;
      customerId: string;
      promoCode: string;
    }) =>
      promocodeService.applyPromocode(
        params.grandTotal,
        params.customerId,
        params.promoCode,
      ),
    onSuccess: data => {
      Toast.show({
        type: 'success',
        text1: 'Promo Code Applied',
        text2: data.message || 'Promo code applied successfully!',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Promo Code Error',
        text2: error.message || 'Failed to apply promo code.',
      });
    },
  });
};

export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (feedbackData: any) => {
      console.log(
        'useSubmitFeedback - Sending data:',
        JSON.stringify(feedbackData, null, 2),
      );
      return feedbackService.submitFeedback(feedbackData);
    },
    onSuccess: data => {
      console.log('useSubmitFeedback - Success:', data);
      Toast.show({
        type: 'success',
        text1: 'Feedback Submitted',
        text2: 'Thank you for your feedback!',
      });
    },
    onError: (error: any) => {
      console.log('useSubmitFeedback - Error:', error);
      console.log('useSubmitFeedback - Error message:', error?.message);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error?.message || 'Failed to submit feedback',
      });
    },
  });
};

export const useAddons = () => {
  return useQuery({
    queryKey: ['addons'],
    queryFn: () => addonsService.getAddons(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePreorderLimit = () => {
  return useQuery({
    queryKey: ['preorderLimit'],
    queryFn: () => settingsService.getPreorderLimit(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCheckoutDetails = (
  customerId?: string,
  cartId?: string,
  deliveryDate?: string,
  deliveryTime?: string
) => {
  return useQuery({
    queryKey: ['checkoutDetails', customerId, cartId, deliveryDate, deliveryTime],
    queryFn: async () => {
      if (!customerId || !cartId || !deliveryDate || !deliveryTime) {
        return null;
      }
      return checkoutService.cartCheckout({
        customer_id: customerId,
        cart_id: cartId,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
      });
    },
    enabled: !!customerId && !!cartId && !!deliveryDate && !!deliveryTime,
    staleTime: 0,
  });
};

