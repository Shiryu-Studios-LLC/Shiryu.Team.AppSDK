import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { requestAuth, onHeartbeatResponse, type TeamAppManifest } from "./heartbeat";

export interface EmbeddedTeamUser {
  id: string;
  email: string;
  personal_email?: string | null;
  name: string;
  globalRole: string;
  services: { cloud: string | null; team: string | null };
  role: "employee" | "contractor" | "admin";
  employment_type: "employee" | "contractor";
  is_system_admin: boolean;
  status: string;
  position_applied_for?: string | null;
  job_title: string | null;
  department: string | null;
  company_email?: string | null;
  personal_email_summary_enabled?: boolean;
  phone?: string | null;
  start_date?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

interface TeamAuthContextValue {
  user: EmbeddedTeamUser | null;
  actualUser: EmbeddedTeamUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: EmbeddedTeamUser) => void;
  logout: () => Promise<void>;
  clearSession: () => void;
  refreshUser: () => Promise<void>;
}

const TeamAuthContext = createContext<TeamAuthContextValue | null>(null);

function parseUserFromToken(token: string): EmbeddedTeamUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      id: payload.userId || payload.sub || "",
      email: payload.email || "",
      personal_email: payload.personalEmail || payload.personal_email || null,
      name: payload.name || "",
      globalRole: payload.globalRole || "user",
      services: payload.services || { cloud: null, team: null },
      role: payload.role || "employee",
      employment_type: payload.employment_type || "employee",
      is_system_admin: Boolean(payload.is_system_admin),
      status: payload.status || "active",
      position_applied_for: payload.position_applied_for || null,
      job_title: payload.job_title || null,
      department: payload.department || null,
      company_email: payload.company_email || null,
      personal_email_summary_enabled: Boolean(payload.personal_email_summary_enabled),
      phone: payload.phone || null,
      start_date: payload.start_date || null,
      avatar_url: payload.avatar_url || null,
      created_at: payload.created_at || null,
    };
  } catch {
    return null;
  }
}

interface TeamAuthProviderProps {
  children: React.ReactNode;
  appId?: string;
  manifest?: TeamAppManifest;
  loadingFallback?: React.ReactNode;
}

export function TeamAuthProvider({ 
  children, 
  appId, 
  manifest,
  loadingFallback 
}: TeamAuthProviderProps) {
  const [actualUser, setActualUser] = useState<EmbeddedTeamUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authAttempted, setAuthAttempted] = useState(false);

  const clearSession = useCallback(() => {
    setToken(null);
    setActualUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = await requestAuth();
      if (authToken) {
        setToken(authToken);
        const user = parseUserFromToken(authToken);
        setActualUser(user);
      } else {
        setActualUser(null);
      }
    } catch {
      setActualUser(null);
    } finally {
      setLoading(false);
      setAuthAttempted(true);
    }
  }, []);

  useEffect(() => {
    if (authAttempted) return;
    
    const handleAuthResponse = (data: { type: string; token?: string }) => {
      if (data.type === "shiryu:auth-response" && data.token) {
        setToken(data.token);
        const user = parseUserFromToken(data.token);
        setActualUser(user);
        setLoading(false);
        setAuthAttempted(true);
      }
    };
    
    onHeartbeatResponse(handleAuthResponse);
    
    void refreshUser();
  }, [authAttempted, refreshUser]);

  const login = useCallback((nextToken: string, nextUser: EmbeddedTeamUser) => {
    setToken(nextToken);
    setActualUser(nextUser);
    setLoading(false);
    setAuthAttempted(true);
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    setAuthAttempted(false);
    await refreshUser();
  }, [clearSession, refreshUser]);

  const value = useMemo<TeamAuthContextValue>(() => ({
    user: actualUser,
    actualUser,
    token,
    loading,
    isAuthenticated: !!actualUser,
    login,
    logout,
    clearSession,
    refreshUser,
  }), [actualUser, token, loading, login, logout, clearSession, refreshUser]);

  if (loading && !authAttempted) {
    return (
      <TeamAuthContext.Provider value={value}>
        {loadingFallback || (
          <div className="flex min-h-screen items-center justify-center text-sm" style={{ color: "var(--shiryu-shell-text-muted, #949ba4)" }}>
            Loading...
          </div>
        )}
      </TeamAuthContext.Provider>
    );
  }

  return (
    <TeamAuthContext.Provider value={value}>
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth(): TeamAuthContextValue {
  const context = useContext(TeamAuthContext);
  if (!context) {
    throw new Error("useTeamAuth must be used within TeamAuthProvider");
  }
  return context;
}

export { TeamAuthContext };
