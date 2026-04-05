import React from "react";
import { useTeamAuth, type EmbeddedTeamUser } from "./TeamAuthContext";

interface RequireAuthProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  unauthorizedFallback?: React.ReactNode;
  requireRole?: "admin" | "employee" | "contractor";
}

export function RequireAuth({
  children,
  loadingFallback,
  unauthorizedFallback,
  requireRole,
}: RequireAuthProps) {
  const { actualUser, loading, isAuthenticated } = useTeamAuth();

  if (loading) {
    return loadingFallback || (
      <div className="flex min-h-screen items-center justify-center text-sm" style={{ color: "var(--shiryu-shell-text-muted, #949ba4)" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !actualUser) {
    return unauthorizedFallback || (
      <div className="flex min-h-screen items-center justify-center text-sm" style={{ color: "var(--shiryu-shell-text-muted, #949ba4)" }}>
        Authentication required.
      </div>
    );
  }

  if (requireRole) {
    const userRole = actualUser.role;
    const hasRole = 
      requireRole === "admin" 
        ? userRole === "admin" 
        : requireRole === "employee"
          ? userRole === "employee" || userRole === "admin"
          : userRole === requireRole;
    
    if (!hasRole) {
      return unauthorizedFallback || (
        <div className="flex min-h-screen items-center justify-center text-sm" style={{ color: "var(--shiryu-shell-text-muted, #949ba4)" }}>
          You don't have permission to access this resource.
        </div>
      );
    }
  }

  return <>{children}</>;
}

export function useRequireAuth(): EmbeddedTeamUser {
  const { actualUser, loading, isAuthenticated } = useTeamAuth();

  if (loading) {
    throw new Error("Auth is still loading");
  }

  if (!isAuthenticated || !actualUser) {
    throw new Error("Authentication required");
  }

  return actualUser;
}
