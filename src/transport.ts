const DEFAULT_TEAM_ORIGIN = "https://team.shiryustudios.com";
const DEFAULT_RPC_TIMEOUT_MS = 15000;

export interface TeamAppSdkRequestOptions {
  path: string;
  method?: string;
  body?: string | null;
}

export interface TeamAppSdkConfig {
  teamOrigin?: string;
  timeoutMs?: number;
}

interface TeamAppSdkRequestMessage {
  type: "shiryu:app-sdk:request";
  requestId: string;
  method: "api.request";
  payload: TeamAppSdkRequestOptions;
}

interface TeamAppSdkResponseMessage {
  type: "shiryu:app-sdk:response";
  requestId: string;
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
}

export class TeamAppSdkResponse {
  readonly ok: boolean;
  readonly status: number;
  private readonly payload: unknown;

  constructor(ok: boolean, status: number, payload: unknown) {
    this.ok = ok;
    this.status = status;
    this.payload = payload;
  }

  async json<T = unknown>() {
    return this.payload as T;
  }

  async text() {
    if (typeof this.payload === "string") return this.payload;
    return JSON.stringify(this.payload ?? null);
  }
}

function getParentOrigin(teamOrigin: string) {
  try {
    return document.referrer ? new URL(document.referrer).origin : teamOrigin;
  } catch {
    return teamOrigin;
  }
}

function supportsParentSdk() {
  return typeof window !== "undefined" && window.parent !== window;
}

function createRequestId() {
  return `sdk_${crypto.randomUUID()}`;
}

export function createTeamAppSdk(config: TeamAppSdkConfig = {}) {
  const teamOrigin = config.teamOrigin || DEFAULT_TEAM_ORIGIN;
  const timeoutMs = config.timeoutMs || DEFAULT_RPC_TIMEOUT_MS;

  async function request(
    path: string,
    options: RequestInit = {},
  ): Promise<TeamAppSdkResponse> {
    if (!supportsParentSdk()) {
      throw new Error("This app must be opened from Shiryu Team.");
    }

    const parentOrigin = getParentOrigin(teamOrigin);
    const requestId = createRequestId();
    const message: TeamAppSdkRequestMessage = {
      type: "shiryu:app-sdk:request",
      requestId,
      method: "api.request",
      payload: {
        path,
        method: options.method || "GET",
        body: typeof options.body === "string" ? options.body : null,
      },
    };

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        reject(
          new Error("Shiryu Team did not respond to the app SDK request."),
        );
      }, timeoutMs);

      function handleMessage(event: MessageEvent) {
        if (event.origin !== parentOrigin) return;
        const payload = event.data as TeamAppSdkResponseMessage | null;
        if (
          !payload ||
          payload.type !== "shiryu:app-sdk:response" ||
          payload.requestId !== requestId
        ) {
          return;
        }

        window.clearTimeout(timeout);
        window.removeEventListener("message", handleMessage);

        if (!payload.ok && payload.error && payload.data === undefined) {
          resolve(
            new TeamAppSdkResponse(false, payload.status, {
              error: payload.error,
            }),
          );
          return;
        }

        resolve(new TeamAppSdkResponse(payload.ok, payload.status, payload.data));
      }

      window.addEventListener("message", handleMessage);
      window.parent.postMessage(message, parentOrigin);
    });
  }

  async function getCurrentUser() {
    const response = await request("/api/auth/me");
    if (!response.ok) {
      const data = await response.json<{ error?: string }>();
      throw new Error(data.error || "Unable to load the current Team session.");
    }
    return response.json<Record<string, unknown>>();
  }

  async function logout() {
    const response = await request("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      const data = await response.json<{ error?: string }>();
      throw new Error(data.error || "Unable to sign out of Shiryu Team.");
    }
  }

  function createApiFetch(onUnauthorized?: () => void) {
    return async (path: string, options: RequestInit = {}) => {
      const response = await request(
        path.startsWith("http://") || path.startsWith("https://")
          ? path
          : `${path.startsWith("/") ? path : `/${path}`}`,
        {
          ...options,
          body:
            typeof options.body === "string"
              ? options.body
              : options.body == null
                ? undefined
                : JSON.stringify(options.body),
        },
      );

      if (response.status === 401) {
        onUnauthorized?.();
        throw new Error("Session expired");
      }

      return response;
    };
  }

  return {
    request,
    getCurrentUser,
    logout,
    createApiFetch,
  };
}
