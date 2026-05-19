import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

/**
 * Hook used by protected pages to redirect unauthenticated users to /auth
 * and unboarded users to /onboarding.
 */
export function useRequireAuth(requireOnboarded = true) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (requireOnboarded && profile && !profile.onboarded) {
      navigate({ to: "/onboarding" });
    }
  }, [user, profile, loading, requireOnboarded, navigate]);
  return { user, profile, loading };
}
