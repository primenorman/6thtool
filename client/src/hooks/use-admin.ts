import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface AdminCheckResponse {
  isAdmin: boolean;
}

export function useAdmin() {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data, isLoading: adminLoading } = useQuery<AdminCheckResponse>({
    queryKey: ['/api/admin/check'],
    enabled: !!user,
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    isLoading: authLoading || adminLoading,
    user,
  };
}
