import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface NdaStatus {
  signed: boolean;
  isAdmin: boolean;
}

export function useNdaGate() {
  const [location, setLocation] = useLocation();

  const authQuery = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const isAuthenticated = !!authQuery.data && !authQuery.isError;

  const ndaQuery = useQuery<NdaStatus>({
    queryKey: ["/api/nda/status"],
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    if (ndaQuery.isLoading || ndaQuery.isError) return;
    if (!ndaQuery.data) return;

    const { signed, isAdmin } = ndaQuery.data;

    if (isAdmin) return;

    if (!signed && location !== "/nda" && location !== "/") {
      setLocation("/nda");
    }
  }, [ndaQuery.data, ndaQuery.isLoading, ndaQuery.isError, isAuthenticated, location, setLocation]);

  return {
    isLoading: ndaQuery.isLoading,
    needsNda: ndaQuery.data ? !ndaQuery.data.signed && !ndaQuery.data.isAdmin : false,
    isAdmin: ndaQuery.data?.isAdmin ?? false,
  };
}
