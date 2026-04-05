import { applyEmbeddedSurfaceSettings, type TeamSurfaceSettings } from "./surface";
import { applyEmbeddedAppShellTheme } from "./appShell";

const DEFAULT_TEAM_ORIGIN = "https://team.shiryustudios.com";
const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 10000;

export interface TeamAppManifest {
  id: string;
  name?: string;
  label?: string;
  icon?: string;
  description?: string;
  version?: string;
  capabilities?: string[];
  badgeKey?: string;
  pages?: Array<{
    id: string;
    label: string;
    route: string;
    icon?: string;
    capability?: string;
    hostRoute?: string;
    hostMatchRoutes?: string[];
  }>;
  shellOrigin?: string;
  launcherHidden?: boolean;
  systemApp?: boolean;
  hideForSystemAdmin?: boolean;
}

interface HeartbeatMessage {
  type: "shiryu:heartbeat" | "shiryu:heartbeat-ack" | "shiryu:app-register" | "shiryu:auth-request" | "shiryu:auth-response";
  appId?: string;
  route?: string;
  registered?: boolean;
  manifest?: TeamAppManifest;
  appList?: string[];
  token?: string;
  error?: string;
}

type HeartbeatResponseHandler = (data: HeartbeatMessage) => void;
type RegistrationHandler = (manifest: TeamAppManifest) => void;

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
let parentOrigin: string = DEFAULT_TEAM_ORIGIN;
let currentAppId: string | undefined = undefined;
let isRegistered: boolean = false;
let heartbeatResponseHandler: HeartbeatResponseHandler | null = null;
let registrationHandler: RegistrationHandler | null = null;
let heartbeatCount: number = 0;

function getParentOrigin(): string {
  try {
    return document.referrer ? new URL(document.referrer).origin : DEFAULT_TEAM_ORIGIN;
  } catch {
    return DEFAULT_TEAM_ORIGIN;
  }
}

function supportsParentSdk(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

function createMessageId(): string {
  return `hb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function sendMessage(message: HeartbeatMessage, requireResponse = false): void {
  if (!supportsParentSdk()) return;
  
  try {
    window.parent.postMessage(message, parentOrigin);
  } catch {
    // Silently fail if postMessage fails
  }
}

function handleMessage(event: MessageEvent): void {
  if (event.origin !== parentOrigin) return;
  
  const data = event.data as HeartbeatMessage | null;
  if (!data) return;

  switch (data.type) {
    case "shiryu:heartbeat-ack": {
      isRegistered = data.registered ?? false;
      
      if (heartbeatResponseHandler) {
        heartbeatResponseHandler(data);
      }
      
      if (!isRegistered && currentAppId && data.manifest) {
        setTimeout(() => {
          sendMessage({
            type: "shiryu:app-register",
            appId: currentAppId!,
            manifest: data.manifest,
          });
        }, 100);
      }
      break;
    }
    
    case "shiryu:auth-response": {
      if (heartbeatResponseHandler) {
        heartbeatResponseHandler(data);
      }
      break;
    }
  }
}

export function startHeartbeat(config?: { teamOrigin?: string; appId?: string; manifest?: TeamAppManifest }): void {
  if (!supportsParentSdk()) return;
  
  const teamOrigin = config?.teamOrigin || DEFAULT_TEAM_ORIGIN;
  parentOrigin = teamOrigin;
  currentAppId = config?.appId;
  
  window.addEventListener("message", handleMessage);
  
  sendMessage({
    type: "shiryu:heartbeat",
    appId: currentAppId || undefined,
    route: window.location.pathname,
  });
  
  heartbeatCount = 0;
  
  heartbeatInterval = setInterval(() => {
    heartbeatCount++;
    sendMessage({
      type: "shiryu:heartbeat",
      appId: currentAppId || undefined,
      route: window.location.pathname,
    });
    
    if (heartbeatCount > 12 && !isRegistered) {
      if (config?.manifest) {
        sendMessage({
          type: "shiryu:app-register",
          appId: currentAppId!,
          manifest: config.manifest,
        });
      }
    }
  }, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = null;
  }
  window.removeEventListener("message", handleMessage);
}

export function onHeartbeatResponse(handler: HeartbeatResponseHandler): void {
  heartbeatResponseHandler = handler;
}

export function onAppRegistered(handler: RegistrationHandler): void {
  registrationHandler = handler;
}

export function registerApp(manifest: TeamAppManifest): void {
  sendMessage({
    type: "shiryu:app-register",
    appId: manifest.id,
    manifest,
  });
}

export function requestAuth(parentOriginOverride?: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (parentOriginOverride) {
      parentOrigin = parentOriginOverride;
    }
    
    const timeoutId = setTimeout(() => {
      resolve(null);
    }, HEARTBEAT_TIMEOUT_MS);
    
    const handler: HeartbeatResponseHandler = (data) => {
      if (data.type === "shiryu:auth-response") {
        clearTimeout(timeoutId);
        heartbeatResponseHandler = null;
        resolve(data.token || null);
      }
    };
    
    heartbeatResponseHandler = handler;
    
    sendMessage({
      type: "shiryu:auth-request",
      appId: currentAppId || undefined,
    });
  });
}

export function isAppRegistered(): boolean {
  return isRegistered;
}

export function getCurrentAppId(): string | undefined {
  return currentAppId;
}

export function initializeTeamApp(config?: {
  teamOrigin?: string;
  appId: string;
  manifest?: TeamAppManifest;
  surface?: TeamSurfaceSettings;
}): void {
  if (config?.surface) {
    applyEmbeddedSurfaceSettings(config.surface);
  }
  
  applyEmbeddedAppShellTheme();
  
  if (supportsParentSdk()) {
    startHeartbeat({
      teamOrigin: config?.teamOrigin,
      appId: config?.appId,
      manifest: config?.manifest,
    });
  }
}
