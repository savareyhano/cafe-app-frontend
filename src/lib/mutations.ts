import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from './api';
import { queryKeys } from './queries';
import { toast } from 'sonner';

// Auth
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (credentials: Record<string, string>) => 
      fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchApi('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
    }
  });
};

// Menu Items
export const useAddMenuItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => 
      fetchApi('/api/menu/item', {
        method: 'POST',
        body: formData,
      }),
    onSuccess: () => {
      toast.success('Menu item added successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add menu item');
    }
  });
};

export const useUpdateMenuItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => 
      fetchApi(`/api/menu/item/${id}`, {
        method: 'PATCH',
        body: formData,
      }),
    onSuccess: () => {
      toast.success('Menu item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update menu item');
    }
  });
};

export const useDeleteMenuItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetchApi(`/api/menu/item/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Menu item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete menu item');
    }
  });
};

// Orders
export const useAddOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderData: any) => 
      fetchApi('/api/order', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
};

export const useUpdateOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      fetchApi(`/api/order/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData(['orders']);

      // Optimistically update
      queryClient.setQueryData(['orders'], (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((order: any) => 
            order.id === id ? { ...order, status } : order
          )
        };
      });

      return { previousOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      toast.error(err.message || 'Failed to update order status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onSuccess: () => {
      toast.success('Order status updated');
    }
  });
};
