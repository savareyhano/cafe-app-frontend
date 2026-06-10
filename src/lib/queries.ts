import { useQuery } from '@tanstack/react-query';
import { fetchApi } from './api';

export const queryKeys = {
  user: ['user'] as const,
  menuItems: (params: Record<string, string | number>) => ['menuItems', params] as const,
  orders: (params: Record<string, string | number>) => ['orders', params] as const,
  order: (id: string) => ['order', id] as const,
};

// Users
export const useUserQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => fetchApi('/api/users/me'),
    enabled,
    retry: false,
  });
};

// Menu Items
export const useMenuItemsQuery = (
  page: number, 
  perPage: number, 
  search: string, 
  sortBy: string, 
  sortOrder: string
) => {
  return useQuery({
    queryKey: queryKeys.menuItems({ page, perPage, search, sortBy, sortOrder }),
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        search,
        sortBy,
        sortOrder
      });
      return fetchApi(`/api/menu/items?${params.toString()}`);
    },
  });
};

// Orders
export const useOrdersQuery = (
  page: number, 
  perPage: number, 
  search: string, 
  sortBy: string, 
  sortOrder: string,
  refetchInterval: number | false = 5000
) => {
  return useQuery({
    queryKey: queryKeys.orders({ page, perPage, search, sortBy, sortOrder }),
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
        search,
        sortBy,
        sortOrder
      });
      return fetchApi(`/api/orders?${params.toString()}`);
    },
    refetchInterval,
  });
};

export const useOrderQuery = (id: string, refetchInterval: number | false = 5000) => {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => fetchApi(`/api/order/${id}`),
    enabled: !!id,
    refetchInterval,
  });
};
